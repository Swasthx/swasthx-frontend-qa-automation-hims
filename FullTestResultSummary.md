# HIMS Frontend QA — Full Test Result Summary

_Generated 2026-10-21 06:04 UTC · target https://qa-doctor.swasthx.com/ · regenerate with `npm run dashboard`_

## Totals

| Test cases | Executed | ✅ Pass | ❌ Fail | ⚠️ Error | 📝 Manual | 🏗️ Main repo | ⏸️ Blocked | ⏭️ Not run |
|---|---|---|---|---|---|---|---|---|
| **324** | 193 | **106** | **87** | 0 | 37 | 39 | 35 | 20 |

**204** of 324 TCs are automated in this repo. Pass rate of executed (pass+fail+error) tests: **55%**.

## By category

| Category | Command | Total | ✅ | ❌ | ⚠️ | 📝 | 🏗️ | ⏸️ | ⏭️ | Pass rate* |
|---|---|---|---|---|---|---|---|---|---|---|
| **Web Vitals** | `npm run test:wv` | 55 | 30 | 20 | 0 | 0 | 3 | 0 | 2 | 60% |
| **Business Logic** | `npm run test:biz` | 24 | 7 | 0 | 0 | 3 | 3 | 10 | 1 | 100% |
| **Security** | `npm run test:security` | 38 | 16 | 16 | 0 | 2 | 0 | 4 | 0 | 50% |
| **Bundle Size** | `npm run test:bundle` | 25 | 2 | 18 | 0 | 0 | 5 | 0 | 0 | 10% |
| **Accessibility** | `npm run test:a11y` | 38 | 3 | 25 | 0 | 6 | 0 | 0 | 4 | 11% |
| **Recovery** | `npm run test:recovery` | 25 | 6 | 4 | 0 | 7 | 6 | 2 | 0 | 60% |
| **API Contract** | `npm run test:api` | 20 | 7 | 2 | 0 | 0 | 4 | 7 | 0 | 78% |
| **Runtime Performance** | `npm run test:runtime` | 32 | 14 | 0 | 0 | 0 | 7 | 3 | 8 | 100% |
| **Compatibility** | `npm run test:compat` | 24 | 14 | 0 | 0 | 8 | 0 | 1 | 1 | 100% |
| **Visual Regression** | `npm run test:visual` | 12 | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 100% |
| **UI/UX** | `npm run test:uiux` | 19 | 2 | 2 | 0 | 11 | 0 | 0 | 4 | 50% |
| **Component / Unit** | `npm run test:unit` | 12 | 1 | 0 | 0 | 0 | 11 | 0 | 0 | 100% |

\* Pass rate = pass ÷ (pass + fail + error), i.e. of the tests that actually executed. Manual/main-repo/blocked/not-run are excluded.

## Automated vs not

| Category | Automated here | Manual / main-repo / needs-data |
|---|---|---|
| Web Vitals | 52 | 3 |
| Business Logic | 8 | 16 |
| Security | 25 | 13 |
| Bundle Size | 20 | 5 |
| Accessibility | 32 | 6 |
| Recovery | 10 | 15 |
| API Contract | 9 | 11 |
| Runtime Performance | 22 | 10 |
| Compatibility | 14 | 10 |
| Visual Regression | 4 | 8 |
| UI/UX | 8 | 11 |
| Component / Unit | 0 | 12 |
| **Total** | **204** | **120** |

## How to run each category

```bash
npm install && npx playwright install chromium webkit firefox   # first time
cp .env.example .env                                           # fill BASE_URL, API_BASE_URL, test accounts

# Web Vitals
npm run test:wv

# Business Logic
npm run test:biz

# Security — Add `npm run sec:mainrepo` for the dependency/CVE + source checks.
npm run test:security

# Bundle Size — Node HTTP+analysis script (no browser).
npm run test:bundle

# Accessibility
npm run test:a11y

# Recovery
npm run test:recovery

# API Contract — Runs serially; retries through QA gateway 5xx.
npm run test:api

# Runtime Performance
npm run test:runtime

# Compatibility — Runs on all 4 browsers (chromium, webkit, firefox, edge).
npm run test:compat

# Visual Regression — Compares to baselines; `npm run test:visual:update` re-blesses them.
npm run test:visual

# UI/UX
npm run test:uiux

# Component / Unit — Node test runner against the product source (set MAIN_REPO if not ./Swasthx_HIP_Frontend).
npm run test:unit

npm test            # everything, all 4 browsers
npm run results     # rebuild all Test-result/*.md from recorded data (no run)
npm run dashboard   # rebuild this summary
npm run report      # open the Playwright HTML report
```

## Result sheets

Per-category detail (every TC, traceable) lives in `Test-result/`:

- **Web Vitals** → `Test-result/webvitalResult.md`
- **Business Logic** → `Test-result/businessLogicResult.md`
- **Security** → `Test-result/securityResult.md`
- **Bundle Size** → `Test-result/bundleSizeResult.md`
- **Accessibility** → `Test-result/accessibilityResult.md`
- **Recovery** → `Test-result/recoveryResult.md`
- **API Contract** → `Test-result/apiContractResult.md`
- **Runtime Performance** → `Test-result/runtimePerformanceResult.md`
- **Compatibility** → `Test-result/compatibilityResult.md`
- **Visual Regression** → `Test-result/visualRegressionResult.md`
- **UI/UX** → `Test-result/uiUxResult.md`
- **Component / Unit** → `Test-result/componentUnitResult.md`

> Statuses: **Pass/Fail/Error** are executed results (Error = test could not complete, e.g. QA gateway down). **Manual** = needs a human (recorded in `Test-case-csv/manual-results.csv`). **Main repo** = needs the product source (unit tests, CVEs, React Profiler). **Blocked** = needs QA data writes. **Not run** = automatable but pending a seed/selector.
