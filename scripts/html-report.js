// Generates Test-result/index.html — a single self-contained page (inline CSS+JS, no network,
// no build) that renders every category's results in the browser. Deploy Test-result/ as static
// files (or just open the file) and the whole report is viewable. Usage: npm run report:html
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES, resolveCategory } from '../utils/results.js';

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
const STATUS = ['PASS', 'FAIL', 'ERROR', 'MANUAL PENDING', 'MAIN REPO', 'BLOCKED', 'NOT RUN'];
const EXEC_LABEL = { auto: 'Auto', 'auto+manual': 'Auto + Manual', 'auto+main': 'Auto + Main', manual: 'Manual', main: 'Main repo', 'needs-data': 'Needs data' };

// Build a compact data model the page renders from.
const data = CATEGORIES.map((c) => {
  const { columns, rows } = resolveCategory(c);
  const descCol = columns.find((col) => !['TC ID', 'Module', 'Module / Area', 'Category'].includes(col) && !['Measured', 'Pass/Fail', 'Status'].includes(col));
  const groupCol = ['Module', 'Module / Area', 'Category'].find((col) => columns.includes(col));
  return {
    key: c.key,
    title: c.title,
    command: RUN[c.key] || '',
    counts: Object.fromEntries(STATUS.map((s) => [s, rows.filter((r) => r.status === s).length])),
    rows: rows.map((r) => ({
      id: r['TC ID'],
      group: groupCol ? r[groupCol] : '',
      desc: descCol ? r[descCol] : '',
      status: r.status,
      exec: EXEC_LABEL[r.exec] || r.exec,
      measured: r.measured ?? '',
      notes: (r.notes || []).join(' · '),
    })),
  };
});
const totals = Object.fromEntries(STATUS.map((s) => [s, data.reduce((n, c) => n + c.counts[s], 0)]));
const total = data.reduce((n, c) => n + c.rows.length, 0);
const meta = { generated: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC', env: process.env.BASE_URL || '—' };

const json = JSON.stringify({ data, totals, total, meta }).replace(/</g, '\\u003c');

const html = `<!doctype html>
<html lang="en" data-theme="auto">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HIMS QA — Test Report</title>
<style>
  :root{
    --bg:#f6f7f9; --card:#fff; --ink:#1a1f2b; --muted:#5b6472; --line:#e4e7ec; --accent:#2f6feb;
    --pass:#15803d; --pass-bg:#dcfce7; --fail:#b42318; --fail-bg:#fee4e2; --error:#b54708; --error-bg:#fef0c7;
    --manual:#1570cf; --manual-bg:#d1e9ff; --main:#6941c6; --main-bg:#ebe9fe; --blocked:#475467; --blocked-bg:#eaecf0; --notrun:#667085; --notrun-bg:#f2f4f7;
  }
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
    --bg:#0f1420; --card:#171d2b; --ink:#e7ecf3; --muted:#9aa5b5; --line:#2a3242; --accent:#5b8cff;
    --pass-bg:#10341f; --fail-bg:#3a1714; --error-bg:#3a2a0c; --manual-bg:#0f2e4d; --main-bg:#241a46; --blocked-bg:#232a37; --notrun-bg:#1c2330;
  }}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  .wrap{max-width:1200px;margin:0 auto;padding:24px 16px 64px}
  header h1{margin:0 0 4px;font-size:22px}
  .sub{color:var(--muted);font-size:13px;margin-bottom:20px}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin:16px 0}
  .kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
  .kpi .n{font-size:24px;font-weight:700}
  .kpi .l{font-size:12px;color:var(--muted)}
  .bar{display:flex;height:14px;border-radius:8px;overflow:hidden;margin:6px 0 20px;border:1px solid var(--line)}
  .bar span{display:block}
  .controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px}
  .controls input{flex:1;min-width:180px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}
  .chip{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:5px 11px;font-size:12px;cursor:pointer;user-select:none}
  .chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
  .cat{background:var(--card);border:1px solid var(--line);border-radius:14px;margin:12px 0;overflow:hidden}
  .cat>summary{cursor:pointer;padding:14px 16px;font-weight:600;display:flex;flex-wrap:wrap;gap:10px;align-items:center;list-style:none}
  .cat>summary::-webkit-details-marker{display:none}
  .cat>summary .mini{font-size:12px;font-weight:500;color:var(--muted)}
  .cat>summary code{background:var(--notrun-bg);padding:2px 7px;border-radius:6px;font-size:12px}
  .tbl{width:100%;border-collapse:collapse;font-size:13px}
  .tbl th,.tbl td{text-align:left;padding:8px 10px;border-top:1px solid var(--line);vertical-align:top}
  .tbl th{color:var(--muted);font-weight:600;position:sticky;top:0;background:var(--card)}
  .tbl td.id{font-family:ui-monospace,Menlo,Consolas,monospace;white-space:nowrap;font-weight:600}
  .tbl td.notes{color:var(--muted);max-width:420px}
  .b{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap}
  .b.PASS{color:var(--pass);background:var(--pass-bg)} .b.FAIL{color:var(--fail);background:var(--fail-bg)}
  .b.ERROR{color:var(--error);background:var(--error-bg)} .b.MANUAL{color:var(--manual);background:var(--manual-bg)}
  .b.MAIN{color:var(--main);background:var(--main-bg)} .b.BLOCKED{color:var(--blocked);background:var(--blocked-bg)}
  .b.NOTRUN{color:var(--notrun);background:var(--notrun-bg)}
  .hidden{display:none}
  .legend{font-size:12px;color:var(--muted);margin-top:24px;line-height:1.7}
  @media (max-width:640px){.tbl td.notes{max-width:160px}}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Swasthx HIMS Frontend — QA Test Report</h1>
    <div class="sub" id="meta"></div>
  </header>
  <div class="bar" id="bar"></div>
  <div class="cards" id="kpis"></div>
  <div class="controls">
    <input id="q" placeholder="Filter by TC ID, text, notes…" />
    <span class="chip active" data-f="ALL">All</span>
    <span class="chip" data-f="PASS">Pass</span>
    <span class="chip" data-f="FAIL">Fail</span>
    <span class="chip" data-f="ERROR">Error</span>
    <span class="chip" data-f="MANUAL PENDING">Manual</span>
    <span class="chip" data-f="MAIN REPO">Main repo</span>
    <span class="chip" data-f="BLOCKED">Blocked</span>
    <span class="chip" data-f="NOT RUN">Not run</span>
  </div>
  <div id="cats"></div>
  <div class="legend" id="legend"></div>
</div>
<script>
const REPORT = ${json};
const COLORS = {PASS:'var(--pass)',FAIL:'var(--fail)',ERROR:'var(--error)','MANUAL PENDING':'var(--manual)','MAIN REPO':'var(--main)',BLOCKED:'var(--blocked)','NOT RUN':'var(--notrun)'};
const CLS = {PASS:'PASS',FAIL:'FAIL',ERROR:'ERROR','MANUAL PENDING':'MANUAL','MAIN REPO':'MAIN',BLOCKED:'BLOCKED','NOT RUN':'NOTRUN'};
const LABEL = {PASS:'Pass',FAIL:'Fail',ERROR:'Error','MANUAL PENDING':'Manual','MAIN REPO':'Main repo',BLOCKED:'Blocked','NOT RUN':'Not run'};
const esc = (s)=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.getElementById('meta').textContent = \`\${REPORT.total} test cases · \${REPORT.data.length} categories · generated \${REPORT.meta.generated} · target \${REPORT.meta.env}\`;

const order = Object.keys(COLORS);
document.getElementById('bar').innerHTML = order.filter(s=>REPORT.totals[s]).map(s=>\`<span title="\${LABEL[s]}: \${REPORT.totals[s]}" style="flex:\${REPORT.totals[s]};background:\${COLORS[s]}"></span>\`).join('');
document.getElementById('kpis').innerHTML = [['Total',REPORT.total,'var(--ink)'],...order.map(s=>[LABEL[s],REPORT.totals[s],COLORS[s]])]
  .map(([l,n,c])=>\`<div class="kpi"><div class="n" style="color:\${c}">\${n}</div><div class="l">\${l}</div></div>\`).join('');

const cats = document.getElementById('cats');
cats.innerHTML = REPORT.data.map(c=>{
  const open = c.counts.FAIL>0 ? 'open' : '';
  const mini = order.filter(s=>c.counts[s]).map(s=>\`\${LABEL[s]} \${c.counts[s]}\`).join(' · ');
  const rows = c.rows.map(r=>\`<tr data-status="\${r.status}" data-text="\${esc((r.id+' '+r.group+' '+r.desc+' '+r.notes).toLowerCase())}">
    <td class="id">\${esc(r.id)}</td>
    <td>\${esc(r.group)}</td>
    <td>\${esc(r.desc)}</td>
    <td><span class="b \${CLS[r.status]}">\${LABEL[r.status]||r.status}</span></td>
    <td>\${esc(r.exec)}</td>
    <td>\${esc(r.measured)}</td>
    <td class="notes">\${esc(r.notes)}</td></tr>\`).join('');
  return \`<details class="cat" \${open}>
    <summary>\${esc(c.title)} <span class="mini">\${mini}</span> \${c.command?\`<code>\${esc(c.command)}</code>\`:''}</summary>
    <table class="tbl"><thead><tr><th>TC ID</th><th>Module</th><th>Scenario</th><th>Status</th><th>Execution</th><th>Measured</th><th>Notes</th></tr></thead>
    <tbody>\${rows}</tbody></table></details>\`;
}).join('');

let filter='ALL', query='';
function apply(){
  document.querySelectorAll('.cat').forEach(cat=>{
    let shown=0;
    cat.querySelectorAll('tbody tr').forEach(tr=>{
      const okS = filter==='ALL' || tr.dataset.status===filter;
      const okQ = !query || tr.dataset.text.includes(query);
      const show = okS && okQ; tr.classList.toggle('hidden',!show); if(show) shown++;
    });
    cat.classList.toggle('hidden', shown===0);
    if(shown>0 && (filter!=='ALL'||query)) cat.open=true;
  });
}
document.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active')); ch.classList.add('active'); filter=ch.dataset.f; apply();
});
document.getElementById('q').oninput=(e)=>{query=e.target.value.toLowerCase().trim();apply();};
document.getElementById('legend').innerHTML = 'Pass / Fail / Error are executed results (Error = could not complete, e.g. environment down). Manual = needs a human. Main repo = needs the product source. Blocked = needs QA data writes. Not run = automatable but pending a seed/selector. · Regenerate with <code>npm run report:html</code>.';
</script>
</body>
</html>`;

// Write the report to both Test-result/ (local viewing + zip) and docs/ (served by GitHub Pages
// when Pages is set to "Deploy from a branch → main → /docs"). The report is self-contained,
// so a single index.html is all Pages needs; .nojekyll stops Pages' Jekyll from touching it.
for (const dir of ['Test-result', 'docs']) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
fs.writeFileSync(path.join('docs', '.nojekyll'), '');
console.log(`Report written to Test-result/index.html and docs/index.html — ${total} TCs, ${totals.PASS} pass / ${totals.FAIL} fail.`);
console.log('GitHub Pages (main /docs) will serve docs/index.html at the site root.');
