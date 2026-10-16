import { test, expect, trackErrors } from '../../fixtures/auth.fixture.js';
import { API, PATHS, isApiUrl } from '../../fixtures/app-map.js';
import { expectAppNotCrashed } from '../../utils/page.js';

// TODO(calibrate): the app's error UI wording. Prefer role="alert" or a data-testid if present.
const ERROR_STATE = /something went wrong|failed to (load|fetch)|unable to (load|fetch)|server error|error loading|try again/i;
const RETRY_BUTTON = /retry|try again|reload|refresh/i;

test.describe('Pharmacy — recovery', () => {
  test.use({ role: 'pharmacy' });

  test('RFT-TMO-002 API returns 500 → error state + retry recovers, no crash', {
    annotation: { type: 'tc', description: 'RFT-TMO-002' },
  }, async ({ page }) => {
    const errors = trackErrors(page);
    let failing = true;
    let injected = 0;

    // Fails GETs only, so writes and token-refresh POSTs still pass. If the app logs out when
    // a profile/permissions GET fails, narrow the match with PH_QUEUE_API.
    await page.route(isApiUrl(API.pharmacy.queue), async (route) => {
      const req = route.request();
      if (failing && req.method() === 'GET' && ['fetch', 'xhr'].includes(req.resourceType())) {
        injected++;
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'QA injected failure' }) });
      }
      return route.fallback();
    });

    await page.goto(PATHS.pharmacy.queue);
    await expect.poll(() => injected, { message: 'no API GET was intercepted; check PH_QUEUE_API' }).toBeGreaterThan(0);

    await expect(page, 'a 500 should not bounce the user to login').toHaveURL(/\/pharmacy/);
    await expectAppNotCrashed(page);

    const errorState = page.getByRole('alert').or(page.getByText(ERROR_STATE)).first();
    await expect(errorState, 'no visible error state after API 500').toBeVisible();

    const retry = page.getByRole('button', { name: RETRY_BUTTON }).first();
    await expect(retry, 'no retry control offered').toBeVisible();

    failing = false;
    await retry.click();
    await expect(errorState).toBeHidden();
    await expectAppNotCrashed(page);

    expect(errors.pageErrors, 'uncaught exceptions during failure/recovery').toEqual([]);
  });
});
