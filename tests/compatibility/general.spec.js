import { test, expect } from '../../fixtures/auth.fixture.js';
import { ROLE_KEYS, getRole } from '../../fixtures/roles.js';
import { expectAppNotCrashed, settle } from '../../utils/page.js';

// Runs under every browser project (chromium, webkit, firefox, edge). To reuse an existing
// spec across browsers, run it with --project=<name>; this file holds checks that only
// matter cross-browser.
test.describe('App-wide — compatibility', () => {
  for (const key of ROLE_KEYS) {
    const role = getRole(key);
    test(`GEN-CMPT-001 ${role.landing} renders without layout overflow`, {
      annotation: { type: 'tc', description: 'GEN-CMPT-001' },
    }, async ({ asRole }, testInfo) => {
      const page = await asRole(key);
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(e.message));

      await page.goto(role.landing);
      await settle(page);
      await expectAppNotCrashed(page);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow of ${overflow}px on ${testInfo.project.name}`).toBeLessThanOrEqual(1);
      expect(pageErrors, `uncaught exceptions on ${testInfo.project.name}`).toEqual([]);
    });
  }
});
