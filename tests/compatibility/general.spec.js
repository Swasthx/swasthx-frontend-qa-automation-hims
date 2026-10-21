import { test, expect } from '../../fixtures/auth.fixture.js';
import { ROLE_KEYS, getRole } from '../../fixtures/roles.js';
import { expectAppNotCrashed, settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// Per-module "opens consistently" TCs. Each runs under every browser project
// (chromium, webkit, firefox, edge); the sheet row aggregates the browsers.
const MODULE_TC = { superadmin: 'CMPT-002', admin: 'CMPT-003', doctor: 'CMPT-004', diagnostic: 'CMPT-005', reception: 'CMPT-006', pharmacy: 'CMPT-007' };

// Not a rendering incompatibility: environment/third-party/network noise. "due to access control
// checks" is WebKit's wording for a cross-origin request blocked by CORS/ITP (the API and socket
// are on other origins) — a real Safari/ITP risk tracked under CMPT-012, not a layout break here.
const BENIGN_ERROR = /ResizeObserver|websocket|socket\.io|Non-Error promise rejection|Script error\.?$|Load failed|NetworkError|cashfree|due to access control checks|awsapprunner|websiteqa\.api\.swasthx/i;

test.describe('App-wide — compatibility', () => {
  for (const key of ROLE_KEYS) {
    const role = getRole(key);
    test(`${MODULE_TC[key]} ${role.landing} renders without layout overflow`, tc(MODULE_TC[key]), async ({ asRole }, testInfo) => {
      const page = await asRole(key);
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(e.message.split('\n')[0]));

      await page.goto(role.landing);
      await settle(page);
      await expectAppNotCrashed(page);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const realErrors = [...new Set(pageErrors)].filter((m) => !BENIGN_ERROR.test(m));
      recordTc(testInfo, { notes: [`${testInfo.project.name}: overflowX=${overflow}px${realErrors.length ? `, errors: ${realErrors.slice(0, 2).join(' | ').slice(0, 100)}` : ', no app errors'}${pageErrors.length && !realErrors.length ? ' (benign socket/RO noise ignored)' : ''}`] });
      expect(overflow, `horizontal overflow of ${overflow}px on ${testInfo.project.name}`).toBeLessThanOrEqual(1);
      expect(realErrors, `uncaught app exceptions on ${testInfo.project.name}: ${realErrors.join(' | ')}`).toEqual([]);
    });
  }
});
