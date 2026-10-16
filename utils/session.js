import fs from 'node:fs';
import path from 'node:path';

export const AUTH_DIR = path.resolve('.auth');

// sessionStorage keys the app reads its auth from.
export const SESSION_KEYS = ['token', 'refreshToken', 'role', 'permissions', 'impersonatedBy'];

const bundlePath = (role) => path.join(AUTH_DIR, `${role}.json`);

export function saveBundle(role, bundle) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(bundlePath(role), JSON.stringify(bundle, null, 2));
}

export function loadBundle(role) {
  try {
    return JSON.parse(fs.readFileSync(bundlePath(role), 'utf8'));
  } catch {
    return null;
  }
}

// Reads `exp` from a JWT without verifying it. Returns ms epoch or null for opaque tokens.
export function jwtExpiry(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Opaque tokens (no exp) are trusted for 1h after capture.
export function isBundleFresh(bundle, minRemainingMs = 10 * 60 * 1000) {
  if (!bundle?.session?.token) return false;
  const exp = bundle.expiresAt ?? (bundle.capturedAt ? bundle.capturedAt + 60 * 60 * 1000 : 0);
  return exp - Date.now() > minRemainingMs;
}

/**
 * Runs inside the browser via addInitScript / evaluateOnNewDocument, so it must be
 * self-contained (it's serialized and doesn't close over anything).
 *
 * Only seeds the app's origin (not reCAPTCHA iframes or about:blank), and only once
 * per tab: the `__qa_seeded` marker stops later navigations from overwriting tokens
 * the app has refreshed. If the app calls sessionStorage.clear() (logout), the next
 * navigation re-seeds; test logout in a context created without a role.
 */
export function seedSessionStorage({ origin, session }) {
  try {
    if (window.location.origin !== origin) return;
    if (window.sessionStorage.getItem('__qa_seeded')) return;
    for (const [k, v] of Object.entries(session)) {
      if (v !== null && v !== undefined) window.sessionStorage.setItem(k, String(v));
    }
    window.sessionStorage.setItem('__qa_seeded', '1');
  } catch {
    // sandboxed frames throw on sessionStorage access, so ignore them
  }
}
