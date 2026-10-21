import { request } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { API_BASE_URL } from '../../utils/env.js';
import { getRole } from '../../fixtures/roles.js';
import { loadBundle, SESSION_KEYS, withRoleLock } from '../../utils/session.js';
import { apiLogin, hasCreds, refreshLogin } from '../../utils/login.js';
import { settle, waitForStableUrl } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

test.describe('Security — auth / session', () => {
  // GEN-SEC-010: logout empties every auth key from sessionStorage.
  test('GEN-SEC-010 logout clears all auth keys from sessionStorage', tc('GEN-SEC-010'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy');
    await page.goto(getRole('pharmacy').landing);
    await settle(page);

    expect(await page.evaluate(() => sessionStorage.getItem('token')), 'precondition: token present').toBeTruthy();

    // Pharmacy profile menu → Logout → confirm modal.
    await page.getByRole('button', { name: /Pharmacy$/ }).first().click();
    await page.getByText('Logout', { exact: true }).click();
    await page.getByRole('button', { name: /^(Logout|Confirm|Yes)/ }).last().click();
    await waitForStableUrl(page);

    const leftover = await page.evaluate((keys) => keys.filter((k) => sessionStorage.getItem(k) !== null), SESSION_KEYS);
    recordTc(testInfo, { notes: [`Post-logout URL: ${new URL(page.url()).pathname}`, leftover.length ? `Leftover keys: ${leftover.join(', ')}` : 'All auth keys cleared'] });
    expect(leftover, 'auth keys still in sessionStorage after logout').toEqual([]);
    await expect(page).toHaveURL(/\/login/);
  });

  // GEN-SEC-014: after logout, deep-linking back to a protected route must re-auth, not show cached data.
  test('GEN-SEC-014 protected route after logout forces re-auth', tc('GEN-SEC-014'), async ({ browser, baseURL }, testInfo) => {
    const ctx = await browser.newContext({ baseURL });
    const page = await ctx.newPage();
    // No seeding: simulate a browser whose session was cleared by logout.
    await page.addInitScript(() => sessionStorage.clear());
    await page.goto(getRole('pharmacy').landing);
    await settle(page);
    const path = new URL(page.url()).pathname;
    recordTc(testInfo, { notes: [`Landed on ${path}`] });
    expect(path, 'cached protected page shown without re-auth').toMatch(/\/login/);
    await ctx.close();
  });

  // GEN-SEC-012: refresh rotates the token pair; an invalid refresh token is rejected (→ forced logout).
  // Uses reception, not pharmacy: the pharmacy logout test (GEN-SEC-010) ends the server session.
  test('GEN-SEC-012 refresh rotates token; bad refresh token is rejected', tc('GEN-SEC-012'), async ({}, testInfo) => {
    test.skip(!hasCreds('reception'), 'No reception creds to mint a fresh session');
    test.setTimeout(120_000); // apiLogin may wait out the 60s OTP resend cooldown
    // Mint a brand-new session and rotate IT, under the per-role lock, so the test never depends
    // on (or corrupts) the shared on-disk token and never races a parallel worker. Reception is
    // used only via seeded client-side tokens elsewhere, so resetting its server session is safe.
    const { prevToken, rotated } = await withRoleLock('reception', async () => {
      const fresh = await apiLogin('reception'); // 3-call OTP flow, forceLogin, saves a valid pair
      return { prevToken: fresh.session.token, rotated: await refreshLogin('reception', fresh) };
    });

    const ctx = await request.newContext();
    try {
      const bad = await ctx.post(`${API_BASE_URL()}/auth/refresh`, { data: { refreshToken: 'invalid.refresh.token' }, failOnStatusCode: false });
      recordTc(testInfo, { notes: [`valid refresh issued a new token: ${!!rotated.session.token}; invalid refresh → ${bad.status()}`] });
      expect(rotated.session.token, 'valid refresh did not rotate the access token').not.toBe(prevToken);
      expect(bad.status(), 'invalid refresh token was not rejected').toBeGreaterThanOrEqual(400);
    } finally {
      await ctx.dispose();
    }
  });
});
