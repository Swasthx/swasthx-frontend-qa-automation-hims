import { test, expect } from '../../fixtures/auth.fixture.js';
import { CART_LABELS, PharmacyPage, currencyRegex } from '../../pages/pharmacy.page.js';
import { settle } from '../../utils/page.js';

test.describe('Pharmacy — functional', () => {
  test.use({ role: 'pharmacy' });

  test('PH-FUN-001 cart shows subtotal + GST + total, currency-formatted', {
    annotation: { type: 'tc', description: 'PH-FUN-001' },
  }, async ({ page }) => {
    // Seed: a cart that already holds at least one item (see README "Seed data").
    const cartPath = process.env.PH_CART_PATH;
    test.skip(!cartPath, 'Seed missing: set PH_CART_PATH to a pharmacy cart that holds at least one item');

    await page.goto(cartPath);
    await settle(page);
    const ph = new PharmacyPage(page);

    const subtotal = await ph.summaryAmount(CART_LABELS.subtotal);
    const gst = await ph.summaryAmount(CART_LABELS.gst);
    const total = await ph.summaryAmount(CART_LABELS.total);

    for (const [name, amt] of Object.entries({ subtotal, gst, total })) {
      expect(amt.formatted, `${name} is not currency-formatted`).toMatch(new RegExp(`^${currencyRegex().source}$`));
    }
    expect(subtotal.value).toBeGreaterThan(0);
    expect(gst.value).toBeGreaterThanOrEqual(0);
    // If the cart also shows discount/delivery lines, extend this equation.
    expect(total.value, `${subtotal.formatted} + ${gst.formatted} should equal ${total.formatted}`).toBeCloseTo(subtotal.value + gst.value, 2);
  });
});
