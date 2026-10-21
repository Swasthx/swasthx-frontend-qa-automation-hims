import { test, expect, trackErrors } from '../../fixtures/auth.fixture.js';
import { ROLE_KEYS, getRole } from '../../fixtures/roles.js';
import { expectAppNotCrashed, settle } from '../../utils/page.js';
import { tc } from '../../utils/tc.js';

// Smoke check, not in the planning sheets: every role's landing route loads cleanly.
test.describe('App-wide — smoke', () => {
  for (const key of ROLE_KEYS) {
    const role = getRole(key);
    test(`GEN-FUN-002 ${role.landing} loads with no uncaught exceptions or 5xx API calls`, tc('GEN-FUN-002'), async ({ asRole }, testInfo) => {
      const page = await asRole(key);
      const errors = trackErrors(page);
      await page.goto(role.landing);
      await settle(page);
      await expectAppNotCrashed(page);

      // Console errors are informational: React warnings and 3rd-party noise land here too.
      if (errors.consoleErrors.length) {
        await testInfo.attach('console-errors.txt', { body: errors.consoleErrors.join('\n'), contentType: 'text/plain' });
      }
      expect(errors.pageErrors, 'uncaught exceptions').toEqual([]);
      expect(errors.failedResponses.filter((r) => r.startsWith('5')), 'API 5xx on load').toEqual([]);
    });
  }
});
