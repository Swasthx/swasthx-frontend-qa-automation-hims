import { test, expect } from '../../fixtures/auth.fixture.js';
import { ROLE_KEYS, getRole } from '../../fixtures/roles.js';
import { blockingViolations, formatViolations, runAxe } from '../../utils/a11y.js';
import { settle } from '../../utils/page.js';

test.describe('App-wide — accessibility', () => {
  for (const key of ROLE_KEYS) {
    const role = getRole(key);
    test(`GEN-A11Y-001 ${role.landing} has 0 serious/critical axe violations`, {
      annotation: { type: 'tc', description: 'GEN-A11Y-001' },
    }, async ({ asRole }, testInfo) => {
      const page = await asRole(key);
      await page.goto(role.landing);
      await settle(page);

      const results = await runAxe(page, testInfo);
      const blocking = blockingViolations(results);
      expect(blocking, formatViolations(blocking)).toHaveLength(0);
    });
  }
});
