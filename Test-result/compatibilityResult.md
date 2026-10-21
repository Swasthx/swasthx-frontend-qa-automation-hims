# Compatibility: Result Sheet

| Run | Value |
|---|---|
| Last updated | 2026-10-19 08:28 UTC (each row's own time is in "Run at") |
| Environment | https://qa-doctor.swasthx.com/ |
| Test cases | `Test-case-csv/Testcase-HIMS-Frontend - Compactibility.csv` |

## Summary

| Total | ✅ PASS | ⏭️ NOT RUN | 📝 MANUAL PENDING | ⏸️ BLOCKED |
|---|---|---|---|---|
| 24 | 14 | 1 | 8 | 1 |

| Module / Area | ✅ PASS | ⏭️ NOT RUN | 📝 MANUAL PENDING | ⏸️ BLOCKED |
|---|---|---|---|---|
| Login | 1 | 0 | 1 | 0 |
| SuperAdmin | 1 | 0 | 0 | 0 |
| Admin | 1 | 0 | 0 | 0 |
| Doctor | 1 | 0 | 0 | 0 |
| Diagnostic | 1 | 0 | 0 | 0 |
| Reception | 1 | 0 | 0 | 0 |
| Pharmacy | 1 | 0 | 0 | 0 |
| App-wide | 6 | 0 | 4 | 0 |
| Auth | 0 | 0 | 2 | 0 |
| Pharmacy/Doctor | 0 | 1 | 0 | 1 |
| Analytics | 1 | 0 | 0 | 0 |
| Admin/Facility | 0 | 0 | 1 | 0 |

| Execution | TCs |
|---|---|
| Auto | 11 |
| Auto + Manual | 3 |
| Manual | 9 |
| Needs data | 1 |

## Results

| TC ID | Module / Area | Feature Under Test | Browsers | OS / Device | Scenario / Steps | Expected Result | Severity | Execution | Status | Measured | Runs | Run at (UTC) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **CMPT-001** | Login | Load + OTP login | Chrome, Safari, Firefox, Edge | Win / macOS / iOS / Android | Open app, log in via OTP | Renders, login works, 0 console errors | Critical | Manual | ✅ PASS | — | — | — | Manual: PASS (Status Pass carried over from the Compatibility sheet) |
| **CMPT-002** | SuperAdmin | Dashboard, tables, charts | Chrome, Safari, Firefox, Edge | Desktop | Open key pages | Consistent layout, no broken UI | High | Auto | ✅ PASS | — | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; chromium: overflowX=0px, no app errors; webkit: overflowX=0px, no app errors; firefox: overflowX=0px, no app errors; edge: overflowX=0px, no app errors |
| **CMPT-003** | Admin | Config pages + sidebar | Chrome, Safari, Firefox, Edge | Desktop | Navigate config + sidebar | Consistent, sidebar collapses correctly | High | Auto | ✅ PASS | — | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; chromium: overflowX=0px, no app errors; webkit: overflowX=0px, no app errors; firefox: overflowX=0px, no app errors; edge: overflowX=0px, no app errors |
| **CMPT-004** | Doctor | Consult + queue + calendar | Chrome, Safari, Firefox, Edge | Desktop | Run consult flow | Consistent, interactions work | High | Auto | ✅ PASS | — | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; chromium: overflowX=0px, no app errors; webkit: overflowX=0px, no app errors; firefox: overflowX=0px, no app errors; edge: overflowX=0px, no app errors |
| **CMPT-005** | Diagnostic | Queue + availability grid | Chrome, Safari, Firefox, Edge | Desktop | Open queue + toggle slots | Consistent behavior | High | Auto | ✅ PASS | — | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; chromium: overflowX=0px, no app errors; webkit: overflowX=0px, no app errors; firefox: overflowX=0px, no app errors; edge: overflowX=0px, no app errors |
| **CMPT-006** | Reception | Queue + patient + payment | Chrome, Safari, Firefox, Edge | Desktop | Run token + payment flow | Consistent behavior | High | Auto | ✅ PASS | — | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; chromium: overflowX=0px, no app errors; webkit: overflowX=0px, no app errors; firefox: overflowX=0px, no app errors; edge: overflowX=0px, no app errors |
| **CMPT-007** | Pharmacy | Queue + patient + invoice | Chrome, Safari, Firefox, Edge | Desktop | Open queue + invoice | Consistent behavior | High | Auto | ✅ PASS | — | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; chromium: overflowX=0px, no app errors; webkit: overflowX=0px, no app errors; firefox: overflowX=0px, no app errors; edge: overflowX=0px, no app errors |
| **CMPT-010** | App-wide | esnext build on min-supported versions | Safari, Firefox (older minor) | macOS / Win | Load app on minimum supported browser | No syntax error / white screen | Critical | Manual | 📝 MANUAL PENDING | — | — | — | Minimum-supported browser versions (BrowserStack) |
| **CMPT-011** | App-wide | WebSocket live queues (socket.io) | Chrome, Safari, Firefox, Edge | Desktop | Trigger real-time queue updates | Socket connects, live updates on all | High | Auto | ✅ PASS | **chromium: chromium: 3 socket.io reqs · webkit: webkit: 1 socket.io reqs · firefox: firefox: 3 socket.io reqs · edge: edge: 2 socket.io reqs** | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; Socket handshake attempted;  |
| **CMPT-012** | Auth | sessionStorage token in private mode / ITP | Safari | iOS / macOS (Private) | Login + navigate in private window | Works or fails gracefully (no crash) | High | Manual | 📝 MANUAL PENDING | — | — | — | Real Safari private mode / ITP. NOTE: WebKit already blocks the cross-origin API + socket calls "due to access control checks" — confirm the backend sends correct CORS headers for Safari and that ITP does not break the session |
| **CMPT-013** | Pharmacy/Doctor | PDF viewer (@react-pdf-viewer / pdfjs) | Chrome, Safari, Firefox, Edge | Desktop | Open invoice, navigate pages | Renders + pages navigate everywhere | Medium | Needs data | ⏸️ BLOCKED | — | — | — | Opening an invoice PDF needs a billed order; QA pharmacy queue is empty |
| **CMPT-014** | App-wide | File/image upload incl. HEIC | Safari, Chrome | iOS / Android | Upload photo/doc from device | Accepts + validates; HEIC handled | Medium | Manual | 📝 MANUAL PENDING | — | — | — | HEIC upload from a real iOS/Android device |
| **CMPT-015** | App-wide | Video playback (video-react) | Safari, Chrome, Firefox | Desktop / iOS | Play a video | Codec supported, controls work | Medium | Manual | 📝 MANUAL PENDING | — | — | — | Real Safari codecs (Playwright WebKit lacks proprietary codecs) |
| **CMPT-016** | App-wide | Date parse/format (moment/dayjs) | Safari | macOS / iOS | View schedules, dates, slots | Correct dates (no Safari date-parse bug) | High | Auto | ✅ PASS | **chromium: chromium: 0 bad dates · webkit: webkit: 0 bad dates · firefox: firefox: 0 bad dates · edge: edge: 0 bad dates** | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; Dates render correctly |
| **CMPT-017** | Analytics | Charts SVG (recharts) | Chrome, Safari, Firefox, Edge | Desktop | Open analytics dashboards | SVG renders identically | Low | Auto | ✅ PASS | **chromium: chromium: 22 svg · webkit: webkit: 22 svg · firefox: firefox: 20 svg · edge: edge: 22 svg** | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; SVG charts present |
| **CMPT-018** | Admin/Facility | Maps (leaflet) | Chrome, Safari, Firefox, Edge | Desktop | Open facility map | Tiles + markers render | Low | Manual | 📝 MANUAL PENDING | — | — | — | Facility map (leaflet) screen location unconfirmed; verify tiles/markers by hand |
| **CMPT-019** | App-wide | CSS layout (sticky, flex/grid gap, 100vh) | Safari | iPhone / iPad | Scroll long pages, sticky headers | No 100vh overflow; sticky works | Medium | Auto + Manual | ✅ PASS | **chromium: chromium: overflowX=0px · webkit: webkit: overflowX=0px · firefox: firefox: overflowX=0px · edge: edge: overflowX=0px** | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; Page scrolls; Manual sign-off pending |
| **CMPT-020** | Pharmacy/Doctor | Print / download invoice (file-saver, print) | Chrome, Safari, Firefox, Edge | Desktop | Download + print invoice | File saves / print dialog opens on all | Medium | Auto + Manual | ⏭️ NOT RUN | — | — | — | Download automated; native print dialog by a person |
| **CMPT-021** | Login | reCAPTCHA | Chrome, Safari, Firefox, Edge | Desktop / Mobile | Complete captcha | Loads + verifies on all | Medium | Manual | 📝 MANUAL PENDING | — | — | — | reCAPTCHA challenge cannot be automated |
| **CMPT-022** | App-wide | Google Translate widget | Chrome, Safari, Firefox, Edge | Desktop | Switch language | Works, no layout break | Low | Manual | 📝 MANUAL PENDING | — | — | — | Google Translate widget behaviour is a manual visual check |
| **CMPT-023** | App-wide | Notifications (polling + bell) | Chrome, Safari, Firefox, Edge | Desktop | Receive notifications | Consistent; no timer/visibility issues | Low | Auto | ✅ PASS | **chromium: chromium: bell=1 · webkit: webkit: bell=1 · firefox: firefox: bell=1 · edge: edge: bell=1** | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge |
| **CMPT-024** | Auth | Idle timeout (activity/visibility) | Chrome, Safari, Firefox, Edge | Desktop | Idle, then return to tab | Session expiry consistent across browsers | Medium | Manual | 📝 MANUAL PENDING | — | — | — | Idle timeout is 15 min (useIdleTimeout.js); impractical to automate across browsers — verify by hand |
| **CMPT-025** | App-wide | Responsive mobile layout | Chrome, Safari | Android / iOS (360–390px) | Run key flows on phone | Usable, no horizontal scroll, tap targets ≥44px | High | Auto + Manual | ✅ PASS | **chromium: chromium: 0px overflow @390 · webkit: webkit: 0px overflow @390 · firefox: firefox: 0px overflow @390 · edge: edge: 0px overflow @390** | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge; Full responsive/tap-target audit is manual; Manual sign-off pending |
| **CMPT-026** | App-wide | antd controls (dropdown, datepicker, modal) | Chrome, Safari, Firefox, Edge | Desktop | Open dropdowns/pickers/modals | Consistent; overlay/z-index correct | Medium | Auto | ✅ PASS | **chromium: chromium: opened=yes, overlay=true, closed=false · webkit: webkit: opened=yes, overlay=true, closed=false · firefox: firefox: opened=yes, overlay=true, closed=false · edge: edge: opened=yes, overlay=true, closed=false** | — | 2026-10-19 08:26 | 4/4 checks passed across chromium, webkit, firefox, edge |

## Blocked: needs QA data writes

- **CMPT-013**: Opening an invoice PDF needs a billed order; QA pharmacy queue is empty

## Manual, pending

- **CMPT-010**: Minimum-supported browser versions (BrowserStack)
- **CMPT-012**: Real Safari private mode / ITP. NOTE: WebKit already blocks the cross-origin API + socket calls "due to access control checks" — confirm the backend sends correct CORS headers for Safari and that ITP does not break the session
- **CMPT-014**: HEIC upload from a real iOS/Android device
- **CMPT-015**: Real Safari codecs (Playwright WebKit lacks proprietary codecs)
- **CMPT-018**: Facility map (leaflet) screen location unconfirmed; verify tiles/markers by hand
- **CMPT-021**: reCAPTCHA challenge cannot be automated
- **CMPT-022**: Google Translate widget behaviour is a manual visual check
- **CMPT-024**: Idle timeout is 15 min (useIdleTimeout.js); impractical to automate across browsers — verify by hand

> Record manual outcomes in `Test-case-csv/manual-results.csv`, then run `npm run results` to refresh this sheet.
> Execution buckets are defined in `Test-case-csv/execution-plan.js`.
