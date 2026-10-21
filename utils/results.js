import fs from 'node:fs';
import path from 'node:path';
import { readCsvObjects } from './csv.js';
import { executionFor } from '../Test-case-csv/execution-plan.js';

// One result sheet per test-case CSV. `out` lands in Test-result/, merged state in Test-result/data/.
export const CASES_DIR = 'Test-case-csv';
export const RESULT_DIR = 'Test-result';
const DATA_DIR = path.join(RESULT_DIR, 'data');
const MANUAL_FILE = path.join(CASES_DIR, 'manual-results.csv');

export const CATEGORIES = [
  { key: 'web-vitals', title: 'Web Vitals', csv: 'Testcase-HIMS-Frontend - Web Vitals.csv', out: 'webvitalResult.md', header: webVitalsHeader },
  { key: 'business-logic', title: 'Business Logic', csv: 'Testcase-HIMS-Frontend - Business Logic.csv', out: 'businessLogicResult.md' },
  { key: 'security', title: 'Security', csv: 'Testcase-HIMS-Frontend - Security Test.csv', out: 'securityResult.md' },
  { key: 'bundle-size', title: 'Bundle Size', csv: 'Testcase-HIMS-Frontend - Bundle-size.csv', out: 'bundleSizeResult.md' },
  { key: 'accessibility', title: 'Accessibility', csv: 'Testcase-HIMS-Frontend - Accessibility.csv', out: 'accessibilityResult.md' },
  { key: 'recovery', title: 'Recovery', csv: 'Testcase-HIMS-Frontend - Recovery.csv', out: 'recoveryResult.md' },
  { key: 'api-contract', title: 'API Contract', csv: 'Testcase-HIMS-Frontend - API contract.csv', out: 'apiContractResult.md' },
  { key: 'runtime-performance', title: 'Runtime Performance', csv: 'Testcase-HIMS-Frontend - Runtime Performace.csv', out: 'runtimePerformanceResult.md' },
  { key: 'compatibility', title: 'Compatibility', csv: 'Testcase-HIMS-Frontend - Compactibility.csv', out: 'compatibilityResult.md' },
  { key: 'visual-regression', title: 'Visual Regression', csv: 'Testcase-HIMS-Frontend - Visual Regression.csv', out: 'visualRegressionResult.md' },
  { key: 'ui-ux', title: 'UI/UX', csv: 'Testcase-HIMS-Frontend - UI_UX.csv', out: 'uiUxResult.md' },
  { key: 'component-unit', title: 'Component / Unit', csv: 'Testcase-HIMS-Frontend - Component_unit Testing.csv', out: 'componentUnitResult.md' },
];

// CSV placeholder columns that the result sheet fills itself.
const RESULT_COLUMNS = new Set(['Measured', 'Pass/Fail', 'Status']);

export function loadCases(category) {
  return readCsvObjects(path.join(CASES_DIR, category.csv));
}

/** TC ID → category key, across every CSV. */
export function tcIndex() {
  const index = new Map();
  for (const c of CATEGORIES) for (const r of loadCases(c).rows) index.set(r['TC ID'], c.key);
  return index;
}

const stateFile = (key) => path.join(DATA_DIR, `${key}.json`);
export function loadState(key) {
  try {
    return JSON.parse(fs.readFileSync(stateFile(key), 'utf8'));
  } catch {
    return {};
  }
}
export function saveState(key, state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(stateFile(key), JSON.stringify(state, null, 2));
}

/** Test-case-csv/manual-results.csv: TC ID, Status, Tester, Date, Evidence / Notes. */
export function loadManualResults() {
  if (!fs.existsSync(MANUAL_FILE)) return new Map();
  return new Map(readCsvObjects(MANUAL_FILE).rows.filter((r) => r['TC ID']).map((r) => [r['TC ID'], r]));
}

// ---- aggregation of several test results (sub-checks, browsers) into one TC row ----

const RANK = { FAIL: 4, ERROR: 3, PASS: 2, 'NOT RUN': 1 };

/**
 * results: [{ project, title, status: PASS|FAIL|ERROR|NOT RUN, measured?, runs?, notes?: [], error?, skipReason?, reports? }]
 */
