import { API_BASE_URL, BASE_URL, assertNotProduction } from './utils/env.js';
import { ROLE_KEYS } from './fixtures/roles.js';
import { apiLogin, hasCreds } from './utils/login.js';
import { isBundleFresh, loadBundle } from './utils/session.js';

/**
 * Runs once before all projects:
 *  1. refuses to run against anything that doesn't look like QA/local;
 *  2. makes sure each role has a fresh token bundle in .auth/<role>.json.
 * A role that can't be logged in is reported here and its tests skip; the run doesn't abort.
 */
export default async function globalSetup() {
  assertNotProduction([BASE_URL(), API_BASE_URL()]);

  const mode = (process.env.AUTH_MODE || 'api').toLowerCase();
  const force = process.env.AUTH_REFRESH === '1';
  const status = {};

  for (const role of ROLE_KEYS) {
    const cached = loadBundle(role);
    if (!force && isBundleFresh(cached)) {
      status[role] = `cached (${cached.source})`;
      continue;
    }
    if (mode === 'manual') {
      status[role] = 'NO TOKEN: run `npm run auth:manual -- ' + role + '`';
      continue;
    }
    if (!hasCreds(role)) {
      status[role] = 'skipped: no TEST_' + role.toUpperCase() + '_* creds';
      continue;
    }
    try {
      await apiLogin(role);
      status[role] = 'logged in (api)';
    } catch (err) {
      status[role] = `LOGIN FAILED: ${err.message}`;
    }
  }

  console.log('\n[global-setup] auth status per role:');
  for (const [role, s] of Object.entries(status)) console.log(`  ${role.padEnd(11)} ${s}`);
  console.log('');
}
