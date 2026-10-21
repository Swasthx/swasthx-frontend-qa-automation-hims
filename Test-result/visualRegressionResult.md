# Visual Regression: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 08:56 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Visual Regression.csv` |

## Summary

| Total | ✅ PASS | ⏸️ BLOCKED |
|---|---|---|
| 12 | 4 | 8 |

| Module | ✅ PASS | ⏸️ BLOCKED |
|---|---|---|
| Login | 1 | 0 |
| SuperAdmin | 0 | 1 |
| Admin | 1 | 1 |
| Doctor | 0 | 2 |
| Reception | 0 | 1 |
| Diagnostic | 0 | 1 |
| Pharmacy | 0 | 2 |
| App-wide | 2 | 0 |

| Execution | TCs |
|---|---|
| Auto | 4 |
| Needs data | 8 |

## Results

| TC ID | Module | Component / Screen | State / Variant | Viewport + Theme | Baseline Ref | Diff Threshold | Expected | Tool | Execution | Status | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AUTH-VIS-001** | Login | Login | Default + OTP step | 1440 & 390 · Light | login@base | ≤ 0.1% | No unintended diff | Chromatic / Playwright | Auto | ✅ PASS | 2026-10-19 08:56 | Baselines: login desktop (1440) + mobile (390) |
| **SA-VIS-001** | SuperAdmin | HospitalAnalytics | Charts loaded | 1440 · Light | sa-analytics@base | ≤ 0.1% | Stable chart layout | Playwright | Needs data | ⏸️ BLOCKED | — | HospitalAnalytics charts need a stable dataset to baseline (mock the analytics API) |
| **AD-VIS-001** | Admin | AuditLogTablePanel | 20 rows loaded | 1440 · Light | auditlog@base | ≤ 0.1% | No diff | Playwright | Needs data | ⏸️ BLOCKED | — | AuditLog "20 rows" needs a fixed dataset (mock the audit API) |
| **AD-VIS-002** | Admin | AdminSidebar | Expanded vs collapsed | 1440 · Light | sidebar@base | ≤ 0.1% | No diff per state | Playwright | Auto | ✅ PASS | 2026-10-19 08:56 | Baselines: admin sidebar expanded + collapsed (main area masked) |
| **DOC-VIS-001** | Doctor | ConsultWorkspace | Populated form | 1440 · Light | consult@base | ≤ 0.1% | No diff | Playwright | Needs data | ⏸️ BLOCKED | — | ConsultWorkspace needs DOC_CONSULT_PATIENT_ID + a populated form |
| **DOC-VIS-002** | Doctor | DoctorDashboard | Charts + widgets | 1440 · Light | doc-dash@base | ≤ 0.1% | Stable layout | Playwright | Needs data | ⏸️ BLOCKED | — | DoctorDashboard charts need a stable dataset |
| **RCP-VIS-001** | Reception | ReceptionQueue | Populated list | 1440 & 390 · Light | rcp-queue@base | ≤ 0.1% | No diff | Playwright | Needs data | ⏸️ BLOCKED | — | ReceptionQueue populated list needs a fixed dataset (mock the queue API) |
| **DIAG-VIS-001** | Diagnostic | DiagnosticQueue | Populated list | 1440 · Light | diag-queue@base | ≤ 0.1% | No diff | Playwright | Needs data | ⏸️ BLOCKED | — | DiagnosticQueue populated list needs a fixed dataset |
| **PH-VIS-001** | Pharmacy | PharmacyQueue | Populated list | 1440 · Light | ph-queue@base | ≤ 0.1% | No diff | Playwright | Needs data | ⏸️ BLOCKED | — | PharmacyQueue populated list needs a fixed dataset; QA queue is empty |
| **PH-VIS-002** | Pharmacy | InvoiceModal | Totals rendered | 1440 · Light | invoice@base | ≤ 0.1% | No diff | Playwright | Needs data | ⏸️ BLOCKED | — | InvoiceModal needs a billed order |
| **GEN-VIS-001** | App-wide | CustomModal | Open overlay | 1440 · Light | modal@base | ≤ 0.1% | No diff | Playwright | Auto | ✅ PASS | 2026-10-19 08:56 | Baseline: Create Order modal overlay |
| **GEN-VIS-002** | App-wide | Shared states | Empty / loading / error | 1440 · Light | states@base | ≤ 0.1% | Each state matches baseline | Playwright | Auto | ✅ PASS | 2026-10-19 08:56 | Baselines: pharmacy empty state + API-500 state |

## Blocked: needs QA data writes

- **SA-VIS-001**: HospitalAnalytics charts need a stable dataset to baseline (mock the analytics API)
- **AD-VIS-001**: AuditLog "20 rows" needs a fixed dataset (mock the audit API)
- **DOC-VIS-001**: ConsultWorkspace needs DOC_CONSULT_PATIENT_ID + a populated form
- **DOC-VIS-002**: DoctorDashboard charts need a stable dataset
- **RCP-VIS-001**: ReceptionQueue populated list needs a fixed dataset (mock the queue API)
- **DIAG-VIS-001**: DiagnosticQueue populated list needs a fixed dataset
- **PH-VIS-001**: PharmacyQueue populated list needs a fixed dataset; QA queue is empty
- **PH-VIS-002**: InvoiceModal needs a billed order

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
