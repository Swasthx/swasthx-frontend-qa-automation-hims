import { test, expect } from '../../fixtures/auth.fixture.js';
import { apiUrl } from '../../fixtures/app-map.js';
import { ROLE_KEYS } from '../../fixtures/roles.js';
import { loadBundle, withRoleLock } from '../../utils/session.js';
import { apiLogin, refreshLogin, hasCreds } from '../../utils/login.js';
import { recordTc, tc } from '../../utils/tc.js';

const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
const INTERNAL_MED_FIELDS = ['cost', 'costPrice', 'purchasePrice', 'margin', 'supplier', 'vendor', 'stock', 'batch', 'profit'];
const GATEWAY = [502, 503, 504];

// QA's gateway flaps (502/504 at ~29s, then 200 in <1s). Retry a few times with a long timeout;
// only when every attempt is a gateway error / connection failure do we record ERROR (environment)
// rather than a contract FAIL. Returns the Playwright response, or null when the gateway is down.
async function resilient(fn, testInfo, label) {
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fn();
      if (!GATEWAY.includes(res.status())) return res;
      last = `${res.status()}`;
    } catch (e) {
      last = e.message.split('\n')[0];
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  recordTc(testInfo, { status: 'ERROR', notes: [`QA gateway unavailable for ${label} after 4 tries (last: ${last}) — environment degraded; re-run when healthy`] });
  test.skip(true, `QA gateway down: ${label}`);
}
const get = (api, url, testInfo, label, opts = {}) => resilient(() => api.get(url, { timeout: 60000, failOnStatusCode: false, ...opts }), testInfo, label);
const post = (api, url, data, testInfo, label) => resilient(() => api.post(url, { data, timeout: 60000, failOnStatusCode: false }), testInfo, label);
const permsArray = (s) => {
  try {
    return Array.isArray(JSON.parse(s.permissions));
  } catch {
    return false;
  }
};

