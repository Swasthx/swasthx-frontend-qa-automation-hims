# Web Vitals: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 05:08 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Web Vitals.csv` |
| Runs per measurement | 3 (Measured = p75 of the runs, linear interpolation) |
| Tooling | Playwright + web-vitals 5, DevTools throttling, cold cache. Lighthouse can't load QA deep links (HTTP 404 SPA fallback) |
| Profiles | Mobile · Fast 3G = DevTools "Fast 3G" (562.5ms, 1.47/0.68 Mbps) + 4× CPU, Moto G4 · Desktop · Cable = 28ms, 5/1 Mbps, 1× CPU, 1350×940 |

## Summary

| Total | ✅ PASS | ❌ FAIL | ⏭️ NOT RUN | 🏗️ MAIN REPO |
|---|---|---|---|---|
| 55 | 30 | 20 | 2 | 3 |

| Module | ✅ PASS | ❌ FAIL | ⏭️ NOT RUN | 🏗️ MAIN REPO |
|---|---|---|---|---|
| Pharmacy | 6 | 3 | 0 | 1 |
| SuperAdmin | 6 | 4 | 0 | 0 |
| Admin | 5 | 5 | 0 | 1 |
| Reception | 5 | 2 | 0 | 0 |
| Doctor | 4 | 3 | 2 | 1 |
| Diagnostic | 4 | 3 | 0 | 0 |

| Execution | TCs |
|---|---|
| Auto | 52 |
| Main repo | 3 |

## Results

