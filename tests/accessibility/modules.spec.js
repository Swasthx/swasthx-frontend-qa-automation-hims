import { test, expect } from '../../fixtures/auth.fixture.js';
import { A11Y_SCREENS, resolveRoute } from '../../test-data/a11y/screens.js';
import { blockingViolations, formatViolations, scanRoute } from '../../utils/a11y.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// Per-module accessibility TCs: scan the module's screen with axe (0 serious/critical).
// Many are "auto+manual" in the plan — axe covers the structural WCAG SC here; the sheet
// then flags that an NVDA/screen-reader sign-off is still pending.
test.describe('Accessibility — per module (axe)', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [id, screen] of Object.entries(A11Y_SCREENS)) {
    test(`${id} ${screen.area} has 0 serious/critical axe violations`, tc(id), async ({ asRole }, testInfo) => {
      const { resolved, missing } = resolveRoute(screen.route);
      if (missing) {
        recordTc(testInfo, { status: 'NOT RUN', notes: [`Seed missing: set ${missing} in .env to scan ${screen.route}`] });
        test.skip(true, `Seed missing: ${missing}`);
      }
      const { results, finalUrl } = await scanRoute(asRole, screen.role, resolved, { settleFn: settle });
      // If the guard/redirect bounced us off the screen, the scan is not meaningful.
      if (!new URL(finalUrl).pathname.toLowerCase().startsWith(resolved.split('?')[0].toLowerCase().slice(0, 12))) {
        recordTc(testInfo, { status: 'ERROR', notes: [`Did not land on ${resolved} (got ${new URL(finalUrl).pathname})`] });
        throw new Error(`Not on ${resolved}`);
      }
      const blocking = blockingViolations(results);
      recordTc(testInfo, { measured: `${blocking.length} serious/critical`, notes: blocking.length ? blocking.map((v) => `${v.id} (${v.nodes.length})`) : [`${screen.area}: clean`] });
      expect(blocking, formatViolations(blocking)).toHaveLength(0);
    });
  }
});
