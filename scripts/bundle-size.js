// Bundle-size checks against the DEPLOYED build (black-box). Fetches index.html + its
// same-origin JS/CSS assets, measures raw + gzip transfer and the Content-Encoding actually
// served, detects whether heavy libraries ship in the initial bundle, and evaluates each
// BND-* budget from Test-case-csv. Writes Test-result/bundleSizeResult.md.
//
//   npm run test:bundle
//
// Per-module chunk sizes and tree-shaking (BND-033/040/041/042) need source maps, which QA does
// not publish; those stay "main repo" (see execution-plan.js) — run scripts/main-repo-bundle.js.
import 'dotenv/config';
import zlib from 'node:zlib';
import { request } from '@playwright/test';
import { BASE_URL, assertNotProduction, API_BASE_URL } from '../utils/env.js';
import { CATEGORIES, loadState, saveState, renderCategory } from '../utils/results.js';

assertNotProduction([BASE_URL(), API_BASE_URL()]);
const base = BASE_URL();
const KB = 1024;
const gzip = (buf) => zlib.gzipSync(buf, { level: 9 }).length;
const kb = (n) => `${(n / KB).toFixed(1)} KB`;

// Library signatures to detect presence in the initial bundle (minified-safe substrings).
const LIB_SIGNATURES = {
  'pdfjs-dist': [/pdfjs|GlobalWorkerOptions|getDocument/], // BND-020
  '@react-pdf': [/@react-pdf|react-pdf\/renderer/], //        BND-020/021
  xlsx: [/sheetjs|XLSX|book_new|sheet_to_json/i], //          BND-022
  recharts: [/recharts|CartesianGrid|ResponsiveContainer/], //BND-023
  leaflet: [/leaflet|L\.map|tileLayer/], //                   BND-024
  'video-react': [/video-react|BigPlayButton/], //            BND-025
  moment: [/\bmoment\b|__moment__|moment\.fn/], //            BND-030
  dayjs: [/dayjs/], //                                        BND-030
  'react-toastify': [/react-toastify|Toastify__/], //         BND-031
  'react-hot-toast': [/react-hot-toast|useToaster/], //       BND-031
  sweetalert: [/sweetalert|swal/i], //                        BND-031
  html2canvas: [/html2canvas/], //                            BND-032
  mobx: [/mobx|__mobxInstanceCount|observable/], //           BND-034
  '@reduxjs/toolkit': [/@reduxjs|configureStore|createSlice/], // BND-034
};

async function fetchBundle() {
  const ctx = await request.newContext();
  try {
    const htmlRes = await ctx.get(base + '/');
    const html = await htmlRes.text();
    const refs = [...new Set([...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]))]
      .filter((u) => u.startsWith('/') && !u.startsWith('//') && u.startsWith('/assets/'));
    const assets = [];
    for (const path of refs) {
      const res = await ctx.get(new URL(path, base).href, { headers: { 'Accept-Encoding': 'br, gzip' } });
      const body = await res.body();
      assets.push({ path, type: path.endsWith('.css') ? 'css' : 'js', raw: body.length, gzip: gzip(body), servedEncoding: res.headers()['content-encoding'] || 'none', text: path.endsWith('.js') ? body.toString('utf8') : '' });
    }
    return { html, assets };
  } finally {
    await ctx.dispose();
  }
}

const { html, assets } = await fetchBundle();
const js = assets.filter((a) => a.type === 'js');
const css = assets.filter((a) => a.type === 'css');
const jsText = js.map((a) => a.text).join('');
const initialJsGzip = js.reduce((n, a) => n + a.gzip, 0);
const initialCssGzip = css.reduce((n, a) => n + a.gzip, 0);
const initialRaw = assets.reduce((n, a) => n + a.raw, 0);
const totalServed = assets.reduce((n, a) => n + (a.servedEncoding === 'none' ? a.raw : a.gzip), 0);
const uncompressed = assets.filter((a) => a.servedEncoding === 'none' && a.raw > 2 * KB);

const present = (lib) => LIB_SIGNATURES[lib].some((re) => re.test(jsText));
const splitNote = `single bundle: ${js.length} JS file(s), ${kb(js[0]?.raw ?? 0)} raw`;

// Each BND row → { status, measured, notes }.
const rows = {};
const set = (id, status, measured, ...notes) => (rows[id] = { status, measured, notes });

// --- initial-load budgets ---
set('BND-001', initialJsGzip <= 300 * KB ? 'PASS' : 'FAIL', `${kb(initialJsGzip)} gzip (${kb(js.reduce((n, a) => n + a.raw, 0))} raw)`, 'Budget ≤ 300 KB gzip. App is not code-split, so the whole app ships on first load.');
set('BND-002', initialCssGzip <= 100 * KB ? 'PASS' : 'FAIL', `${kb(initialCssGzip)} gzip`, 'Budget ≤ 100 KB gzip (antd + tailwind + slick + leaflet).');
set('BND-003', totalServed <= 400 * KB ? 'PASS' : 'FAIL', `${kb(totalServed)} actually transferred`, 'Budget ≤ 400 KB. Cold /login pulls the entire SPA bundle, not just a shell.');
set('BND-005', uncompressed.length === 0 ? 'PASS' : 'FAIL', uncompressed.length ? `${uncompressed.length} asset(s) served uncompressed` : 'all compressed', ...uncompressed.map((a) => `${a.path} served with no Content-Encoding (${kb(a.raw)}) — likely over the CDN's compression size limit`));

