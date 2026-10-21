# UI/UX: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 09:00 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - UI_UX.csv` |

## Summary

| Total | ✅ PASS | ❌ FAIL | ⏭️ NOT RUN | 📝 MANUAL PENDING |
|---|---|---|---|---|
| 19 | 2 | 2 | 4 | 11 |

| Module | ✅ PASS | ❌ FAIL | ⏭️ NOT RUN | 📝 MANUAL PENDING |
|---|---|---|---|---|
| App-wide | 2 | 2 | 1 | 6 |
| Pharmacy | 0 | 0 | 2 | 0 |
| Doctor | 0 | 0 | 0 | 2 |
| Reception | 0 | 0 | 0 | 1 |
| Diagnostic | 0 | 0 | 0 | 1 |
| Admin | 0 | 0 | 1 | 0 |
| SuperAdmin | 0 | 0 | 0 | 1 |

| Execution | TCs |
|---|---|
| Auto | 5 |
| Auto + Manual | 3 |
| Manual | 11 |

## Results

| TC ID | Module | Screen / Flow | UX Criterion / Heuristic | Scenario / Steps | Expected (per design spec) | Severity | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **GEN-UX-001** | App-wide | All async actions | Visibility of system status | Trigger a load/save | Loading indicator <100ms, control disabled, result feedback shown | Medium | Manual | 📝 MANUAL PENDING | — | — | — | Loading-indicator timing (<100ms) and result feedback need human judgement |
| **GEN-UX-002** | App-wide | Toasts (react-hot-toast) | Feedback & error recovery | Fire success & error actions | Consistent toast; errors explain the next step (not codes) | Low | Auto + Manual | ⏭️ NOT RUN | — | — | — | Toast consistency automated; wording judged by a person |
| **GEN-UX-003** | App-wide | Destructive actions (delete/deactivate) | Error prevention / user control | Click delete/deactivate | WarningModal confirm before action; cancel available | High | Manual | 📝 MANUAL PENDING | — | — | — | Destructive-action confirm modal needs triggering a delete/deactivate (mutating) — verify by hand |
| **GEN-UX-004** | App-wide | Empty states (lists/tables) | Recognition over recall | Open a list with no data | Helpful empty state + CTA, never blank | Medium | Auto | ✅ PASS | **empty state shown** | — | 2026-10-19 08:59 | Shows an empty-state message on an empty queue |
| **GEN-UX-005** | App-wide | Error states | Help users recover | Force an API error | Clear message + retry, no raw error dump | Medium | Auto | ❌ FAIL | **no error affordance** | — | 2026-10-19 08:59 | error message: false; retry: false; raw dump: false; On a 500 the app shows the normal empty state — no error message or retry (same defect as RFT-TMO-002); Error: API error gives the user no error message and no retry |
| **GEN-UX-006** | App-wide | Forms | Error prevention / identification | Submit invalid form | Inline errors near fields; entered data retained | — | Manual | 📝 MANUAL PENDING | — | — | — | Inline form errors + data retention need a full invalid-submit flow per form |
| **GEN-UX-007** | App-wide | Components vs Figma | Consistency & standards | Compare screens to design | Matches design system (spacing, type, color, components) | Low | Manual | 📝 MANUAL PENDING | — | — | — | Design comparison against Figma |
| **GEN-UX-008** | App-wide | Navigation / sidebar | Visibility / recognition | Navigate between modules | Active route highlighted; page title correct | High | Auto | ❌ FAIL | **title="Swasthx", activeNav=true** | — | 2026-10-19 08:59 | Page title is the generic "Swasthx" (not route-specific — see GEN-A11Y-003); Active nav item is marked; Error: page title is generic "Swasthx" rather than route-specific |
| **GEN-UX-009** | App-wide | Responsive layout | Flexibility & efficiency | Resize to tablet/mobile | Usable per design; no overflow, no clipping | — | Manual | 📝 MANUAL PENDING | — | — | — | Deferred — desktop/web scope only for now (mobile/tablet responsive out of scope) |
| **GEN-UX-010** | App-wide | Submit buttons | Error prevention | Double-click submit | Disabled while in-flight; no double action | — | Manual | 📝 MANUAL PENDING | — | — | — | Double-submit guard needs a real submit flow (mutating) — verify by hand |
| **GEN-UX-011** | App-wide | Tooltips / icon labels (CustomToolTip) | Help & documentation | Hover/focus icon actions | Clear, accessible tooltip for icon-only actions | — | Auto | ✅ PASS | **0 unnamed icon button(s)** | — | 2026-10-19 08:59 | All icon-only buttons are labeled |
| **PH-UX-001** | Pharmacy | Checkout flow | Match real world / feedback | Choose prepaid vs counter / homeTest | Options clear; blocked combos explained inline | — | Auto + Manual | ⏭️ NOT RUN | — | — | — | Options/inline blocking automated; clarity judged by a person |
| **PH-UX-002** | Pharmacy | Cart price breakdown | Visibility of system status | View cart | Subtotal/GST/total itemized, currency formatted | — | Auto | ⏭️ NOT RUN | — | — | 2026-10-19 09:00 | Seed order P-20260924-0002 not present on QA (queue empty or data changed) — set a current PH_ORDER_VISIT_ID |
| **DOC-UX-001** | Doctor | ConsultWorkspace | Efficiency of use | Write a prescription | Efficient, keyboard-friendly, draft/unsaved cue | — | Manual | 📝 MANUAL PENDING | — | — | — | Heuristic review of prescription efficiency |
| **DOC-UX-002** | Doctor | Schedule / calendar | Match real world | Book / view slots | Intuitive slot selection; time/timezone clear | — | Manual | 📝 MANUAL PENDING | — | — | — | Heuristic review of slot selection |
| **RCP-UX-001** | Reception | Queue | Visibility of status | Token lifecycle | Clear token status + next-patient visibility, live updates | — | Manual | 📝 MANUAL PENDING | — | — | — | Heuristic review of token status visibility |
| **DIAG-UX-001** | Diagnostic | Availability grid | Error prevention | Toggle slots | Clear selected/unavailable states; confirm bulk change | — | Manual | 📝 MANUAL PENDING | — | — | — | Heuristic review of availability grid |
| **AD-UX-001** | Admin | Config forms (policy/tax/token) | Error prevention / help | Edit a config value | Guidance + validation + confirm on impactful change | — | Auto + Manual | ⏭️ NOT RUN | — | — | — | Validation/confirm automated (no save); guidance judged by a person |
| **SA-UX-001** | SuperAdmin | Analytics dashboards | Aesthetic & minimalist | View metrics | Readable charts, legends, date-range clarity, loading states | — | Manual | 📝 MANUAL PENDING | — | — | — | Heuristic review of analytics dashboards |

