// Builds FullTestResultSummary.md: one dashboard across every category — status tallies
// (pass/fail/manual/blocked/…), execution split (auto vs manual vs main-repo), and the exact
// terminal command to run each category. Reads the same resolved rows as the per-category
// sheets, so the numbers always match. Usage: npm run dashboard
import 'dotenv/config';
import fs from 'node:fs';
import { CATEGORIES, resolveCategory } from '../utils/results.js';

// Category key → how to run it in the terminal.
const RUN = {
  'web-vitals': 'npm run test:wv',
  'business-logic': 'npm run test:biz',
  security: 'npm run test:security',
  'bundle-size': 'npm run test:bundle',
  accessibility: 'npm run test:a11y',
  recovery: 'npm run test:recovery',
  'api-contract': 'npm run test:api',
  'runtime-performance': 'npm run test:runtime',
  compatibility: 'npm run test:compat',
  'visual-regression': 'npm run test:visual',
  'ui-ux': 'npm run test:uiux',
  'component-unit': 'npm run test:unit',
};
// Extra notes per category where the command needs context.
const RUN_NOTE = {
  'bundle-size': 'Node HTTP+analysis script (no browser).',
  'component-unit': 'Node test runner against the product source (set MAIN_REPO if not ./Swasthx_HIP_Frontend).',
  'api-contract': 'Runs serially; retries through QA gateway 5xx.',
  compatibility: 'Runs on all 4 browsers (chromium, webkit, firefox, edge).',
  'visual-regression': 'Compares to baselines; `npm run test:visual:update` re-blesses them.',
  security: 'Add `npm run sec:mainrepo` for the dependency/CVE + source checks.',
};

const STATUS_ORDER = ['PASS', 'FAIL', 'ERROR', 'MANUAL PENDING', 'MAIN REPO', 'BLOCKED', 'NOT RUN'];
const STATUS_LABEL = { PASS: '✅ Pass', FAIL: '❌ Fail', ERROR: '⚠️ Error', 'MANUAL PENDING': '📝 Manual', 'MAIN REPO': '🏗️ Main repo', BLOCKED: '⏸️ Blocked', 'NOT RUN': '⏭️ Not run' };
// Execution buckets → auto vs needs-a-human / needs the source.
const AUTO_EXEC = new Set(['auto', 'auto+manual', 'auto+main']);

const cats = CATEGORIES.map((c) => {
  const { rows } = resolveCategory(c);
  const by = (s) => rows.filter((r) => r.status === s).length;
  const auto = rows.filter((r) => AUTO_EXEC.has(r.exec)).length;
  const manualOrMain = rows.filter((r) => ['manual', 'main', 'needs-data'].includes(r.exec)).length;
  const executed = by('PASS') + by('FAIL') + by('ERROR');
  const passRate = executed ? Math.round((by('PASS') / executed) * 100) : null;
  return { c, rows, total: rows.length, by, auto, manualOrMain, executed, passRate };
});

const sum = (sel) => cats.reduce((n, x) => n + sel(x), 0);
const grand = {
  total: sum((x) => x.total),
  ...Object.fromEntries(STATUS_ORDER.map((s) => [s, sum((x) => x.by(s))])),
  auto: sum((x) => x.auto),
  executed: sum((x) => x.executed),
};
const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
const env = process.env.BASE_URL || '—';
const o = [];

o.push('# HIMS Frontend QA — Full Test Result Summary', '');
o.push(`_Generated ${now} UTC · target ${env} · regenerate with \`npm run dashboard\`_`, '');

o.push('## Totals', '');
o.push(`| Test cases | Executed | ✅ Pass | ❌ Fail | ⚠️ Error | 📝 Manual | 🏗️ Main repo | ⏸️ Blocked | ⏭️ Not run |`);
o.push('|---|---|---|---|---|---|---|---|---|');
o.push(`| **${grand.total}** | ${grand.executed} | **${grand.PASS}** | **${grand.FAIL}** | ${grand.ERROR} | ${grand['MANUAL PENDING']} | ${grand['MAIN REPO']} | ${grand.BLOCKED} | ${grand['NOT RUN']} |`);
const execPass = grand.executed ? Math.round((grand.PASS / grand.executed) * 100) : 0;
o.push('', `**${grand.auto}** of ${grand.total} TCs are automated in this repo. Pass rate of executed (pass+fail+error) tests: **${execPass}%**.`, '');

o.push('## By category', '');
o.push('| Category | Command | Total | ✅ | ❌ | ⚠️ | 📝 | 🏗️ | ⏸️ | ⏭️ | Pass rate* |');
o.push('|---|---|---|---|---|---|---|---|---|---|---|');
for (const x of cats) {
  const cmd = RUN[x.c.key] ? `\`${RUN[x.c.key]}\`` : '—';
  o.push(`| **${x.c.title}** | ${cmd} | ${x.total} | ${x.by('PASS')} | ${x.by('FAIL')} | ${x.by('ERROR')} | ${x.by('MANUAL PENDING')} | ${x.by('MAIN REPO')} | ${x.by('BLOCKED')} | ${x.by('NOT RUN')} | ${x.passRate == null ? '—' : x.passRate + '%'} |`);
}
o.push('', '\\* Pass rate = pass ÷ (pass + fail + error), i.e. of the tests that actually executed. Manual/main-repo/blocked/not-run are excluded.', '');

o.push('## Automated vs not', '');
o.push('| Category | Automated here | Manual / main-repo / needs-data |');
o.push('|---|---|---|');
for (const x of cats) o.push(`| ${x.c.title} | ${x.auto} | ${x.manualOrMain} |`);
o.push(`| **Total** | **${grand.auto}** | **${sum((x) => x.manualOrMain)}** |`, '');

o.push('## How to run each category', '');
o.push('```bash', 'npm install && npx playwright install chromium webkit firefox   # first time', 'cp .env.example .env                                           # fill BASE_URL, API_BASE_URL, test accounts', '');
for (const x of cats) {
  if (!RUN[x.c.key]) continue;
  o.push(`# ${x.c.title}${RUN_NOTE[x.c.key] ? ` — ${RUN_NOTE[x.c.key]}` : ''}`);
  o.push(RUN[x.c.key]);
  o.push('');
}
o.push('npm test            # everything, all 4 browsers', 'npm run results     # rebuild all Test-result/*.md from recorded data (no run)', 'npm run dashboard   # rebuild this summary', 'npm run report      # open the Playwright HTML report', '```', '');

o.push('## Result sheets', '');
o.push('Per-category detail (every TC, traceable) lives in `Test-result/`:', '');
for (const x of cats) o.push(`- **${x.c.title}** → \`Test-result/${x.c.out}\``);
o.push('', '> Statuses: **Pass/Fail/Error** are executed results (Error = test could not complete, e.g. QA gateway down). **Manual** = needs a human (recorded in `Test-case-csv/manual-results.csv`). **Main repo** = needs the product source (unit tests, CVEs, React Profiler). **Blocked** = needs QA data writes. **Not run** = automatable but pending a seed/selector.', '');

fs.writeFileSync('FullTestResultSummary.md', o.join('\n'));
console.log(`FullTestResultSummary.md written — ${grand.total} TCs across ${cats.length} categories (${grand.PASS} pass / ${grand.FAIL} fail / ${grand.auto} automated).`);
