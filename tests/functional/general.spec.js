import { test, expect } from '../../fixtures/auth.fixture.js';
import { ROLE_KEYS, getRole } from '../../fixtures/roles.js';
import { escapeRegex, settle } from '../../utils/page.js';

// Auth smoke test: shows the seeded session is accepted. Run this first. If it fails,
// every other role-based failure is probably an auth problem, not an app bug.
test.describe('App-wide — functional', () => {
  for (const key of ROLE_KEYS) {
    const role = getRole(key);
    test(`GEN-FUN-001 ${key} session lands on ${role.landing} without being sent to login`, {
      annotation: { type: 'tc', description: 'GEN-FUN-001' },
    }, async ({ asRole }) => {
      const page = await asRole(key);
      await page.goto(role.landing);
      await settle(page);

      await expect(page).toHaveURL(new RegExp(`${escapeRegex(role.prefix)}(/|$|\\?)`, 'i'));
      // An app that rejects the token usually clears storage before redirecting.
      expect(await page.evaluate(() => sessionStorage.getItem('token')), 'token was removed from sessionStorage').toBeTruthy();
    });
  }
});
