import { test, expect } from '../../fixtures/auth.fixture.js';
import { API, isApiUrl } from '../../fixtures/app-map.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

const EMPTY_STATE = /no prescriptions|no data|nothing here|no results|no .* (right now|yet|found)/i;
const ERROR_STATE = /something went wrong|failed to (load|fetch)|unable to (load|fetch)|server error|error loading|try again|retry/i;
const RAW_DUMP = /\b(stack|TypeError|undefined is not|\{"message"|Internal Server Error|at Object\.)/;

test.describe('UI/UX — automatable heuristics', () => {
  test.use({ role: 'pharmacy' });

  // GEN-UX-004: an empty list shows a helpful empty state, never a blank area.
  test('GEN-UX-004 empty list shows a helpful empty state', tc('GEN-UX-004'), async ({ page }, testInfo) => {
    await page.goto('/pharmacy/queue');
    await settle(page);
    const main = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const hasEmpty = EMPTY_STATE.test(main);
    recordTc(testInfo, { measured: hasEmpty ? 'empty state shown' : 'no empty state', notes: [hasEmpty ? 'Shows an empty-state message on an empty queue' : 'No empty-state message found on an empty list'] });
    expect(main.trim().length, 'content area is blank').toBeGreaterThan(20);
    expect(hasEmpty, 'no helpful empty-state message on an empty list').toBe(true);
  });

  // GEN-UX-005: an API error shows a clear message + retry, not a raw error dump and not a silent empty state.
  test('GEN-UX-005 API error shows a clear message + retry (no raw dump)', tc('GEN-UX-005'), async ({ page }, testInfo) => {
    await page.route(isApiUrl(API.pharmacy.queue), (route) => (route.request().method() === 'GET' && ['fetch', 'xhr'].includes(route.request().resourceType()) ? route.fulfill({ status: 500, body: '{"message":"boom"}', contentType: 'application/json' }) : route.fallback()));
    await page.goto('/pharmacy/queue');
    await settle(page);
    const main = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    const hasError = ERROR_STATE.test(main);
    const hasRetry = (await page.getByRole('button', { name: /retry|try again|reload/i }).count()) > 0;
    const rawDump = RAW_DUMP.test(main);
    recordTc(testInfo, { measured: hasError || hasRetry ? 'error/retry shown' : 'no error affordance', notes: [`error message: ${hasError}`, `retry: ${hasRetry}`, `raw dump: ${rawDump}`, !hasError && !hasRetry ? 'On a 500 the app shows the normal empty state — no error message or retry (same defect as RFT-TMO-002)' : ''] });
    expect(rawDump, 'raw error/stack shown to the user').toBe(false);
    expect(hasError || hasRetry, 'API error gives the user no error message and no retry').toBe(true);
  });

  // GEN-UX-008: the active nav item is marked, and the page has a meaningful title.
  test('GEN-UX-008 active nav highlighted + meaningful page title', tc('GEN-UX-008'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy');
    await page.goto('/pharmacy/queue');
    await settle(page);
    const title = (await page.title()).trim();
    const activeMarked = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href*="/pharmacy/queue"], nav a, aside a')];
      return links.some((a) => a.getAttribute('aria-current') || /active|selected|bg-|text-primary/.test(a.className) || (a.href.includes('/pharmacy/queue') && /active|selected/i.test(a.parentElement?.className || '')));
    });
    recordTc(testInfo, { measured: `title="${title}", activeNav=${activeMarked}`, notes: [title && title !== 'Swasthx' ? '' : 'Page title is the generic "Swasthx" (not route-specific — see GEN-A11Y-003)', activeMarked ? 'Active nav item is marked' : 'Could not detect an active-nav indicator'] });
    expect(activeMarked, 'no active-route indicator in the nav').toBe(true);
    expect(title && title !== 'Swasthx', `page title is generic "${title}" rather than route-specific`).toBeTruthy();
  });

  // GEN-UX-011: icon-only action buttons expose a tooltip / accessible name.
  test('GEN-UX-011 icon-only buttons have a tooltip / accessible name', tc('GEN-UX-011'), async ({ page }, testInfo) => {
    await page.goto('/pharmacy/queue');
    await settle(page);
    const unnamed = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('main button, header button, aside button, nav button')];
      const iconOnly = btns.filter((b) => !b.textContent.trim() && b.querySelector('svg, img, i'));
      return iconOnly.filter((b) => !(b.getAttribute('aria-label') || b.getAttribute('title') || b.getAttribute('aria-labelledby'))).length;
    });
    recordTc(testInfo, { measured: `${unnamed} unnamed icon button(s)`, notes: [unnamed ? `${unnamed} icon-only buttons have no tooltip/aria-label (see also GEN-A11Y-010)` : 'All icon-only buttons are labeled'] });
    expect(unnamed, `${unnamed} icon-only buttons lack a tooltip/accessible name`).toBe(0);
  });
});
