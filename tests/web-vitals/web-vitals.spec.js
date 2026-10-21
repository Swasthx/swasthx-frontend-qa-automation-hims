import path from 'node:path';
import { devices } from '@playwright/test';
import { test, expect, ensureBundle } from '../../fixtures/auth.fixture.js';
import { INTERACTIONS, ROUTE_PARAMS } from '../../test-data/web-vitals/interactions.js';
import { executionFor } from '../../Test-case-csv/execution-plan.js';
import { CATEGORIES, loadCases } from '../../utils/results.js';
import { recordTc, tc } from '../../utils/tc.js';
import { THROTTLING, formatValue, measureInp, measureLoadVitals, parseTarget, percentile, profileFor, runLighthouse } from '../../utils/webvitals.js';

// Data-driven from Test-case-csv/…Web Vitals.csv: one test per automatable TC ID. Results go
// through recordTc() into Test-result/webvitalResult.md (reporters/sheet-reporter.js).
// Field-RUM rows are "main repo" in execution-plan.js, so no test is generated for them.
//
// Run serially (npm run test:wv uses --workers=1): parallel Lighthouse runs compete for CPU
// and skew the simulated timings. Lighthouse runs are shared by every TC on the same
// route + profile (one load yields LCP, FCP, CLS and TTFB).

const RUNS = Number(process.env.WV_RUNS || 3);
const RUN_ID = process.env.WV_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = path.resolve('results/web-vitals', RUN_ID);
const MODULE_ROLE = { SuperAdmin: 'superadmin', Admin: 'admin', Reception: 'reception', Doctor: 'doctor', Diagnostic: 'diagnostic', Pharmacy: 'pharmacy' };
const LOAD_METRICS = ['LCP', 'FCP', 'CLS', 'TTFB'];
// playwright (default): web-vitals on a DevTools-throttled load; works on 4xx SPA fallbacks.
// lighthouse: simulated throttling; needs the route to return HTTP 200 (QA currently 301 → 404).
const ENGINE = process.env.WV_ENGINE || 'playwright';

const CASES = loadCases(CATEGORIES.find((c) => c.key === 'web-vitals')).rows.filter((c) => executionFor('web-vitals', c['TC ID']).exec === 'auto');

function resolveRoute(route) {
  let missing = null;
  // `||`, not `??`: an empty value in .env means "not set".
  const resolved = route.replace(/:\w+/g, (param) => ROUTE_PARAMS[param] || ((missing = param), param));
  return { resolved, missing };
}

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase();
const samePath = (a, b) => a.replace(/\/+$/, '').toLowerCase() === b.replace(/\/+$/, '').toLowerCase();

// route|profile → Promise of load runs, shared by the TCs of one worker. A failed group is
// dropped from the cache so the next TC on that route retries instead of reusing the error.
const loadGroups = new Map();
function loadGroup({ url, route, profile, role, asRole }, testInfo) {
  const key = `${route}|${profile}`;
  if (!loadGroups.has(key)) {
    const p = (async () => {
      const runs = [];
      for (let i = 1; i <= RUNS; i++) {
        if (ENGINE === 'lighthouse') {
          const bundle = await ensureBundle(role, testInfo);
          runs.push(await runLighthouse(url, { session: bundle.session, profile, outDir: path.join(OUT, 'lighthouse', `${slug(route)}_${profile}`, `run-${i}`) }));
        } else {
          const t = THROTTLING[profile];
          const { defaultBrowserType, ...device } = t.device ? devices[t.device] : { viewport: { width: 1350, height: 940 } };
          const page = await asRole(role, device);
          try {
            runs.push({ ...(await measureLoadVitals(page, url, profile)), requestedUrl: url });
          } finally {
            await page.context().close();
          }
        }
      }
      return runs;
    })();
    p.catch(() => loadGroups.delete(key));
    loadGroups.set(key, p);
  }
  return loadGroups.get(key);
}

