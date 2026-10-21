# Security: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 06:15 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/, main-repo feature/feature-fixing-newdesign@27eb26c6 |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Security Test.csv` |

## Summary

| Total | ✅ PASS | ❌ FAIL | 📝 MANUAL PENDING | ⏸️ BLOCKED |
|---|---|---|---|---|
| 38 | 16 | 16 | 2 | 4 |

| Category | ✅ PASS | ❌ FAIL | 📝 MANUAL PENDING | ⏸️ BLOCKED |
|---|---|---|---|---|
| Access-Control | 2 | 5 | 0 | 0 |
| Access-Control (IDOR) | 1 | 0 | 0 | 0 |
| Access-Control (UI) | 0 | 0 | 0 | 1 |
| Auth/Session | 4 | 0 | 1 | 0 |
| Secrets | 3 | 0 | 0 | 0 |
| Dependency/SCA | 1 | 4 | 0 | 0 |
| XSS | 2 | 0 | 0 | 1 |
| XSS (upload) | 0 | 0 | 0 | 1 |
| Stored XSS | 0 | 0 | 0 | 1 |
| Headers/CSP | 0 | 1 | 0 | 0 |
| Headers | 0 | 4 | 0 | 0 |
| CSP (fallback) | 0 | 1 | 0 | 0 |
| Transport | 1 | 0 | 0 | 0 |
| PII/Logging | 0 | 1 | 0 | 0 |
| Data exposure | 1 | 0 | 0 | 0 |
| CSRF | 1 | 0 | 0 | 0 |
| Bot/Abuse | 0 | 0 | 1 | 0 |

| Execution | TCs |
|---|---|
| Auto | 25 |
| Manual | 2 |
| Main repo | 7 |
| Needs data | 4 |

## Results

