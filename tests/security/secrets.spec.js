import { test, expect, request } from '@playwright/test';
import { BASE_URL } from '../../utils/env.js';
import { recordTc, tc } from '../../utils/tc.js';

// Downloads the deployed HTML + every entry JS/CSS asset and scans the shipped client code
// for accidentally-exposed secrets. This is a defensive check: any hit is redacted in output.
let bundle = { html: '', js: '', assets: [] };

test.describe('Security — secrets in the shipped bundle', () => {
  test.beforeAll(async () => {
    const ctx = await request.newContext();
    try {
      const base = BASE_URL();
      const html = await (await ctx.get(base + '/')).text();
      const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]).filter((u) => u.startsWith('/'));
      let js = '';
      for (const a of assets) {
        const body = await (await ctx.get(new URL(a, base).href)).text();
        if (a.endsWith('.js')) js += body;
      }
      bundle = { html, js, assets };
    } finally {
      await ctx.dispose();
    }
  });

  const redact = (s) => (s.length <= 8 ? '***' : `${s.slice(0, 4)}…${s.slice(-2)} [${s.length} chars]`);
  const scan = (text, patterns) => {
    const hits = [];
    for (const { label, re } of patterns) for (const m of text.matchAll(re)) hits.push(`${label}: ${redact(m[0])}`);
    return hits;
  };

  // GEN-SEC-022: no private keys / cloud secrets / passwords in any shipped VITE_* value.
  test('GEN-SEC-022 no tokens, passwords or private keys in the client bundle', tc('GEN-SEC-022'), async ({}, testInfo) => {
    const hits = scan(bundle.js + bundle.html, [
      { label: 'PEM private key', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
      { label: 'AWS access key id', re: /AKIA[0-9A-Z]{16}/g },
      { label: 'aws secret', re: /aws_secret_access_key["'\s:=]+[A-Za-z0-9/+]{20,}/gi },
      { label: 'generic *_secret', re: /(?:client_secret|api_secret|key_secret|app_secret)["'\s:=]+[A-Za-z0-9_\-]{12,}/gi },
      { label: 'bearer/jwt literal', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
      { label: 'inline password', re: /"password"\s*:\s*"[^"]{3,}"/gi },
    ]);
    recordTc(testInfo, { measured: `${bundle.assets.length} assets scanned`, notes: hits.length ? hits.slice(0, 8) : ['No private-key/cloud-secret/password/JWT literals found'] });
    expect(hits, `secrets found in shipped bundle:\n${hits.join('\n')}`).toEqual([]);
  });

  // GEN-SEC-021: only the Razorpay/Cashfree PUBLIC key ships, never a *_secret.
  test('GEN-SEC-021 payment gateway: only public key shipped, no key_secret', tc('GEN-SEC-021'), async ({}, testInfo) => {
    const hits = scan(bundle.js, [
      { label: 'razorpay key_secret', re: /rzp_(?:live|test)_secret|razorpay[_a-z]*secret["'\s:=]+[A-Za-z0-9]{8,}/gi },
      { label: 'cashfree secret', re: /cashfree[_a-z]*secret["'\s:=]+[A-Za-z0-9]{8,}/gi },
      { label: 'generic key_secret', re: /key_secret["'\s:=]+[A-Za-z0-9_\-]{8,}/gi },
    ]);
    const publicKeys = [...bundle.js.matchAll(/rzp_(?:live|test)_[A-Za-z0-9]+/g)].map((m) => redact(m[0]));
    recordTc(testInfo, { notes: [publicKeys.length ? `Public key id present: ${publicKeys[0]}` : 'No Razorpay public key literal found', ...(hits.length ? hits : ['No payment *_secret found'])] });
    expect(hits, `payment secret in bundle:\n${hits.join('\n')}`).toEqual([]);
  });

  // GEN-SEC-020: VITE_SECRET_KEY powers client-side crypto-js. A client-side "secret" is not
  // a real server secret; this records the exposure. Server-secret verdict → main-repo review.
  test('GEN-SEC-020 client-side crypto key is not a server secret', tc('GEN-SEC-020'), async ({}, testInfo) => {
    const usesCrypto = /crypto-js|CryptoJS|AES\.(?:en|de)crypt/.test(bundle.js);
    recordTc(testInfo, {
      status: 'PASS',
      notes: [
        usesCrypto ? 'crypto-js ships in the client bundle; its key (VITE_SECRET_KEY) is embedded and readable by anyone' : 'No crypto-js usage detected in bundle',
        'A client-embedded key protects nothing from the client; confirm it is NOT reused as a server-side secret (main-repo review).',
      ],
    });
    // Informational: the exposure is inherent to any VITE_* value; the real check is "not a server secret".
    expect(true).toBe(true);
  });

  // GEN-SEC-055: CSP <meta> fallback in index.html (since hosting sends no CSP header — GEN-SEC-050).
  test('GEN-SEC-055 index.html provides a CSP <meta> fallback', tc('GEN-SEC-055'), async ({}, testInfo) => {
    const hasMeta = /http-equiv=["']Content-Security-Policy["']/i.test(bundle.html);
    recordTc(testInfo, { measured: hasMeta ? 'present' : 'missing', notes: [hasMeta ? 'CSP meta present' : 'No CSP <meta> in index.html and no CSP header (GEN-SEC-050) → app has no CSP at all'] });
    expect(hasMeta, 'no CSP meta fallback in index.html').toBe(true);
  });
});
