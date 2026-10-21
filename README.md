# swasthx-frontend-qa-automation-hims

Black-box QA automation for the **Swasthx HIP frontend** (React 18 + Vite SPA, six role modules).
This repo is standalone: it does not import product source. It drives the app only through
its UI and HTTP API at the URLs you configure. Point it at **local or QA only, never production**.

Stack: Playwright Test (JS/ESM) · @axe-core/playwright · Lighthouse · `toHaveScreenshot`.

---

## Prerequisites

- Node **20+** (Playwright 1.64 requires it; Lighthouse 12 is pinned so Node 20–22 work)
- A running app: `http://localhost:5173` (`vite`), a `vite preview` build, or a QA URL
- Reachable API (`API_BASE_URL`) and one test account per role you want covered
- Microsoft Edge installed if you run the `edge` project (`npx playwright install msedge` otherwise)

## Setup

```bash
npm install
npx playwright install chromium webkit firefox
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
# edit .env → BASE_URL, API_BASE_URL, TEST_<ROLE>_PHONE + _PASSWORD or _OTP
```

`.env` is gitignored. Nothing (URLs, creds, tokens) is hard-coded anywhere else.

**Production guard:** `global-setup.js` refuses to run unless both URLs look like QA/local
(localhost, private IPs, `*.local`/`*.internal`, or hostnames containing qa/dev/staging/test/uat/sandbox/preview).
For a QA host with an unusual name, add it to `QA_ALLOWED_HOSTS`. There is no "force" switch.

## Running

| What | Command |
|---|---|
| Everything, all 4 browsers | `npm test` |
| One browser | `npm run test:chromium` · `test:webkit` · `test:firefox` · `test:edge` |
| Functional + business logic | `npm run test:functional` |
| Accessibility (axe) | `npm run test:a11y` |
| Security (route guards, headers) | `npm run test:security` |
| Recovery (500/offline via interception) | `npm run test:recovery` |
| Runtime (uncaught errors, 5xx) | `npm run test:runtime` |
| Compatibility | `npm run test:compat` |
| Web Vitals (Chromium, serial) → `webvitalResult.md` | `npm run test:wv` |
| Visual (Chromium) | `npm run test:visual` |
| One TC | `npx playwright test -g "PH-FUN-001"` |
| A category on one browser | `npm run test:security -- --project=firefox` |
| HTML report | `npm run report` |
| Record selectors (logged out) | `npm run codegen` |
| Record selectors **as a role** | `npm run codegen -- pharmacy` |

Projects: `chromium`, `webkit`, `firefox`, `edge` (`channel: 'msedge'`). `tests/web-vitals` and
`tests/visual` run on Chromium only (see `CHROMIUM_ONLY` in `playwright.config.js`).
Traces are kept on the first retry; screenshots/videos on failure.

---

## How auth works (read this before debugging a redirect-to-login)

The app keeps auth in **sessionStorage** (`token`, `refreshToken`, `role`, `permissions`, `impersonatedBy`).
That rules out Playwright's usual approach:

1. **`storageState` can't be used.** It saves cookies and localStorage only, never sessionStorage.
   Instead, every authenticated context gets `context.addInitScript(seedSessionStorage, …)`,
   which writes the role's keys into sessionStorage **before any app script runs**, on every page
   in that context. The script only touches the app's origin (not reCAPTCHA iframes) and
   seeds each tab once (`__qa_seeded` marker), so tokens the app refreshes are not overwritten.
2. **The UI login (phone + OTP + reCAPTCHA) isn't automated.** reCAPTCHA makes it unreliable.

Flow:

```
global-setup.js  ── for each role ──►  .auth/<role>.json  (gitignored token bundle)
   │   cached & >10 min left? reuse it
   │   else AUTH_MODE=api  → POST ${API_BASE_URL}${LOGIN_PATH}   (utils/login.js → apiLogin)
   │   else AUTH_MODE=manual → you run `npm run auth:manual -- <role>` (headed browser, log in
   │                           by hand, tokens captured from sessionStorage)
   ▼
fixtures/auth.fixture.js
   test.use({ role: 'pharmacy' })   → default `page` is logged in
   const p = await asRole('doctor') → extra isolated logged-in page (cross-role tests)
   const api = await apiAs('admin') → APIRequestContext with Authorization header
```

- A role with no creds, or whose login fails, is **reported in global-setup and its tests skip**.
  The run doesn't abort. `GEN-FUN-001` is the auth smoke test: run it first.
- `LOGIN_BODY_TEMPLATE` shapes the login request (`{{phone}}`, `{{password}}`, `{{otp}}`, `{{role}}`);
  keys that resolve empty are dropped. Add a QA reCAPTCHA-bypass field there if the backend has one.
  The response parser looks for `token|accessToken`, `refreshToken`, `role`, `permissions` at the
  top level or under `data` / `result` / `user`.
