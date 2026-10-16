import { test as base, expect, request } from '@playwright/test';
import { getRole } from './roles.js';
import { isBundleFresh, loadBundle, seedSessionStorage } from '../utils/session.js';
import { API_BASE_URL } from '../utils/env.js';

// Fails up front with a skip (not an error) when the role has no usable token,
// so a missing account doesn't turn into a vague "redirected to login" failure.
function requireBundle(roleKey, testInfo) {
  getRole(roleKey);
  const bundle = loadBundle(roleKey);
  testInfo.skip(
    !isBundleFresh(bundle, 0),
    `No valid token for role "${roleKey}". Set TEST_${roleKey.toUpperCase()}_* in .env or run \`npm run auth:manual -- ${roleKey}\`.`,
  );
  return bundle;
}

/**
 * Seeds the role's sessionStorage on every page in the context, before any app script runs.
 * storageState can't do this: it only persists cookies and localStorage.
 */
export async function authenticate(context, roleKey, baseURL, testInfo) {
  const bundle = requireBundle(roleKey, testInfo);
  await context.addInitScript(seedSessionStorage, { origin: new URL(baseURL).origin, session: bundle.session });
  testInfo.annotations.push({ type: 'role', description: roleKey });
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
    if (role) await authenticate(context, role, baseURL, testInfo);
    await use(context);
  },

  // Usage: const page = await asRole('doctor'); — an isolated, logged-in page. Can be called
  // several times in one test for cross-role scenarios. Contexts are closed after the test.
  asRole: async ({ browser, baseURL }, use, testInfo) => {
    const contexts = [];
    await use(async (roleKey, contextOptions = {}) => {
      const context = await browser.newContext({ ...projectContextOptions(testInfo), baseURL, ...contextOptions });
      contexts.push(context);
      await authenticate(context, roleKey, baseURL, testInfo);
      return context.newPage();
    });
    for (const c of contexts) await c.close();
  },

  // Usage: const api = await apiAs('pharmacy'); await api.post(apiUrl('/x'), { data })
  // Direct API calls with the role's token, for checks that are business rules rather than UI.
  apiAs: async ({}, use, testInfo) => {
    const contexts = [];
    await use(async (roleKey) => {
      const bundle = requireBundle(roleKey, testInfo);
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