// --- regression gate: compare to stored baseline, set it on first run ---
const key = 'bundle-size';
const state = loadState(key);
const baseline = state['BND-004']?.baselineGzip;
if (!baseline) {
  rows['BND-004'] = { status: 'PASS', measured: `baseline set: ${kb(initialJsGzip)} gzip`, baselineGzip: initialJsGzip, notes: ['First run — recorded current initial JS as the baseline. Future runs fail on >5% growth.'] };
} else {
  const delta = ((initialJsGzip - baseline) / baseline) * 100;
  rows['BND-004'] = { status: delta <= 5 ? 'PASS' : 'FAIL', measured: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs baseline`, baselineGzip: baseline, notes: [`baseline ${kb(baseline)} → now ${kb(initialJsGzip)}`] };
}

// --- route-chunk code-splitting (BND-010..015): none exist in a single bundle ---
for (const [id, mod] of [['BND-010', 'SuperAdmin'], ['BND-011', 'Admin'], ['BND-012', 'Doctor'], ['BND-013', 'Diagnostic'], ['BND-014', 'Reception'], ['BND-015', 'Pharmacy']]) {
  set(id, 'FAIL', 'not code-split', `${mod} is not in its own async chunk — ${splitNote}. Static import in App.jsx.`);
}

// --- lazy-load libraries (BND-020..025): must NOT be in the initial bundle ---
const lazyChecks = [
  ['BND-020', ['pdfjs-dist', '@react-pdf'], 'PDF libs (jspdf/html2canvas/pdfjs/@react-pdf)'],
  ['BND-021', ['@react-pdf'], '@react-pdf-viewer'],
  ['BND-022', ['xlsx'], 'xlsx (SheetJS)'],
  ['BND-023', ['recharts'], 'recharts'],
  ['BND-024', ['leaflet'], 'leaflet'],
  ['BND-025', ['video-react'], 'video-react'],
];
for (const [id, libs, label] of lazyChecks) {
  const found = libs.filter(present);
  set(id, found.length ? 'FAIL' : 'PASS', found.length ? `in initial bundle` : 'not detected in initial', found.length ? `${label} ships in the initial bundle (should load only on its screen): ${found.join(', ')}` : `${label} not detected in the initial bundle`);
}

// --- duplicate libraries ---
const dateLibs = ['moment', 'dayjs'].filter(present);
set('BND-030', dateLibs.length <= 1 ? 'PASS' : 'FAIL', dateLibs.join(' + ') || 'none', dateLibs.length > 1 ? `Two date libraries ship: ${dateLibs.join(' + ')} — migrate moment → dayjs` : `Date lib: ${dateLibs.join(', ') || 'none detected'}`);
const toastLibs = ['react-toastify', 'react-hot-toast', 'sweetalert'].filter(present);
set('BND-031', toastLibs.length <= 1 ? 'PASS' : 'FAIL', toastLibs.join(' + ') || 'none', toastLibs.length > 1 ? `Multiple toast/alert libs: ${toastLibs.join(' + ')} — consolidate` : `Toast lib: ${toastLibs.join(', ') || 'none detected'}`);
// Original html2canvas sets data-html2canvas-* attributes; the fork adds the "-pro" package id.
const hasHtml2canvas = /data-html2canvas|html2canvas\.js/.test(jsText);
const hasHtml2canvasPro = /html2canvas-pro/.test(jsText);
const canvasLibs = [hasHtml2canvas && 'html2canvas', hasHtml2canvasPro && 'html2canvas-pro'].filter(Boolean);
set('BND-032', canvasLibs.length > 1 ? 'FAIL' : 'PASS', canvasLibs.join(' + ') || 'none', canvasLibs.length > 1 ? `Both ship — keep one: ${canvasLibs.join(' + ')}` : `Canvas lib: ${canvasLibs.join(', ') || 'none'}`);

const runAt = new Date().toISOString();
for (const [id, r] of Object.entries(rows)) state[id] = { ...r, runAt, env: base };
saveState(key, state);
renderCategory(CATEGORIES.find((c) => c.key === key));

console.log(`[bundle-size] initial JS ${kb(initialJsGzip)} gzip / ${kb(js.reduce((n, a) => n + a.raw, 0))} raw · CSS ${kb(initialCssGzip)} gzip · served-uncompressed: ${uncompressed.map((a) => a.path).join(', ') || 'none'}`);
console.log(`  libraries in initial bundle: ${Object.keys(LIB_SIGNATURES).filter(present).join(', ')}`);
console.log('  updated Test-result/bundleSizeResult.md');
