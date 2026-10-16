import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const RUNNER = path.resolve('scripts/lighthouse-run.js');

/**
 * Runs a Lighthouse performance audit on an authenticated URL, in a separate Node process
 * (see scripts/lighthouse-run.js for why). The child launches Playwright's Chromium via
 * puppeteer-core, seeds sessionStorage with the same init script as the fixtures, and hands
 * the page to Lighthouse with disableStorageReset so the seeded session survives.
 *
 * Default Lighthouse config = mobile form factor + simulated slow-4G / 4x CPU throttling.
 * Session tokens go over stdin, not argv, so they never appear in process listings.
 */
export async function runLighthouse(url, { session, formFactor = 'mobile', outDir }) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [RUNNER], { stdio: ['pipe', 'inherit', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`lighthouse exited ${code}:\n${stderr.slice(-2000)}`))));
    child.stdin.end(JSON.stringify({ url, session, formFactor, outDir }));
  });

  const lhr = JSON.parse(fs.readFileSync(path.join(outDir, 'lhr.json'), 'utf8'));
  const metric = (id) => lhr.audits[id]?.numericValue;
  return {
    lhr,
    htmlPath: path.join(outDir, 'report.html'),
    finalUrl: lhr.finalDisplayedUrl,
    metrics: {
      performanceScore: lhr.categories.performance?.score,
      lcp: metric('largest-contentful-paint'),
      fcp: metric('first-contentful-paint'),
      cls: metric('cumulative-layout-shift'),
      tbt: metric('total-blocking-time'),
      si: metric('speed-index'),
    },
  };
}
