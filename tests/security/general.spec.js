import { test, expect } from '../../fixtures/auth.fixture.js';
import { ROLES, ROLE_KEYS, getRole } from '../../fixtures/roles.js';
import { expectBlocked } from '../../utils/page.js';

test.describe('App-wide — security: route guards', () => {
  for (const key of ROLE_KEYS) {
    const role = getRole(key);
    test(`GEN-SEC-001 logged-out visitor cannot open ${role.landing}`, {
      annotation: { type: 'tc', description: 'GEN-SEC-001' },
    }, async ({ page }) => {
      await page.goto(role.landing);
      await expectBlocked(page, role.prefix);
    });
  }

  // 6 roles × 5 foreign prefixes. Positive control is GEN-FUN-001 (own landing loads).
  for (const own of ROLE_KEYS) {
    for (const foreign of ROLE_KEYS.filter((k) => k !== own)) {
      const target = ROLES[foreign];
      test(`GEN-SEC-002 ${own} session cannot open ${target.landing}`, {
        annotation: { type: 'tc', description: 'GEN-SEC-002' },
      }, async ({ asRole }) => {
        const page = await asRole(own);
        await page.goto(target.landing);
        await expectBlocked(page, target.prefix);
      });
    }
  }
});

test.describe('App-wide — security: response headers', () => {
  test('GEN-SEC-050 document response sends CSP / X-Frame-Options / HSTS', {
    annotation: { type: 'tc', description: 'GEN-SEC-050' },
  }, async ({ request, baseURL }, testInfo) => {
    const res = await request.get(baseURL + '/');
    const h = res.headers();
    const csp = h['content-security-policy'] || '';
    const https = baseURL.startsWith('https:');

    const checks = [
      { name: 'Content-Security-Policy', required: true, ok: !!csp, note: h['content-security-policy-report-only'] ? 'only Report-Only is set' : '' },
      { name: 'X-Frame-Options (or CSP frame-ancestors)', required: true, ok: /^(deny|sameorigin)$/i.test(h['x-frame-options'] || '') || /frame-ancestors/i.test(csp) },
      { name: 'Strict-Transport-Security', required: https, ok: /max-age=\d+/i.test(h['strict-transport-security'] || ''), note: https ? '' : 'not applicable over http' },
      { name: 'X-Content-Type-Options: nosniff', required: false, ok: /nosniff/i.test(h['x-content-type-options'] || '') },
      { name: 'Referrer-Policy', required: false, ok: !!h['referrer-policy'] },
    ];

    const report = checks.map((c) => `${c.ok ? 'OK     ' : c.required ? 'MISSING' : 'advise '} ${c.name}${c.note ? ` (${c.note})` : ''}`).join('\n');
    await testInfo.attach('security-headers.txt', { body: `${baseURL}\n\n${report}\n\nRaw headers:\n${JSON.stringify(h, null, 2)}`, contentType: 'text/plain' });
    for (const c of checks.filter((c) => !c.ok)) testInfo.annotations.push({ type: c.required ? 'missing-header' : 'advisory-header', description: c.name });

    // A Vite dev server sends none of these. Run against `vite preview`/QA to see the real config.
    if (process.env.SEC_HEADERS_ENFORCE !== 'false') {
      for (const c of checks.filter((c) => c.required)) expect.soft(c.ok, `missing ${c.name}`).toBe(true);
    }
  });
});
