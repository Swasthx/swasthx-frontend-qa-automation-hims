// Usage: npm run auth:manual -- <role> [<role> ...]
// Opens a headed browser; you log in by hand (OTP + reCAPTCHA); tokens go to .auth/<role>.json.
import { API_BASE_URL, BASE_URL, assertNotProduction } from '../utils/env.js';
import { getRole } from '../fixtures/roles.js';
import { uiLogin } from '../utils/login.js';

const roles = process.argv.slice(2);
if (!roles.length) {
  console.error('Usage: npm run auth:manual -- <role> [<role> ...]');
  process.exit(1);
}
roles.forEach(getRole);
assertNotProduction([BASE_URL(), API_BASE_URL()]);

for (const role of roles) {
  const bundle = await uiLogin(role);
  const exp = bundle.expiresAt ? new Date(bundle.expiresAt).toISOString() : 'unknown (treated as 1h)';
  console.log(`[auth:manual] saved .auth/${role}.json — token expires ${exp}`);
}