export function aggregate(results, runAt) {
  const status = results.reduce((s, r) => (RANK[r.status] > RANK[s] ? r.status : s), 'NOT RUN');
  const notes = [];
  const projects = [...new Set(results.map((r) => r.project))];
  if (results.length > 1) {
    const by = (s) => results.filter((r) => r.status === s).length;
    notes.push(`${by('PASS')}/${results.length} checks passed${projects.length > 1 ? ` across ${projects.join(', ')}` : ''}`);
  }
  for (const r of results) for (const n of r.notes ?? []) if (!notes.includes(n)) notes.push(n);
  const failures = results.filter((r) => r.status === 'FAIL' || r.status === 'ERROR');
  for (const f of failures.slice(0, 6)) {
    const where = [projects.length > 1 ? f.project : null, results.length > 1 ? f.subtitle : null].filter(Boolean).join(' · ');
    if (f.error) notes.push(`${where ? `${where}: ` : ''}${f.error}`);
  }
  if (failures.length > 6) notes.push(`…and ${failures.length - 6} more failing checks`);
  if (status === 'NOT RUN') for (const r of results) if (r.skipReason && !notes.includes(r.skipReason)) notes.push(r.skipReason);

  const withMeasure = results.filter((r) => r.measured !== undefined);
  return {
    status,
    measured: withMeasure.length === 1 ? withMeasure[0].measured : withMeasure.length ? withMeasure.map((r) => `${r.project}: ${r.measured}`).join(' · ') : undefined,
    runs: withMeasure.length === 1 ? withMeasure[0].runs : undefined,
    reports: results.flatMap((r) => r.reports ?? []),
    projects,
    notes,
    runAt,
    env: process.env.BASE_URL,
  };
}

// ---- rendering ----

const EXEC_LABEL = {
  auto: 'Auto',
  'auto+manual': 'Auto + Manual',
  'auto+main': 'Auto + Main repo',
  manual: 'Manual',
  main: 'Main repo',
  'needs-data': 'Needs data',
};
const BADGE = {
  PASS: '✅ PASS',
  FAIL: '❌ FAIL',
  ERROR: '⚠️ ERROR',
  'NOT RUN': '⏭️ NOT RUN',
  'MANUAL PENDING': '📝 MANUAL PENDING',
  'MAIN REPO': '🏗️ MAIN REPO',
  BLOCKED: '⏸️ BLOCKED',
};
const cell = (s) => String(s ?? '—').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|') || '—';

/** Final row status/notes from: automated state, execution plan, manual results. */
function resolveRow(categoryKey, csvRow, state, manual) {
  const id = csvRow['TC ID'];
  const exec = executionFor(categoryKey, id);
  // A skipped run of a manual/main/needs-data TC says nothing new: show the plan's label.
  const planned = ['manual', 'main', 'needs-data'].includes(exec.exec);
  const auto = planned && state[id]?.status === 'NOT RUN' ? undefined : state[id];
  const man = manual.get(id);
  const row = { ...csvRow, exec: exec.exec, notes: [...(auto?.notes ?? [])], status: auto?.status, measured: auto?.measured, runs: auto?.runs, reports: auto?.reports, runAt: auto?.runAt };

  if (!auto) {
    if (exec.exec === 'main') row.status = 'MAIN REPO';
    else if (exec.exec === 'manual') row.status = 'MANUAL PENDING';
    else if (exec.exec === 'needs-data') row.status = 'BLOCKED';
    else row.status = 'NOT RUN';
    if (exec.reason) row.notes.push(exec.reason);
    else if (row.status === 'NOT RUN') row.notes.push('Not automated yet');
  }
  if (man?.Status) {
    const s = man.Status.trim().toUpperCase();
    const manualNote = `Manual: ${s}${man.Tester ? ` by ${man.Tester}` : ''}${man.Date ? ` on ${man.Date}` : ''}${man['Evidence / Notes'] ? ` (${man['Evidence / Notes']})` : ''}`;
    if (!auto || ['manual', 'main', 'needs-data'].includes(exec.exec)) {
      row.status = s;
      row.notes = [manualNote];
      row.runAt = man.Date || row.runAt;
    } else {
      row.notes.push(manualNote);
      if (s === 'FAIL') row.status = 'FAIL';
    }
  } else if (auto && exec.exec === 'auto+manual' && row.status === 'PASS') {
    row.notes.push('Manual sign-off pending');
  }
  return row;
}

// Resolved rows (final status + execution bucket) for a category — the single source the
// per-category sheet and the dashboard both read, so their numbers always agree.
export function resolveCategory(category) {
  const { columns, rows: csvRows } = loadCases(category);
  const state = loadState(category.key);
  const manual = loadManualResults();
  return { columns, rows: csvRows.map((r) => resolveRow(category.key, r, state, manual)) };
}

export const BADGE_MAP = BADGE;
export const EXEC_LABELS = EXEC_LABEL;