- If login is two-step (send OTP → verify), extend `apiLogin` in `utils/login.js`. That's the only file to change.
- Force fresh tokens: `npm run auth:refresh`. Wipe everything: delete `.auth/`.
- **Logout tests:** if the app calls `sessionStorage.clear()`, the next navigation in that
  context re-seeds the session. Test logout in a plain `page` with no role.

## Seed data

Specs that need specific records **skip with a "Seed missing" message** until you set these in `.env`:

| TC | Needs |
|---|---|
| PH-FUN-001 | `PH_CART_PATH`: in-app path of a pharmacy cart holding ≥ 1 item |
| PH-BIZ-003 | `PH_PATIENT_ID` (throwaway patient) and `PH_CREATE_ORDER_API`. Payload template is `test-data/ph-biz-003-home-counter-order.json` (field names need confirming) |
| PH-BIZ-006 | `PH_CROSS_PATIENT_ORDER_PATH` (patient A's context + patient B's order), optional `PH_FOREIGN_ORDER_ID` for the API-leak check |
| RFT-TMO-002 | optional `PH_QUEUE_API` to fail only the queue call (default: every API GET) |
| PH-VIS-001 | a recorded HAR (see Visual below) |

## Calibration: what was guessed

The suite was written without the product source, so selectors and endpoints are best guesses.
Everything guessed is marked `TODO(calibrate)` and kept in a few files:

- `fixtures/roles.js`: landing route per role
- `fixtures/app-map.js`: routes and API paths
- `pages/pharmacy.page.js`: cart-summary label wording
- `tests/recovery/pharmacy.spec.js`: error-state and retry-button wording
- `test-data/ph-biz-003-home-counter-order.json`: order payload

Use DevTools → Network or `npm run codegen -- <role>` to confirm them. If the app team can add
`data-testid` attributes to key elements, switch to those.

## Category notes

- **Security (GEN-SEC-002)** opens each role's landing route with every *other* role's session
  (30 cases). Pass = redirected out of the prefix, or a 403/404/unauthorized screen.
  **GEN-SEC-050** reports CSP / X-Frame-Options / HSTS (plus advisory nosniff and Referrer-Policy) as an
  attachment and annotations. Vite's dev server sends none of these, so it will fail locally.
  Run it against `vite preview` or QA, or set `SEC_HEADERS_ENFORCE=false` to report without failing.
- **Web Vitals (`*-WV-*`)** is data-driven from the planning sheet:
  - `Test-case-csv/Testcase-HIMS-Frontend - Web Vitals.csv` is the sheet (one test per TC ID). Edit rows there.
  - `test-data/web-vitals/interactions.js` holds the scripted interaction for each INP TC (non-mutating
    only) and route params (`DOC_CONSULT_PATIENT_ID` for `/doctor/consult/:patientId`).
  - `npm run test:wv` measures every Lab row `WV_RUNS` times (default 3, serially) and reports **p75** of
    the runs into `Test-result/webvitalResult.md`. Raw Lighthouse output goes to `results/web-vitals/`.
  - Engine `WV_ENGINE=playwright` (default): Playwright + web-vitals on a cold, DevTools-throttled load
    (Mobile · Fast 3G = DevTools "Fast 3G" + 4× CPU on a Moto G4; Desktop · Cable = 28ms / 5 Mbps).
    `WV_ENGINE=lighthouse` uses Lighthouse instead, but Lighthouse refuses pages served with a 4xx status,
    and QA deep links currently answer `301 → 404` (SPA fallback), so it only works once hosting returns 200.
  - Field-RUM rows are reported **NOT RUN – requires main repo** (web-vitals in the app + RUM collector).
  - One TC: `npx playwright test tests/web-vitals --project=chromium --workers=1 -g "AD-WV-004 "`.
    Quick pass: `WV_RUNS=1`.
  - Measure a deployed **build** (QA), never the Vite dev server.
- **Visual (PH-VIS-001)**: API responses are recorded to a HAR and replayed, so the test doesn't need
  to know the response shapes. `Date` is frozen, and animations and the caret are disabled.
  ```bash
  # record HAR + (re)create baseline        PowerShell: $env:HAR_UPDATE=1; npm run test:visual:update
  HAR_UPDATE=1 npm run test:visual:update
  npm run test:visual                       # replay + compare
  ```
  The HAR is sanitized automatically (auth headers, cookies and token fields are stripped) but stays
  gitignored. Review it before committing, and only record synthetic QA data. Baselines are
  per-OS (`*-chromium-win32.png`), so create them on the same OS your CI uses.
- **Recovery (RFT-TMO-002)**: injects 500s with `page.route`, then expects a visible error state, a
  retry control, recovery after retry, a non-empty `#root` (no white screen) and no uncaught exceptions.

---

## Component / unit tests (Step 10 — product repo)

Unit tests run against the **product source**, not the black-box app. Pure modules can be tested
with zero install and without mutating the product repo, via Node's built-in runner:

```bash
# MAIN_REPO defaults to ./Swasthx_HIP_Frontend (gitignored local checkout)
npm run test:unit
```

