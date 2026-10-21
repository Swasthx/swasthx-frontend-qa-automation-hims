import { test, expect } from '../../fixtures/auth.fixture.js';
import { API, isApiUrl } from '../../fixtures/app-map.js';
import { getRole } from '../../fixtures/roles.js';
import { settle, waitForStableUrl } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

test.describe('Business logic — Auth', () => {
  // GEN-BIZ-003: a feature response with errorCode ACCOUNT_DEACTIVATED forces logout → /login.
  test('GEN-BIZ-003 ACCOUNT_DEACTIVATED forces logout', tc('GEN-BIZ-003'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy');
    await page.route(isApiUrl(API.pharmacy.queue), (route) =>
      route.request().method() === 'GET' && ['fetch', 'xhr'].includes(route.request().resourceType())
        ? route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ statusCode: 403, errorCode: 'ACCOUNT_DEACTIVATED', message: 'Account deactivated' }) })
        : route.fallback(),
    );
    await page.goto('/pharmacy/queue');
    await settle(page);
    // The app shows a sweetalert ("Account is deactivated") then redirects to /login on OK.
    await page.getByRole('button', { name: /^ok$/i }).click({ timeout: 8000 }).catch(() => {});
    await page.waitForURL(/\/login/, { timeout: 12000 }).catch(() => {});
    await waitForStableUrl(page);
    const path = new URL(page.url()).pathname;
    recordTc(testInfo, { measured: `final path: ${path}`, notes: ['403 ACCOUNT_DEACTIVATED should block + force logout'] });
    expect(path, 'ACCOUNT_DEACTIVATED did not force a logout to /login').toMatch(/\/login/);
  });
});