| TC ID | Category | Component / Endpoint | Attack / Scenario | Tool | Expected Result | Severity | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AD-SEC-001** | Access-Control | /admin/* (RBACPermission, discount-tiers, policy, staffusers) | reception/doctor/pharmacy role opens admin URL directly | ZAP + manual | Redirected/blocked; API 403; no admin data rendered | Medium | Auto | ❌ FAIL | — | — | 2026-10-19 06:12 | 4/6 checks passed; superadmin session cannot open /admin/profile: Error: Route guard let this session in: still on /admin/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /admin/profile: Error: Route guard let this session in: still on /admin/profile/ rendering module content (no login/denied screen) |
| **SA-SEC-001** | Access-Control | /superadmin/* (manageHospital, pricing, orders) | non-superadmin opens superadmin URL (no RequireAuth wrapper here) | ZAP + manual | Redirected/blocked; API 403 | Medium | Auto | ❌ FAIL | — | — | 2026-10-19 06:12 | 1/6 checks passed; admin session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); reception session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); doctor session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); diagnostic session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen) |
| **DOC-SEC-001** | Access-Control | /doctor/consult/:patientId | unauthenticated deep-link (no token) | manual + React Router | Redirect to /login, nothing renders | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | — |
| **RCP-SEC-001** | Access-Control | /reception/* | other-role token hits reception routes | manual | Redirect/block | High | Auto | ❌ FAIL | — | — | 2026-10-19 06:12 | 1/6 checks passed; superadmin session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); admin session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); doctor session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); diagnostic session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen) |
| **DIAG-SEC-001** | Access-Control | /diagnostic/* | cross-role access | manual | Redirect/block | Critical | Auto | ❌ FAIL | — | — | 2026-10-19 06:12 | 1/6 checks passed; superadmin session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); admin session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); reception session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); doctor session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); pharmacy session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen) |
| **PH-SEC-001** | Access-Control | /pharmacy/* (RequireAuthPharmacy) | cross-role / no token | manual | Guard blocks (verify fix held) | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | 6/6 checks passed |
| **GEN-SEC-002** | Access-Control | All role routers using <Routes element={guard}> | Confirm guard actually mounts on nested routes | manual code + runtime | Guard executes on every nested route | Critical | Auto | ❌ FAIL | — | — | 2026-10-19 06:12 | 0/5 checks passed; superadmin session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); admin session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); reception session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); diagnostic session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen) |
| **AD-SEC-003** | Access-Control (IDOR) | /admin/diagnostics/:id, /admin/doctorsetup/:doctorId | swap id to another tenant's resource | Burp / ZAP | API 403/404, no cross-tenant data | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | 12 admin API responses checked; all scoped to IN3610001058; Tampered /HPR/verify/banner?hospitalId=IN3610001068 → 403 |
| **AD-SEC-004** | Access-Control (UI) | AdminSidebar links gated by lowercase permission | user without permission navigates by URL (link hidden) | manual | Blocked even when link hidden | High | Needs data | ⏸️ BLOCKED | — | — | — | Needs an admin account missing a specific permission to prove URL access stays blocked when the sidebar link is hidden |
| **GEN-SEC-010** | Auth/Session | sessionStorage token/refreshToken/role | Logout clears all auth keys | DevTools / manual | storage emptied on logout | Critical | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | Post-logout URL: /login; All auth keys cleared |
| **GEN-SEC-011** | Auth/Session | useIdleTimeout | Idle expiry clears token + redirects | manual | session invalidated after idle | High | Manual | 📝 MANUAL PENDING | — | — | — | Idle timeout is 15 min (useIdleTimeout.js); full idle expiry is impractical to automate — verify by hand |
| **GEN-SEC-012** | Auth/Session | axios refresh flow | Expired token → refresh; bad refresh → force logout | Burp / manual | no loop, logout on 401 | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | valid refresh issued a new token: true; invalid refresh → 401 |
| **GEN-SEC-013** | Auth/Session | token in sessionStorage (XSS-readable) | Assess XSS→token theft; consider httpOnly cookie | review | risk documented/mitigated | High | Main repo | ✅ PASS | **sessionStorage** | — | 2026-10-19 06:15 | [main-repo feature/feature-fixing-newdesign@27eb26c6]; Token stored in sessionStorage (14 VITE_SECRET_KEY references in src/), so it is readable by any script → XSS can exfiltrate it.; Risk documented. Mitigation (httpOnly cookie) is an architecture decision; a strong CSP (currently absent, GEN-SEC-050/055) lowers the XSS risk meanwhile. |
| **GEN-SEC-014** | Auth/Session | Browser back after logout | navigate back to protected page post-logout | manual | no cached PHI, re-auth required | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | Landed on /login |
| **GEN-SEC-020** | Secrets | VITE_SECRET_KEY (sharedFunction.js) + crypto-js | inspect built bundle for the secret | grep dist / source-map-explorer | no real server secret in client | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | crypto-js ships in the client bundle; its key (VITE_SECRET_KEY) is embedded and readable by anyone; A client-embedded key protects nothing from the client; confirm it is NOT reused as a server-side secret (main-repo review). |
| **GEN-SEC-021** | Secrets | VITE_RAZORPAY_KEY (paymentAPI.js) | confirm only Razorpay key_id (public), not key_secret | grep / manual | no key_secret shipped | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | No Razorpay public key literal found; No payment *_secret found |
| **GEN-SEC-022** | Secrets | all import.meta.env / .env | no tokens/passwords/private keys in any VITE_* var | grep + snyk code | clean | High | Auto | ✅ PASS | **2 assets scanned** | — | 2026-10-19 06:12 | No private-key/cloud-secret/password/JWT literals found |
| **GEN-SEC-030** | Dependency/SCA | pdfjs-dist 3.11.174 (@react-pdf-viewer) | CVE-2024-4367 arbitrary JS via crafted PDF | npm audit / snyk + open malicious PDF | upgrade pdfjs ≥4.2 or isEvalSupported:false; no JS exec | High | Main repo | ❌ FAIL | **pdfjs-dist@3.11.174** | — | 2026-10-19 06:15 | [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit: high; PDF.js vulnerable to arbitrary JavaScript execution upon opening a malicious PDF (high) |
| **GEN-SEC-031** | Dependency/SCA | xlsx 0.18.5 (SheetJS) | prototype pollution / ReDoS (CVE-2023-30533) | npm audit / snyk | patched/mitigated version | High | Main repo | ❌ FAIL | **xlsx@0.18.5** | — | 2026-10-19 06:15 | [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit: high; Prototype Pollution in sheetJS (high); SheetJS Regular Expression Denial of Service (ReDoS) (high) |
| **GEN-SEC-032** | Dependency/SCA | axios 1.5.0 | CVEs fixed in later 1.x (SSRF / cred leak) | npm audit / snyk | upgrade axios | High | Main repo | ❌ FAIL | **axios@1.5.0** | — | 2026-10-19 06:15 | [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit: high; Axios Cross-Site Request Forgery Vulnerability (moderate); Server-Side Request Forgery in axios (high) |
| **GEN-SEC-033** | Dependency/SCA | moment 2.x | ReDoS / deprecated | npm audit / snyk | migrate to dayjs | High | Main repo | ✅ PASS | **moment@2.30.1** | — | 2026-10-19 06:15 | [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit: moderate; moment vulnerable to Path Traversal via crafted non-string locale name (moderate) |
| **GEN-SEC-034** | Dependency/SCA | whole dependency tree | CI gate: 0 high/critical | npm audit --audit-level=high / snyk test | pipeline fails on high+ | High | Main repo | ❌ FAIL | **51 high/critical** | — | 2026-10-19 06:15 | [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit totals: {"info":0,"low":1,"moderate":15,"high":48,"critical":3,"total":67}; CI gate: fail on high+ |
| **GEN-SEC-040** | XSS | app-wide render | keep dangerouslySetInnerHTML at 0 | ESLint react/no-danger + grep | 0 occurrences | High | Main repo | ✅ PASS | **0 occurrence(s)** | — | 2026-10-19 06:15 | [main-repo feature/feature-fixing-newdesign@27eb26c6]; No dangerouslySetInnerHTML in src/ |
| **GEN-SEC-041** | XSS | react-highlight-words (search) | inject <img onerror>/<script> as search term | manual | rendered escaped, no exec | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | injected <img> elements: 0; onerror executed: false |
| **GEN-SEC-042** | XSS | react-helmet (DynamicDoctorProfileLanding) | malicious doctor name/meta into <head> | manual | escaped, no exec | High | Needs data | ⏸️ BLOCKED | — | — | — | Writes a malicious doctor name/meta to a profile |
| **GEN-SEC-043** | XSS (upload) | CustomImageUpload / SingleVideoUpload | upload SVG w/ embedded script or spoofed MIME | manual / ZAP | type+size validated, SVG blocked/sanitized | High | Needs data | ⏸️ BLOCKED | — | — | — | Uploads SVG/spoofed-MIME files |
| **GEN-SEC-044** | Stored XSS | profile/notes/ticket fields | inject payload, persist, reload & view | manual | escaped on render | High | Needs data | ⏸️ BLOCKED | — | — | — | Persists an XSS payload in profile/notes/ticket fields |
| **GEN-SEC-050** | Headers/CSP | HTTP response headers (hosting) | Content-Security-Policy present & restrictive | securityheaders.com / ZAP / curl -I | CSP blocks inline/eval, whitelists origins | High | Auto | ❌ FAIL | **missing** | — | 2026-10-19 06:12 | Error: Content-Security-Policy: missing |
| **GEN-SEC-051** | Headers | X-Frame-Options / frame-ancestors | iframe the app (clickjacking) | manual iframe / ZAP | framing denied | High | Auto | ❌ FAIL | **missing** | — | 2026-10-19 06:12 | Error: X-Frame-Options / frame-ancestors: missing |
| **GEN-SEC-052** | Headers | Strict-Transport-Security (HSTS) | check HTTPS enforcement header | curl -I / securityheaders | HSTS set, long max-age | High | Auto | ❌ FAIL | **missing** | — | 2026-10-19 06:12 | Error: Strict-Transport-Security: missing |
| **GEN-SEC-053** | Headers | X-Content-Type-Options | check nosniff present | curl -I | nosniff set | High | Auto | ❌ FAIL | **missing** | — | 2026-10-19 06:12 | Error: X-Content-Type-Options: nosniff: missing |
| **GEN-SEC-054** | Headers | Referrer-Policy / Permissions-Policy | check present & strict | securityheaders.com | strict-origin-when-cross-origin, minimal perms | High | Auto | ❌ FAIL | **referrer-policy=∅; permissions-policy=∅** | — | 2026-10-19 06:12 | Error: Referrer-Policy + Permissions-Policy: referrer-policy=∅; permissions-policy=∅ |
| **GEN-SEC-055** | CSP (fallback) | index.html <meta http-equiv> | meta CSP if server headers not possible | manual | present as fallback | High | Auto | ❌ FAIL | **missing** | — | 2026-10-19 06:12 | No CSP <meta> in index.html and no CSP header (GEN-SEC-050) → app has no CSP at all; Error: no CSP meta fallback in index.html |
| **GEN-SEC-060** | Transport | API + socket (VITE_BASE_URL, websocket) | ensure HTTPS/WSS only, no mixed content | DevTools / ZAP | no http:// or ws:// calls | High | Auto | ✅ PASS | **46 requests** | — | 2026-10-19 06:12 | All requests used https/wss |
| **GEN-SEC-061** | PII/Logging | console logs (socket warn, errors) | no token/PHI/PII in console or network in prod build | prod build + manual | nothing sensitive logged | High | Auto | ❌ FAIL | **16 console lines** | — | 2026-10-19 06:12 | error: WebSocket connection to 'wss://98jahxhmj5.ap-south-1.awsapprunner.com/socket.io/?token=<jwt>&EIO=4&transport=webs; warning: WebSocket connection to 'wss://98jahxhmj5.ap-south-1.awsapprunner.com/socket.io/?token=<jwt>&EIO=4&transport=we; Error: token/PII in console |
| **GEN-SEC-062** | Data exposure | query params (phone, ids) | PHI/PII not leaked in URL/referrer | manual | ids only, no PII in URL | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | No phone/mobile in query strings |
| **GEN-SEC-063** | CSRF | state-changing POSTs | confirm bearer-header auth, not cookie | Burp / review | no cookie-based auth → CSRF low | High | Auto | ✅ PASS | — | — | 2026-10-19 06:12 | 0 cookies for origin; No auth cookies (token lives in sessionStorage; requests use Authorization: Bearer) |
| **GEN-SEC-064** | Bot/Abuse | Login (VITE_RECAPTURE_SITE_KEY) | reCAPTCHA + OTP enforced server-side | manual / Burp | brute-force/bot mitigated | High | Manual | 📝 MANUAL PENDING | — | — | — | reCAPTCHA challenge cannot be automated; server-side OTP enforcement is covered by business-logic login tests |

## Failures

- **AD-SEC-001**: 4/6 checks passed; superadmin session cannot open /admin/profile: Error: Route guard let this session in: still on /admin/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /admin/profile: Error: Route guard let this session in: still on /admin/profile/ rendering module content (no login/denied screen)
- **SA-SEC-001**: 1/6 checks passed; admin session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); reception session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); doctor session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); diagnostic session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /superadmin/profile: Error: Route guard let this session in: still on /superadmin/profile/ rendering module content (no login/denied screen)
- **RCP-SEC-001**: 1/6 checks passed; superadmin session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); admin session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); doctor session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); diagnostic session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /reception/profile: Error: Route guard let this session in: still on /reception/profile/ rendering module content (no login/denied screen)
- **DIAG-SEC-001**: 1/6 checks passed; superadmin session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); admin session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); reception session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); doctor session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen); pharmacy session cannot open /diagnostic: Error: Route guard let this session in: still on /diagnostic/ rendering module content (no login/denied screen)
- **GEN-SEC-002**: 0/5 checks passed; superadmin session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); admin session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); reception session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); diagnostic session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen); pharmacy session cannot open /doctor/profile: Error: Route guard let this session in: still on /doctor/profile/ rendering module content (no login/denied screen)
- **GEN-SEC-030**: [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit: high; PDF.js vulnerable to arbitrary JavaScript execution upon opening a malicious PDF (high)
- **GEN-SEC-031**: [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit: high; Prototype Pollution in sheetJS (high); SheetJS Regular Expression Denial of Service (ReDoS) (high)
- **GEN-SEC-032**: [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit: high; Axios Cross-Site Request Forgery Vulnerability (moderate); Server-Side Request Forgery in axios (high)
- **GEN-SEC-034**: [main-repo feature/feature-fixing-newdesign@27eb26c6]; npm audit totals: {"info":0,"low":1,"moderate":15,"high":48,"critical":3,"total":67}; CI gate: fail on high+
- **GEN-SEC-050**: Error: Content-Security-Policy: missing
- **GEN-SEC-051**: Error: X-Frame-Options / frame-ancestors: missing
- **GEN-SEC-052**: Error: Strict-Transport-Security: missing
- **GEN-SEC-053**: Error: X-Content-Type-Options: nosniff: missing
- **GEN-SEC-054**: Error: Referrer-Policy + Permissions-Policy: referrer-policy=∅; permissions-policy=∅
- **GEN-SEC-055**: No CSP <meta> in index.html and no CSP header (GEN-SEC-050) → app has no CSP at all; Error: no CSP meta fallback in index.html
- **GEN-SEC-061**: error: WebSocket connection to 'wss://98jahxhmj5.ap-south-1.awsapprunner.com/socket.io/?token=<jwt>&EIO=4&transport=webs; warning: WebSocket connection to 'wss://98jahxhmj5.ap-south-1.awsapprunner.com/socket.io/?token=<jwt>&EIO=4&transport=we; Error: token/PII in console

## Blocked: needs QA data writes

- **AD-SEC-004**: Needs an admin account missing a specific permission to prove URL access stays blocked when the sidebar link is hidden
- **GEN-SEC-042**: Writes a malicious doctor name/meta to a profile
- **GEN-SEC-043**: Uploads SVG/spoofed-MIME files
- **GEN-SEC-044**: Persists an XSS payload in profile/notes/ticket fields

## Manual, pending

- **GEN-SEC-011**: Idle timeout is 15 min (useIdleTimeout.js); full idle expiry is impractical to automate — verify by hand
- **GEN-SEC-064**: reCAPTCHA challenge cannot be automated; server-side OTP enforcement is covered by business-logic login tests

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