| TC ID | Module | Route / URL | Metric | Measurement | Device · Network | Percentile | Target (Good) | Tool | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **PH-WV-001** | Pharmacy | /pharmacy | LCP | Lab | Mobile · Fast 3G | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **68.75s** | 68.55s / 68.69s / 68.81s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-001** | SuperAdmin | /superadmin | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **19.65s** | 19.60s / 19.66s / 19.64s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-002** | SuperAdmin | /superadmin | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **136ms** | 152ms / 120ms / 88ms | 2026-10-19 04:42 | Interaction: click "Edit Profile" |
| **SA-WV-003** | SuperAdmin | /superadmin | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.000** | 0.000 / 0.000 / 0.000 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-004** | SuperAdmin | /superadmin | FCP | Lab | Desktop · Cable | p75 | ≤ 1.8s | Lighthouse CI | Auto | ❌ FAIL | **19.37s** | 19.39s / 19.35s / 19.36s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-005** | SuperAdmin | /superadmin | TTFB | Lab | Desktop · Cable | p75 | ≤ 800ms | Lighthouse CI | Auto | ✅ PASS | **243ms** | 242ms / 244ms / 223ms | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-006** | SuperAdmin | /superadmin/hospital-analytics | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **19.59s** | 19.43s / 19.41s / 19.74s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-007** | SuperAdmin | /superadmin/hospital-analytics | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.021** | 0.012 / 0.009 / 0.031 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-008** | SuperAdmin | /superadmin/hospital-analytics | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **16ms** | 16ms / 16ms / 16ms | 2026-10-16 10:11 | Interaction: click tab "Active…" |
| **SA-WV-009** | SuperAdmin | /superadmin/orders | LCP | Lab | Mobile · Fast 3G | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **67.78s** | 67.33s / 67.45s / 68.11s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **SA-WV-010** | SuperAdmin | /superadmin/managepaitent | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **80ms** | 32ms / 128ms / 24ms | 2026-10-16 10:11 | Interaction: click "Add User" |
| **AD-WV-001** | Admin | /admin | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **20.10s** | 20.13s / 19.98s / 20.07s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **AD-WV-002** | Admin | /admin | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **112ms** | 112ms / 112ms / 96ms | 2026-10-16 10:11 | Interaction: click "Edit Profile" |
| **AD-WV-003** | Admin | /admin | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ❌ FAIL | **0.132** | 0.127 / 0.127 / 0.138 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **AD-WV-004** | Admin | /admin/operationsdashboard | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **19.61s** | 19.54s / 19.68s / 19.52s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **AD-WV-005** | Admin | /admin/operationsdashboard | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.014** | 0.014 / 0.014 / 0.013 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **AD-WV-006** | Admin | /admin/Analytics | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **72ms** | 16ms / 128ms / 16ms | 2026-10-16 10:11 | Interaction: click "Refresh analytics" |
| **AD-WV-007** | Admin | /admin/auditlog | LCP | Lab | Mobile · Fast 3G | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **68.06s** | 67.36s / 68.25s / 67.88s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **AD-WV-008** | Admin | /admin/auditlog | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **24ms** | 32ms / 16ms / 16ms | 2026-10-16 10:11 | Interaction: click "Reset filters" |
| **AD-WV-009** | Admin | /admin/financialdashboard | FCP | Lab | Desktop · Cable | p75 | ≤ 1.8s | Lighthouse CI | Auto | ❌ FAIL | **19.85s** | 19.61s / 20.10s / 19.59s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **AD-WV-010** | Admin | /admin/RBACPermission | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.000** | 0.000 / 0.000 / 0.000 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **RCP-WV-001** | Reception | /reception | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **20.26s** | 20.28s / 20.24s / 20.25s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **RCP-WV-002** | Reception | /reception | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **24ms** | 24ms / 24ms / 24ms | 2026-10-16 10:11 | Interaction: click "Edit Profile" |
| **RCP-WV-003** | Reception | /reception | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.000** | 0.000 / 0.000 / 0.000 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **RCP-WV-004** | Reception | /reception/queue | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **19.76s** | 19.80s / 19.72s / 19.66s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **RCP-WV-005** | Reception | /reception/queue | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **20ms** | 16ms / 24ms / 16ms | 2026-10-16 10:11 | Interaction: click tab "Follow…" |
| **RCP-WV-006** | Reception | /reception/queue | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.002** | 0.002 / 0.002 / 0.002 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **RCP-WV-007** | Reception | /reception/patient | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **72ms** | 48ms / 56ms / 88ms | 2026-10-16 10:11 | Interaction: click tab "Patient Appointments…" |
| **DOC-WV-001** | Doctor | /doctor | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **19.79s** | 19.80s / 19.68s / 19.78s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DOC-WV-002** | Doctor | /doctor | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **96ms** | 96ms / 96ms / 88ms | 2026-10-16 10:11 | Interaction: click "Edit Profile" |
| **DOC-WV-003** | Doctor | /doctor | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.077** | 0.077 / 0.077 / 0.077 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DOC-WV-004** | Doctor | /doctor/dashboard | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **19.54s** | 19.58s / 19.49s / 19.50s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DOC-WV-005** | Doctor | /doctor/dashboard | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.000** | 0.000 / 0.000 / 0.000 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DOC-WV-006** | Doctor | /doctor/consult/:patientId | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ⏭️ NOT RUN | — | — | 2026-10-19 04:42 | Seed missing: set DOC_CONSULT_PATIENT_ID in .env |
| **DOC-WV-007** | Doctor | /doctor/consult/:patientId | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ⏭️ NOT RUN | — | — | 2026-10-19 04:42 | Seed missing: set DOC_CONSULT_PATIENT_ID in .env |
| **DOC-WV-008** | Doctor | /doctor/calendar | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **152ms** | 16ms / 160ms / 144ms | 2026-10-16 10:11 | Interaction: click "Week" |
| **DOC-WV-009** | Doctor | /doctor/queue | LCP | Lab | Mobile · Fast 3G | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **68.24s** | 67.74s / 68.44s / 68.04s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DIAG-WV-001** | Diagnostic | /diagnostic | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **20.45s** | 20.44s / 20.46s / 20.28s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DIAG-WV-002** | Diagnostic | /diagnostic | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **88ms** | 16ms / 152ms / 24ms | 2026-10-16 10:11 | Interaction: click "Edit Profile" |
| **DIAG-WV-003** | Diagnostic | /diagnostic | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.071** | 0.071 / 0.071 / 0.071 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DIAG-WV-004** | Diagnostic | /diagnostic/queue | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **20.54s** | 20.98s / 20.09s / 20.06s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DIAG-WV-005** | Diagnostic | /diagnostic/queue | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **116ms** | 160ms / 56ms / 72ms | 2026-10-16 10:11 | Interaction: click tab "Report Published…" |
| **DIAG-WV-006** | Diagnostic | /diagnostic/operator/queue | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **20.18s** | 19.96s / 20.18s / 20.18s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **DIAG-WV-007** | Diagnostic | /diagnostic/availability | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.000** | 0.000 / 0.000 / 0.000 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **PH-WV-002** | Pharmacy | /pharmacy | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **64ms** | 112ms / 16ms / 16ms | 2026-10-16 10:11 | Interaction: click "Edit Profile" |
| **PH-WV-003** | Pharmacy | /pharmacy | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.000** | 0.001 / 0.000 / 0.000 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **PH-WV-004** | Pharmacy | /pharmacy | FCP | Lab | Desktop · Cable | p75 | ≤ 1.8s | Lighthouse CI | Auto | ❌ FAIL | **27.49s** | 22.21s / 19.43s / 32.76s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **PH-WV-005** | Pharmacy | /pharmacy | TTFB | Lab | Desktop · Cable | p75 | ≤ 800ms | Lighthouse CI | Auto | ✅ PASS | **237ms** | 226ms / 242ms / 232ms | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **PH-WV-006** | Pharmacy | /pharmacy/queue | LCP | Lab | Desktop · Cable | p75 | ≤ 2.5s | Lighthouse CI | Auto | ❌ FAIL | **21.65s** | 21.66s / 21.55s / 21.64s | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **PH-WV-007** | Pharmacy | /pharmacy/queue | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **56ms** | 24ms / 64ms / 48ms | 2026-10-16 10:11 | Interaction: click tab "Order Delivered…" |
| **PH-WV-008** | Pharmacy | /pharmacy/patient | INP | Lab | Desktop · Cable | p75 | ≤ 200ms | Lighthouse CI | Auto | ✅ PASS | **36ms** | 32ms / 32ms / 40ms | 2026-10-16 10:11 | Interaction: click tab "My Patient…" |
| **PH-WV-009** | Pharmacy | /pharmacy/payment | CLS | Lab | Desktop · Cable | p75 | ≤ 0.1 | Lighthouse CI | Auto | ✅ PASS | **0.001** | 0.001 / 0.001 / 0.001 | 2026-10-16 10:11 | Engine: playwright; HTTP 301 → 404 |
| **PH-WV-010** | Pharmacy | /pharmacy | LCP | Field-RUM | Mobile · real users | p75 | ≤ 2.5s | web-vitals + RUM | Main repo | 🏗️ MAIN REPO | — | — | — | Field data: web-vitals library in the app + RUM collector + real traffic |
| **DOC-WV-010** | Doctor | /doctor/dashboard | INP | Field-RUM | Desktop · real users | p75 | ≤ 200ms | web-vitals + RUM | Main repo | 🏗️ MAIN REPO | — | — | — | Field data: web-vitals library in the app + RUM collector + real traffic |
| **AD-WV-011** | Admin | /admin/operationsdashboard | CLS | Field-RUM | Desktop · real users | p75 | ≤ 0.1 | web-vitals + RUM | Main repo | 🏗️ MAIN REPO | — | — | — | Field data: web-vitals library in the app + RUM collector + real traffic |

