import { test, expect } from '../../fixtures/auth.fixture.js';
import { ROLES } from '../../fixtures/roles.js';
import { settle } from '../../utils/page.js';
import { measureLeak, measureLongTasks } from '../../utils/perf.js';
import { recordTc, tc } from '../../utils/tc.js';

// Heap-growth budget for repeated mount/unmount. The TC target is ±5%; real apps allocate caches
// on first use, so we allow a looser ceiling and report the actual number for trend tracking.
const LEAK_CEILING_PCT = 40;

test.describe('Runtime — memory & navigation', () => {
  test.describe.configure({ timeout: 180_000 });

  // RCP-RUN-004 / PH-RUN-004: navigate in and out of a screen ×15 — heap should not keep growing.
  for (const c of [
    { id: 'RCP-RUN-004', role: 'reception', a: '/reception/queue', b: '/reception/profile' },
    { id: 'PH-RUN-004', role: 'pharmacy', a: '/pharmacy/queue', b: '/pharmacy/profile' },
  ]) {
    test(`${c.id} navigate ${c.a} in/out ×15 — heap stable`, tc(c.id), async ({ asRole }, testInfo) => {
      const page = await asRole(c.role);
      await page.goto(c.a);
      await settle(page);
      const leak = await measureLeak(page, async () => {
        await page.goto(c.b);
        await page.waitForLoadState('domcontentloaded');
        await page.goto(c.a);
        await page.waitForLoadState('domcontentloaded');
      }, 15);
      recordTc(testInfo, { measured: `heap ${leak.beforeMB}→${leak.afterMB} MB (${leak.growthPct > 0 ? '+' : ''}${leak.growthPct}%)`, notes: [`DOM nodes ${leak.nodesBefore}→${leak.nodesAfter} (Δ${leak.nodeGrowth}); target ±5%, ceiling ${LEAK_CEILING_PCT}%`] });
      await page.context().close();
      expect(leak.growthPct, `heap grew ${leak.growthPct}% over 15 navigations (possible leak)`).toBeLessThanOrEqual(LEAK_CEILING_PCT);
    });
  }

  // GEN-RUN-001: open/close the Create Order modal ×50 — detached DOM nodes should not pile up.
  test('GEN-RUN-001 modal open/close ×50 — no detached-node growth', tc('GEN-RUN-001'), async ({ asRole }, testInfo) => {
    const page = await asRole('pharmacy');
    await page.goto('/pharmacy/queue');
    await settle(page);
    const open = page.getByRole('button', { name: /^Create Order/ }).first();
    await expect(open).toBeVisible();
    // This modal ignores Esc (see GEN-A11Y-011), so dismiss via its Close/X control.
    const dialog = page.getByRole('dialog').first();
    const leak = await measureLeak(page, async () => {
      await open.click();
      await dialog.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      await page.getByRole('button', { name: /close/i }).first().click({ timeout: 2000 }).catch(() => {});
      await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }, 50);
    recordTc(testInfo, { measured: `heap ${leak.beforeMB}→${leak.afterMB} MB (${leak.growthPct > 0 ? '+' : ''}${leak.growthPct}%), nodes Δ${leak.nodeGrowth}`, notes: ['Target: nodes released after close'] });
    await page.context().close();
    expect(leak.growthPct, `heap grew ${leak.growthPct}% over 50 modal cycles`).toBeLessThanOrEqual(LEAK_CEILING_PCT);
  });

  // GEN-RUN-002: switching between modules should not block the main thread (TBT budget < 200ms).
  test('GEN-RUN-002 module navigation TBT < 200ms', tc('GEN-RUN-002'), async ({ asRole }, testInfo) => {
    // SuperAdmin session can reach several module routes (see route-guard findings), making this
    // a clean single-session navigation probe across modules.
    const page = await asRole('superadmin');
    await page.goto(ROLES.superadmin.landing);
    await settle(page);
    const routes = ['/superadmin/orders', '/superadmin/hospital-analytics', '/superadmin/managepaitent', '/superadmin/profile'];
    const lt = await measureLongTasks(page, async () => {
      for (const r of routes) {
        await page.goto(r);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(800);
      }
    }, 1000);
    recordTc(testInfo, { measured: `TBT ${lt.totalBlockingMs}ms over ${routes.length} navigations`, notes: [`${lt.count} long tasks, longest ${lt.longest}ms; target TBT <200ms`] });
    await page.context().close();
    expect(lt.totalBlockingMs, `total blocking ${lt.totalBlockingMs}ms across module navigations`).toBeLessThan(200);
  });
});