export function renderCategory(category, { updatedAt = new Date() } = {}) {
  const { columns, rows } = resolveCategory(category);
  const state = loadState(category.key);
  const shownCols = columns.filter((c) => !RESULT_COLUMNS.has(c));
  const hasMeasure = rows.some((r) => r.measured !== undefined);
  const groupCol = ['Module', 'Module / Area', 'Category'].find((c) => columns.includes(c));
  const statuses = Object.keys(BADGE);
  const count = (list, s) => list.filter((r) => r.status === s).length;
  const envs = [...new Set(Object.values(state).map((s) => s.env).filter(Boolean))];

  const out = [];
  out.push(`# ${category.title}: Result Sheet`, '');
  out.push('| Run | Value |', '|---|---|');
  out.push(`| Last updated | ${updatedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC (each row's own time is in "Run at") |`);
  out.push(`| Environment | ${envs.join(', ') || process.env.BASE_URL || '—'} |`);
  out.push(`| Test cases | \`${CASES_DIR}/${category.csv}\` |`);
  for (const line of category.header?.() ?? []) out.push(line);
  out.push('');

  out.push('## Summary', '');
  const used = statuses.filter((s) => count(rows, s));
  out.push(`| Total | ${used.map((s) => BADGE[s]).join(' | ')} |`, `|---|${used.map(() => '---').join('|')}|`);
  out.push(`| ${rows.length} | ${used.map((s) => count(rows, s)).join(' | ')} |`, '');
  if (groupCol) {
    out.push(`| ${groupCol} | ${used.map((s) => BADGE[s]).join(' | ')} |`, `|---|${used.map(() => '---').join('|')}|`);
    for (const g of [...new Set(rows.map((r) => r[groupCol]))]) {
      const list = rows.filter((r) => r[groupCol] === g);
      out.push(`| ${cell(g)} | ${used.map((s) => count(list, s)).join(' | ')} |`);
    }
    out.push('');
  }
  out.push('| Execution | TCs |', '|---|---|');
  for (const [k, label] of Object.entries(EXEC_LABEL)) {
    const n = rows.filter((r) => r.exec === k).length;
    if (n) out.push(`| ${label} | ${n} |`);
  }
  out.push('');

  out.push('## Results', '');
  const head = [...shownCols, 'Execution', 'Status', ...(hasMeasure ? ['Measured', 'Runs'] : []), 'Run at (UTC)', 'Notes'];
  out.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`);
  for (const r of rows) {
    const notes = [...r.notes];
    if (r.reports?.length) notes.push(`[report](../${r.reports.at(-1)})`);
    const vals = [
      ...shownCols.map((c) => (c === 'TC ID' ? `**${cell(r[c])}**` : cell(r[c]))),
      EXEC_LABEL[r.exec],
      BADGE[r.status] ?? r.status,
      ...(hasMeasure ? [r.measured !== undefined ? `**${cell(r.measured)}**` : '—', cell(r.runs?.join(' / ') || '—')] : []),
      r.runAt ? String(r.runAt).replace('T', ' ').slice(0, 16) : '—',
      cell(notes.join('; ') || '—'),
    ];
    out.push(`| ${vals.join(' | ')} |`);
  }
  out.push('');

  const section = (title, filter) => {
    const list = rows.filter(filter);
    if (!list.length) return;
    out.push(`## ${title}`, '');
    for (const r of list) out.push(`- **${r['TC ID']}**: ${cell(r.notes.join('; ') || '—')}`);
    out.push('');
  };
  section('Failures', (r) => r.status === 'FAIL');
  section('Errors (test could not complete)', (r) => r.status === 'ERROR');
  section('Blocked: needs QA data writes', (r) => r.status === 'BLOCKED');
  section('Manual, pending', (r) => r.status === 'MANUAL PENDING');
  section('Requires main repo', (r) => r.status === 'MAIN REPO');
  out.push(
    '> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.',
    '> Execution buckets are defined in `Test-case-csv/execution-plan.js`.',
    '',
  );

  fs.mkdirSync(RESULT_DIR, { recursive: true });
  const file = path.join(RESULT_DIR, category.out);
  fs.writeFileSync(file, out.join('\n'));
  return file;
}

function webVitalsHeader() {
  const engine = process.env.WV_ENGINE || 'playwright';
  return [
    `| Runs per measurement | ${process.env.WV_RUNS || 3} (Measured = p75 of the runs, linear interpolation) |`,
    engine === 'lighthouse'
      ? '| Tooling | Lighthouse, simulated throttling (LCP, FCP, CLS, TTFB) · Playwright + web-vitals (INP) |'
      : "| Tooling | Playwright + web-vitals 5, DevTools throttling, cold cache. Lighthouse can't load QA deep links (HTTP 404 SPA fallback) |",
    engine === 'lighthouse'
      ? '| Profiles | Mobile · Fast 3G = Lighthouse mobile (150ms RTT, 1.6 Mbps, 4× CPU) · Desktop · Cable = 28ms RTT, 5 Mbps, 1× CPU |'
      : '| Profiles | Mobile · Fast 3G = DevTools "Fast 3G" (562.5ms, 1.47/0.68 Mbps) + 4× CPU, Moto G4 · Desktop · Cable = 28ms, 5/1 Mbps, 1× CPU, 1350×940 |',
  ];
}
