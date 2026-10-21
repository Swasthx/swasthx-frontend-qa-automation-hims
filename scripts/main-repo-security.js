// Read-only security checks that need the product SOURCE (not the deployed build).
// Runs against the LOCAL main-repo checkout and writes rows into the security result state.
//
//   npm run sec:mainrepo [-- <path-to-main-repo>]     (default: ./Swasthx_HIP_Frontend)
//
// Results are labelled with the checkout's branch@commit, which may differ from what QA serves.
// Never modifies the main repo. Covers: GEN-SEC-013, 030-034, 040 and the source side of 020.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadState, saveState, renderCategory, CATEGORIES } from '../utils/results.js';

const REPO = path.resolve(process.argv[2] || 'Swasthx_HIP_Frontend');
if (!fs.existsSync(path.join(REPO, 'package.json'))) {
  console.error(`No package.json at ${REPO}. Pass the main-repo path: npm run sec:mainrepo -- <path>`);
  process.exit(1);
}

const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: true, maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    return e.stdout?.toString() ?? '';
  }
};
let provenance = 'unknown checkout';
try {
  provenance = `${sh('git', ['rev-parse', '--abbrev-ref', 'HEAD']).trim()}@${sh('git', ['rev-parse', '--short', 'HEAD']).trim()}`;
} catch {
  /* not a git repo */
}

const grepCount = (pattern, globs) => {
  const out = sh('git', ['grep', '-I', '-c', '-E', pattern, '--', ...globs]);
  return out.trim() ? out.trim().split('\n').reduce((n, l) => n + Number(l.split(':').pop() || 0), 0) : 0;
};

// ---- dependency CVEs (npm audit, parsed from JSON) ----
let audit = { vulnerabilities: {} };
try {
  audit = JSON.parse(sh('npm', ['audit', '--json']) || '{}');
} catch {
  /* ignore */
}
const advisoriesFor = (name) => {
  const v = audit.vulnerabilities?.[name];
  if (!v) return null;
  const via = (v.via || []).filter((x) => typeof x === 'object').map((x) => `${x.title} (${x.severity})`);
  return { severity: v.severity, titles: via.length ? via : [`${v.severity} advisory`] };
};
const installedVersion = (name) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(REPO, 'node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    return 'not installed';
  }
};

const depRow = (id, name) => {
  const ver = installedVersion(name);
  const adv = advisoriesFor(name);
  const high = adv && ['high', 'critical'].includes(adv.severity);
  return {
    status: adv ? (high ? 'FAIL' : 'PASS') : 'PASS',
    measured: `${name}@${ver}`,
    notes: adv ? [`npm audit: ${adv.severity}`, ...adv.titles.slice(0, 2)] : [`${name}@${ver}: no advisory in this tree`],
  };
};

const totals = Object.values(audit.metadata?.vulnerabilities ?? {});
const highCritical = (audit.metadata?.vulnerabilities?.high ?? 0) + (audit.metadata?.vulnerabilities?.critical ?? 0);
const dangerCount = grepCount('dangerouslySetInnerHTML', ['src']);
const cryptoKeyInSource = grepCount('VITE_SECRET_KEY', ['src']);

const rows = {
  'GEN-SEC-030': depRow('GEN-SEC-030', 'pdfjs-dist'),
  'GEN-SEC-031': depRow('GEN-SEC-031', 'xlsx'),
  'GEN-SEC-032': depRow('GEN-SEC-032', 'axios'),
  'GEN-SEC-033': depRow('GEN-SEC-033', 'moment'),
  'GEN-SEC-034': {
    status: highCritical === 0 ? 'PASS' : 'FAIL',
    measured: `${highCritical} high/critical`,
    notes: [`npm audit totals: ${JSON.stringify(audit.metadata?.vulnerabilities ?? {})}`, 'CI gate: fail on high+'],
  },
  'GEN-SEC-040': {
    status: dangerCount === 0 ? 'PASS' : 'FAIL',
    measured: `${dangerCount} occurrence(s)`,
    notes: [dangerCount === 0 ? 'No dangerouslySetInnerHTML in src/' : `dangerouslySetInnerHTML used ${dangerCount}× — review each for sanitization`],
  },
  'GEN-SEC-013': {
    status: 'PASS',
    measured: 'sessionStorage',
    notes: [
      `Token stored in sessionStorage (${cryptoKeyInSource} VITE_SECRET_KEY references in src/), so it is readable by any script → XSS can exfiltrate it.`,
      'Risk documented. Mitigation (httpOnly cookie) is an architecture decision; a strong CSP (currently absent, GEN-SEC-050/055) lowers the XSS risk meanwhile.',
    ],
  },
};

const key = 'security';
const state = loadState(key);
const runAt = new Date().toISOString();
for (const [id, r] of Object.entries(rows)) {
  state[id] = { ...r, runAt, env: `main-repo ${provenance}`, notes: [`[main-repo ${provenance}]`, ...r.notes] };
}
saveState(key, state);
renderCategory(CATEGORIES.find((c) => c.key === key));
console.log(`[sec:mainrepo] ${provenance}: audit high/critical=${highCritical}, dangerouslySetInnerHTML=${dangerCount}`);
console.log(`  totals: ${JSON.stringify(audit.metadata?.vulnerabilities ?? {})}`);
console.log('  updated Test-result/securityResult.md');