`unit/orderStage.test.mjs` imports the real `orderStage.js` and covers PH-CMP-001. The other 11
component TCs render React with antd/redux/mobx providers, so they need Vitest + React Testing
Library set up **inside the product repo** (that's where they belong) — marked "Main repo" in
`componentUnitResult.md`. Ask and I'll scaffold that in `Swasthx_HIP_Frontend`.

## Reports: browser dashboard + summary

- **`Test-result/index.html`** — a single self-contained page (inline CSS/JS, no server, no network)
  that renders every category's results with KPIs, a status filter, search, and the run command per
  category. **Open it directly in a browser**, or deploy the `Test-result/` folder as static files
  (GitHub Pages, S3, Netlify, `npx serve Test-result`) and it's viewable at the deployed URL.
  Rebuild after a run with `npm run report:html`.
- **`FullTestResultSummary.md`** — the same tallies + per-category run commands as Markdown (`npm run dashboard`).
- **`Test-result/<category>Result.md`** — per-category detail, every TC traceable.

```bash
npm run report:html   # regenerate the HTML dashboard from recorded data
npm run dashboard     # regenerate the Markdown summary
npm run results       # regenerate all per-category .md sheets
```

## Test plans and result sheets

```
Test-case-csv/                 the plan: one CSV per category (source of truth)
  execution-plan.js            per TC: auto · auto+manual · auto+main · manual · main · needs-data
  manual-results.csv           outcomes of manual TCs (TC ID, Status, Tester, Date, Evidence / Notes)
Test-result/                   generated result sheets, one per category
  webvitalResult.md, securityResult.md, accessibilityResult.md, …
  data/<category>.json         merged automated results behind each sheet
```

- **Every** TC in a CSV appears in its sheet, automated or not. **Execution** says how it's run; **Status** is
  `PASS · FAIL · ERROR` (couldn't complete) `· NOT RUN · MANUAL PENDING · MAIN REPO · BLOCKED` (needs QA writes).
- A test belongs to a TC through its `tc` annotation (`tc('AD-SEC-001')` from `utils/tc.js`). Several tests
  can share a TC (sub-checks, browsers): the row aggregates them, and any failure makes it FAIL.
  Specs can add a measured value or notes with `recordTc(testInfo, { measured, notes })`.
- Results **merge**: rerunning a few TCs (`-g "AD-SEC-001 "`) updates only those rows. Only the final
  attempt after retries counts.
- Manual TCs: add a row to `Test-case-csv/manual-results.csv`, then `npm run results` (no test run needed).
  For `auto+manual` TCs the automated result stays and the manual sign-off is added to the notes.
- Passing `--reporter=…` on the CLI replaces the configured reporters; add
  `./reporters/sheet-reporter.js` to it if you want the sheets updated.
- `Swasthx_HIP_Frontend/` (the main project) may sit in this folder for local reference only. It is
  gitignored, and nothing here imports from it.

## Adding a spec from a TC ID

ID scheme: `<MODULE>-<TYPE>-###` (module codes `SA AD RCP DOC DIAG PH`) or `GEN-<TYPE>-###` for
app-wide. Use the TC ID exactly as it appears in `Test-case-csv/`.

1. Pick the folder for the type (`FUN`→`functional`, `BIZ`→`business-logic`, `A11Y`→`accessibility`,
   `WV`→`web-vitals`, `RUN`→`runtime`, `VIS`→`visual`, `CMPT`→`compatibility`, `SEC`→`security`,
   `RFT`→`recovery`) and the module file (`doctor.spec.js`, `admin.spec.js`, … or `general.spec.js`).
2. Start the title with the TC ID and add the `tc` annotation:

```js
import { test, expect } from '../../fixtures/auth.fixture.js';

test.describe('Doctor — functional', () => {
  test.use({ role: 'doctor' });

  test('DOC-FUN-004 calendar shows today\'s appointments', {
    annotation: { type: 'tc', description: 'DOC-FUN-004' },
  }, async ({ page }) => {
    await page.goto('/doctor/calendar');
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible();
  });
});
```

3. Put new routes/endpoints in `fixtures/app-map.js` and selectors in a `pages/<module>.page.js`.
   If the test needs data, read it from an env var and `test.skip(!value, 'Seed missing: …')`.
4. Run it: `npx playwright test -g "DOC-FUN-004" --project=chromium`.

## Layout

```
playwright.config.js   4 browser projects, baseURL from env, html reporter
global-setup.js        prod guard + per-role login → .auth/<role>.json
fixtures/              auth.fixture.js (role, asRole, apiAs, trackErrors) · roles.js · app-map.js
pages/                 page objects (selectors live here)
utils/                 login · session (seeding) · env (guard) · a11y · webvitals · har · page helpers
scripts/               auth:manual capture · auth:refresh · codegen-as-role · lighthouse-run · sanitize-har
test-data/             payload templates; har/ (gitignored)
tests/<category>/<module>.spec.js
```