## Failures

- **PH-WV-001**: Engine: playwright; HTTP 301 → 404
- **SA-WV-001**: Engine: playwright; HTTP 301 → 404
- **SA-WV-004**: Engine: playwright; HTTP 301 → 404
- **SA-WV-006**: Engine: playwright; HTTP 301 → 404
- **SA-WV-009**: Engine: playwright; HTTP 301 → 404
- **AD-WV-001**: Engine: playwright; HTTP 301 → 404
- **AD-WV-003**: Engine: playwright; HTTP 301 → 404
- **AD-WV-004**: Engine: playwright; HTTP 301 → 404
- **AD-WV-007**: Engine: playwright; HTTP 301 → 404
- **AD-WV-009**: Engine: playwright; HTTP 301 → 404
- **RCP-WV-001**: Engine: playwright; HTTP 301 → 404
- **RCP-WV-004**: Engine: playwright; HTTP 301 → 404
- **DOC-WV-001**: Engine: playwright; HTTP 301 → 404
- **DOC-WV-004**: Engine: playwright; HTTP 301 → 404
- **DOC-WV-009**: Engine: playwright; HTTP 301 → 404
- **DIAG-WV-001**: Engine: playwright; HTTP 301 → 404
- **DIAG-WV-004**: Engine: playwright; HTTP 301 → 404
- **DIAG-WV-006**: Engine: playwright; HTTP 301 → 404
- **PH-WV-004**: Engine: playwright; HTTP 301 → 404
- **PH-WV-006**: Engine: playwright; HTTP 301 → 404

## Requires main repo

- **PH-WV-010**: Field data: web-vitals library in the app + RUM collector + real traffic
- **DOC-WV-010**: Field data: web-vitals library in the app + RUM collector + real traffic
- **AD-WV-011**: Field data: web-vitals library in the app + RUM collector + real traffic

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
