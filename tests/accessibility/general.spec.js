import { test, expect } from '../../fixtures/auth.fixture.js';
import { APP_WIDE_ROUTES } from '../../test-data/a11y/screens.js';
import { blockingViolations, formatViolations, scanRoute, violationsByRule } from '../../utils/a11y.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// App-wide axe-derived TCs: scan each role's landing once (cached in scanRoute) and derive
// several verdicts. GEN-A11Y-001 is the aggregate; 006/010 slice the same results by rule.
test.describe('Accessibility — app-wide (axe)', () => {
  test.describe.configure({ timeout: 180_000 });

  async function scanAll(asRole) {
    const scans = [];
    for (const { role, route } of APP_WIDE_ROUTES) {
      const { results } = await scanRoute(asRole, role, route, { settleFn: settle });
      scans.push({ route, results });
    }
    return scans;
  }

  test('GEN-A11Y-001 every landing route has 0 serious/critical axe violations', tc('GEN-A11Y-001'), async ({ asRole }, testInfo) => {
    const scans = await scanAll(asRole);
    const perRoute = scans.map(({ route, results }) => ({ route, blocking: blockingViolations(results) }));
    const total = perRoute.reduce((n, r) => n + r.blocking.length, 0);
    recordTc(testInfo, { measured: `${total} serious/critical`, notes: perRoute.map((r) => `${r.route}: ${r.blocking.length ? r.blocking.map((v) => v.id).join(', ') : '0'}`) });
    const worst = perRoute.flatMap((r) => r.blocking);
    expect(worst, formatViolations(worst)).toHaveLength(0);
  });

  test('GEN-A11Y-006 text/controls meet contrast minimums (axe color-contrast)', tc('GEN-A11Y-006'), async ({ asRole }, testInfo) => {
    const scans = await scanAll(asRole);
    const hits = scans.flatMap(({ route, results }) => violationsByRule(results, ['color-contrast']).map((v) => ({ route, nodes: v.nodes.length })));
    const total = hits.reduce((n, h) => n + h.nodes, 0);
    recordTc(testInfo, { measured: `${total} low-contrast node(s)`, notes: hits.length ? hits.map((h) => `${h.route}: ${h.nodes} node(s)`) : ['No color-contrast violations'] });
    expect(total, `color-contrast violations on: ${hits.map((h) => h.route).join(', ')}`).toBe(0);
  });

  test('GEN-A11Y-010 icon-only controls expose an accessible name', tc('GEN-A11Y-010'), async ({ asRole }, testInfo) => {
    const RULES = ['button-name', 'link-name', 'image-alt', 'input-image-alt', 'aria-command-name', 'aria-toggle-field-name'];
    const scans = await scanAll(asRole);
    const hits = scans.flatMap(({ route, results }) => violationsByRule(results, RULES).map((v) => `${route}: ${v.id} (${v.nodes.length})`));
    recordTc(testInfo, { measured: `${hits.length} name issue(s)`, notes: hits.length ? hits : ['All controls have accessible names'] });
    expect(hits, `unnamed controls:\n${hits.join('\n')}`).toEqual([]);
  });
});
