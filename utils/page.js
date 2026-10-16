import { expect } from '@playwright/test';

/** Lets a SPA finish its first data load and any client-side redirect. Apps that poll never go idle, so this is capped. */
export async function settle(page, timeout = 10_000) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
}

export const BLOCKED_TEXT = /unauthori[sz]ed|not authori[sz]ed|forbidden|access denied|permission denied|no permission|\b403\b|\b404\b|not found|page doesn.?t exist/i;

/**
 * Asserts the current page is NOT showing content under `forbiddenPrefix`. Accepted outcomes:
 * redirected out of the prefix, or a 403/404/unauthorized page is shown.
 */
export async function expectBlocked(page, forbiddenPrefix) {
  await settle(page);
  const { pathname } = new URL(page.url());
  const stayed = pathname.toLowerCase().startsWith(forbiddenPrefix.toLowerCase());
  if (!stayed) return;
  await expect(
    page.getByText(BLOCKED_TEXT).first(),
    `Still on ${pathname} with no blocked/404 message: the route guard let this session in`,
  ).toBeVisible({ timeout: 5_000 });
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** React mounts into #root (Vite default). An empty root after an error = white-screen crash. */
export async function expectAppNotCrashed(page) {
  await expect(page.locator('#root > *').first(), 'App root is empty (white-screen crash)').toBeAttached();
}
