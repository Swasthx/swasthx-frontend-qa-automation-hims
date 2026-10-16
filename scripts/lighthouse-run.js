// Child-process entry for utils/webvitals.js. Lighthouse can't be imported inside the Playwright
// test runner (its module loader breaks csp_evaluator's circular imports), so it runs here in plain Node.
// Input: JSON on stdin { url, session, formFactor, outDir }. Output: <outDir>/lhr.json + report.html.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';
import { seedSessionStorage } from '../utils/session.js';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const { url, session, formFactor = 'mobile', outDir } = JSON.parse(input);

const browser = await puppeteer.launch({ executablePath: chromium.executablePath(), headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  if (session) await page.evaluateOnNewDocument(seedSessionStorage, { origin: new URL(url).origin, session });

  const flags = { output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance'], disableStorageReset: true };
  const config =
    formFactor === 'desktop'
      ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false } } }
      : undefined;

  const result = await lighthouse(url, flags, config, page);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'lhr.json'), result.report[0]);
  fs.writeFileSync(path.join(outDir, 'report.html'), result.report[1]);
} finally {
  await browser.close();
}
