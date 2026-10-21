# Business Logic: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-21 05:19 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Business Logic.csv` |

## Summary

| Total | ✅ PASS | ⏭️ NOT RUN | 📝 MANUAL PENDING | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|---|
| 24 | 7 | 1 | 3 | 3 | 10 |

| Module | ✅ PASS | ⏭️ NOT RUN | 📝 MANUAL PENDING | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|---|
| Pharmacy | 4 | 1 | 0 | 0 | 3 |
| Auth/RBAC | 0 | 0 | 0 | 0 | 1 |
| Auth | 2 | 0 | 1 | 1 | 0 |
| Payment | 1 | 0 | 0 | 0 | 0 |
| Doctor | 0 | 0 | 0 | 0 | 2 |
| Diagnostic | 0 | 0 | 0 | 0 | 2 |
| Reception | 0 | 0 | 0 | 0 | 1 |
| Admin | 0 | 0 | 1 | 2 | 0 |
| SuperAdmin | 0 | 0 | 1 | 0 | 1 |

| Execution | TCs |
|---|---|
| Auto | 8 |
| Manual | 3 |
| Main repo | 3 |
| Needs data | 10 |

## Results

| TC ID | Module | Feature | Input / Precondition | Action | Expected Result | Reference | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **PH-BIZ-001** | Pharmacy | Quote GST/total calc | cart lines, hospitalId | View cart/quote | totalAmount = subtotal + gstTotal; GST per tax rules | Backend PH-FUN-001 | Auto | ✅ PASS | **subtotal=1092 gst=131.04 discount=0 total=1223.04** | — | 2026-10-21 05:18 | total should equal subtotal + gst − discount |
| **PH-BIZ-002** | Pharmacy | PREPAID requires payment | paymentType=PREPAID, no payment | Confirm order | Blocked: "payment block required" | PH-FUN-008 | Auto | ✅ PASS | **400** | — | 2026-10-21 05:18 | PREPAID requires a payment block; rejected before persist; {"status":false,"message":"payment block is required for PREPAID."} |
| **PH-BIZ-003** | Pharmacy | homeTest must be PREPAID | collectionMode=home + PAY_AT_COUNTER | Confirm order | Blocked: HOME_REQUIRES_PREPAID | PH-FUN-009 | Auto | ✅ PASS | **400** | — | 2026-10-21 05:18 | {"status":false,"message":"HOME_REQUIRES_PREPAID: home-collection bookings must be paid online."} |
| **PH-BIZ-004** | Pharmacy | PAY_AT_COUNTER order | paymentType=counter | Create order | Status PENDING, no invoice yet | PH-FUN-011 | Needs data | ⏸️ BLOCKED | — | — | — | Creates a PAY_AT_COUNTER order on QA |
| **PH-BIZ-005** | Pharmacy | Idempotent order create | same idempotencyKey x2 | Submit twice | 2nd returns the same order, no duplicate | PH-FUN-010 | Needs data | ⏸️ BLOCKED | — | — | — | Creates an order twice to prove idempotency |
| **PH-BIZ-006** | Pharmacy | Order scoped to patient | patient A vs B | View order list/detail | Only own orders; B cannot read A's | PH-FUN-012/014 | Auto | ⏭️ NOT RUN | — | — | 2026-10-21 05:18 | Owner read returned 401 — seeded order not on QA; set a current PH_PHR_ORDER_ID + PH_PHR_ORDER_PATIENT_ID; seed order not readable on QA |
| **PH-BIZ-007** | Pharmacy | Invoice readiness gating | counter unpaid vs paid | View invoice | invoiceReady=false until paid; download gated | PH-FUN-015/017 | Needs data | ⏸️ BLOCKED | — | — | — | Needs a billed order to check invoiceReady gating (QA pharmacy queue empty) |
| **PH-BIZ-008** | Pharmacy | Patient-safe catalog | medicine detail | View medicine | Internal fields (stock/composition) hidden | PH-FUN-006 | Auto | ✅ PASS | **10 items; leaked: none** | — | 2026-10-21 05:18 | keys: id,medicineId,name,label,type,image,prices,quantity_info,manufacturer,rx_required,category,inStock |
| **GEN-BIZ-001** | Auth/RBAC | Permission gating (read/write/override) | permissions from /auth/refresh | Attempt write without write perm | Action blocked; read-only respected | permissions model | Needs data | ⏸️ BLOCKED | — | — | — | Attempting a write without write-permission mutates data; needs a least-privilege account |
| **GEN-BIZ-002** | Auth | Role to home redirect | role in sessionStorage | Log in as each role | Routed to correct module (doctor to /doctor | super admin to /superadmin) | Auto | ✅ PASS | — | — | 2026-10-21 05:18 | 6/6 checks passed |
| **GEN-BIZ-003** | Auth | Account deactivated | ACCOUNT_DEACTIVATED | Any request | Blocked + forced logout | axios.js | Auto | ✅ PASS | **final path: /login/** | — | 2026-10-21 05:18 | 403 ACCOUNT_DEACTIVATED should block + force logout |
| **GEN-BIZ-004** | Auth | HPR verification gate | HPR_NOT_VERIFIED | Doctor booking / diagnostic submit | Blocked via gate modal until HPR confirmed | hprGate | Main repo | 🏗️ MAIN REPO | — | — | — | HPR_NOT_VERIFIED gate fires on six ABDM submit endpoints; needs the source to target one |
| **GEN-BIZ-005** | Auth | Idle timeout | inactivity period | Stay idle | Auto logout, session cleared | useIdleTimeout | Manual | 📝 MANUAL PENDING | — | — | — | Idle timeout is 15 min (useIdleTimeout.js) — impractical to automate; verify by hand |
| **GEN-BIZ-006** | Payment | Amount / GST / discount calc | items, tax, discount | Checkout | Final = items + tax - discount; matches server | BRD | Auto | ✅ PASS | **subtotal=1092 gst=131.04 discount=0 total=1223.04** | — | 2026-10-21 05:18 | total should equal subtotal + gst − discount |
| **DOC-BIZ-001** | Doctor | Appointment booking rules | slot availability, fee | Book appointment | Only available slots bookable; fee applied; payment entry created | BRD | Needs data | ⏸️ BLOCKED | — | — | — | Appointment booking creates a payment entry / appointment |
| **DOC-BIZ-002** | Doctor | Prescription record types | create record | Save record | Only doctor-allowed record types; required fields enforced | BRD | Needs data | ⏸️ BLOCKED | — | — | — | Saving a prescription record needs DOC_CONSULT_PATIENT_ID and writes a record |
| **DIAG-BIZ-001** | Diagnostic | Section availability | operator shift/section | Set availability | Unavailable section/time not bookable | BRD | Needs data | ⏸️ BLOCKED | — | — | — | Setting availability + attempting a booking mutates diagnostic schedule |
| **DIAG-BIZ-002** | Diagnostic | Test to doctor assignment | test/doctor mapping | Assign test | Only valid mappings allowed | BRD | Needs data | ⏸️ BLOCKED | — | — | — | Test-to-doctor assignment mutates mappings |
| **RCP-BIZ-001** | Reception | Token generation | queue + token policy | Generate token | Token issued per policy (sequence, cap, slot) | TokenPolicy | Needs data | ⏸️ BLOCKED | — | — | — | Token generation creates a reception token |
| **AD-BIZ-001** | Admin | Service catalog tax | tax rate | Save tax | Tax within 0-100, applied to catalog | ServiceCatalogTax | Manual | 📝 MANUAL PENDING | — | — | — | Open ServiceCatalogTaxModal, enter tax >100 / negative, confirm inline validation blocks save — quick manual check |
| **AD-BIZ-002** | Admin | Discount tiers | tier thresholds | Configure tiers | Non-overlapping tiers; discount caps enforced | DiscountTiers | Main repo | 🏗️ MAIN REPO | — | — | — | Discount-tier overlap/caps are config logic — unit-test (DiscountTiers) |
| **AD-BIZ-003** | Admin | Token policy rules | policy config | Save policy | Invalid rules rejected before save | TokenPolicy | Main repo | 🏗️ MAIN REPO | — | — | — | Token-policy rule validation is config logic — unit-test (TokenPolicy) |
| **SA-BIZ-001** | SuperAdmin | Medicine/pricing | price, composition | Add/edit medicine | Required fields + price >= 0 enforced | BRD | Manual | 📝 MANUAL PENDING | — | — | — | Open Add/Edit Medicine modal, submit empty / negative price, confirm required-field + price>=0 validation — quick manual check |
| **SA-BIZ-002** | SuperAdmin | Rewards / coupons | coupon rules | Create coupon | Validity/expiry/usage limits enforced | Rewards BRD | Needs data | ⏸️ BLOCKED | — | — | — | Creating a coupon mutates rewards config |

## Blocked: needs QA data writes

- **PH-BIZ-004**: Creates a PAY_AT_COUNTER order on QA
- **PH-BIZ-005**: Creates an order twice to prove idempotency
- **PH-BIZ-007**: Needs a billed order to check invoiceReady gating (QA pharmacy queue empty)
- **GEN-BIZ-001**: Attempting a write without write-permission mutates data; needs a least-privilege account
- **DOC-BIZ-001**: Appointment booking creates a payment entry / appointment
- **DOC-BIZ-002**: Saving a prescription record needs DOC_CONSULT_PATIENT_ID and writes a record
- **DIAG-BIZ-001**: Setting availability + attempting a booking mutates diagnostic schedule
- **DIAG-BIZ-002**: Test-to-doctor assignment mutates mappings
- **RCP-BIZ-001**: Token generation creates a reception token
- **SA-BIZ-002**: Creating a coupon mutates rewards config

## Manual, pending

- **GEN-BIZ-005**: Idle timeout is 15 min (useIdleTimeout.js) — impractical to automate; verify by hand
- **AD-BIZ-001**: Open ServiceCatalogTaxModal, enter tax >100 / negative, confirm inline validation blocks save — quick manual check
- **SA-BIZ-001**: Open Add/Edit Medicine modal, submit empty / negative price, confirm required-field + price>=0 validation — quick manual check

## Requires main repo

- **GEN-BIZ-004**: HPR_NOT_VERIFIED gate fires on six ABDM submit endpoints; needs the source to target one
- **AD-BIZ-002**: Discount-tier overlap/caps are config logic — unit-test (DiscountTiers)
- **AD-BIZ-003**: Token-policy rule validation is config logic — unit-test (TokenPolicy)

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
