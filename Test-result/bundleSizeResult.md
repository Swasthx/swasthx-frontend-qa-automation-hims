# Bundle Size: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 06:34 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Bundle-size.csv` |

## Summary

| Total | ✅ PASS | ❌ FAIL | 🏗️ MAIN REPO |
|---|---|---|---|
| 25 | 2 | 18 | 5 |

| Module | ✅ PASS | ❌ FAIL | 🏗️ MAIN REPO |
|---|---|---|---|
| App-wide | 2 | 12 | 5 |
| SuperAdmin | 0 | 1 | 0 |
| Admin | 0 | 1 | 0 |
| Doctor | 0 | 1 | 0 |
| Diagnostic | 0 | 1 | 0 |
| Reception | 0 | 1 | 0 |
| Pharmacy | 0 | 1 | 0 |

| Execution | TCs |
|---|---|
| Auto | 20 |
| Main repo | 5 |

## Results

| TC ID | Module | Build Artifact / Chunk | Check | Size Type | Budget | Baseline | Tool | Notes / Action | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **BND-001** | App-wide | entry index-[hash].js + initial vendor | Initial JS budget (first load) | gzip | ≤ 300 KB | — | rollup-plugin-visualizer | App shell only; lazy modules must be excluded | Auto | ❌ FAIL | **2812.3 KB gzip (11378.7 KB raw)** | — | 2026-10-19 06:34 | Budget ≤ 300 KB gzip. App is not code-split, so the whole app ships on first load. |
| **BND-002** | App-wide | index-[hash].css | Initial CSS budget | gzip | ≤ 100 KB | — | source-map-explorer | antd + tailwind + slick + leaflet CSS | Auto | ✅ PASS | **62.3 KB gzip** | — | 2026-10-19 06:34 | Budget ≤ 100 KB gzip (antd + tailwind + slick + leaflet). |
| **BND-003** | App-wide | total first-load transfer | Total initial transfer (cold /login) | brotli | ≤ 400 KB | — | Lighthouse / Network | Shell + login only | Auto | ❌ FAIL | **11440.9 KB actually transferred** | — | 2026-10-19 06:34 | Budget ≤ 400 KB. Cold /login pulls the entire SPA bundle, not just a shell. |
| **BND-004** | App-wide | build output | Regression gate vs last release | gzip | ≤ +5% Δ | — | size-limit (CI) | Fail PR if initial JS grows >5% | Auto | ✅ PASS | **+0.0% vs baseline** | — | 2026-10-19 06:34 | baseline 2812.3 KB → now 2812.3 KB |
| **BND-005** | App-wide | build output | Compression served (gzip/brotli) | brotli | on | — | Network headers | Verify Content-Encoding | Auto | ❌ FAIL | **1 asset(s) served uncompressed** | — | 2026-10-19 06:34 | /assets/index-10e6cbe6.js served with no Content-Encoding (11378.7 KB) — likely over the CDN's compression size limit |
| **BND-010** | SuperAdmin | superadmin route chunk | Code-split into own async chunk | gzip | ≤ 200 KB | — | rollup-plugin-visualizer | Static import in App.jsx — not split yet | Auto | ❌ FAIL | **not code-split** | — | 2026-10-19 06:34 | SuperAdmin is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx. |
| **BND-011** | Admin | admin route chunk | Code-split into own async chunk | gzip | ≤ 250 KB | — | rollup-plugin-visualizer | Largest module (many config pages); static now | Auto | ❌ FAIL | **not code-split** | — | 2026-10-19 06:34 | Admin is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx. |
| **BND-012** | Doctor | doctor route chunk | Code-split into own async chunk | gzip | ≤ 200 KB | — | rollup-plugin-visualizer | Static import now | Auto | ❌ FAIL | **not code-split** | — | 2026-10-19 06:34 | Doctor is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx. |
| **BND-013** | Diagnostic | diagnostic route chunk | Code-split into own async chunk | gzip | ≤ 150 KB | — | rollup-plugin-visualizer | Static import now | Auto | ❌ FAIL | **not code-split** | — | 2026-10-19 06:34 | Diagnostic is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx. |
| **BND-014** | Reception | reception route chunk | Code-split into own async chunk | gzip | ≤ 120 KB | — | rollup-plugin-visualizer | Static import now | Auto | ❌ FAIL | **not code-split** | — | 2026-10-19 06:34 | Reception is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx. |
| **BND-015** | Pharmacy | pharmacy route chunk | Code-split into own async chunk | gzip | ≤ 150 KB | — | rollup-plugin-visualizer | Static import now | Auto | ❌ FAIL | **not code-split** | — | 2026-10-19 06:34 | Pharmacy is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx. |
| **BND-020** | App-wide | pdf vendor (@react-pdf/renderer + pdfjs-dist + jspdf + html2canvas) | Lazy-load, excluded from initial | gzip | not in initial; chunk ≤ 600 KB | — | rollup-plugin-visualizer | Load only on Invoice/record view | Auto | ❌ FAIL | **in initial bundle** | — | 2026-10-19 06:34 | PDF libs (jspdf/html2canvas/pdfjs/@react-pdf) ships in the initial bundle (should load only on its screen): pdfjs-dist, @react-pdf |
| **BND-021** | App-wide | @react-pdf-viewer/* chunk | Lazy-load on viewer open | gzip | not in initial | — | rollup-plugin-visualizer | PDF viewer screens only | Auto | ❌ FAIL | **in initial bundle** | — | 2026-10-19 06:34 | @react-pdf-viewer ships in the initial bundle (should load only on its screen): @react-pdf |
| **BND-022** | App-wide | xlsx (SheetJS) chunk | Lazy-load on export action | gzip | not in initial; ≤ 300 KB | — | rollup-plugin-visualizer | Dynamic import on Export click | Auto | ❌ FAIL | **in initial bundle** | — | 2026-10-19 06:34 | xlsx (SheetJS) ships in the initial bundle (should load only on its screen): xlsx |
| **BND-023** | App-wide | recharts chunk | Lazy-load on analytics/dashboard routes | gzip | not in initial; ≤ 150 KB | — | rollup-plugin-visualizer | Analytics/operations dashboards only | Auto | ❌ FAIL | **in initial bundle** | — | 2026-10-19 06:34 | recharts ships in the initial bundle (should load only on its screen): recharts |
| **BND-024** | App-wide | leaflet + react-leaflet chunk | Lazy-load on map screens | gzip | not in initial | — | rollup-plugin-visualizer | Facility/map screens only | Auto | ❌ FAIL | **in initial bundle** | — | 2026-10-19 06:34 | leaflet ships in the initial bundle (should load only on its screen): leaflet |
| **BND-025** | App-wide | video-react chunk | Lazy-load on video screens | gzip | not in initial | — | rollup-plugin-visualizer | Only where player used | Auto | ❌ FAIL | **in initial bundle** | — | 2026-10-19 06:34 | video-react ships in the initial bundle (should load only on its screen): video-react |
| **BND-030** | App-wide | moment + moment-timezone vs dayjs | No duplicate date lib | gzip | 1 date lib | — | rollup-plugin-visualizer / depcheck | Migrate moment→dayjs; drop moment (large) | Auto | ❌ FAIL | **moment + dayjs** | — | 2026-10-19 06:34 | Two date libraries ship: moment + dayjs — migrate moment → dayjs |
| **BND-031** | App-wide | react-toastify + react-hot-toast + sweetalert | No duplicate toast/alert lib | gzip | 1 toast lib | — | rollup-plugin-visualizer | Consolidate (App uses react-hot-toast) | Auto | ❌ FAIL | **react-toastify + sweetalert** | — | 2026-10-19 06:34 | Multiple toast/alert libs: react-toastify + sweetalert — consolidate |
| **BND-032** | App-wide | html2canvas + html2canvas-pro | No duplicate canvas lib | gzip | 1 only | — | rollup-plugin-visualizer | Keep one | Auto | ❌ FAIL | **html2canvas + html2canvas-pro** | — | 2026-10-19 06:34 | Both ship — keep one: html2canvas + html2canvas-pro |
| **BND-033** | App-wide | lucide-react + react-icons | Single icon lib / tree-shaken | gzip | tree-shaken | — | rollup-plugin-visualizer | Prefer one; import by subpath | Main repo | 🏗️ MAIN REPO | — | — | — | Tree-shaking needs source maps (not published on QA) |
| **BND-034** | App-wide | mobx + redux/@reduxjs/toolkit | Justify two state libs | gzip | justify | — | rollup-plugin-visualizer | Both shipped today | Main repo | 🏗️ MAIN REPO | — | — | — | Architecture justification for two state libraries |
| **BND-040** | App-wide | react-icons imports | Tree-shaking (no barrel import) | gzip | only used icons | — | source-map-explorer | Import from react-icons/<pack> | Main repo | 🏗️ MAIN REPO | — | — | — | Tree-shaking needs source maps (not published on QA) |
| **BND-041** | App-wide | antd | ESM tree-shaking; no global CSS import | gzip | tree-shaken | — | rollup-plugin-visualizer | antd v5 ESM; avoid full reset import | Main repo | 🏗️ MAIN REPO | — | — | — | Tree-shaking needs source maps (not published on QA) |
| **BND-042** | App-wide | moment locales (if kept) | Unused locales excluded | gzip | en only | — | rollup-plugin-visualizer | Strip locale data | Main repo | 🏗️ MAIN REPO | — | — | — | Locale stripping needs source maps (not published on QA) |

## Failures

- **BND-001**: Budget ≤ 300 KB gzip. App is not code-split, so the whole app ships on first load.
- **BND-003**: Budget ≤ 400 KB. Cold /login pulls the entire SPA bundle, not just a shell.
- **BND-005**: /assets/index-10e6cbe6.js served with no Content-Encoding (11378.7 KB) — likely over the CDN's compression size limit
- **BND-010**: SuperAdmin is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx.
- **BND-011**: Admin is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx.
- **BND-012**: Doctor is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx.
- **BND-013**: Diagnostic is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx.
- **BND-014**: Reception is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx.
- **BND-015**: Pharmacy is not in its own async chunk — single bundle: 1 JS file(s), 11378.7 KB raw. Static import in App.jsx.
- **BND-020**: PDF libs (jspdf/html2canvas/pdfjs/@react-pdf) ships in the initial bundle (should load only on its screen): pdfjs-dist, @react-pdf
- **BND-021**: @react-pdf-viewer ships in the initial bundle (should load only on its screen): @react-pdf
- **BND-022**: xlsx (SheetJS) ships in the initial bundle (should load only on its screen): xlsx
- **BND-023**: recharts ships in the initial bundle (should load only on its screen): recharts
- **BND-024**: leaflet ships in the initial bundle (should load only on its screen): leaflet
- **BND-025**: video-react ships in the initial bundle (should load only on its screen): video-react
- **BND-030**: Two date libraries ship: moment + dayjs — migrate moment → dayjs
- **BND-031**: Multiple toast/alert libs: react-toastify + sweetalert — consolidate
- **BND-032**: Both ship — keep one: html2canvas + html2canvas-pro

## Requires main repo

- **BND-033**: Tree-shaking needs source maps (not published on QA)
- **BND-034**: Architecture justification for two state libraries
- **BND-040**: Tree-shaking needs source maps (not published on QA)
- **BND-041**: Tree-shaking needs source maps (not published on QA)
- **BND-042**: Locale stripping needs source maps (not published on QA)

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
