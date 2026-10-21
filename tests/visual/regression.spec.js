import { test, expect } from '../../fixtures/auth.fixture.js';
import { BASE_URL } from '../../utils/env.js';
import { API, isApiUrl } from '../../fixtures/app-map.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// Visual baselines for data-INDEPENDENT screens (deterministic without seeded data). First run
// writes baselines (npm run test:visual:update); later runs diff against them. Chromium-only
// (see playwright.config CHROMIUM_ONLY); baselines are per-OS. Animations/caret are disabled in
// config; we freeze the clock and mask volatile bits (dates/counts).
const FROZEN = new Date('2026-02-01T10:00:00+05:30');
const shot = (page, name, opts = {}) => expect(page).toHaveScreenshot(name, { fullPage: true, animations: 'disabled', caret: 'hide', ...opts });

test.describe('Visual regression (deterministic screens)', () => {
  test.describe.configure({ timeout: 120_000 });

  test('AUTH-VIS-001 login at 1440 and 390', tc('AUTH-VIS-001'), async ({ browser }, testInfo) => {
    for (const [w, label] of [[1440, 'desktop'], [390, 'mobile']]) {
      const ctx = await browser.newContext({ baseURL: BASE_URL(), viewport: { width: w, height: 900 } });
      const page = await ctx.newPage();
      await page.clock.setFixedTime(FROZEN);
      await page.goto('/login');
      await settle(page);
      await page.evaluate(() => document.fonts.ready);
      await shot(page, `login-${label}.png`);
      await ctx.close();
    }
    recordTc(testInfo, { notes: ['Baselines: login desktop (1440) + mobile (390)'] });
  });

  test('AD-VIS-002 admin sidebar expanded vs collapsed', tc('AD-VIS-002'), async ({ asRole }, testInfo) => {
    const page = await asRole('admin', { viewport: { width: 1440, height: 900 } });
    await page.clock.setFixedTime(FROZEN);
    await page.goto('/admin/profile');
    await settle(page);
    await page.evaluate(() => document.fonts.ready);
    // Mask the profile header (account-specific text) so only the sidebar chrome is compared.
    const mask = [page.locator('main')];
    await shot(page, 'admin-sidebar-expanded.png', { mask });
    await page.getByRole('button', { name: /^Collapse/i }).first().click().catch(() => {});
    await page.waitForTimeout(600);
    await shot(page, 'admin-sidebar-collapsed.png', { mask });
    recordTc(testInfo, { notes: ['Baselines: admin sidebar expanded + collapsed (main area masked)'] });
  });

  test('GEN-VIS-001 CustomModal open overlay', tc('GEN-VIS-001'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy', { viewport: { width: 1440, height: 900 } });
    await page.clock.setFixedTime(FROZEN);
    await page.goto('/pharmacy/queue');
    await settle(page);
    await page.getByRole('button', { name: /^Create Order/ }).first().click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(800);
    await page.evaluate(() => document.fonts.ready);
    // Mask inputs/date fields inside the dialog (they can default to the current date/time).
    await expect(dialog).toHaveScreenshot('create-order-modal.png', { animations: 'disabled', caret: 'hide', mask: [dialog.locator('input, [class*="picker" i], [class*="date" i]')], maxDiffPixelRatio: 0.03 });
    recordTc(testInfo, { notes: ['Baseline: Create Order modal overlay'] });
  });

  test('GEN-VIS-002 shared empty and error states', tc('GEN-VIS-002'), async ({ asRole, browser, baseURL }, testInfo) => {
    // Empty state: QA pharmacy queue currently has no orders.
    const page = await asRole('pharmacy', { viewport: { width: 1440, height: 900 } });
    await page.clock.setFixedTime(FROZEN);
    await page.goto('/pharmacy/queue');
    await settle(page);
    // Mask the live date header AND the sidebar (shows a changing "Last login" timestamp + avatar).
    const dynMask = (p) => [p.getByText(/Today · .*\d{4}/), p.locator('aside, [class*="sidebar" i], complementary, [role=complementary]')];
    await page.evaluate(() => document.fonts.ready);
    await shot(page, 'pharmacy-empty-state.png', { mask: dynMask(page), maxDiffPixelRatio: 0.03 });

    // Error state: force the orders API to 500.
    const ctx = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } });
    const ep = await ctx.newPage();
    await ep.clock.setFixedTime(FROZEN);
    const { seedSessionStorage, loadBundle } = await import('../../utils/session.js');
    await ctx.addInitScript(seedSessionStorage, { origin: new URL(baseURL).origin, session: loadBundle('pharmacy').session });
    await ep.route(isApiUrl(API.pharmacy.queue), (route) => (route.request().method() === 'GET' ? route.fulfill({ status: 500, body: '{}', contentType: 'application/json' }) : route.fallback()));
    await ep.goto('/pharmacy/queue');
    await settle(ep);
    await ep.evaluate(() => document.fonts.ready);
    await shot(ep, 'pharmacy-error-state.png', { mask: dynMask(ep), maxDiffPixelRatio: 0.03 });
    await ctx.close();
    recordTc(testInfo, { notes: ['Baselines: pharmacy empty state + API-500 state'] });
  });
});
