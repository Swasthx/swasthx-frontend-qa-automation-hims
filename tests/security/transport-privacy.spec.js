import { test, expect } from '../../fixtures/auth.fixture.js';
import { getRole } from '../../fixtures/roles.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// Drives a real pharmacy session and inspects its network, console and cookies.
async function sessionProbe(asRole) {
  const page = await asRole('pharmacy');
  const requests = [];
  const consoleLines = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => consoleLines.push(`${m.type()}: ${m.text()}`));
  await page.goto(getRole('pharmacy').landing);
  await settle(page);
  // Exercise a navigation so queue/socket traffic is captured too.
  await page.goto('/pharmacy/queue');
  await settle(page);
  return { page, requests, consoleLines };
}

test.describe('Security — transport & data exposure', () => {
  // GEN-SEC-060: all app traffic is HTTPS/WSS; no cleartext http:// or ws:// calls.
  test('GEN-SEC-060 no cleartext (http/ws) requests during a session', tc('GEN-SEC-060'), async ({ asRole }, testInfo) => {
    const { page, requests } = await sessionProbe(asRole);
    const appHost = new URL(page.url()).host;
    // Only flag calls to the app's own / API hosts; ignore unrelated third parties' own schemes.
    const cleartext = requests.filter((u) => /^(http:|ws:)\/\//.test(u) && !u.startsWith('http://localhost'));
    recordTc(testInfo, { measured: `${requests.length} requests`, notes: cleartext.length ? [...new Set(cleartext)].slice(0, 6) : ['All requests used https/wss'], env: appHost });
    expect([...new Set(cleartext)], `cleartext requests:\n${[...new Set(cleartext)].join('\n')}`).toEqual([]);
  });

  // GEN-SEC-062: PHI/PII (e.g. phone numbers) must not travel in URLs / query strings.
  test('GEN-SEC-062 no PII in URLs or query strings', tc('GEN-SEC-062'), async ({ asRole }, testInfo) => {
    const { requests } = await sessionProbe(asRole);
    const phoneLike = requests.filter((u) => /[?&/](phone|mobile|mobileNumber)=/i.test(u) || /\b[6-9]\d{9}\b/.test(new URL(u).search));
    recordTc(testInfo, { notes: phoneLike.length ? [...new Set(phoneLike.map((u) => new URL(u).pathname + new URL(u).search.replace(/\d{6,}/g, '******')))].slice(0, 6) : ['No phone/mobile in query strings'] });
    expect(phoneLike.length, `PII in URL query:\n${phoneLike.slice(0, 4).join('\n')}`).toBe(0);
  });

  // GEN-SEC-063: state-changing requests authenticate with a Bearer header, not an auth cookie
  // (so CSRF risk is low). Confirm no auth/session cookie is set for the app origin.
  test('GEN-SEC-063 auth is Bearer-header based, not cookie (CSRF-resistant)', tc('GEN-SEC-063'), async ({ asRole }, testInfo) => {
    const { page } = await sessionProbe(asRole);
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter((c) => /token|session|auth|jwt|sid/i.test(c.name));
    recordTc(testInfo, { notes: [`${cookies.length} cookies for origin`, authCookies.length ? `Auth-like cookies: ${authCookies.map((c) => `${c.name}(httpOnly=${c.httpOnly})`).join(', ')}` : 'No auth cookies (token lives in sessionStorage; requests use Authorization: Bearer)'] });
    expect(authCookies, 'auth cookie present → re-check CSRF posture').toEqual([]);
  });

  // GEN-SEC-061: no token / PHI in the browser console on a deployed build.
  test('GEN-SEC-061 no token or PII logged to the console', tc('GEN-SEC-061'), async ({ asRole }, testInfo) => {
    const { consoleLines } = await sessionProbe(asRole);
    const leaky = consoleLines.filter((l) => /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(l) || /\b[6-9]\d{9}\b/.test(l) || /refreshToken|"token"/i.test(l));
    recordTc(testInfo, { measured: `${consoleLines.length} console lines`, notes: leaky.length ? leaky.slice(0, 5).map((l) => l.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<jwt>').replace(/\b[6-9]\d{9}\b/g, '<phone>').slice(0, 120)) : ['No token/PII in console'] });
    expect(leaky.length, 'token/PII in console').toBe(0);
  });
});
