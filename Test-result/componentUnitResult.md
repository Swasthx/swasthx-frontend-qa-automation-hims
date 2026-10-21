# Component / Unit: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 09:15 UTC (each row's own time is in "Run at") |
| Environment | main-repo unit (node --test) |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Component_unit Testing.csv` |

## Summary

| Total | ✅ PASS | 🏗️ MAIN REPO |
|---|---|---|
| 12 | 1 | 11 |

| Module | ✅ PASS | 🏗️ MAIN REPO |
|---|---|---|
| App-wide | 0 | 5 |
| Admin | 0 | 3 |
| Pharmacy | 1 | 1 |
| Doctor | 0 | 1 |
| Reception | 0 | 1 |

| Execution | TCs |
|---|---|
| Main repo | 12 |

## Results

| TC ID | Module | Component | Props / Input State | Interaction | Expected Render / Behavior | Edge / Negative Cases | Tool | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **GEN-CMP-001** | App-wide | CustomModal | open=true, children | Press Esc / click overlay | onClose fires, modal unmounts | open=false renders nothing | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **GEN-CMP-002** | App-wide | CustomInputPatient | value, onChange, rules | Type valid/invalid | Formats value, shows error on invalid | empty/max-length | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **GEN-CMP-003** | App-wide | TagInput | tags=[] | Add + remove a tag | Tag added, removed, onChange emits | duplicate / empty tag rejected | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **GEN-CMP-004** | App-wide | CustomImageUpload | accept, maxSize | Select file | Valid image accepted | wrong MIME / oversized rejected | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **AD-CMP-001** | Admin | ServiceCatalogTaxModal | item=null (create) | Submit empty | Required errors shown, onSave not called | tax>100, negative price | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **AD-CMP-002** | Admin | TokenPolicyRuleCard | rule object | Click edit | Renders rule, edit callback fires | missing fields fallback | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **AD-CMP-003** | Admin | AuditLogStats | raw log array | — | Computes/format counts correctly | empty array → zeros | Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **PH-CMP-001** | Pharmacy | orderStage status map | each status value | — | Maps status → label + color | unknown status → safe default | Vitest | Main repo | ✅ PASS | **6/6 assertions** | — | 2026-10-19 09:15 | [main-repo feature/feature-fixing-newdesign] Unit-tested the real orderStage.js (pure module) with node --test: deriveStage status→stage incl. unknown→safe default, isPaid, STAGE_META completeness, inbox/fulfilment partition |
| **PH-CMP-002** | Pharmacy | InvoiceModal | line items | — | Subtotal/GST/total computed & rendered | empty items / rounding | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **DOC-CMP-001** | Doctor | ConsultWorkspace (med rows) | initial rows | Add / remove row | Row added/removed, state consistent | remove last row guard | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **RCP-CMP-001** | Reception | Queue token card | token props | — | Status badge + patient info render | missing patient data fallback | RTL + Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |
| **GEN-CMP-005** | App-wide | timeSlotFunction (util) | time range input | — | Returns correct slot array | DST / invalid range | Vitest | Main repo | 🏗️ MAIN REPO | — | — | — | Component/unit test: Vitest + React Testing Library in the main repo |

## Requires main repo

- **GEN-CMP-001**: Component/unit test: Vitest + React Testing Library in the main repo
- **GEN-CMP-002**: Component/unit test: Vitest + React Testing Library in the main repo
- **GEN-CMP-003**: Component/unit test: Vitest + React Testing Library in the main repo
- **GEN-CMP-004**: Component/unit test: Vitest + React Testing Library in the main repo
- **AD-CMP-001**: Component/unit test: Vitest + React Testing Library in the main repo
- **AD-CMP-002**: Component/unit test: Vitest + React Testing Library in the main repo
- **AD-CMP-003**: Component/unit test: Vitest + React Testing Library in the main repo
- **PH-CMP-002**: Component/unit test: Vitest + React Testing Library in the main repo
- **DOC-CMP-001**: Component/unit test: Vitest + React Testing Library in the main repo
- **RCP-CMP-001**: Component/unit test: Vitest + React Testing Library in the main repo
- **GEN-CMP-005**: Component/unit test: Vitest + React Testing Library in the main repo

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
