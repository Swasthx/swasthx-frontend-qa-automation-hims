import { request, chromium } from '@playwright/test';
import { API_BASE_URL, BASE_URL } from './env.js';
import { getRole, roleCreds } from '../fixtures/roles.js';
import { SESSION_KEYS, jwtExpiry, saveBundle } from './session.js';

const DEFAULT_TEMPLATE = '{"phone":"{{phone}}","password":"{{password}}","otp":"{{otp}}"}';

function buildLoginBody(roleKey) {
  const creds = roleCreds(roleKey);
  const vars = { ...creds, role: getRole(roleKey).roleString };
  const template = JSON.parse(process.env.LOGIN_BODY_TEMPLATE || DEFAULT_TEMPLATE);
  const body = {};
  for (const [k, v] of Object.entries(template)) {
    const value = typeof v === 'string' ? v.replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? '') : v;
    if (value !== '') body[k] = value;
  }
  return body;
}

// The response shape isn't documented here, so look in the usual envelopes.
function pick(json, ...names) {
  for (const scope of [json, json?.data, json?.result, json?.data?.user, json?.user]) {
    if (!scope || typeof scope !== 'object') continue;
    for (const n of names) if (scope[n] !== undefined && scope[n] !== null) return scope[n];
  }
  return undefined;
}

function toSessionString(v) {
  if (v === undefined || v === null) return undefined;
  return typeof v === 'string' ? v : JSON.stringify(v);
}

export function hasCreds(roleKey) {
  const c = roleCreds(roleKey);
  return Boolean(c.phone && (c.password || c.otp));
}

/** Programmatic login: POST ${API_BASE_URL}${LOGIN_PATH} and turn the response into a session bundle. */
export async function apiLogin(roleKey) {
  const role = getRole(roleKey);
  const loginPath = process.env.LOGIN_PATH || '/auth/login';
  const ctx = await request.newContext();
  try {
    const res = await ctx.post(`${API_BASE_URL()}${loginPath}`, { data: buildLoginBody(roleKey) });
    const text = await res.text();
    if (!res.ok()) throw new Error(`login ${res.status()} for ${roleKey}: ${text.slice(0, 300)}`);
    const json = JSON.parse(text);

    const token = pick(json, 'token', 'accessToken', 'access_token');
    if (!token) throw new Error(`login response for ${roleKey} had no token field: ${text.slice(0, 300)}`);

    const session = {
      token: toSessionString(token),
      refreshToken: toSessionString(pick(json, 'refreshToken', 'refresh_token')),
      role: toSessionString(pick(json, 'role')) ?? role.roleString,
      permissions: toSessionString(pick(json, 'permissions')),
      impersonatedBy: toSessionString(pick(json, 'impersonatedBy')),
    };
    const bundle = { role: roleKey, source: 'api', capturedAt: Date.now(), expiresAt: jwtExpiry(session.token), session };
    saveBundle(roleKey, bundle);
    return bundle;
  } finally {
    await ctx.dispose();
  }
}

/**
 * UI-login fallback: opens a headed browser on the login page, a human completes
 * phone + OTP + reCAPTCHA, and the tokens the app writes to sessionStorage are saved.
 * Run with `npm run auth:manual -- <role>`; tokens are reused until they expire.
 *
 * TODO(automate): if QA gets a reCAPTCHA test key and a fixed OTP, fill the form here
 * (phone input → "Send OTP" → OTP input → submit) instead of waiting for a human.
 */
export async function uiLogin(roleKey, { timeoutMs = 5 * 60 * 1000 } = {}) {
  getRole(roleKey);
  const browser = await chromium.launch({ headless: false });
  try {
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${BASE_URL()}${process.env.UI_LOGIN_PATH || '/'}`);
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
