import { test, expect } from '../../fixtures/auth.fixture.js';
import { API, apiUrl } from '../../fixtures/app-map.js';
import { recordTc, tc } from '../../utils/tc.js';

const GATEWAY = [502, 503, 504];
// QA gateway flaps; retry a few times and record ERROR (environment) only if every try is a gateway error.
async function resilient(fn, testInfo, label) {
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fn();
      if (!GATEWAY.includes(res.status())) return res;
      last = String(res.status());
    } catch (e) {
      last = e.message.split('\n')[0];
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  recordTc(testInfo, { status: 'ERROR', notes: [`QA gateway unavailable for ${label} (last: ${last}) — re-run when healthy`] });
  test.skip(true, `QA gateway down: ${label}`);
}
const INTERNAL_MED_FIELDS = ['cost', 'costPrice', 'purchasePrice', 'margin', 'supplier', 'vendor', 'stock', 'composition', 'batch', 'profit'];
const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);

test.describe('Business logic — Pharmacy / Payment', () => {
  // PH-BIZ-001 / GEN-BIZ-006: the quote is authoritative — total = subtotal + gst (− discount).
  test('PH-BIZ-001 quote: total = subtotal + gstTotal', { annotation: [{ type: 'tc', description: 'PH-BIZ-001' }, { type: 'tc', description: 'GEN-BIZ-006' }] }, async ({ apiAs }, testInfo) => {
    const api = await apiAs('pharmacy');
    const medsRes = await resilient(() => api.get(apiUrl(`/pharmacy/phr/medicines?hospitalId=${process.env.HOSPITAL_ID}&page=1&limit=5`), { timeout: 60000, failOnStatusCode: false }), testInfo, 'phr/medicines');
    const meds = (await medsRes.json()).data ?? [];
    test.skip(!meds.length, 'no medicines to quote');
    const medId = meds[0].medicineId ?? meds[0].id;
    const res = await resilient(() => api.post(apiUrl('/pharmacy/phr/quote'), { data: { hospitalId: process.env.HOSPITAL_ID, lines: [{ medicineId: medId, quantity: 3 }] }, timeout: 60000, failOnStatusCode: false }), testInfo, 'phr/quote');
    const j = await res.json();
    const q = j.data ?? j;
    const subtotal = q.subtotal ?? q.subTotal;
    const gst = q.gstTotal ?? q.gst ?? q.gstAmount;
    const discount = q.discount ?? q.discountTotal ?? 0;
    const total = q.totalAmount ?? q.total;
    recordTc(testInfo, { measured: `subtotal=${subtotal} gst=${gst} discount=${discount} total=${total}`, notes: ['total should equal subtotal + gst − discount'] });
    expect(isNum(subtotal) && isNum(gst) && isNum(total), `non-numeric: ${JSON.stringify(q)}`).toBe(true);
    expect(total, 'total ≠ subtotal + gst − discount').toBeCloseTo(subtotal + gst - (isNum(discount) ? discount : 0), 2);
  });

  // PH-BIZ-002: a PREPAID booking with no payment block is rejected before anything is persisted.
  test('PH-BIZ-002 PREPAID without payment block is rejected', tc('PH-BIZ-002'), async ({ request }, testInfo) => {
    test.skip(!process.env.HOSPITAL_ID, 'Seed missing: HOSPITAL_ID');
    const res = await resilient(() => request.post(apiUrl(API.diagnostic.phrBookings), {
      data: { hospitalId: process.env.HOSPITAL_ID, collectionMode: 'labTest', paymentType: 'PREPAID', patient: { name: 'QA Automation', phone: '0000000000' }, items: [{ testId: 'qa-placeholder', slotTime: new Date(Date.now() + 86400000).toISOString() }] },
      timeout: 60000, failOnStatusCode: false,
    }), testInfo, 'phr/bookings PREPAID');
    const textBody = await res.text();
    recordTc(testInfo, { measured: `${res.status()}`, notes: ['PREPAID requires a payment block; rejected before persist', textBody.slice(0, 120)] });
    expect(res.status(), `expected 4xx rejection, got ${res.status()}`).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  // PH-BIZ-003: homeTest + pay-at-counter is rejected with HOME_REQUIRES_PREPAID (shared booking rule).
  test('PH-BIZ-003 homeTest + counter is rejected (HOME_REQUIRES_PREPAID)', tc('PH-BIZ-003'), async ({ request }, testInfo) => {
    test.skip(!process.env.HOSPITAL_ID, 'Seed missing: HOSPITAL_ID');
    const res = await resilient(() => request.post(apiUrl(API.diagnostic.phrBookings), {
      data: { hospitalId: process.env.HOSPITAL_ID, collectionMode: 'homeTest', paymentType: 'PAY_AT_RECEPTION', patient: { name: 'QA Automation', phone: '0000000000' }, items: [{ testId: 'qa-placeholder', slotTime: new Date(Date.now() + 86400000).toISOString() }] },
      timeout: 60000, failOnStatusCode: false,
    }), testInfo, 'phr/bookings homeTest');
    const textBody = await res.text();
    recordTc(testInfo, { measured: `${res.status()}`, notes: [textBody.slice(0, 120)] });
    expect(res.status(), textBody.slice(0, 200)).toBe(400);
    expect(textBody).toContain('HOME_REQUIRES_PREPAID');
  });

  // PH-BIZ-006: a patient cannot read another patient's order.
  test('PH-BIZ-006 order read is scoped to its patient', tc('PH-BIZ-006'), async ({ request }, testInfo) => {
    const { HOSPITAL_ID: hospitalId, PH_PHR_ORDER_ID: orderId, PH_PHR_ORDER_PATIENT_ID: owner } = process.env;
    test.skip(!hospitalId || !orderId || !owner, 'Seed missing: HOSPITAL_ID, PH_PHR_ORDER_ID, PH_PHR_ORDER_PATIENT_ID');
    const getOrder = (params) => resilient(() => request.get(apiUrl(API.pharmacy.phrOrder(orderId)), { params: { hospitalId, ...params }, timeout: 60000, failOnStatusCode: false }), testInfo, 'phr order read');

    const ownerRes = await getOrder({ patientId: owner });
    // Positive control: without a 200 for the owner, the seed is stale/not on QA → NOT RUN (not a bug).
    if (ownerRes.status() !== 200) {
      recordTc(testInfo, { status: 'NOT RUN', notes: [`Owner read returned ${ownerRes.status()} — seeded order not on QA; set a current PH_PHR_ORDER_ID + PH_PHR_ORDER_PATIENT_ID`] });
      test.skip(true, 'seed order not readable on QA');
    }
    const intruder = await getOrder({ patientId: 'qa-intruder@sbx' });
    const text = await intruder.text();
    recordTc(testInfo, { measured: `owner=200, intruder=${intruder.status()}`, notes: ['Another patientId must get 404 with no order data'] });
    expect(intruder.status(), 'another patient could read the order').toBe(404);
    expect(text).not.toContain(orderId);
  });

  // PH-BIZ-008: the patient-facing catalog hides internal fields (stock/composition/cost).
  test('PH-BIZ-008 patient catalog hides internal fields', tc('PH-BIZ-008'), async ({ apiAs }, testInfo) => {
    const api = await apiAs('pharmacy');
    const res = await resilient(() => api.get(apiUrl(`/pharmacy/phr/medicines?hospitalId=${process.env.HOSPITAL_ID}&page=1&limit=10`), { timeout: 60000, failOnStatusCode: false }), testInfo, 'phr/medicines');
    const items = (await res.json()).data ?? [];
    test.skip(!items.length, 'no medicines returned');
    const leaked = INTERNAL_MED_FIELDS.filter((f) => f in items[0]);
    recordTc(testInfo, { measured: `${items.length} items; leaked: ${leaked.join(',') || 'none'}`, notes: [`keys: ${Object.keys(items[0]).join(',')}`] });
    expect(leaked, `patient catalog exposes internal fields: ${leaked.join(', ')}`).toEqual([]);
  });
});
