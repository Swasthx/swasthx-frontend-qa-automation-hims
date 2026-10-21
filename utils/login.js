import { request, chromium } from '@playwright/test';
import { API_BASE_URL, BASE_URL } from './env.js';
import { getRole, roleCreds } from '../fixtures/roles.js';
import { SESSION_KEYS, jwtExpiry, saveBundle } from './session.js';

// The same three calls the login screen makes (src/pages/LogInPages/Login.jsx).
// reCAPTCHA is only checked in the browser, so the API flow doesn't need it.
const SEND_OTP = '/auth/confirmMobileNumber'; // { mobileNumber }
const VERIFY_OTP = '/auth/verifyMobileOTP'; //   { mobileNumber, otp }
const LOGIN = '/auth/login'; //                  { mobile, forceLogin }
const REFRESH = '/auth/refresh'; //              { refreshToken }

// A cold dev backend can take >30s on the first OTP request.
const REQUEST_TIMEOUT_MS = 60_000;

// The app stores an array; the API may return { resource: { read, write, override } }.
function normalizePermissions(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([resource, f]) => ({
      resource,
      read: f?.read ?? false,
      write: f?.write ?? false,
      override: f?.override ?? false,
    }));
  }
  return [];
}

async function post(ctx, path, data) {
  const res = await ctx.post(`${API_BASE_URL()}${path}`, { data, failOnStatusCode: false });
  const json = await res.json().catch(() => ({}));
  return { status: res.status(), ok: res.ok() && !json?.errorCode, json };
}

const describe = (r) => `${r.status} ${r.json?.errorCode ?? ''} ${r.json?.message ?? ''}`.trim();

export function hasCreds(roleKey) {
  const c = roleCreds(roleKey);
  return Boolean(c.phone && c.otp);
}

/**
 * Programmatic login: send OTP → verify OTP → login, then turn the response into the
 * sessionStorage bundle the app would have written itself.
 *
 * - Only works without SMS for numbers on the backend's test list (fixed OTP).
 * - The OTP is verified exactly once: 5 wrong attempts lock the number for 5 minutes.
 * - forceLogin: true replaces any open session for the account, so a person logged in
 *   with the same test number in a browser gets logged out.
 */
export async function apiLogin(roleKey) {
  const role = getRole(roleKey);
  const { phone, otp } = roleCreds(roleKey);
  const ctx = await request.newContext({ timeout: REQUEST_TIMEOUT_MS });
  try {
    let r = await post(ctx, SEND_OTP, { mobileNumber: phone });
    if (r.status === 429 && r.json?.errorCode === 'OTP_COOLDOWN') {
      // 60s resend cooldown (e.g. auth:refresh right after a run): wait it out once.
      const secs = Number(/(\d+)\s*second/.exec(r.json.message)?.[1] ?? 60);
      console.log(`[auth] ${roleKey}: OTP cooldown, waiting ${secs}s…`);
      await new Promise((res) => setTimeout(res, (secs + 1) * 1000));
      r = await post(ctx, SEND_OTP, { mobileNumber: phone });
    }
    if (!r.ok) throw new Error(`send OTP: ${describe(r)}`);

    r = await post(ctx, VERIFY_OTP, { mobileNumber: phone, otp });
    if (!r.ok) throw new Error(`verify OTP: ${describe(r)}`);

    r = await post(ctx, LOGIN, { mobile: phone, forceLogin: true });
    if (!r.ok || !r.json?.token) throw new Error(`login: ${describe(r)}`);
    const j = r.json;

    if (j.role && j.role !== role.roleString) {
      console.warn(`[auth] ${roleKey}: account ${phone} has role "${j.role}", expected "${role.roleString}"`);
    }

    const bundle = toBundle(roleKey, 'api', j, j.lastLoginAt ?? '');
    saveBundle(roleKey, bundle);
    return bundle;
  } finally {
    await ctx.dispose();
  }
}

function toBundle(roleKey, source, j, lastLogin) {
  const session = {
    token: j.token,
    refreshToken: j.refreshToken,
    role: j.role,
    permissions: JSON.stringify(normalizePermissions(j.permissions)),
    impersonatedBy: j.impersonatedBy ?? '',
    lastLogin,
  };
  return { role: roleKey, source, capturedAt: Date.now(), expiresAt: jwtExpiry(session.token), session };
}

/**
 * Exchanges the bundle's refreshToken for a new token pair, the way the app's axios
 * interceptor does. The backend rotates the refreshToken, so the old pair is dead
 * afterwards: callers must hold the role lock (see fixtures/auth.fixture.js).
 */
export async function refreshLogin(roleKey, bundle) {
  // /auth/refresh requires BOTH the refreshToken (body) and the current access token
  // (Authorization: Bearer) — body alone returns 401.
  const scheme = process.env.API_AUTH_SCHEME ?? 'Bearer';
  const ctx = await request.newContext({
    timeout: REQUEST_TIMEOUT_MS,
    extraHTTPHeaders: { Authorization: scheme ? `${scheme} ${bundle.session.token}` : bundle.session.token },
  });
  try {
    const r = await post(ctx, REFRESH, { refreshToken: bundle.session.refreshToken });
    if (!r.ok || !r.json?.token) throw new Error(`refresh: ${describe(r)}`);
    const next = toBundle(roleKey, `${bundle.source}+refresh`, r.json, bundle.session.lastLogin ?? '');
    saveBundle(roleKey, next);
    return next;
  } finally {
    await ctx.dispose();
  }
}

/**
 * Manual fallback: opens a headed browser on the login page, a human completes
 * phone + OTP + reCAPTCHA, and the tokens the app writes to sessionStorage are saved.
 * Run with `npm run auth:manual -- <role>`. Tokens are reused until they expire.
 */
export async function uiLogin(roleKey, { timeoutMs = 5 * 60 * 1000 } = {}) {
  getRole(roleKey);
  const browser = await chromium.launch({ headless: false });
  try {
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${BASE_URL()}${process.env.UI_LOGIN_PATH || '/login'}`);
    console.log(`[auth:manual] Log in as the ${roleKey} test account in the opened window (timeout ${timeoutMs / 1000}s)…`);
    await page.waitForFunction(() => !!window.sessionStorage.getItem('token'), null, { timeout: timeoutMs, polling: 500 });

    // Take the values verbatim, exactly as the app stored them.
    const session = await page.evaluate(
      (keys) => Object.fromEntries(keys.map((k) => [k, window.sessionStorage.getItem(k) ?? undefined])),
      SESSION_KEYS,
    );
    const bundle = { role: roleKey, source: 'manual', capturedAt: Date.now(), expiresAt: jwtExpiry(session.token), session };
    saveBundle(roleKey, bundle);
    return bundle;
  } finally {
    await browser.close();
  }
}
