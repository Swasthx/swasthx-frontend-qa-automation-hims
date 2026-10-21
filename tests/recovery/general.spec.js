import { request } from '@playwright/test';
import { test, expect, trackErrors } from '../../fixtures/auth.fixture.js';
import { API, isApiUrl } from '../../fixtures/app-map.js';
import { BASE_URL } from '../../utils/env.js';
import { getRole } from '../../fixtures/roles.js';
import { expectAppNotCrashed, settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// base64url JWT with a chosen exp (unsigned — the app only decodes exp client-side).
function jwtWithExp(expSeconds) {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b({ alg: 'HS256', typ: 'JWT' })}.${b({ exp: expSeconds, EntityID: 'qa' })}.sig`;
}

test.describe('Recovery — app-wide', () => {
  test.use({ role: 'pharmacy' });

  // RFT-OFF-001: going offline mid-session must not white-screen or hang on a spinner.
  test('RFT-OFF-001 offline mid-session: no crash, no infinite spinner', tc('RFT-OFF-001'), async ({ page, context }, testInfo) => {
    const errors = trackErrors(page);
    await page.goto('/pharmacy/queue');
    await settle(page);
    await context.setOffline(true);
    await page.getByRole('button', { name: /^Refresh/i }).first().click().catch(() => {});
    await page.waitForTimeout(5000);

    await expectAppNotCrashed(page);
    const banner = (await page.getByText(/offline|no internet|connection lost|check your (internet|connection)/i).count()) > 0;
    const spinnerOnly = (await page.locator('.ant-spin-spinning, [role=progressbar]').count()) > 0 && (await page.locator('main').innerText()).trim().length < 40;
    recordTc(testInfo, { notes: [`offline banner shown: ${banner}`, `stuck on spinner: ${spinnerOnly}`, `no uncaught errors: ${errors.pageErrors.length === 0}`, banner ? '' : 'No offline indicator — user gets no feedback that the network dropped'] });
    await context.setOffline(false);
    expect(spinnerOnly, 'app is stuck showing only a spinner while offline').toBe(false);
    expect(errors.pageErrors, 'uncaught exceptions while offline').toEqual([]);
  });

  // RFT-OFF-002: reloading while offline should show a cached shell / offline page, not a raw browser error.
  test('RFT-OFF-002 reload while offline shows a cached shell, not a browser error', tc('RFT-OFF-002'), async ({ page, context }, testInfo) => {
    await page.goto('/pharmacy/queue');
    await settle(page);
    await context.setOffline(true);
    let reloadError = null;
    await page.reload({ timeout: 15000 }).catch((e) => (reloadError = e.message.split('\n')[0]));
    const rootContent = await page.locator('#root').innerText().catch(() => '');
    const served = rootContent.trim().length > 0;
    await context.setOffline(false);
    recordTc(testInfo, { measured: served ? 'shell rendered' : 'browser error', notes: [reloadError ? `reload failed: ${reloadError}` : 'reload returned', served ? 'Something rendered from cache' : 'No service worker / offline cache → raw browser error on offline reload'] });
    expect(served, 'offline reload shows a raw browser error (no offline shell / service worker)').toBe(true);
  });

  // RFT-OFF-005: hashed assets should be cacheable (immutable / long max-age), served from cache on repeat load.
  test('RFT-OFF-005 hashed static assets are cacheable', tc('RFT-OFF-005'), async ({}, testInfo) => {
    const ctx = await request.newContext();
    try {
      const html = await (await ctx.get(BASE_URL() + '/')).text();
      const asset = html.match(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/)?.[1];
      test.skip(!asset, 'no hashed asset found in index.html');
      const res = await ctx.get(new URL(asset, BASE_URL()).href);
      const cc = res.headers()['cache-control'] || '';
      const browserMaxAge = Number(/(?:^|[^-])max-age=(\d+)/.exec(cc)?.[1] ?? 0);
      const cacheable = /immutable/.test(cc) || browserMaxAge > 0;
      recordTc(testInfo, { measured: `Cache-Control: ${cc || '(none)'}`, notes: [cacheable ? 'Hashed asset is browser-cacheable' : `Browser max-age=${browserMaxAge}; hashed assets are re-validated on every load (not served straight from cache)`] });
      expect(cacheable, `hashed asset not browser-cacheable: ${cc}`).toBe(true);
    } finally {
      await ctx.dispose();
    }
  });

  // RFT-CRA-002: an unknown route renders a NotFound page, not a blank shell.
  test('RFT-CRA-002 unknown route renders NotFound, not a blank shell', tc('RFT-CRA-002'), async ({ page }, testInfo) => {
    await page.goto('/pharmacy/this-route-does-not-exist-zzz');
    await settle(page);
    await expectAppNotCrashed(page);
    const text = (await page.locator('#root').innerText()).replace(/\s+/g, ' ');
    const notFound = /not found|404|doesn.?t exist|page you.?re looking for|go (back|home)/i.test(text);
    const path = new URL(page.url()).pathname;
    const redirected = !path.includes('this-route-does-not-exist');
    recordTc(testInfo, { measured: notFound ? 'NotFound shown' : redirected ? `redirected to ${path}` : 'neither', notes: [`final path: ${path}`, text.trim().length < 5 ? 'Blank shell' : 'Content present'] });
    expect(text.trim().length, 'blank shell on unknown route').toBeGreaterThan(4);
    expect(notFound || redirected, 'unknown route shows neither a NotFound page nor a redirect').toBe(true);
  });

  // RFT-CRA-003: hard reload mid-session keeps the user authenticated and on the page.
  test('RFT-CRA-003 F5 mid-session retains auth and route', tc('RFT-CRA-003'), async ({ page }, testInfo) => {
    await page.goto(getRole('pharmacy').landing);
    await settle(page);
    await page.reload();
    await settle(page);
    const path = new URL(page.url()).pathname;
    const token = await page.evaluate(() => sessionStorage.getItem('token'));
    recordTc(testInfo, { notes: [`after reload: ${path}`, `token retained: ${!!token}`] });
    await expectAppNotCrashed(page);
    expect(path, 'reload bounced the user to login').not.toMatch(/\/login/);
    expect(token, 'token lost on reload').toBeTruthy();
  });

  // RFT-TMO-001: a hung request must not leave the UI on an infinite spinner.
  test('RFT-TMO-001 hung request does not spin forever', tc('RFT-TMO-001'), async ({ page }, testInfo) => {
    await page.route(isApiUrl(API.pharmacy.queue), async (route) => {
      if (route.request().method() === 'GET') {
        await new Promise((r) => setTimeout(r, 40000)); // never resolves within the test
        return route.abort();
      }
      return route.fallback();
    });
    await page.goto('/pharmacy/queue').catch(() => {});
    await page.waitForTimeout(22000);
    const spinning = await page.locator('.ant-spin-spinning, [role=progressbar]').count();
    const mainLen = (await page.locator('main').innerText().catch(() => '')).trim().length;
    recordTc(testInfo, { measured: spinning ? 'still spinning' : 'resolved/empty', notes: [`spinner elements after 22s: ${spinning}`, `main content length: ${mainLen}`] });
    // Either a timeout/empty/error state, or at least page chrome — not ONLY a spinner.
    expect(spinning === 0 || mainLen > 60, 'UI appears stuck on an infinite spinner for a hung request').toBe(true);
  });

  // RFT-TMO-004: when the refresh token is rejected, the session is cleared and the user is sent to /login.
  test('RFT-TMO-004 invalid refresh → session cleared, redirect to /login', tc('RFT-TMO-004'), async ({ browser, baseURL }, testInfo) => {
    const bundle = getRole('pharmacy'); // only for prefix; session comes from .auth
    const { loadBundle, seedSessionStorage } = await import('../../utils/session.js');
    const stored = loadBundle('pharmacy');
    test.skip(!stored?.session, 'no pharmacy session');
    const ctx = await browser.newContext({ baseURL });
    // Seed a session whose ACCESS token is already expired so the interceptor must refresh.
    const session = { ...stored.session, token: jwtWithExp(Math.floor(Date.now() / 1000) - 3600) };
    await ctx.addInitScript(seedSessionStorage, { origin: new URL(baseURL).origin, session });
    const page = await ctx.newPage();
    await page.route(isApiUrl('/auth/refresh'), (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"invalid refresh"}' }));

    await page.goto(bundle.landing).catch(() => {});
    // sweetalert "Session Expired" → OK → /login. Click OK if present.
    await page.getByRole('button', { name: /^ok$/i }).click({ timeout: 8000 }).catch(() => {});
    await page.waitForURL(/\/login/, { timeout: 15000 }).catch(() => {});
    const path = new URL(page.url()).pathname;
    recordTc(testInfo, { notes: [`final path: ${path}`, 'Storage-clear on logout is covered by GEN-SEC-010 (not asserted here: the test re-seeds sessionStorage on every navigation)'] });
    await ctx.close();
    expect(path, 'not redirected to /login after refresh failure').toMatch(/\/login/);
  });

  // RFT-TMO-006: a feature-endpoint 401 while OUR JWT is still valid must NOT wipe the session.
  test('RFT-TMO-006 feature 401 with valid JWT does not log the user out', tc('RFT-TMO-006'), async ({ page }, testInfo) => {
    let hit = 0;
    await page.route(isApiUrl(API.pharmacy.queue), (route) => {
      if (route.request().method() === 'GET') {
        hit++;
        return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"upstream 401"}' });
      }
      return route.fallback();
    });
    await page.goto('/pharmacy/queue');
    await settle(page);
    await page.waitForTimeout(3000);
    const path = new URL(page.url()).pathname;
    const token = await page.evaluate(() => sessionStorage.getItem('token'));
    recordTc(testInfo, { notes: [`injected 401s: ${hit}`, `still on: ${path}`, `token retained: ${!!token}`] });
    expect(hit, 'no feature GET was intercepted').toBeGreaterThan(0);
    expect(path, 'a feature 401 with a valid JWT wrongly logged the user out').toMatch(/\/pharmacy/);
    expect(token, 'session wiped by a feature 401 despite a valid JWT').toBeTruthy();
  });
});
