import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

// Specs that only make sense on one engine: Lighthouse drives Chromium itself, and visual
// baselines are kept for Chromium only (each engine renders fonts differently).
const CHROMIUM_ONLY = ['**/web-vitals/**', '**/visual/**'];

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.js',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  // sheet-reporter writes Test-result/<category>Result.md for every TC ID found in Test-case-csv.
  reporter: [['list'], ['html', { open: 'never' }], ['./reporters/sheet-reporter.js']],

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: CHROMIUM_ONLY },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: CHROMIUM_ONLY },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' }, testIgnore: CHROMIUM_ONLY },
  ],
});
