import { test, expect } from '../../fixtures/auth.fixture.js';
import { getRole } from '../../fixtures/roles.js';
import { API_BASE_URL } from '../../utils/env.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// AD-SEC-003 (IDOR / tenant isolation): an admin must only ever see their own hospital's data.
// 1) Drive admin pages and confirm no API response leaks another hospital's id.
// 2) Replay one hospital-scoped GET with a foreign hospitalId and confirm no foreign data returns.
test.describe('Security — IDOR / tenant isolation', () => {
  test('AD-SEC-003 admin cannot read another hospital\'s data', tc('AD-SEC-003'), async ({ asRole, apiAs }, testInfo) => {
    const myHospital = process.env.HOSPITAL_ID;
    const otherHospital = process.env.OTHER_HOSPITAL_ID;
    test.skip(!myHospital || !otherHospital, 'Seed missing: set HOSPITAL_ID and OTHER_HOSPITAL_ID');

    const page = await asRole('admin');
    const apiCalls = [];
    page.on('response', async (r) => {
      const req = r.request();
      if (!r.url().startsWith(API_BASE_URL()) || !['fetch', 'xhr'].includes(req.resourceType())) return;
      const body = await r.text().catch(() => '');
      apiCalls.push({ url: r.url(), method: req.method(), status: r.status(), body });
    });

    for (const path of ['/admin/auditlog', '/admin/operationsdashboard']) {
      await page.goto(path);
      await settle(page);
    }

    // 1) Tenant isolation on reads: no response should mention the foreign hospital id.
    const leaks = apiCalls.filter((c) => c.body.includes(otherHospital));
    expect(leaks.map((c) => `${c.method} ${new URL(c.url).pathname}`), `admin responses leaked ${otherHospital}`).toEqual([]);

    // 2) Active probe: replay a hospital-scoped GET with the foreign hospitalId.
    const scoped = apiCalls.find((c) => c.method === 'GET' && c.status === 200 && /[?&]hospitalId=/.test(c.url));
    let probeNote = 'No hospitalId-scoped GET observed to tamper with';
    if (scoped) {
      const tampered = new URL(scoped.url);
      tampered.searchParams.set('hospitalId', otherHospital);
      const api = await apiAs('admin');
      const res = await api.get(tampered.href);
      const text = await res.text();
      probeNote = `Tampered ${tampered.pathname}?hospitalId=${otherHospital} → ${res.status()}`;
      // Backend must ignore the tampered param (scope from JWT) or reject it — never serve foreign data.
      expect(text.includes(otherHospital) && res.status() === 200, `tampered request returned foreign hospital data (${res.status()})`).toBe(false);
    }
    recordTc(testInfo, { notes: [`${apiCalls.length} admin API responses checked; all scoped to ${myHospital}`, probeNote] });
  });
});
