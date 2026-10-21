import { test as base, expect, request } from '@playwright/test';
import { getRole } from './roles.js';
import { isBundleFresh, loadBundle, seedSessionStorage, withRoleLock } from '../utils/session.js';
import { apiLogin, hasCreds, refreshLogin } from '../utils/login.js';
import { API_BASE_URL } from '../utils/env.js';

// A seeded token must outlive the test that uses it. Otherwise the app refreshes it
// itself mid-test, the backend rotates the shared refreshToken, and every other context
// holding the old one gets logged out.
const MIN_TOKEN_LIFE_MS = 4 * 60 * 1000;

/**
 * Returns a token bundle with at least MIN_TOKEN_LIFE_MS left. Refreshes (or, if the
 * refresh token is dead too, logs in again) under a per-role lock, so parallel workers
 * do it once. Skips the test when the role has no usable account at all.
 */
export async function ensureBundle(roleKey, testInfo) {
  getRole(roleKey);
  const hint = `Set TEST_${roleKey.toUpperCase()}_PHONE/_OTP in .env or run \`npm run auth:manual -- ${roleKey}\`.`;
  const cached = loadBundle(roleKey);
  testInfo.skip(!cached?.session?.token, `No token for role "${roleKey}". ${hint}`);
  if (isBundleFresh(cached, MIN_TOKEN_LIFE_MS)) return cached;

  return withRoleLock(roleKey, async () => {
    const latest = loadBundle(roleKey);
    if (isBundleFresh(latest, MIN_TOKEN_LIFE_MS)) return latest; // another worker refreshed it
    try {
      return await refreshLogin(roleKey, latest);
    } catch (err) {
      if (process.env.AUTH_MODE === 'manual' || !hasCreds(roleKey)) {
        testInfo.skip(true, `Token for "${roleKey}" expired and can't be renewed (${err.message}). ${hint}`);
      }
      return apiLogin(roleKey);
    }
  });
}

/**
 * Seeds the role's sessionStorage on every page in the context, before any app script runs.
 * storageState can't do this: it only persists cookies and localStorage.
 */
export async function authenticate(context, roleKey, baseURL, testInfo) {
  const bundle = await ensureBundle(roleKey, testInfo);
  await context.addInitScript(seedSessionStorage, { origin: new URL(baseURL).origin, session: bundle.session });
  testInfo.annotations.push({ type: 'role', description: roleKey });
}

// Last line of defence behind the global-setup URL check: the frontend's own env decides which
// API it calls, so a dev server still pointing at production would slip past BASE_URL checks.
// Any browser request to a host matching BLOCK_HOSTS_REGEX is aborted and fails the test.
const BLOCK_HOSTS = new RegExp(process.env.BLOCK_HOSTS_REGEX || 'production', 'i');

async function guardContext(context) {
  const blocked = [];
  await context.route(
    (url) => BLOCK_HOSTS.test(url.hostname),
    (route) => {
      blocked.push(`${route.request().method()} ${route.request().url()}`);
      return route.abort('blockedbyclient');
    },
  );
  return () => {
    if (blocked.length) {
      throw new Error(`Blocked ${blocked.length} request(s) to production-looking hosts. Point the frontend at the local/QA API.\n${[...new Set(blocked)].slice(0, 5).join('\n')}`);
    }
  };
}

// Context options a manually created context should share with the project's default one.
function projectContextOptions(testInfo) {
  const u = testInfo.project.use;
  const keys = ['viewport', 'userAgent', 'deviceScaleFactor', 'isMobile', 'hasTouch', 'locale', 'timezoneId', 'ignoreHTTPSErrors', 'colorScheme'];
  return Object.fromEntries(keys.filter((k) => u[k] !== undefined).map((k) => [k, u[k]]));
}

export const test = base.extend({
  // Usage: test.use({ role: 'pharmacy' }) → the default `page` is logged in as pharmacy.
  role: [null, { option: true }],

  context: async ({ context, role, baseURL }, use, testInfo) => {
    const assertNoProdTraffic = await guardContext(context);
    if (role) await authenticate(context, role, baseURL, testInfo);
    await use(context);
    assertNoProdTraffic();
  },

  // Usage: const page = await asRole('doctor'); — an isolated, logged-in page. Can be called
  // several times in one test for cross-role scenarios. Contexts are closed after the test.
  asRole: async ({ browser, baseURL }, use, testInfo) => {
    const contexts = [];
    const checks = [];
    await use(async (roleKey, contextOptions = {}) => {
      const context = await browser.newContext({ ...projectContextOptions(testInfo), baseURL, ...contextOptions });
      contexts.push(context);
      checks.push(await guardContext(context));
      await authenticate(context, roleKey, baseURL, testInfo);
      return context.newPage();
    });
    for (const c of contexts) await c.close();
    for (const check of checks) check();
  },

  // Usage: const api = await apiAs('pharmacy'); await api.post(apiUrl('/x'), { data })
  // Direct API calls with the role's token, for checks that are business rules rather than UI.
  apiAs: async ({}, use, testInfo) => {
    const contexts = [];
    await use(async (roleKey) => {
      const bundle = await ensureBundle(roleKey, testInfo);
      const scheme = process.env.API_AUTH_SCHEME ?? 'Bearer';
      const ctx = await request.newContext({
        extraHTTPHeaders: { Authorization: scheme ? `${scheme} ${bundle.session.token}` : bundle.session.token },
      });
      contexts.push(ctx);
      return ctx;
    });
    for (const c of contexts) await c.dispose();
  },
});

export { expect };

/** Collects uncaught exceptions, console errors and failed API responses for a page. */
export function trackErrors(page) {
  const errors = { pageErrors: [], consoleErrors: [], failedResponses: [] };
  page.on('pageerror', (e) => errors.pageErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.consoleErrors.push(m.text()));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(API_BASE_URL())) errors.failedResponses.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  return errors;
}
