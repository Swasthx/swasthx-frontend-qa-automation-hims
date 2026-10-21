import { test, expect } from '../../fixtures/auth.fixture.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// GEN-SEC-041: a payload typed into a search box (react-highlight-words) must render as text,
// never execute. The patient search highlights the query, so it is the natural injection point.
test.describe('Security — XSS', () => {
  test.use({ role: 'pharmacy' });

  test('GEN-SEC-041 search highlight escapes an injected payload', tc('GEN-SEC-041'), async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.__xssFired = false;
      window.addEventListener('error', (e) => {
        if (String(e.message).includes('__xss')) window.__xssFired = true;
      });
    });
    await page.goto('/pharmacy/patient');
    await settle(page);

    const payload = '"><img src=x onerror="window.__xssFired=true;throw new Error(\'__xss\')">';
    const search = page.getByPlaceholder(/Find by/i).first();
    await expect(search, 'search box not found on /pharmacy/patient').toBeVisible();
    await search.fill(payload);
    await page.waitForTimeout(1500); // allow debounce + highlight render

    const injectedImg = await page.locator('img[src="x"]').count();
    const fired = await page.evaluate(() => window.__xssFired === true);
    recordTc(testInfo, { notes: [`injected <img> elements: ${injectedImg}`, `onerror executed: ${fired}`] });
    expect(fired, 'injected onerror executed — stored/reflected XSS').toBe(false);
    expect(injectedImg, 'payload became a live <img> element instead of escaped text').toBe(0);
  });
});