test.describe('Web Vitals', () => {
  test.describe.configure({ timeout: 20 * 60_000, retries: 0 });

  for (const c of CASES) {
    const id = c['TC ID'];
    const title = `${id} ${c.Metric} ${c['Route / URL']} (${c['Device · Network']})`;

    test(title, tc(id), async ({ asRole, baseURL }, testInfo) => {
      const target = parseTarget(c['Target (Good)']);
      const row = { runs: [], notes: [] };
      const record = (fields) => {
        Object.assign(row, fields);
        recordTc(testInfo, { status: row.status, measured: row.measured, runs: row.runs, notes: row.notes, reports: row.reports });
      };

      const profile = profileFor(c['Device · Network']);
      const { resolved, missing } = resolveRoute(c['Route / URL']);
      if (missing) {
        record({ status: 'NOT RUN', notes: [`Seed missing: set ${missing === ':patientId' ? 'DOC_CONSULT_PATIENT_ID' : missing} in .env`] });
        test.skip(true, `Seed missing for ${missing}`);
      }
      const role = MODULE_ROLE[c.Module];
      const url = new URL(resolved, baseURL).href;
      let values;

      if (LOAD_METRICS.includes(c.Metric)) {
        let runs;
        try {
          runs = await loadGroup({ url, route: resolved, profile, role, asRole }, testInfo);
        } catch (err) {
          record({ status: 'ERROR', notes: [`${ENGINE}: ${err.message.split('\n')[0].slice(0, 200)}`] });
          throw err;
        }
        const bad = runs.find((r) => r.runtimeError || !new URL(r.finalUrl).pathname.toLowerCase().startsWith(resolved.toLowerCase()));
        if (bad) {
          record({ status: 'ERROR', notes: [bad.runtimeError || `Landed on ${new URL(bad.finalUrl).pathname} instead of ${resolved} (auth or routing problem)`] });
          throw new Error(row.notes[0]);
        }
        values = runs.map((r) => r.metrics[c.Metric]);
        if (values.some((v) => v === undefined)) {
          record({ status: 'ERROR', notes: [`${c.Metric} was not reported on ${values.filter((v) => v === undefined).length}/${values.length} runs`] });
          throw new Error(row.notes[0]);
        }
        row.notes.push(`Engine: ${ENGINE}`);
        if (ENGINE === 'lighthouse') {
          row.reports = runs.map((r) => path.relative(process.cwd(), r.htmlPath).replace(/\\/g, '/'));
          row.lighthouseVersion = runs[0].lighthouseVersion;
          if (c.Metric === 'TTFB') row.notes.push(`server ${Math.round(percentile(runs.map((r) => r.metrics.serverResponse), 75))}ms + redirect ${Math.round(percentile(runs.map((r) => r.metrics.redirects), 75))}ms`);
        } else if (runs[0].statuses.length) {
          // e.g. "301 → 404": the trailing-slash redirect and the SPA fallback status.
          row.notes.push(`HTTP ${runs[0].statuses.join(' → ')}`);
        }
        if (!samePath(new URL(runs[0].requestedUrl).pathname, new URL(runs[0].finalUrl).pathname)) {
          row.notes.push(`Redirect ${new URL(runs[0].requestedUrl).pathname} → ${new URL(runs[0].finalUrl).pathname}`);
        }
      } else if (c.Metric === 'INP') {
        const interaction = INTERACTIONS[id];
        if (!interaction) {
          record({ status: 'NOT RUN', notes: ['No interaction defined in test-data/web-vitals/interactions.js'] });
          test.skip(true, 'No INP interaction defined');
        }
        values = [];
        let target0;
        for (let i = 0; i < RUNS; i++) {
          const page = await asRole(role, { viewport: { width: 1350, height: 940 } });
          try {
            const inp = await measureInp(page, url, interaction.run);
            values.push(inp?.value);
            target0 ??= inp?.target;
          } catch (err) {
            record({ status: 'ERROR', notes: [`Interaction ${interaction.label} failed: ${err.message.split('\n')[0].slice(0, 160)}`] });
            throw err;
          } finally {
            await page.context().close();
          }
        }
        row.notes.push(`Interaction: ${interaction.label}`);
        // web-vitals 5 always reports a click via first-input, so "nothing" means it never registered.
        if (values.some((v) => v === undefined)) {
          record({ status: 'ERROR', notes: [...row.notes, `No INP recorded on ${values.filter((v) => v === undefined).length}/${values.length} runs`] });
          throw new Error(row.notes.at(-1));
        }
      } else {
        record({ status: 'NOT RUN', notes: [`Metric ${c.Metric} not supported in lab`] });
        test.skip(true, `Unsupported metric ${c.Metric}`);
      }

      const p75 = percentile(values, 75);
      const pass = p75 <= target.value;
      record({
        status: pass ? 'PASS' : 'FAIL',
        measured: formatValue(p75, target.display),
        measuredRaw: p75,
        runs: values.map((v) => formatValue(v, target.display)),
      });
      expect(p75, `${c.Metric} p75 ${formatValue(p75, target.display)} > target ${c['Target (Good)']}`).toBeLessThanOrEqual(target.value);
    });
  }
});
