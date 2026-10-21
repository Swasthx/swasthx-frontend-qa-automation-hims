// How each TC is executed. Any TC not listed here is `auto`: automated in this black-box
// repo against the QA deployment. Edit this file when a TC moves between buckets.
//
//   auto         automated here (Playwright vs QA)
//   auto+manual  automated check here, plus a human sign-off (e.g. NVDA, real device)
//   auto+main    black-box part automated here; the rest needs the source (React Profiler…)
//   manual       a person runs it; record the outcome in Test-case-csv/manual-results.csv
//   main         needs the product source/build/unit runner (Swasthx_HIP_Frontend)
//   needs-data   automatable, but creates/changes QA data; on hold until writes are approved

const m = (exec, reason) => ({ exec, reason });

export const EXECUTION_PLAN = {
  // ---- Web Vitals ----
  'PH-WV-010': m('main', 'Field data: web-vitals library in the app + RUM collector + real traffic'),
  'DOC-WV-010': m('main', 'Field data: web-vitals library in the app + RUM collector + real traffic'),
  'AD-WV-011': m('main', 'Field data: web-vitals library in the app + RUM collector + real traffic'),

  // ---- Business logic ----
  'PH-BIZ-004': m('needs-data', 'Creates a PAY_AT_COUNTER order on QA'),
  'PH-BIZ-005': m('needs-data', 'Creates an order twice to prove idempotency'),
  'PH-BIZ-007': m('needs-data', 'Needs a billed order to check invoiceReady gating (QA pharmacy queue empty)'),
  'GEN-BIZ-001': m('needs-data', 'Attempting a write without write-permission mutates data; needs a least-privilege account'),
  'GEN-BIZ-004': m('main', 'HPR_NOT_VERIFIED gate fires on six ABDM submit endpoints; needs the source to target one'),
  'GEN-BIZ-005': m('manual', 'Idle timeout is 15 min (useIdleTimeout.js) — impractical to automate; verify by hand'),
  'DOC-BIZ-001': m('needs-data', 'Appointment booking creates a payment entry / appointment'),
  'DOC-BIZ-002': m('needs-data', 'Saving a prescription record needs DOC_CONSULT_PATIENT_ID and writes a record'),
  'DIAG-BIZ-001': m('needs-data', 'Setting availability + attempting a booking mutates diagnostic schedule'),
  'DIAG-BIZ-002': m('needs-data', 'Test-to-doctor assignment mutates mappings'),
  'RCP-BIZ-001': m('needs-data', 'Token generation creates a reception token'),
  'AD-BIZ-001': m('manual', 'Open ServiceCatalogTaxModal, enter tax >100 / negative, confirm inline validation blocks save — quick manual check'),
  'AD-BIZ-002': m('main', 'Discount-tier overlap/caps are config logic — unit-test (DiscountTiers)'),
  'AD-BIZ-003': m('main', 'Token-policy rule validation is config logic — unit-test (TokenPolicy)'),
  'SA-BIZ-001': m('manual', 'Open Add/Edit Medicine modal, submit empty / negative price, confirm required-field + price>=0 validation — quick manual check'),
  'SA-BIZ-002': m('needs-data', 'Creating a coupon mutates rewards config'),

  // ---- Security ----
  'GEN-SEC-011': m('manual', 'Idle timeout is 15 min (useIdleTimeout.js); full idle expiry is impractical to automate — verify by hand'),
  'GEN-SEC-013': m('main', 'Architecture review of token storage (sessionStorage vs httpOnly cookie)'),
  'GEN-SEC-030': m('main', 'Dependency CVE: npm audit / snyk on package-lock'),
  'GEN-SEC-031': m('main', 'Dependency CVE: npm audit / snyk on package-lock'),
  'GEN-SEC-032': m('main', 'Dependency CVE: npm audit / snyk on package-lock'),
  'GEN-SEC-033': m('main', 'Dependency CVE: npm audit / snyk on package-lock'),
  'GEN-SEC-034': m('main', 'CI gate in the main repo pipeline'),
  'GEN-SEC-040': m('main', 'Source scan: ESLint react/no-danger + grep'),
  'AD-SEC-004': m('needs-data', 'Needs an admin account missing a specific permission to prove URL access stays blocked when the sidebar link is hidden'),
  'GEN-SEC-064': m('manual', 'reCAPTCHA challenge cannot be automated; server-side OTP enforcement is covered by business-logic login tests'),
  'GEN-SEC-042': m('needs-data', 'Writes a malicious doctor name/meta to a profile'),
  'GEN-SEC-043': m('needs-data', 'Uploads SVG/spoofed-MIME files'),
  'GEN-SEC-044': m('needs-data', 'Persists an XSS payload in profile/notes/ticket fields'),

  // ---- Accessibility ----
  'GEN-A11Y-005': m('auto+manual', 'Focus ring detected automatically; visual confirmation by a person'),
  'GEN-A11Y-012': m('manual', 'Status-message announcement needs a live toast + screen reader; no reliable persistent live region to assert at idle'),
  'GEN-A11Y-013': m('manual', 'aria-busy on loading states is transient and hard to catch reliably; verify by hand'),
  'AD-A11Y-005': m('auto+manual', 'Config modals must be opened to scan; page-level axe runs here, modal review by a person'),
  'AUTH-A11Y-002': m('manual', 'Invalid-input behaviour (inline error vs disabled submit) and its announcement need human judgement'),
  'GEN-A11Y-007': m('manual', 'Non-text contrast needs human judgement (TPGi CCA)'),
  'GEN-A11Y-009': m('auto+manual', 'Clipping/overlap detected automatically at 200%; readability by a person'),
  'GEN-A11Y-014': m('manual', 'Third-party Google Translate widget with NVDA'),
  'SA-A11Y-001': m('auto+manual', 'Text alternative presence automated; usefulness via NVDA'),
  'AD-A11Y-003': m('auto+manual', 'Keyboard drag attempted automatically; NVDA confirmation'),
  'AD-A11Y-004': m('auto+manual', 'Accessible names automated; context announcement via NVDA'),
  'RCP-A11Y-001': m('auto+manual', 'Keyboard + names automated; NVDA confirmation'),
  'RCP-A11Y-002': m('auto+manual', 'Live region presence automated; announcement via NVDA'),
  'DOC-A11Y-002': m('auto+manual', 'Role/name/value automated; NVDA confirmation'),
  'DOC-A11Y-003': m('auto+manual', 'Keyboard operation automated; NVDA confirmation'),
  'DOC-A11Y-004': m('auto+manual', 'Text alternative presence automated; usefulness via NVDA'),
  'DIAG-A11Y-001': m('auto+manual', 'Cell names automated; announcement via NVDA'),
  'DIAG-A11Y-002': m('auto+manual', 'Keyboard + live region automated; NVDA confirmation'),
  'PH-A11Y-001': m('auto+manual', 'Keyboard + names automated; NVDA confirmation'),
  'PH-A11Y-002': m('manual', 'PDF viewer readability with NVDA'),

  // ---- Recovery ----
  'RFT-OFF-003': m('manual', 'Socket reconnect + queue re-sync needs two live clients and real socket traffic'),
  'RFT-OFF-004': m('manual', 'Offline form submit with data retained needs an editable clinical form (consult/prescription)'),
  'RFT-OFF-006': m('manual', 'Razorpay checkout interrupted mid-payment (third-party sandbox)'),
  'RFT-OFF-007': m('manual', 'Intermittent-connectivity behaviour needs sustained real flaky network + human judgement'),
  'RFT-TMO-003': m('main', 'axios single-flight refresh + replay of the original request — unit-test the interceptor'),
  'RFT-TMO-005': m('main', 'Concurrent-401 single-flight refresh — unit-test the interceptor queue'),
  'RFT-TMO-007': m('needs-data', 'Creates an order to prove idempotent retry'),
  'RFT-TMO-008': m('needs-data', 'Submits a real write under slow network'),
  'RFT-TMO-010': m('main', 'HPR_NOT_VERIFIED gate fires on six ABDM-backed submit endpoints; needs the source to target one reliably'),
  'RFT-CRA-001': m('main', 'Requires throwing inside a child component to exercise the ErrorBoundary'),
  'RFT-CRA-004': m('manual', 'Tab background/resume → socket rejoin; needs real backgrounding + socket traffic'),
  'RFT-CRA-005': m('manual', 'Unsaved-form warning needs an editable clinical form with dirty state'),
  'RFT-CRA-006': m('main', 'ErrorBoundary reset path is reachable only after injecting a render error (see RFT-CRA-001)'),
  'RFT-CRA-007': m('main', 'No code-splitting on the current build (single bundle, BND-010..015), so there are no lazy chunks to fail — revisit after code-splitting lands'),
  'RFT-CRA-008': m('manual', 'Long-session soak test (many navigations over time) — run by hand / in a soak harness'),

  // ---- API contract ----
  'GEN-API-003': m('main', 'Exact 403 errorCode enum can only be forced with mocked responses (MSW) in the app test env'),
  'GEN-API-004': m('main', 'HPR_NOT_VERIFIED 403 shape needs a mocked gated response (MSW)'),
  'GEN-API-005': m('main', 'Refresh-once-and-replay interceptor behaviour is a unit test (MSW); see RFT-TMO-003/006'),
  'GEN-API-013': m('main', 'Generic 400 validation-error shape needs mocked responses per form (MSW)'),
  'PH-API-002': m('needs-data', 'POST creates a PHR order'),
  'DOC-API-001': m('needs-data', 'POST creates a payment entry'),
  'DIAG-API-001': m('needs-data', 'POST creates a payment entry'),
  'SA-API-001': m('needs-data', 'POST creates a medicine'),
  'SA-API-002': m('needs-data', 'PUT updates a medicine'),
  'GEN-API-010': m('needs-data', 'POST registers a patient'),
  'GEN-API-011': m('needs-data', 'Creates a Razorpay order (third party)'),

  // ---- Runtime performance ----
  'SA-RUN-001': m('main', 'React Profiler commit duration'),
  'SA-RUN-003': m('auto+main', 'INP + debounce (API call count) here; re-render scope via React Profiler'),
  'AD-RUN-003': m('main', 'React Profiler commit duration / layout thrash'),
  'AD-RUN-004': m('auto+manual', 'dnd-kit drag FPS: scripted drag is unreliable; measure here, confirm smoothness by hand'),
  'AD-RUN-005': m('main', 'Re-render scope (React Profiler + why-did-you-render)'),
  'RCP-RUN-001': m('auto+manual', 'Live-queue load (20 socket events/s) cannot be driven black-box; observe responsiveness manually'),
  'RCP-RUN-003': m('auto+main', 'Debounce (API call count) here; re-render scope via React Profiler'),
  'DOC-RUN-002': m('main', 'Re-render scope (React Profiler)'),
  'DOC-RUN-004': m('auto+manual', 'Live-queue load (20 socket events/s) cannot be driven black-box'),
  'DOC-RUN-005': m('main', 'React Profiler commit duration'),
  'DIAG-RUN-001': m('auto+manual', 'Live-queue load (20 socket events/s) cannot be driven black-box'),
  'DIAG-RUN-003': m('main', 'Re-render scope (React Profiler)'),
  'PH-RUN-001': m('auto+manual', 'Live-queue load (20 socket events/s) cannot be driven black-box'),
  'PH-RUN-003': m('needs-data', 'Opening an invoice needs a billed order; QA pharmacy queue is currently empty'),
  'DOC-RUN-001': m('needs-data', 'Consult workspace needs DOC_CONSULT_PATIENT_ID'),
  'DOC-RUN-006': m('needs-data', 'Consult workspace needs DOC_CONSULT_PATIENT_ID'),
  'GEN-RUN-003': m('main', 'Duplicate socket listeners on reconnect — inspect listener registration in source / unit test'),

  // ---- Compatibility ----
  'CMPT-001': m('manual', 'Real OTP + reCAPTCHA login on each browser/OS'),
  'CMPT-013': m('needs-data', 'Opening an invoice PDF needs a billed order; QA pharmacy queue is empty'),
  'CMPT-018': m('manual', 'Facility map (leaflet) screen location unconfirmed; verify tiles/markers by hand'),
  'CMPT-020': m('auto+manual', 'Download automated where data exists; the native print dialog is manual'),
  'CMPT-022': m('manual', 'Google Translate widget behaviour is a manual visual check'),
  'CMPT-024': m('manual', 'Idle timeout is 15 min (useIdleTimeout.js); impractical to automate across browsers — verify by hand'),
  'CMPT-010': m('manual', 'Minimum-supported browser versions (BrowserStack)'),
  'CMPT-012': m('manual', 'Real Safari private mode / ITP. NOTE: WebKit already blocks the cross-origin API + socket calls "due to access control checks" — confirm the backend sends correct CORS headers for Safari and that ITP does not break the session'),
  'CMPT-014': m('manual', 'HEIC upload from a real iOS/Android device'),
  'CMPT-015': m('manual', 'Real Safari codecs (Playwright WebKit lacks proprietary codecs)'),
  'CMPT-019': m('auto+manual', 'Emulated iPhone on WebKit here; real iPhone/iPad by a person'),
  'CMPT-020': m('auto+manual', 'Download automated; native print dialog by a person'),
  'CMPT-021': m('manual', 'reCAPTCHA challenge cannot be automated'),
  'CMPT-025': m('auto+manual', 'Emulated phones here; real Android/iOS by a person'),

  // ---- UI/UX ----
  'GEN-UX-001': m('manual', 'Loading-indicator timing (<100ms) and result feedback need human judgement'),
  'GEN-UX-002': m('auto+manual', 'Toast consistency automated; wording judged by a person'),
  'GEN-UX-003': m('manual', 'Destructive-action confirm modal needs triggering a delete/deactivate (mutating) — verify by hand'),
  'GEN-UX-006': m('manual', 'Inline form errors + data retention need a full invalid-submit flow per form'),
  'GEN-UX-009': m('manual', 'Deferred — desktop/web scope only for now (mobile/tablet responsive out of scope)'),
  'GEN-UX-010': m('manual', 'Double-submit guard needs a real submit flow (mutating) — verify by hand'),
  'GEN-UX-007': m('manual', 'Design comparison against Figma'),
  'PH-UX-001': m('auto+manual', 'Options/inline blocking automated; clarity judged by a person'),
  'DOC-UX-001': m('manual', 'Heuristic review of prescription efficiency'),
  'DOC-UX-002': m('manual', 'Heuristic review of slot selection'),
  'RCP-UX-001': m('manual', 'Heuristic review of token status visibility'),
  'DIAG-UX-001': m('manual', 'Heuristic review of availability grid'),
  'AD-UX-001': m('auto+manual', 'Validation/confirm automated (no save); guidance judged by a person'),
  'SA-UX-001': m('manual', 'Heuristic review of analytics dashboards'),

  // ---- Visual regression ---- (populated screens need a mocked/seeded dataset; QA data is empty/volatile)
  'SA-VIS-001': m('needs-data', 'HospitalAnalytics charts need a stable dataset to baseline (mock the analytics API)'),
  'AD-VIS-001': m('needs-data', 'AuditLog "20 rows" needs a fixed dataset (mock the audit API)'),
  'DOC-VIS-001': m('needs-data', 'ConsultWorkspace needs DOC_CONSULT_PATIENT_ID + a populated form'),
  'DOC-VIS-002': m('needs-data', 'DoctorDashboard charts need a stable dataset'),
  'RCP-VIS-001': m('needs-data', 'ReceptionQueue populated list needs a fixed dataset (mock the queue API)'),
  'DIAG-VIS-001': m('needs-data', 'DiagnosticQueue populated list needs a fixed dataset'),
  'PH-VIS-001': m('needs-data', 'PharmacyQueue populated list needs a fixed dataset; QA queue is empty'),
  'PH-VIS-002': m('needs-data', 'InvoiceModal needs a billed order'),

  // ---- Bundle-size ----
  'BND-033': m('main', 'Tree-shaking needs source maps (not published on QA)'),
  'BND-034': m('main', 'Architecture justification for two state libraries'),
  'BND-040': m('main', 'Tree-shaking needs source maps (not published on QA)'),
  'BND-041': m('main', 'Tree-shaking needs source maps (not published on QA)'),
  'BND-042': m('main', 'Locale stripping needs source maps (not published on QA)'),
};

// Component/unit testing needs the product's own test runner (Vitest + RTL): every TC is main.
export const MAIN_ONLY_CATEGORIES = ['component-unit'];

export function executionFor(categoryKey, tcId) {
  if (MAIN_ONLY_CATEGORIES.includes(categoryKey)) return m('main', 'Component/unit test: Vitest + React Testing Library in the main repo');
  return EXECUTION_PLAN[tcId] ?? m('auto', '');
}
