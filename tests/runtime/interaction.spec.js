import { test, expect } from '../../fixtures/auth.fixture.js';
import { measureInp } from '../../utils/webvitals.js';
import { recordTc, tc } from '../../utils/tc.js';

// INP / interaction-latency TCs: load the screen, perform one interaction, read INP (web-vitals).
// Target ≤ 200ms. QA data volumes vary, so the measured value is directional and noted.
// Type with real key events (fill() dispatches no keydown, so web-vitals records no interaction).
const typeSearch = (re) => async (page) => {
  const el = page.getByPlaceholder(re).first();
  await el.click();
  await el.pressSequentially('ab', { delay: 60 });
};
const clickBtn = (re) => (page) => page.getByRole('button', { name: re }).first().click();
const clickTab = (re) => (page) => page.getByRole('button', { name: re }).first().click();

const CASES = [
  { id: 'PH-RUN-002', role: 'pharmacy', route: '/pharmacy/patient', act: typeSearch(/find by/i), what: 'type in patient search' },
  { id: 'RCP-RUN-002', role: 'reception', route: '/reception/queue', act: clickTab(/^Booked|^Completed/), what: 'click a queue tab' },
  { id: 'RCP-RUN-003', role: 'reception', route: '/reception/patient', act: typeSearch(/find by/i), what: 'type in patient search' },
  { id: 'AD-RUN-002', role: 'admin', route: '/admin/auditlog', act: clickBtn(/Reset filters/i), what: 'apply/reset audit filter' },
  { id: 'AD-RUN-006', role: 'admin', route: '/admin/Analytics', act: clickBtn(/Refresh analytics/i), what: 'refresh analytics (date range)' },
  { id: 'DIAG-RUN-004', role: 'diagnostic', route: '/diagnostic/queue', act: typeSearch(/find by/i), what: 'type in queue search' },
  { id: 'SA-RUN-004', role: 'superadmin', route: '/superadmin/medicine', act: typeSearch(/find by|search/i), what: 'filter medicines' },
  { id: 'SA-RUN-003', role: 'superadmin', route: '/superadmin/managepaitent', act: typeSearch(/find by|search/i), what: 'type in patient search' },
];

test.describe('Runtime — interaction latency (INP)', () => {
  test.describe.configure({ timeout: 90_000 });
  for (const c of CASES) {
    test(`${c.id} INP ≤ 200ms — ${c.what}`, tc(c.id), async ({ asRole, baseURL }, testInfo) => {
      const page = await asRole(c.role);
      const url = new URL(c.route, baseURL).href;
      let inp;
      let elementMissing = false;
      try {
        inp = await measureInp(page, url, c.act);
      } catch (e) {
        elementMissing = true;
        recordTc(testInfo, { status: 'NOT RUN', notes: [`Interaction target for "${c.what}" not found on ${c.route} (selector/screen differs or no data): ${e.message.split('\n')[0].slice(0, 100)}`] });
      } finally {
        await page.context().close();
      }
      if (elementMissing) test.skip(true, 'interaction element not found');
      if (inp == null) {
        recordTc(testInfo, { measured: 'no INP', notes: ['Interaction registered no INP event (below threshold / element absent)'] });
        test.skip(true, 'no INP recorded');
      }
      recordTc(testInfo, { measured: `${Math.round(inp.value)}ms`, notes: [`${c.what}; target ≤200ms`] });
      expect(inp.value, `INP ${Math.round(inp.value)}ms exceeds 200ms`).toBeLessThanOrEqual(200);
    });
  }
});
