// Usage:
//   npm run codegen              → plain `playwright codegen $BASE_URL` (logged out)
//   npm run codegen -- pharmacy  → opens the Inspector on that role's landing page, already logged in.
// Codegen's --load-storage can't restore sessionStorage, so the role mode seeds it with an init
// script and calls page.pause(); press "Record" in the Inspector to generate code.
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { API_BASE_URL, BASE_URL, assertNotProduction } from '../utils/env.js';
import { getRole } from '../fixtures/roles.js';
import { loadBundle, seedSessionStorage } from '../utils/session.js';

assertNotProduction([BASE_URL(), API_BASE_URL()]);
const roleKey = process.argv[2];

if (!roleKey) {
  const child = spawn('npx', ['playwright', 'codegen', BASE_URL()], { stdio: 'inherit', shell: true });
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  const role = getRole(roleKey);
  const bundle = loadBundle(roleKey);
  if (!bundle) throw new Error(`No .auth/${roleKey}.json — run \`npx playwright test --list\` (runs global-setup) or \`npm run auth:manual -- ${roleKey}\` first.`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL() });
  await context.addInitScript(seedSessionStorage, { origin: new URL(BASE_URL()).origin, session: bundle.session });
  const page = await context.newPage();
  await page.goto(role.landing);
  await page.pause();
  await browser.close();
}
