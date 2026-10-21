import { request } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { ROLES, ROLE_KEYS, getRole } from '../../fixtures/roles.js';
import { BASE_URL } from '../../utils/env.js';
import { expectBlocked } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// Route-guard TC per target module (Security sheet). Doctor routes have no cross-role TC of
// their own, so those checks count toward GEN-SEC-002 (guard actually runs on the routes).
const GUARD_TC = { superadmin: 'SA-SEC-001', admin: 'AD-SEC-001', reception: 'RCP-SEC-001', doctor: 'GEN-SEC-002', diagnostic: 'DIAG-SEC-001', pharmacy: 'PH-SEC-001' };
const NO_TOKEN_TC = { ...GUARD_TC, doctor: 'DOC-SEC-001' };

test.describe('App-wide — security: route guards', () => {
  for (const key of ROLE_KEYS) {
    const role = getRole(key);
    test(`${NO_TOKEN_TC[key]} logged-out visitor cannot open ${role.landing}`, tc(NO_TOKEN_TC[key]), async ({ page }) => {
      await page.goto(role.landing);
      await expectBlocked(page, role.prefix);
    });
  }

  // 6 roles × 5 foreign prefixes. Positive control is GEN-FUN-001 (own landing loads).
  for (const own of ROLE_KEYS) {
    for (const foreign of ROLE_KEYS.filter((k) => k !== own)) {
      const target = ROLES[foreign];
      test(`${GUARD_TC[foreign]} ${own} session cannot open ${target.landing}`, tc(GUARD_TC[foreign]), async ({ asRole }) => {
        const page = await asRole(own);
        await page.goto(target.landing);
        await expectBlocked(page, target.prefix);
      });
    }
  }
});

// One TC per header (GEN-SEC-050…054). The document is fetched once per worker.
test.describe('App-wide — security: response headers', () => {
  let headers;
  // beforeAll can't use test-scoped fixtures (request, baseURL), so build a context here.
  test.beforeAll(async () => {
    const ctx = await request.newContext();
    headers = (await ctx.get(BASE_URL())).headers();
    await ctx.dispose();
  });

  const HEADER_CHECKS = [
    {
      id: 'GEN-SEC-050',
      name: 'Content-Security-Policy',
      check: (h) => ({ ok: !!h['content-security-policy'], value: h['content-security-policy'] ?? (h['content-security-policy-report-only'] ? `report-only: ${h['content-security-policy-report-only']}` : undefined) }),
    },
    {
      id: 'GEN-SEC-051',
      name: 'X-Frame-Options / frame-ancestors',
      check: (h) => ({ ok: /^(deny|sameorigin)$/i.test(h['x-frame-options'] || '') || /frame-ancestors/i.test(h['content-security-policy'] || ''), value: h['x-frame-options'] }),
    },
    {
      id: 'GEN-SEC-052',
      name: 'Strict-Transport-Security',
      check: (h, https) => ({ ok: !https || /max-age=\d+/i.test(h['strict-transport-security'] || ''), value: h['strict-transport-security'] ?? (https ? undefined : 'n/a over http') }),
    },
    {
      id: 'GEN-SEC-053',
      name: 'X-Content-Type-Options: nosniff',
      check: (h) => ({ ok: /nosniff/i.test(h['x-content-type-options'] || ''), value: h['x-content-type-options'] }),
    },
    {
      id: 'GEN-SEC-054',
      name: 'Referrer-Policy + Permissions-Policy',
      check: (h) => ({ ok: !!h['referrer-policy'] && !!h['permissions-policy'], value: `referrer-policy=${h['referrer-policy'] ?? '∅'}; permissions-policy=${h['permissions-policy'] ?? '∅'}` }),
    },
  ];

  for (const c of HEADER_CHECKS) {
    test(`${c.id} document response sends ${c.name}`, tc(c.id), async ({ baseURL }, testInfo) => {
      const { ok, value } = c.check(headers, baseURL.startsWith('https:'));
      recordTc(testInfo, { measured: value ?? 'missing' });
      if (process.env.SEC_HEADERS_ENFORCE === 'false') return;
      expect(ok, `${c.name}: ${value ?? 'missing'}`).toBe(true);
    });
  }
});
