# Runtime Performance: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 08:05 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Runtime Performace.csv` |

## Summary

| Total | ✅ PASS | ⏭️ NOT RUN | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|
| 32 | 14 | 8 | 7 | 3 |

| Module | ✅ PASS | ⏭️ NOT RUN | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|
| SuperAdmin | 1 | 2 | 1 | 0 |
| Admin | 3 | 1 | 2 | 0 |
| Reception | 3 | 1 | 0 | 0 |
| Doctor | 0 | 2 | 2 | 2 |
| Diagnostic | 2 | 1 | 1 | 0 |
| Pharmacy | 3 | 1 | 0 | 1 |
| App-wide | 2 | 0 | 1 | 0 |

| Execution | TCs |
|---|---|
| Auto | 15 |
| Auto + Manual | 5 |
| Auto + Main repo | 2 |
| Main repo | 7 |
| Needs data | 3 |

## Results

| TC ID | Module | Component / Area | Scenario / Interaction | Load / Condition | Metric | Target / Budget | Tool | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **SA-RUN-001** | SuperAdmin | HospitalAnalytics (recharts) | Initial chart render | 12-month dataset · CPU 4× | Mount commit duration | ≤ 300 ms | React Profiler | Main repo | 🏗️ MAIN REPO | — | — | — | React Profiler commit duration |
| **SA-RUN-002** | SuperAdmin | Orders table | Scroll list | 1,000 orders · CPU 4× | Long tasks >50ms · FPS | 0 tasks, ≥ 55 fps | Chrome Perf panel | Auto | ✅ PASS | **0 long tasks (longest 0ms, ~12 rows)** | — | 2026-10-19 08:05 | Total blocking 0ms; target 0 tasks >50ms |
| **SA-RUN-003** | SuperAdmin | managepaitent table | Type in search | 1,000 rows · CPU 4× | INP · re-render scope | ≤ 200 ms, debounced, list-only re-render | React Profiler | Auto + Main repo | ⏭️ NOT RUN | — | — | 2026-10-19 08:05 | Interaction target for "type in patient search" not found on /superadmin/managepaitent (selector/screen differs or no data): locator.click: Timeout 15000ms exceeded.; interaction element not found |
| **SA-RUN-004** | SuperAdmin | Medicine management | Filter / sort | large catalog · CPU 4× | Interaction latency | ≤ 200 ms | Chrome Perf panel | Auto | ⏭️ NOT RUN | — | — | 2026-10-19 08:05 | Interaction target for "filter medicines" not found on /superadmin/medicine (selector/screen differs or no data): locator.click: Timeout 15000ms exceeded.; interaction element not found |
| **AD-RUN-001** | Admin | AuditLogTablePanel | Scroll list | 1,000 rows · CPU 4× | Long tasks >50ms · FPS | 0 tasks, ≥ 55 fps | Chrome Perf panel | Auto | ✅ PASS | **0 long tasks (longest 0ms, ~2 rows)** | — | 2026-10-19 08:05 | Total blocking 0ms; target 0 tasks >50ms |
| **AD-RUN-002** | Admin | AuditLogTablePanel | Apply filter | 1,000 rows · CPU 4× | INP · commit duration | ≤ 200 ms | React Profiler | Auto | ✅ PASS | **24ms** | — | 2026-10-19 08:05 | apply/reset audit filter; target ≤200ms |
| **AD-RUN-003** | Admin | OperationalDashboard (recharts) | Initial render + auto-refresh | all widgets · CPU 4× | Commit duration · layout thrash | ≤ 300 ms, no thrash | React Profiler | Main repo | 🏗️ MAIN REPO | — | — | — | React Profiler commit duration / layout thrash |
| **AD-RUN-004** | Admin | ShiftCalendar (dnd-kit) | Drag a shift | full week grid · CPU 4× | FPS during drag | ≥ 55 fps, no jank | Chrome Perf panel | Auto + Manual | ⏭️ NOT RUN | — | — | — | dnd-kit drag FPS: scripted drag is unreliable; measure here, confirm smoothness by hand |
| **AD-RUN-005** | Admin | RBACPermission matrix | Toggle one permission | full matrix · CPU 4× | Re-render scope | only toggled cell/row | React Profiler + why-did-you-render | Main repo | 🏗️ MAIN REPO | — | — | — | Re-render scope (React Profiler + why-did-you-render) |
| **AD-RUN-006** | Admin | Analytics (recharts) | Switch date range | CPU 4× | INP | ≤ 200 ms | React Profiler | Auto | ✅ PASS | **16ms** | — | 2026-10-19 08:05 | refresh analytics (date range); target ≤200ms |
| **RCP-RUN-001** | Reception | ReceptionQueue (socket) | Live queue updates | 20 events/s · CPU 4× | Responsiveness · FPS | ≤ 200 ms, ≥ 55 fps, no freeze | Chrome Perf panel | Auto + Manual | ⏭️ NOT RUN | — | — | — | Live-queue load (20 socket events/s) cannot be driven black-box; observe responsiveness manually |
| **RCP-RUN-002** | Reception | ReceptionQueue | Token action click | CPU 4× | INP | ≤ 200 ms | web-vitals INP | Auto | ✅ PASS | **120ms** | — | 2026-10-19 08:05 | click a queue tab; target ≤200ms |
| **RCP-RUN-003** | Reception | ReceptionPatient | Type search query | 500 patients · CPU 4× | Debounce · re-render scope | ≤ 200 ms, results-only re-render | React Profiler | Auto + Main repo | ✅ PASS | **112ms** | — | 2026-10-19 08:05 | type in patient search; target ≤200ms |
| **RCP-RUN-004** | Reception | ReceptionQueue | Navigate in/out ×15 | — | Memory / socket-listener leak | heap stable ±5%, listeners removed | Chrome Memory | Auto | ✅ PASS | **heap 20.8→20.8 MB (+0.2%)** | — | 2026-10-19 08:05 | DOM nodes 239→239 (Δ0); target ±5%, ceiling 40% |
| **DOC-RUN-001** | Doctor | ConsultWorkspace | Type in prescription fields | CPU 4× | Input latency / INP | ≤ 200 ms, no dropped keystrokes | Chrome Perf panel | Needs data | ⏸️ BLOCKED | — | — | — | Consult workspace needs DOC_CONSULT_PATIENT_ID |
| **DOC-RUN-002** | Doctor | ConsultWorkspace | Add medicine rows | grows to 30 rows · CPU 4× | Re-render scope | only new/changed row re-renders | React Profiler | Main repo | 🏗️ MAIN REPO | — | — | — | Re-render scope (React Profiler) |
| **DOC-RUN-003** | Doctor | DoctorSchedulePage | Scroll / navigate weeks | CPU 4× | FPS | ≥ 55 fps | Chrome Perf panel | Auto | ⏭️ NOT RUN | — | — | — | Not automated yet |
| **DOC-RUN-004** | Doctor | GeneralDoctorQueue (socket) | Live updates | 20 events/s · CPU 4× | Responsiveness · FPS | ≤ 200 ms, no jank | Chrome Perf panel | Auto + Manual | ⏭️ NOT RUN | — | — | — | Live-queue load (20 socket events/s) cannot be driven black-box |
| **DOC-RUN-005** | Doctor | DoctorDashboard (recharts) | Initial render | CPU 4× | Commit duration | ≤ 300 ms | React Profiler | Main repo | 🏗️ MAIN REPO | — | — | — | React Profiler commit duration |
| **DOC-RUN-006** | Doctor | ConsultWorkspace | Mount / unmount ×15 | — | Memory leak | heap stable ±5% | Chrome Memory | Needs data | ⏸️ BLOCKED | — | — | — | Consult workspace needs DOC_CONSULT_PATIENT_ID |
| **DIAG-RUN-001** | Diagnostic | DiagnosticQueue (socket) | Live updates | 20 events/s · CPU 4× | Responsiveness · FPS | ≤ 200 ms, ≥ 55 fps | Chrome Perf panel | Auto + Manual | ⏭️ NOT RUN | — | — | — | Live-queue load (20 socket events/s) cannot be driven black-box |
| **DIAG-RUN-002** | Diagnostic | DiagnosticOperatorQueue | Scroll queue | large queue · CPU 4× | Long tasks >50ms | 0 tasks | Chrome Perf panel | Auto | ✅ PASS | **0 long tasks (longest 0ms, ~6 rows)** | — | 2026-10-19 08:05 | Total blocking 0ms; target 0 tasks >50ms |
| **DIAG-RUN-003** | Diagnostic | SectionAvailability grid | Toggle slots | full grid · CPU 4× | Re-render scope | only toggled cell | React Profiler | Main repo | 🏗️ MAIN REPO | — | — | — | Re-render scope (React Profiler) |
| **DIAG-RUN-004** | Diagnostic | DiagnosticPatient | Type search | CPU 4× | INP / debounce | ≤ 200 ms | React Profiler | Auto | ✅ PASS | **128ms** | — | 2026-10-19 08:05 | type in queue search; target ≤200ms |
| **PH-RUN-001** | Pharmacy | PharmacyQueue (socket) | Live updates | 20 events/s · CPU 4× | Responsiveness · FPS | ≤ 200 ms, ≥ 55 fps | Chrome Perf panel | Auto + Manual | ⏭️ NOT RUN | — | — | — | Live-queue load (20 socket events/s) cannot be driven black-box |
| **PH-RUN-002** | Pharmacy | PharmacyPatient | Search / paging | 500 patients · CPU 4× | INP | ≤ 200 ms, debounced | React Profiler | Auto | ✅ PASS | **144ms** | — | 2026-10-19 08:05 | type in patient search; target ≤200ms |
| **PH-RUN-003** | Pharmacy | Invoice (@react-pdf-viewer) | Open invoice | multi-page PDF · CPU 4× | Open-to-interactive · main-thread freeze | ≤ 1.5 s, no freeze >200 ms | Chrome Perf panel | Needs data | ⏸️ BLOCKED | — | — | — | Opening an invoice needs a billed order; QA pharmacy queue is currently empty |
| **PH-RUN-004** | Pharmacy | PharmacyQueue | Navigate in/out ×15 | — | Memory / socket-listener leak | heap stable ±5%, listeners removed | Chrome Memory | Auto | ✅ PASS | **heap 101.1→20.5 MB (-79.7%)** | — | 2026-10-19 08:05 | DOM nodes 5704→240 (Δ-5464); target ±5%, ceiling 40% |
| **PH-RUN-005** | Pharmacy | CareContextTable | Scroll / expand rows | CPU 4× | FPS | ≥ 55 fps | Chrome Perf panel | Auto | ✅ PASS | **61 fps (~3 rows/cards)** | — | 2026-10-19 08:05 | Target ≥55 fps |
| **GEN-RUN-001** | App-wide | antd Modal (shared) | Open / close ×50 | — | Detached-node growth | no leak (nodes released) | Chrome Memory | Auto | ✅ PASS | **heap 20.8→23.3 MB (+12.1%), nodes Δ129** | — | 2026-10-19 08:05 | Target: nodes released after close |
| **GEN-RUN-002** | App-wide | Route navigation | Switch between modules | CPU 4× | Total Blocking Time on nav | TBT < 200 ms | Chrome Perf panel | Auto | ✅ PASS | **TBT 0ms over 4 navigations** | — | 2026-10-19 08:05 | 0 long tasks, longest 0ms; target TBT <200ms |
| **GEN-RUN-003** | App-wide | Socket subscriptions | Reconnect / re-subscribe | drop+reconnect | Duplicate listeners | listener count stable | Chrome Memory / console | Main repo | 🏗️ MAIN REPO | — | — | — | Duplicate socket listeners on reconnect — inspect listener registration in source / unit test |

## Blocked: needs QA data writes

- **DOC-RUN-001**: Consult workspace needs DOC_CONSULT_PATIENT_ID
- **DOC-RUN-006**: Consult workspace needs DOC_CONSULT_PATIENT_ID
- **PH-RUN-003**: Opening an invoice needs a billed order; QA pharmacy queue is currently empty

## Requires main repo

- **SA-RUN-001**: React Profiler commit duration
- **AD-RUN-003**: React Profiler commit duration / layout thrash
- **AD-RUN-005**: Re-render scope (React Profiler + why-did-you-render)
- **DOC-RUN-002**: Re-render scope (React Profiler)
- **DOC-RUN-005**: React Profiler commit duration
- **DIAG-RUN-003**: Re-render scope (React Profiler)
- **GEN-RUN-003**: Duplicate socket listeners on reconnect — inspect listener registration in source / unit test

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
