import fs from 'node:fs';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { API, apiUrl } from '../../fixtures/app-map.js';
import { expectBlocked } from '../../utils/page.js';

test.describe('Pharmacy — business logic', () => {
  test('PH-BIZ-003 homeTest + pay-at-counter is rejected with HOME_REQUIRES_PREPAID', {
    annotation: { type: 'tc', description: 'PH-BIZ-003' },
  }, async ({ apiAs }) => {
    // Checked at the API: the rule must hold even if the UI hides the option.
    // If the rule is broken, this creates a real order on QA, so use a throwaway patient.
    const patientId = process.env.PH_PATIENT_ID;
    test.skip(!patientId, 'Seed missing: set PH_PATIENT_ID');

    // TODO(calibrate): payload field names. Copy a real "place order" request body from DevTools.
    const template = fs.readFileSync(new URL('../../test-data/ph-biz-003-home-counter-order.json', import.meta.url), 'utf8');
    const body = JSON.parse(template.replaceAll('{{PH_PATIENT_ID}}', patientId));

    const api = await apiAs('pharmacy');
    const res = await api.post(apiUrl(API.pharmacy.createOrder), { data: body });
    const text = await res.text();

    expect(res.status(), `expected a 4xx rejection, got ${res.status()}: ${text.slice(0, 300)}`).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    expect(text).toContain('HOME_REQUIRES_PREPAID');
  });

  test('PH-BIZ-006 a patient cannot open another patient\'s order (blocked / 404)', {
    annotation: { type: 'tc', description: 'PH-BIZ-006' },
  }, async ({ asRole }) => {
    // Seed: an in-app URL that combines patient A's context with patient B's order id,
    // e.g. /pharmacy/patient/<A>/orders/<B-order>. See README "Seed data".
    const crossPath = process.env.PH_CROSS_PATIENT_ORDER_PATH;
    test.skip(!crossPath, 'Seed missing: set PH_CROSS_PATIENT_ORDER_PATH');

    const foreignOrderId = process.env.PH_FOREIGN_ORDER_ID;
    const page = await asRole('pharmacy');
    const leaked = [];
    page.on('response', (r) => {
      const type = r.request().resourceType();
      if (foreignOrderId && (type === 'fetch' || type === 'xhr') && r.status() === 200 && r.url().includes(foreignOrderId)) leaked.push(r.url());
    });

    await page.goto(crossPath);
    // Accept a redirect away from the order or a 403/404 screen, but never the order itself.
    await expectBlocked(page, crossPath);

    // A 200 for the foreign order means the data reached the browser, even if the UI hides it.
    expect(leaked, 'API served another patient\'s order to this session').toEqual([]);
  });
});