test.describe('API contract (live endpoints)', () => {
  test('GEN-API-001 session bundle has token+refreshToken+role+permissions', tc('GEN-API-001'), async ({}, testInfo) => {
    const missing = [];
    for (const role of ROLE_KEYS) {
      const b = loadBundle(role);
      if (!b?.session) continue;
      const s = b.session;
      if (!s.token || !s.refreshToken || !s.role || !permsArray(s)) missing.push(`${role}: token=${!!s.token} refresh=${!!s.refreshToken} role=${!!s.role} permsArray=${permsArray(s)}`);
    }
    recordTc(testInfo, { notes: missing.length ? missing : ['All cached role sessions carry token, refreshToken, role and an array permissions'] });
    expect(missing, `login contract violations:\n${missing.join('\n')}`).toEqual([]);
  });

  test('GEN-API-002 refresh response carries token+refreshToken+role+permissions', tc('GEN-API-002'), async ({}, testInfo) => {
    test.skip(!hasCreds('reception'), 'no reception creds');
    test.setTimeout(120_000);
    let next;
    try {
      next = await withRoleLock('reception', async () => refreshLogin('reception', await apiLogin('reception')));
    } catch (e) {
      if (/50[234]|timed out|ECONN/i.test(e.message)) {
        recordTc(testInfo, { status: 'ERROR', notes: [`QA gateway unavailable during login/refresh (${e.message.split('\n')[0]})`] });
        test.skip(true, 'QA gateway down');
      }
      throw e;
    }
    const s = next.session;
    recordTc(testInfo, { notes: [`token=${!!s.token} refreshToken=${!!s.refreshToken} role=${s.role} permissions=array(${permsArray(s)})`] });
    expect(!!s.token && !!s.refreshToken && !!s.role && permsArray(s), 'refresh response missing a required field').toBe(true);
  });

  test('PH-API-003 phr/medicines returns a paginated, patient-safe list', tc('PH-API-003'), async ({ apiAs }, testInfo) => {
    const res = await get(await apiAs('pharmacy'), apiUrl(`/pharmacy/phr/medicines?hospitalId=${process.env.HOSPITAL_ID}&page=1&limit=10`), testInfo, 'phr/medicines');
    const json = await res.json();
    const items = json.data ?? json.items ?? [];
    const leaked = items.length ? INTERNAL_MED_FIELDS.filter((f) => f in items[0]) : [];
    recordTc(testInfo, { measured: `${res.status()} · ${items.length} items · pagination=${!!json.pagination}`, notes: [leaked.length ? `Internal fields exposed: ${leaked.join(', ')}` : 'Only patient-safe fields', `sample keys: ${items[0] ? Object.keys(items[0]).join(',') : 'none'}`] });
    expect(res.status()).toBe(200);
    expect(Array.isArray(items), 'medicines not an array').toBe(true);
    expect(json.pagination ?? json.page ?? json.total, 'no pagination envelope').toBeTruthy();
    expect(leaked, `exposes internal fields: ${leaked.join(', ')}`).toEqual([]);
  });

  test('PH-API-001 phr/quote returns numeric totals (total = subtotal + gst)', tc('PH-API-001'), async ({ apiAs }, testInfo) => {
    const api = await apiAs('pharmacy');
    const medsRes = await get(api, apiUrl(`/pharmacy/phr/medicines?hospitalId=${process.env.HOSPITAL_ID}&page=1&limit=5`), testInfo, 'phr/medicines');
    const meds = (await medsRes.json()).data ?? [];
    test.skip(!meds.length, 'no medicines to quote');
    const medId = meds[0].medicineId ?? meds[0].id;
    let json = null;
    let used = null;
    for (const body of [{ hospitalId: process.env.HOSPITAL_ID, lines: [{ medId, qty: 2 }] }, { hospitalId: process.env.HOSPITAL_ID, lines: [{ medicineId: medId, quantity: 2 }] }, { hospitalId: process.env.HOSPITAL_ID, items: [{ medicineId: medId, quantity: 2 }] }]) {
      const res = await post(api, apiUrl('/pharmacy/phr/quote'), body, testInfo, 'phr/quote');
      if (res.ok()) {
        const j = await res.json();
        json = j.data ?? j;
        used = body;
        break;
      }
    }
    if (!json) {
      recordTc(testInfo, { status: 'ERROR', notes: ['No 200 from /pharmacy/phr/quote with known body shapes; confirm the request contract'] });
      throw new Error('quote: no accepted body shape');
    }
    const subtotal = json.subtotal ?? json.subTotal;
    const gst = json.gstTotal ?? json.gst ?? json.gstAmount;
    const total = json.totalAmount ?? json.total;
    recordTc(testInfo, { measured: `subtotal=${subtotal} gst=${gst} total=${total}`, notes: [`body: ${JSON.stringify(used)}`] });
    expect(isNum(subtotal) && isNum(gst) && isNum(total), `non-numeric amounts: ${JSON.stringify({ subtotal, gst, total })}`).toBe(true);
    expect(total, 'totalAmount ≠ subtotal + gstTotal').toBeCloseTo(subtotal + gst, 2);
  });

  test('PH-API-006 pharmacy payments returns an array', tc('PH-API-006'), async ({ apiAs }, testInfo) => {
    const res = await get(await apiAs('pharmacy'), apiUrl('/pharmacy/payment/getAllPaymentsDetails'), testInfo, 'pharmacy payments');
    const json = await res.json().catch(() => ({}));
    const arr = json.data ?? json.payments ?? json;
    recordTc(testInfo, { measured: `${res.status()} · ${Array.isArray(arr) ? arr.length + ' rows' : typeof arr}` });
    expect(res.status()).toBe(200);
    expect(Array.isArray(arr), 'payments payload is not an array').toBe(true);
  });

  test('PH-API-005 /pharmacy/medicines returns an array', tc('PH-API-005'), async ({ apiAs }, testInfo) => {
    const res = await get(await apiAs('pharmacy'), apiUrl('/pharmacy/medicines'), testInfo, 'pharmacy/medicines', { headers: { 'swasthx-hip-id': process.env.HOSPITAL_ID } });
    const json = await res.json().catch(() => ({}));
    const arr = json.data ?? json;
    recordTc(testInfo, { measured: `${res.status()} · ${Array.isArray(arr) ? arr.length + ' rows' : JSON.stringify(json).slice(0, 60)}`, notes: res.status() >= 500 ? ['Endpoint returns a server error for the pharmacy role — the UI medicine list would be empty/broken'] : [] });
    expect(res.status(), `/pharmacy/medicines returned ${res.status()}`).toBe(200);
    expect(Array.isArray(arr), 'medicines payload is not an array').toBe(true);
  });

  test('DIAG-API-002 diagnostic payments returns an array', tc('DIAG-API-002'), async ({ apiAs }, testInfo) => {
    const res = await get(await apiAs('diagnostic'), apiUrl('/diagnostic/payment/getAllPaymentsDetails'), testInfo, 'diagnostic payments');
    const json = await res.json().catch(() => ({}));
    const arr = json.data ?? json.payments ?? (Array.isArray(json) ? json : null);
    recordTc(testInfo, { measured: `${res.status()} · ${Array.isArray(arr) ? arr.length + ' rows' : 'no array'}`, notes: res.status() === 250 ? ['Returns non-standard HTTP 250 with {message} and no data array'] : res.status() === 404 ? ['404 — no payments for this diagnostic account / wrong scope'] : [] });
    expect(res.status(), `expected 200, got ${res.status()}`).toBe(200);
    expect(Array.isArray(arr), 'payments payload is not an array').toBe(true);
  });

  test('PH-API-004 phr order invoice exposes a readiness flag', tc('PH-API-004'), async ({ apiAs }, testInfo) => {
    const { HOSPITAL_ID: hospitalId, PH_PHR_ORDER_ID: orderId, PH_PHR_ORDER_PATIENT_ID: patientId } = process.env;
    test.skip(!orderId || !patientId, 'Seed missing: PH_PHR_ORDER_ID + PH_PHR_ORDER_PATIENT_ID');
    const res = await get(await apiAs('pharmacy'), apiUrl(`/pharmacy/phr/orders/${orderId}/invoice?hospitalId=${hospitalId}&patientId=${encodeURIComponent(patientId)}`), testInfo, 'phr order invoice');
    if (res.status() === 404) {
      recordTc(testInfo, { status: 'NOT RUN', notes: ['Seeded order id not present on QA; set a current PH_PHR_ORDER_ID'] });
      test.skip(true, 'seed order not on QA');
    }
    const json = await res.json().catch(() => ({}));
    const body = json.data ?? json;
    const flag = body.invoiceReady ?? body.invoiceUrl ?? body.invoiceFhirId;
    recordTc(testInfo, { measured: `${res.status()} · keys=${Object.keys(body).slice(0, 8).join(',')}` });
    expect(res.status()).toBe(200);
    expect(flag !== undefined, 'no invoiceReady/invoiceUrl/invoiceFhirId to gate the download button').toBe(true);
  });

  test('GEN-API-012 list endpoints share a consistent envelope', tc('GEN-API-012'), async ({ apiAs }, testInfo) => {
    const api = await apiAs('pharmacy');
    const endpoints = [`/pharmacy/phr/medicines?hospitalId=${process.env.HOSPITAL_ID}&page=1&limit=5`, '/pharmacy/payment/getAllPaymentsDetails'];
    const shapes = [];
    for (const e of endpoints) {
      const res = await get(api, apiUrl(e), testInfo, e.split('?')[0]);
      const json = await res.json().catch(() => ({}));
      shapes.push({ e: e.split('?')[0], status: res.status(), arrayUnderData: Array.isArray(json.data), bareArray: Array.isArray(json) });
    }
    recordTc(testInfo, { notes: shapes.map((s) => `${s.e}: ${s.status} arrayUnderData=${s.arrayUnderData} bare=${s.bareArray}`) });
    expect(shapes.every((s) => s.arrayUnderData) || shapes.every((s) => s.bareArray), 'list endpoints mix envelope styles').toBe(true);
  });
});
