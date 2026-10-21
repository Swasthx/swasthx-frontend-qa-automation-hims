// Child-process entry for utils/webvitals.js. Lighthouse can't be imported inside the Playwright
// test runner (its module loader breaks csp_evaluator's circular imports), so it runs here in plain Node.
// Input: JSON on stdin { url, session, profile, outDir }. Output: <outDir>/lhr.json + report.html.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import puppeteer from 'puppeteer-core';
import { seedSessionStorage } from '../utils/session.js';

// Sheet "Device · Network" → Lighthouse config (simulated throttling).
const PROFILES = {
  // Lighthouse default: Moto G-class screen, 150ms RTT, 1.6 Mbps, 4x CPU.
  // Lighthouse calls it "Slow 4G"; it is DevTools' former "Fast 3G" preset.
  'mobile-fast3g': undefined,
  // WebPageTest "Cable": 28ms RTT, 5 Mbps down, no CPU slowdown.
  'desktop-cable': {
    ...desktopConfig,
    settings: {
      ...desktopConfig.settings,
      throttling: { rttMs: 28, throughputKbps: 5000, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
    },
  },
};

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { url, session, profile = 'mobile-fast3g', outDir } = JSON.parse(input);
if (!(profile in PROFILES)) throw new Error(`Unknown profile "${profile}"`);

const browser = await puppeteer.launch({ executablePath: chromium.executablePath(), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  if (session) await page.evaluateOnNewDocument(seedSessionStorage, { origin: new URL(url).origin, session });

  const flags = {
    output: ['json', 'html'],
    logLevel: 'error',
    onlyCategories: ['performance'],
    disableStorageReset: true,
    // Same safety net as the Playwright fixture: never let a QA page reach production APIs.
    blockedUrlPatterns: ['*production*'],
  };
  const result = await lighthouse(url, flags, PROFILES[profile], page);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'lhr.json'), result.report[0]);
  fs.writeFileSync(path.join(outDir, 'report.html'), result.report[1]);
} finally {
  await browser.close();
}
