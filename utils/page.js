import { expect } from '@playwright/test';

/**
 * Lets the SPA boot, run its route guard and finish its first data load. On QA the app is one
 * ~11 MB bundle, so the URL can still be the requested one for several seconds before React
 * mounts and redirects. Judging before that gives false "guard let me in" results.
 */
export async function settle(page, timeout = 10_000) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('#root > *').first().waitFor({ state: 'attached', timeout: 90_000 });
  await waitForStableUrl(page);
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await waitForStableUrl(page);
}

/** Resolves once the URL hasn't changed for `quietMs` (client-side redirects are done). */
export async function waitForStableUrl(page, { quietMs = 1000, timeout = 15_000 } = {}) {
  const end = Date.now() + timeout;
  let last = page.url();
  let since = Date.now();
  while (Date.now() < end) {
    await page.waitForTimeout(200);
    const now = page.url();
    if (now !== last) {
      last = now;
      since = Date.now();
    } else if (Date.now() - since >= quietMs) {
      return;
    }
  }
}

// Only an explicit login form or a dedicated 403/404 screen counts as "blocked while on the URL".
// A broad keyword match caused false passes (ordinary page copy contains "not found" etc.).
export const LOGIN_MARKER = /Enter your mobile number|Welcome back/i;
export const DENIED_MARKER = /\b(403|404)\b|access denied|you are not authori[sz]ed|don.?t have permission to (access|view)/i;

/**
 * Asserts the current page is NOT showing content under `forbiddenPrefix`.
 *
 * This SPA keeps the URL and renders the target module even for the wrong role, so the
 * reliable signal is: after a full settle, the app either left the prefix (redirect to the
 * user's own area or /login) or shows an explicit login / denied screen. Judged once the URL
 * has stopped moving (waitForStableUrl inside settle), with an extra confirmation pass so a
 * late client-side redirect isn't missed.
 */
export async function expectBlocked(page, forbiddenPrefix) {
  await settle(page);
  await waitForStableUrl(page, { quietMs: 2500, timeout: 20_000 });

  const pathname = new URL(page.url()).pathname.toLowerCase();
  const stayed = pathname.startsWith(forbiddenPrefix.toLowerCase());
  if (!stayed) return; // redirected away → blocked

  const bodyText = await page.locator('body').innerText().catch(() => '');
  const shownLogin = LOGIN_MARKER.test(bodyText);
  const shownDenied = DENIED_MARKER.test(bodyText);
  expect(
    shownLogin || shownDenied,
    `Route guard let this session in: still on ${pathname} rendering module content (no login/denied screen)`,
  ).toBe(true);
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** React mounts into #root (Vite default). An empty root after an error = white-screen crash. */
export async function expectAppNotCrashed(page) {
  await expect(page.locator('#root > *').first(), 'App root is empty (white-screen crash)').toBeAttached();
}
