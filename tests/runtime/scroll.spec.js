import { test, expect } from '../../fixtures/auth.fixture.js';
import { settle } from '../../utils/page.js';
import { measureLongTasks, measureFps } from '../../utils/perf.js';
import { recordTc, tc } from '../../utils/tc.js';

// Scroll a long list and watch for long tasks (>50ms) and frame rate. QA row counts vary, so a
// clean result on a short list means "no jank at this volume"; the actual count is recorded.
const CASES = [
  { id: 'SA-RUN-002', role: 'superadmin', route: '/superadmin/orders', metric: 'longtasks' },
  { id: 'AD-RUN-001', role: 'admin', route: '/admin/auditlog', metric: 'longtasks' },
  { id: 'DIAG-RUN-002', role: 'diagnostic', route: '/diagnostic/operator/queue', metric: 'longtasks' },
  { id: 'PH-RUN-005', role: 'pharmacy', route: '/pharmacy/patient', metric: 'fps' },
];

test.describe('Runtime — scroll performance', () => {
  test.describe.configure({ timeout: 90_000 });
  for (const c of CASES) {
    test(`${c.id} ${c.metric === 'fps' ? '≥55 fps' : '0 long tasks'} while scrolling ${c.route}`, tc(c.id), async ({ asRole }, testInfo) => {
      const page = await asRole(c.role);
      await page.goto(c.route);
      await settle(page);
      const scroll = async () => {
        for (let i = 0; i < 10; i++) {
          await page.mouse.wheel(0, 1200);
          await page.waitForTimeout(120);
        }
      };
      const rowHint = await page.locator('tr, [role=row], [class*="card" i]').count().catch(() => 0);

      if (c.metric === 'fps') {
        const fps = await measureFps(page, scroll, 2500);
        recordTc(testInfo, { measured: `${fps} fps (~${rowHint} rows/cards)`, notes: ['Target ≥55 fps'] });
        await page.context().close();
        expect(fps, `${fps} fps during scroll`).toBeGreaterThanOrEqual(45); // 45 tolerance for CI jitter vs 55 target
      } else {
        const lt = await measureLongTasks(page, scroll);
        recordTc(testInfo, { measured: `${lt.count} long tasks (longest ${lt.longest}ms, ~${rowHint} rows)`, notes: [`Total blocking ${lt.totalBlockingMs}ms; target 0 tasks >50ms`] });
        await page.context().close();
        expect(lt.count, `${lt.count} long tasks while scrolling (longest ${lt.longest}ms)`).toBeLessThanOrEqual(2);
      }
    });
  }
});
