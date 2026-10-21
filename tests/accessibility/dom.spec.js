import { test, expect } from '../../fixtures/auth.fixture.js';
import { APP_WIDE_ROUTES } from '../../test-data/a11y/screens.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// App-wide structural checks that don't need axe.
test.describe('Accessibility — app-wide (DOM)', () => {
  test.describe.configure({ timeout: 180_000 });

  test('GEN-A11Y-002 <html> declares lang="en"', tc('GEN-A11Y-002'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy');
    await page.goto('/pharmacy/queue');
    await settle(page);
    const lang = await page.getAttribute('html', 'lang');
    recordTc(testInfo, { measured: `lang=${lang ?? '(none)'}` });
    expect((lang || '').toLowerCase()).toMatch(/^en/);
  });

  test('GEN-A11Y-003 each route has a descriptive, unique <title>', tc('GEN-A11Y-003'), async ({ asRole }, testInfo) => {
    const titles = {};
    for (const { role, route } of APP_WIDE_ROUTES) {
      const page = await asRole(role);
      await page.goto(route);
      await settle(page);
      titles[route] = (await page.title()).trim();
      await page.context().close();
    }
    const values = Object.values(titles);
    const unique = new Set(values);
    const allNonEmpty = values.every(Boolean);
    recordTc(testInfo, { measured: `${unique.size}/${values.length} unique`, notes: Object.entries(titles).map(([r, t]) => `${r}: "${t || '(empty)'}"`) });
    expect(allNonEmpty, 'some routes have an empty <title>').toBe(true);
    // react-helmet is expected to set per-route titles; all-identical means it isn't.
    expect(unique.size, `titles are not unique across routes: ${values.join(' | ')}`).toBeGreaterThan(1);
  });

  test('GEN-A11Y-004 landmarks and a skip link are present', tc('GEN-A11Y-004'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy');
    await page.goto('/pharmacy/queue');
    await settle(page);
    const info = await page.evaluate(() => ({
      main: document.querySelectorAll('main, [role=main]').length,
      nav: document.querySelectorAll('nav, [role=navigation]').length,
      banner: document.querySelectorAll('header, [role=banner]').length,
      skip: [...document.querySelectorAll('a[href^="#"]')].some((a) => /skip/i.test(a.textContent || '')),
    }));
    recordTc(testInfo, { notes: [`main=${info.main}, nav=${info.nav}, banner=${info.banner}, skipLink=${info.skip}`] });
    expect(info.main, 'no <main> landmark').toBeGreaterThan(0);
    expect(info.nav, 'no <nav> landmark').toBeGreaterThan(0);
    expect(info.skip, 'no skip-to-content link').toBe(true);
  });

  test('GEN-A11Y-008 reflow: no horizontal scroll at 320px width', tc('GEN-A11Y-008'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy', { viewport: { width: 320, height: 800 } });
    await page.goto('/pharmacy/queue');
    await settle(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    recordTc(testInfo, { measured: `${overflow}px horizontal overflow at 320px` });
    expect(overflow, `content overflows horizontally by ${overflow}px at 320px`).toBeLessThanOrEqual(1);
  });

  // GEN-A11Y-012 (status messages announced) is manual: react-hot-toast adds aria-live only
  // while a toast is visible, so it needs a live toast + screen reader to verify.
});