## Failures

- **GEN-UX-005**: error message: false; retry: false; raw dump: false; On a 500 the app shows the normal empty state — no error message or retry (same defect as RFT-TMO-002); Error: API error gives the user no error message and no retry
- **GEN-UX-008**: Page title is the generic "Swasthx" (not route-specific — see GEN-A11Y-003); Active nav item is marked; Error: page title is generic "Swasthx" rather than route-specific

## Manual, pending

- **GEN-UX-001**: Loading-indicator timing (<100ms) and result feedback need human judgement
- **GEN-UX-003**: Destructive-action confirm modal needs triggering a delete/deactivate (mutating) — verify by hand
- **GEN-UX-006**: Inline form errors + data retention need a full invalid-submit flow per form
- **GEN-UX-007**: Design comparison against Figma
- **GEN-UX-009**: Deferred — desktop/web scope only for now (mobile/tablet responsive out of scope)
- **GEN-UX-010**: Double-submit guard needs a real submit flow (mutating) — verify by hand
- **DOC-UX-001**: Heuristic review of prescription efficiency
- **DOC-UX-002**: Heuristic review of slot selection
- **RCP-UX-001**: Heuristic review of token status visibility
- **DIAG-UX-001**: Heuristic review of availability grid
- **SA-UX-001**: Heuristic review of analytics dashboards

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
