import { test, expect } from '../../fixtures/auth.fixture.js';
import { API, apiUrl } from '../../fixtures/app-map.js';
import { PharmacyQueuePage, STRICT_AMOUNT } from '../../pages/pharmacy.page.js';

test.describe('Pharmacy — functional', () => {
  test.use({ role: 'pharmacy' });

  test('PH-FUN-001 order bill shows subtotal + GST + total, currency-formatted', {
    // Also covers UI/UX sheet PH-UX-002 (price breakdown itemized, currency formatted).
    annotation: [{ type: 'tc', description: 'PH-FUN-001' }, { type: 'tc', description: 'PH-UX-002' }],
  }, async ({ page, apiAs }) => {
    // Seed: a billed order in the Delivered tab (see README "Seed data").
    const { PH_ORDER_CODE: orderCode, PH_ORDER_VISIT_ID: visitId, PH_PHR_ORDER_ID: orderId } = process.env;
    test.skip(!orderCode || !visitId, 'Seed missing: set PH_ORDER_CODE and PH_ORDER_VISIT_ID');

    const queue = new PharmacyQueuePage(page);
    await queue.goto();
    await queue.openActiveTab(process.env.PH_ORDER_TAB || 'Order Delivered');
    // The seeded order may not exist on the current QA dataset (queue often empty) — NOT RUN, not FAIL.
    if (!(await queue.card(visitId).isVisible().catch(() => false))) {
      test.skip(true, `Seed order ${visitId} not present on QA (queue empty or data changed) — set a current PH_ORDER_VISIT_ID`);
    }
    const dialog = await queue.openOrderDetails(visitId);
    const bill = await queue.readBillSummary(dialog);

    expect(bill.orderCode, 'details opened for the wrong order').toBe(orderCode);

    await test.step('arithmetic: subtotal − discount + CGST + SGST = total', async () => {
      const expected = bill.subtotal.value - bill.discount.value + bill.cgst.value + bill.sgst.value;
      expect(bill.subtotal.value).toBeGreaterThan(0);
      expect(bill.total.value, JSON.stringify(bill)).toBeCloseTo(expected, 2);
    });

    if (orderId) {
      await test.step('UI matches the backend order', async () => {
        const api = await apiAs('pharmacy');
        const res = await api.get(apiUrl(API.pharmacy.order(orderId)));
        expect(res.status()).toBe(200);
        const o = (await res.json()).data;
        expect(o.orderCode, 'PH_PHR_ORDER_ID and PH_ORDER_CODE point at different orders').toBe(orderCode);
        expect(bill.subtotal.value).toBeCloseTo(o.subtotal, 2);
        expect(bill.cgst.value + bill.sgst.value).toBeCloseTo(o.gstTotal, 2);
        expect(bill.total.value).toBeCloseTo(o.totalAmount, 2);
      });
    }

    await test.step('currency format', async () => {
      for (const [name, amt] of Object.entries(bill).filter(([k]) => k !== 'orderCode')) {
        expect(amt.formatted, `${name} must use ₹`).toMatch(/^₹/);
        // Soft: reported, but the rest of the test still runs.
        expect.soft(amt.formatted, `${name} should show 2 decimals like the other amounts`).toMatch(STRICT_AMOUNT);
      }
    });
  });
});
