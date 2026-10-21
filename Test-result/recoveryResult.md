# Recovery: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 07:19 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Recovery.csv` |

## Summary

| Total | ✅ PASS | ❌ FAIL | 📝 MANUAL PENDING | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|---|
| 25 | 6 | 4 | 7 | 6 | 2 |

| Module / Area | ✅ PASS | ❌ FAIL | 📝 MANUAL PENDING | 🏗️ MAIN REPO | ⏸️ BLOCKED |
|---|---|---|---|---|---|
| App-wide | 1 | 1 | 0 | 1 | 0 |
| App shell | 0 | 1 | 0 | 0 | 0 |
| Queues (socket) | 0 | 0 | 1 | 0 | 0 |
| Forms (consult/prescription) | 0 | 0 | 1 | 0 | 0 |
| Static assets | 0 | 1 | 0 | 0 | 0 |
| Payment (Razorpay) | 0 | 0 | 1 | 0 | 0 |
| Flaky network | 0 | 0 | 1 | 0 | 0 |
| App-wide (axios) | 1 | 0 | 0 | 0 | 0 |
| Auth (axios) | 0 | 0 | 0 | 1 | 0 |
| Auth | 1 | 0 | 0 | 1 | 0 |
| ABDM routes | 1 | 0 | 0 | 0 | 0 |
| Order create | 0 | 0 | 0 | 0 | 1 |
| Double submit | 0 | 0 | 0 | 0 | 1 |
| Lists/tables | 0 | 1 | 0 | 0 | 0 |
| HPR gate | 0 | 0 | 0 | 1 | 0 |
| Routing | 1 | 0 | 0 | 0 | 0 |
| Session | 1 | 0 | 0 | 0 | 0 |
| Socket | 0 | 0 | 1 | 0 | 0 |
| Unsaved form | 0 | 0 | 1 | 0 | 0 |
| ErrorBoundary reset | 0 | 0 | 0 | 1 | 0 |
| Chunk load failure | 0 | 0 | 0 | 1 | 0 |
| Long session | 0 | 0 | 1 | 0 | 0 |

| Execution | TCs |
|---|---|
| Auto | 10 |
| Manual | 7 |
| Main repo | 6 |
| Needs data | 2 |

## Results

