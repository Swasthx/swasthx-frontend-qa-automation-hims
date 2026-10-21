# API Contract: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 07:56 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - API contract.csv` |

## Summary

| Total | ✅ PASS | ❌ FAIL | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|
| 20 | 7 | 2 | 4 | 7 |

| Module | ✅ PASS | ❌ FAIL | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|
| Auth | 2 | 0 | 3 | 0 |
| Pharmacy | 4 | 1 | 0 | 1 |
| Doctor | 0 | 0 | 0 | 1 |
| Diagnostic | 0 | 1 | 0 | 1 |
| SuperAdmin | 0 | 0 | 0 | 2 |
| Patient | 0 | 0 | 0 | 1 |
| Payment | 0 | 0 | 0 | 1 |
| App-wide | 1 | 0 | 1 | 0 |

| Execution | TCs |
|---|---|
| Auto | 9 |
| Main repo | 4 |
| Needs data | 7 |

## Results

| TC ID | Module | Endpoint | Request Schema (field·type·req?) | Response Schema (field·type) | UI Binding | Contract Rule | Expected on Mismatch | Tool | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **GEN-API-001** | Auth | POST /auth/login | credentials (otp/password) req | token:str, refreshToken:str, role:str, permissions | axios → sessionStorage | token+refreshToken+role required, non-empty | Block login + error, no partial session | MSW + zod | Auto | ✅ PASS | — | — | 2026-10-19 07:56 | All cached role sessions carry token, refreshToken, role and an array permissions |
| **GEN-API-002** | Auth | POST /auth/refresh | refreshToken:str req | token, refreshToken, role, permissions(array\|object), impersonatedBy | performRefresh() → sessionStorage | permissions accepts array OR {resource:{read,write,override}} | Permissions empty → silent authz failure (must fail loud) | MSW + zod | Auto | ✅ PASS | — | — | 2026-10-19 07:56 | token=true refreshToken=true role=reception permissions=array(true) |
| **GEN-API-003** | Auth | Error contract (403) | — | errorCode:enum | response interceptor branches | errorCode ∈ {ACCOUNT_DEACTIVATED,SESSION_EXPIRED,INVALID_TOKEN,TOKEN_EXPIRED,INVALID_SESSION}; generic 403 has none | Renamed code → wrong logout or stuck session | MSW + contract test | Main repo | 🏗️ MAIN REPO | — | — | — | Exact 403 errorCode enum can only be forced with mocked responses (MSW) in the app test env |
| **GEN-API-004** | Auth | HPR gate (403) | — | status:false, code:'HPR_NOT_VERIFIED', hprStatus, message | isHprGateError → HPRGateModal | code + hprStatus must be present | Gate modal never fires; booking silently blocked | MSW + contract test | Main repo | 🏗️ MAIN REPO | — | — | — | HPR_NOT_VERIFIED 403 shape needs a mocked gated response (MSW) |
| **GEN-API-005** | Auth | 401 on feature endpoint | — | HTTP 401 (non-auth url) | interceptor refresh-once + replay | Only refresh when our JWT expired; ABDM 401 propagates | Logout loop / mid-flow logout | MSW | Main repo | 🏗️ MAIN REPO | — | — | — | Refresh-once-and-replay interceptor behaviour is a unit test (MSW); see RFT-TMO-003/006 |
| **PH-API-001** | Pharmacy | POST /pharmacy/phr/quote | lines:[{medId,qty:int}] req, hospitalId req | subtotal:num, gstTotal:num, totalAmount:num, lines[] | CartSummary | Amounts numeric; totalAmount = subtotal + gstTotal | NaN/missing → price blank | MSW + zod | Auto | ✅ PASS | **subtotal=728 gst=87.36 total=815.36** | — | 2026-10-19 07:56 | body: {"hospitalId":"IN3610001058","lines":[{"medicineId":"M4979553207","quantity":2}]} |
| **PH-API-002** | Pharmacy | POST /pharmacy/phr/orders | paymentType:enum, collectionMode:enum, lines[] req, payment? | orderId:str, status:enum, invoiceFhirId? | Checkout confirm | status ∈ {CONFIRMED,PENDING}; orderId required | Unknown status → confirm screen stuck | MSW + zod | Needs data | ⏸️ BLOCKED | — | — | — | POST creates a PHR order |
| **PH-API-003** | Pharmacy | GET /pharmacy/phr/medicines?q&page&limit | hospitalId req (query) | items:[{id,name,price,...patient-safe}], page, total | Medicines list | Only patient-safe fields; pagination envelope present | Internal fields leak / paging breaks | MSW + zod | Auto | ✅ PASS | **200 · 10 items · pagination=true** | — | 2026-10-19 07:56 | Only patient-safe fields; sample keys: id,medicineId,name,label,type,image,prices,quantity_info,manufacturer,rx_required,category,inStock |
| **PH-API-004** | Pharmacy | GET /pharmacy/phr/orders/:id/invoice | id (path) | invoiceReady:bool, invoiceUrl?/invoiceFhirId | Download Invoice button | invoiceReady:bool gates the button | Missing → button in wrong state | MSW | Auto | ✅ PASS | **200 · keys=invoiceReady,invoiceSource,orderId,invoiceNumber,date,paymentMode,paymentStatus,careContextId** | — | 2026-10-19 07:56 | — |
| **PH-API-005** | Pharmacy | GET /pharmacy/medicines | auth headers | [{id,name,...}] | Doctor PrescriptionSectionMedication | Response is an array | Non-array → render crash | MSW + zod | Auto | ❌ FAIL | **500 · {"message":"Internal server error"}** | — | 2026-10-19 07:56 | Endpoint returns a server error for the pharmacy role — the UI medicine list would be empty/broken; Error: /pharmacy/medicines returned 500 |
| **PH-API-006** | Pharmacy | GET /pharmacy/payment/getAllPaymentsDetails | auth headers | payments:[{...}] | PharmacyPayment | Array of payment objects | Shape change → table empty | MSW | Auto | ✅ PASS | **200 · 4 rows** | — | 2026-10-19 07:56 | — |
| **DOC-API-001** | Doctor | POST /payment/create-payment-entry | amount:num, patientId:str req | paymentId:str, razorpayOrderId?, status | NewBookAppointment | IDs present to open Razorpay | Missing → payment can't start | MSW + zod | Needs data | ⏸️ BLOCKED | — | — | — | POST creates a payment entry |
| **DIAG-API-001** | Diagnostic | POST /diagnostic/payment/create-payment-entry | amount, patientId, testIds[] req | paymentId:str, status | Diagnostic NewBookAppointment | Required ids returned | Payment init fails silently | MSW + zod | Needs data | ⏸️ BLOCKED | — | — | — | POST creates a payment entry |
| **DIAG-API-002** | Diagnostic | GET /diagnostic/payment/getAllPaymentsDetails | auth headers | payments:[{...}] | DiagnosticPayment | Array envelope stable | Table empty on shape drift | MSW | Auto | ❌ FAIL | **250 · no array** | — | 2026-10-19 07:56 | Returns non-standard HTTP 250 with {message} and no data array; Error: expected 200, got 250 |
| **SA-API-001** | SuperAdmin | POST /medicines | name:str, price:num, composition req | _id:str, ...created | AddMedicineModal | _id returned on create | List not refreshed without _id | MSW + zod | Needs data | ⏸️ BLOCKED | — | — | — | POST creates a medicine |
| **SA-API-002** | SuperAdmin | PUT /medicines/:id | changed fields | updated doc | EditMedicineModal | 200 + updated document | Stale row shown | MSW | Needs data | ⏸️ BLOCKED | — | — | — | PUT updates a medicine |
| **GEN-API-010** | Patient | POST /patient/register | name:str, phone:str req | patientId/_id:str | AddNewUserModal | Required fields validated; id returned | 400 validation shape surfaced inline (not generic) | MSW + zod | Needs data | ⏸️ BLOCKED | — | — | — | POST registers a patient |
| **GEN-API-011** | Payment | Razorpay order (paymentAPI.js, VITE_RAZORPAY_KEY) | amount, currency, receipt req | id(order_id):str, amount, currency | checkout.open() | order_id present | Checkout can't open | MSW + zod | Needs data | ⏸️ BLOCKED | — | — | — | Creates a Razorpay order (third party) |
| **GEN-API-012** | App-wide | List endpoints (generic) | page, limit (query) | {items[], page, total} OR bare array | all tables/lists | Pagination envelope consistent across endpoints | Mixed shapes → paging bugs per screen | Pact / zod | Auto | ✅ PASS | — | — | 2026-10-19 07:56 | /pharmacy/phr/medicines: 200 arrayUnderData=true bare=false; /pharmacy/payment/getAllPaymentsDetails: 200 arrayUnderData=true bare=false |
| **GEN-API-013** | App-wide | 400 validation error (generic) | invalid body | {message, errors[]/fieldErrors} | form submit handlers | Error shape stable & field-mappable | Inline field errors can't render | MSW + contract test | Main repo | 🏗️ MAIN REPO | — | — | — | Generic 400 validation-error shape needs mocked responses per form (MSW) |

## Failures

- **PH-API-005**: Endpoint returns a server error for the pharmacy role — the UI medicine list would be empty/broken; Error: /pharmacy/medicines returned 500
- **DIAG-API-002**: Returns non-standard HTTP 250 with {message} and no data array; Error: expected 200, got 250

## Blocked: needs QA data writes

- **PH-API-002**: POST creates a PHR order
- **DOC-API-001**: POST creates a payment entry
- **DIAG-API-001**: POST creates a payment entry
- **SA-API-001**: POST creates a medicine
- **SA-API-002**: PUT updates a medicine
- **GEN-API-010**: POST registers a patient
- **GEN-API-011**: Creates a Razorpay order (third party)

## Requires main repo

- **GEN-API-003**: Exact 403 errorCode enum can only be forced with mocked responses (MSW) in the app test env
- **GEN-API-004**: HPR_NOT_VERIFIED 403 shape needs a mocked gated response (MSW)
- **GEN-API-005**: Refresh-once-and-replay interceptor behaviour is a unit test (MSW); see RFT-TMO-003/006
- **GEN-API-013**: Generic 400 validation-error shape needs mocked responses per form (MSW)

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
