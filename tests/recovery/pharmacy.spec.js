import { test, expect, trackErrors } from '../../fixtures/auth.fixture.js';
import { API, PATHS, isApiUrl } from '../../fixtures/app-map.js';
import { expectAppNotCrashed, settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

const ERROR_STATE = /something went wrong|failed to (load|fetch)|unable to (load|fetch)|server error|error loading|try again/i;
const EMPTY_STATE = /no prescriptions|no data|nothing here|no results|right now/i;
const RETRY_BUTTON = /retry|try again|reload/i;

test.describe('Pharmacy — recovery', () => {
  test.use({ role: 'pharmacy' });

  test('RFT-TMO-002 API 500 → error state + retry, no crash', tc('RFT-TMO-002'), async ({ page }, testInfo) => {
    const errors = trackErrors(page);
    let injected = 0;
    await page.route(isApiUrl(API.pharmacy.queue), (route) => {
      const req = route.request();
      if (req.method() === 'GET' && ['fetch', 'xhr'].includes(req.resourceType())) {
        injected++;
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'QA injected failure' }) });
      }
      return route.fallback();
    });

    await page.goto(PATHS.pharmacy.queue);
    await settle(page);
    await expect.poll(() => injected, { message: 'no orders GET intercepted; check PH_QUEUE_API' }).toBeGreaterThan(0);
    await expectAppNotCrashed(page); // must not white-screen or bounce to login
    await expect(page).toHaveURL(/\/pharmacy/);

    const bodyText = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const hasError = ERROR_STATE.test(bodyText);
    const hasRetry = (await page.getByRole('button', { name: RETRY_BUTTON }).count()) > 0;
    const showsEmpty = EMPTY_STATE.test(bodyText);
    recordTc(testInfo, { notes: [`error message: ${hasError}`, `retry control: ${hasRetry}`, showsEmpty ? 'Shows an EMPTY state ("no prescriptions…"), indistinguishable from a real 500' : 'No empty state either', `no uncaught JS errors: ${errors.pageErrors.length === 0}`] });

    expect(errors.pageErrors, 'uncaught exceptions on API 500').toEqual([]);
    // The defect: a 500 shows the normal empty state with no error message and no retry.
    expect(hasError || hasRetry, 'no error message and no retry control on API 500 (app treats a server error like "no data")').toBe(true);
  });

  test('RFT-TMO-009 failed list fetch shows an error with retry, never a permanent blank', tc('RFT-TMO-009'), async ({ page }, testInfo) => {
    await page.route(isApiUrl(API.pharmacy.queue), (route) => (route.request().method() === 'GET' && ['fetch', 'xhr'].includes(route.request().resourceType()) ? route.fulfill({ status: 500, body: '{}', contentType: 'application/json' }) : route.fallback()));
    await page.goto(PATHS.pharmacy.queue);
    await settle(page);

    const bodyText = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const blank = (await page.locator('#root').innerText()).trim().length === 0;
    const hasErrorOrRetry = ERROR_STATE.test(bodyText) || (await page.getByRole('button', { name: RETRY_BUTTON }).count()) > 0;
    recordTc(testInfo, { notes: [`permanent blank: ${blank}`, `error-or-retry shown: ${hasErrorOrRetry}`, EMPTY_STATE.test(bodyText) ? 'Falls back to an empty state, not an error-with-retry' : ''] });
    expect(blank, 'content area is permanently blank after a failed fetch').toBe(false);
    expect(hasErrorOrRetry, 'failed fetch shows no error state and no retry (only an empty state)').toBe(true);
  });
});