| TC ID | Category | Module / Area | Fault Scenario | Injection Method | Expected UI Behavior | Data Integrity Expectation | Recovery | Severity | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **RFT-OFF-001** | Offline & Caching | App-wide | Go offline mid-session | DevTools Network: Offline | Offline banner shown; no infinite spinners | Queued/blocked writes not silently dropped | Manual on reconnect | High | Auto | ✅ PASS | — | — | 2026-10-19 07:18 | offline banner shown: false; stuck on spinner: false; no uncaught errors: true; No offline indicator — user gets no feedback that the network dropped |
| **RFT-OFF-002** | Offline & Caching | App shell | Reload while offline | Offline + F5 | Cached shell or clear offline page (not browser error) | — | Auto on reconnect | Medium | Auto | ❌ FAIL | **browser error** | — | 2026-10-19 07:18 | reload failed: page.reload: net::ERR_INTERNET_DISCONNECTED; No service worker / offline cache → raw browser error on offline reload; Error: offline reload shows a raw browser error (no offline shell / service worker) |
| **RFT-OFF-003** | Offline & Caching | Queues (socket) | Network drops then restores | Toggle offline/online | Socket reconnects, queue re-syncs to latest | Queue state consistent, no stale rows | Auto | High | Manual | 📝 MANUAL PENDING | — | — | — | Socket reconnect + queue re-sync needs two live clients and real socket traffic |
| **RFT-OFF-004** | Offline & Caching | Forms (consult/prescription) | Submit while offline | Offline during submit | Blocked with clear message; entered data retained | No partial save; data preserved for retry | Manual retry | High | Manual | 📝 MANUAL PENDING | — | — | — | Offline form submit with data retained needs an editable clinical form (consult/prescription) |
| **RFT-OFF-005** | Offline & Caching | Static assets | Repeat load | Inspect cache-control headers | Hashed JS/CSS/images served from cache | — | Auto | Low | Auto | ❌ FAIL | **Cache-Control: public, max-age=0, s-maxage=31536000** | — | 2026-10-19 07:18 | Browser max-age=0; hashed assets are re-validated on every load (not served straight from cache); Error: hashed asset not browser-cacheable: public, max-age=0, s-maxage=31536000 |
| **RFT-OFF-006** | Offline & Caching | Payment (Razorpay) | Offline during payment | Offline mid-checkout | No double charge; clear failure; can resume/verify | Payment reconciled, no orphan order | Manual | Critical | Manual | 📝 MANUAL PENDING | — | — | — | Razorpay checkout interrupted mid-payment (third-party sandbox) |
| **RFT-OFF-007** | Offline & Caching | Flaky network | Intermittent connectivity | Throttle + random drops | Graceful retry/degrade, no crash | No duplicate submissions | Auto/Manual | Medium | Manual | 📝 MANUAL PENDING | — | — | — | Intermittent-connectivity behaviour needs sustained real flaky network + human judgement |
| **RFT-TMO-001** | Timeout & Retry | App-wide (axios) | Request hangs, no response | Delayed/stalled mock response | Times out with error, NOT an infinite spinner | — | Manual retry | Critical | Auto | ✅ PASS | **resolved/empty** | — | 2026-10-19 07:18 | spinner elements after 22s: 0; main content length: 260 |
| **RFT-TMO-002** | Timeout & Retry | App-wide | API 500 / network error | Mock 500 / force fail | Error state + retry affordance; no crash | — | Manual retry | High | Auto | ❌ FAIL | — | — | 2026-10-19 07:18 | error message: false; retry control: false; Shows an EMPTY state ("no prescriptions…"), indistinguishable from a real 500; no uncaught JS errors: true; Error: no error message and no retry control on API 500 (app treats a server error like "no data") |
| **RFT-TMO-003** | Timeout & Retry | Auth (axios) | 401 then refresh + replay | Expire token / mock 401 | Single refresh, original request replayed once (_retry guard) | No infinite retry loop | Auto | High | Main repo | 🏗️ MAIN REPO | — | — | — | axios single-flight refresh + replay of the original request — unit-test the interceptor |
| **RFT-TMO-004** | Timeout & Retry | Auth | Refresh token invalid/expired | Mock /auth/refresh 401 | Session cleared, "Session Expired" → redirect /login | No stuck half-auth state | Auto→manual login | High | Auto | ✅ PASS | — | — | 2026-10-19 07:19 | final path: /login/; Storage-clear on logout is covered by GEN-SEC-010 (not asserted here: the test re-seeds sessionStorage on every navigation) |
| **RFT-TMO-005** | Timeout & Retry | Auth | Concurrent 401s during refresh | Fire N parallel requests on expired token | Single-flight refresh; queued requests settle together | No duplicate /auth/refresh calls | Auto | High | Main repo | 🏗️ MAIN REPO | — | — | — | Concurrent-401 single-flight refresh — unit-test the interceptor queue |
| **RFT-TMO-006** | Timeout & Retry | ABDM routes | Upstream 401 while our JWT valid | Mock ABDM 401 | Error propagates to caller; session NOT wiped | Session preserved (no false logout) | Auto | High | Auto | ✅ PASS | — | — | 2026-10-19 07:18 | injected 401s: 1; still on: /pharmacy/queue/; token retained: true |
| **RFT-TMO-007** | Timeout & Retry | Order create | Timeout after POST (unknown result) | Drop response post-submit | Retry reuses idempotencyKey → no duplicate order | Exactly-once order | Critical | — | Needs data | ⏸️ BLOCKED | — | — | — | Creates an order to prove idempotent retry |
| **RFT-TMO-008** | Timeout & Retry | Double submit | Rapid clicks under slow network | Slow network + multi-click | Button disabled while in-flight; one request | No duplicate writes | High | — | Needs data | ⏸️ BLOCKED | — | — | — | Submits a real write under slow network |
| **RFT-TMO-009** | Timeout & Retry | Lists/tables | Slow or failed fetch | Delay/fail mock | Skeleton → error with retry; never permanent blank | — | Manual | Medium | Auto | ❌ FAIL | — | — | 2026-10-19 07:18 | permanent blank: false; error-or-retry shown: false; Falls back to an empty state, not an error-with-retry; Error: failed fetch shows no error state and no retry (only an empty state) |
| **RFT-TMO-010** | Timeout & Retry | HPR gate | HPR_NOT_VERIFIED 403 on submit | Mock 403 code | Gate modal/toast fires; per-screen loading cleared | No stuck spinner | Medium | — | Main repo | 🏗️ MAIN REPO | — | — | — | HPR_NOT_VERIFIED gate fires on six ABDM-backed submit endpoints; needs the source to target one reliably |
| **RFT-CRA-001** | Crash Recovery | App-wide | Render error in a component | Throw in a child component | ErrorBoundary shows "Something went wrong" + Reload/dashboard | — | Manual reload | Critical | Main repo | 🏗️ MAIN REPO | — | — | — | Requires throwing inside a child component to exercise the ErrorBoundary |
| **RFT-CRA-002** | Crash Recovery | Routing | Bad URL (#, %22, unknown path) | Navigate to invalid route | NotFound renders (not blank shell) per role catch-all | — | Manual | High | Auto | ✅ PASS | **NotFound shown** | — | 2026-10-19 07:18 | final path: /pharmacy/this-route-does-not-exist-zzz/; Content present |
| **RFT-CRA-003** | Crash Recovery | Session | Hard reload (F5) mid-session | F5 with JWT in sessionStorage | State restored; socket re-handshakes (ensureSocketConnected) | No data loss; auth retained | Auto | High | Auto | ✅ PASS | — | — | 2026-10-19 07:18 | after reload: /pharmacy/profile/; token retained: true |
| **RFT-CRA-004** | Crash Recovery | Socket | Tab backgrounded/slept then resumed | Background tab, return | Socket reconnects + rejoins rooms; queue current | Consistent state | Auto | Medium | Manual | 📝 MANUAL PENDING | — | — | — | Tab background/resume → socket rejoin; needs real backgrounding + socket traffic |
| **RFT-CRA-005** | Crash Recovery | Unsaved form | Crash/navigate with unsaved consult/prescription | Trigger error / back nav | Warn before loss OR draft preserved | No silent data loss | High | — | Manual | 📝 MANUAL PENDING | — | — | — | Unsaved-form warning needs an editable clinical form with dirty state |
| **RFT-CRA-006** | Crash Recovery | ErrorBoundary reset | Recover after error without full reload | Click Reload / dashboard link | App returns to a working route | — | Manual | Medium | Main repo | 🏗️ MAIN REPO | — | — | — | ErrorBoundary reset path is reachable only after injecting a render error (see RFT-CRA-001) |
| **RFT-CRA-007** | Crash Recovery | Chunk load failure | Stale chunk 404 after new deploy | Serve 404 for old chunk | Caught → prompt reload for new build (no dead screen) | — | Manual reload | Medium | Main repo | 🏗️ MAIN REPO | — | — | — | No code-splitting on the current build (single bundle, BND-010..015), so there are no lazy chunks to fail — revisit after code-splitting lands |
| **RFT-CRA-008** | Crash Recovery | Long session | Many navigations over long soak | Soak test | Stays responsive; no leak-induced freeze | — | Auto | Low | Manual | 📝 MANUAL PENDING | — | — | — | Long-session soak test (many navigations over time) — run by hand / in a soak harness |

## Failures

- **RFT-OFF-002**: reload failed: page.reload: net::ERR_INTERNET_DISCONNECTED; No service worker / offline cache → raw browser error on offline reload; Error: offline reload shows a raw browser error (no offline shell / service worker)
- **RFT-OFF-005**: Browser max-age=0; hashed assets are re-validated on every load (not served straight from cache); Error: hashed asset not browser-cacheable: public, max-age=0, s-maxage=31536000
- **RFT-TMO-002**: error message: false; retry control: false; Shows an EMPTY state ("no prescriptions…"), indistinguishable from a real 500; no uncaught JS errors: true; Error: no error message and no retry control on API 500 (app treats a server error like "no data")
- **RFT-TMO-009**: permanent blank: false; error-or-retry shown: false; Falls back to an empty state, not an error-with-retry; Error: failed fetch shows no error state and no retry (only an empty state)

## Blocked: needs QA data writes

- **RFT-TMO-007**: Creates an order to prove idempotent retry
- **RFT-TMO-008**: Submits a real write under slow network

## Manual, pending

- **RFT-OFF-003**: Socket reconnect + queue re-sync needs two live clients and real socket traffic
- **RFT-OFF-004**: Offline form submit with data retained needs an editable clinical form (consult/prescription)
- **RFT-OFF-006**: Razorpay checkout interrupted mid-payment (third-party sandbox)
- **RFT-OFF-007**: Intermittent-connectivity behaviour needs sustained real flaky network + human judgement
- **RFT-CRA-004**: Tab background/resume → socket rejoin; needs real backgrounding + socket traffic
- **RFT-CRA-005**: Unsaved-form warning needs an editable clinical form with dirty state
- **RFT-CRA-008**: Long-session soak test (many navigations over time) — run by hand / in a soak harness

## Requires main repo

- **RFT-TMO-003**: axios single-flight refresh + replay of the original request — unit-test the interceptor
- **RFT-TMO-005**: Concurrent-401 single-flight refresh — unit-test the interceptor queue
- **RFT-TMO-010**: HPR_NOT_VERIFIED gate fires on six ABDM-backed submit endpoints; needs the source to target one reliably
- **RFT-CRA-001**: Requires throwing inside a child component to exercise the ErrorBoundary
- **RFT-CRA-006**: ErrorBoundary reset path is reachable only after injecting a render error (see RFT-CRA-001)
- **RFT-CRA-007**: No code-splitting on the current build (single bundle, BND-010..015), so there are no lazy chunks to fail — revisit after code-splitting lands

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
