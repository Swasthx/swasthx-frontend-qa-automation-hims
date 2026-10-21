import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RUNNER = path.resolve('scripts/lighthouse-run.js');
// The package's "exports" hide the IIFE build, so locate it next to the main entry.
const WEB_VITALS_IIFE = path.join(path.dirname(createRequire(import.meta.url).resolve('web-vitals')), 'web-vitals.attribution.iife.js');
const WEB_VITALS_SRC = fs.readFileSync(WEB_VITALS_IIFE, 'utf8');

/**
 * Each Playwright init script runs in its own scope, so the library and the code using it
 * must be one script. `register` is a function body that can use `webVitals`.
 * Sets window.__wvReady so callers can tell "no metric" from "library never loaded".
 */
async function injectWebVitals(page, register) {
  await page.addInitScript({
    content: `${WEB_VITALS_SRC}\n;try { (${register.toString()})(webVitals); window.__wvReady = true; } catch (e) { window.__wvError = String(e); }`,
  });
}

async function assertWebVitalsLoaded(page) {
  const { ready, error } = await page.evaluate(() => ({ ready: window.__wvReady === true, error: window.__wvError }));
  if (!ready) throw new Error(`web-vitals did not load in the page${error ? `: ${error}` : ''}`);
}

// Sheet "Device · Network" → profile id understood by scripts/lighthouse-run.js.
export function profileFor(deviceNetwork) {
  if (/mobile/i.test(deviceNetwork) && /3g/i.test(deviceNetwork)) return 'mobile-fast3g';
  if (/desktop/i.test(deviceNetwork) && /cable/i.test(deviceNetwork)) return 'desktop-cable';
  return null; // e.g. "real users": field data, not a lab profile
}

/**
 * One Lighthouse page load of an authenticated URL, in a separate Node process (see
 * scripts/lighthouse-run.js). Session tokens go over stdin, never argv.
 */
export async function runLighthouse(url, { session, profile, outDir }) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [RUNNER], { stdio: ['pipe', 'inherit', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`lighthouse exited ${code}:\n${stderr.slice(-2000)}`))));
    child.stdin.end(JSON.stringify({ url, session, profile, outDir }));
  });

  const lhr = JSON.parse(fs.readFileSync(path.join(outDir, 'lhr.json'), 'utf8'));
  const audit = (id) => lhr.audits[id]?.numericValue;
  const serverResponse = audit('server-response-time') ?? 0;
  const redirects = audit('redirects') ?? 0;
  return {
    htmlPath: path.join(outDir, 'report.html'),
    requestedUrl: lhr.requestedUrl,
    finalUrl: lhr.finalDisplayedUrl,
    lighthouseVersion: lhr.lighthouseVersion,
    runtimeError: lhr.runtimeError?.message,
    warnings: lhr.runWarnings ?? [],
    metrics: {
      LCP: audit('largest-contentful-paint'),
      FCP: audit('first-contentful-paint'),
      CLS: audit('cumulative-layout-shift'),
      TBT: audit('total-blocking-time'),
      // web.dev TTFB includes redirect time, so add the trailing-slash redirect hop.
      TTFB: serverResponse + redirects,
      serverResponse,
      redirects,
      performanceScore: lhr.categories.performance?.score,
    },
  };
}

/** Linear-interpolated percentile (numpy default). With 3 runs, p75 sits between the 2nd and 3rd value. */
export function percentile(values, p) {
  const v = values.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b);
  if (!v.length) return undefined;
  const idx = (p / 100) * (v.length - 1);
  const lo = Math.floor(idx);
  return v[lo] + (v[Math.ceil(idx)] - v[lo]) * (idx - lo);
}

/** "≤ 2.5s" → { value: 2500, unit: 'ms' } · "≤ 200ms" → 200 ms · "≤ 0.1" → 0.1 (unitless). */
export function parseTarget(text) {
  const m = /([\d.]+)\s*(ms|s)?/.exec(text);
  if (!m) throw new Error(`Can't parse target "${text}"`);
  const n = Number(m[1]);
  if (m[2] === 's') return { value: n * 1000, display: 's' };
  if (m[2] === 'ms') return { value: n, display: 'ms' };
  return { value: n, display: '' };
}

export function formatValue(value, display) {
  if (value === undefined || value === null) return '—';
  if (display === 's') return `${(value / 1000).toFixed(2)}s`;
  if (display === 'ms') return `${Math.round(value)}ms`;
  return value.toFixed(3);
}

// DevTools-style (applied) throttling per sheet profile, for the Playwright engine.
// Mobile · Fast 3G = Chrome DevTools "Fast 3G" preset + 4x CPU on a Moto G4-sized screen.
// Desktop · Cable  = WebPageTest "Cable" (28ms RTT, 5/1 Mbps), no CPU slowdown.
export const THROTTLING = {
  'mobile-fast3g': { latency: 562.5, downKbps: 1474.56, upKbps: 675, cpu: 4, device: 'Moto G4' },
  'desktop-cable': { latency: 28, downKbps: 5000, upKbps: 1000, cpu: 1, device: null },
};

/**
 * Lab LCP / FCP / CLS / TTFB with Playwright + web-vitals on a cold, throttled load.
 * Unlike Lighthouse it also measures pages served with a 4xx status (QA's SPA fallback).
 */
export async function measureLoadVitals(page, url, profile) {
  const t = THROTTLING[profile];
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: t.latency,
    downloadThroughput: (t.downKbps * 1024) / 8,
    uploadThroughput: (t.upKbps * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: t.cpu });

  await injectWebVitals(page, (wv) => {
    window.__wv = {};
    const keep = (m) => (window.__wv[m.name] = m.value);
    wv.onLCP(keep, { reportAllChanges: true });
    wv.onFCP(keep, { reportAllChanges: true });
    wv.onCLS(keep, { reportAllChanges: true });
    wv.onTTFB(keep, { reportAllChanges: true });
  });

  const statuses = [];
  page.on('response', (r) => r.request().isNavigationRequest() && r.request().frame() === page.mainFrame() && statuses.push(r.status()));
  await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(2000); // late LCP candidates and layout shifts after data arrives
  await assertWebVitalsLoaded(page);
  const v = await page.evaluate(() => window.__wv);
  return {
    finalUrl: page.url(),
    statuses,
    metrics: { LCP: v.LCP, FCP: v.FCP, CLS: v.CLS ?? 0, TTFB: v.TTFB },
  };
}

/**
 * Lab INP: load the page, do one scripted interaction, read INP from the web-vitals library.
 * Returns null when no interaction crossed web-vitals' reporting threshold (i.e. very fast).
 */
export async function measureInp(page, url, interact) {
  await injectWebVitals(page, (wv) => {
    window.__inp = null;
    wv.onINP(
      (m) => {
        window.__inp = { value: m.value, target: m.attribution?.interactionTarget, type: m.attribution?.interactionType };
      },
      { reportAllChanges: true },
    );
  });
  // QA ships an 11 MB uncompressed bundle; the default 30s navigation timeout is too tight.
  await page.goto(url, { timeout: 120_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await assertWebVitalsLoaded(page);
  await interact(page);
  // Let the next frame paint so the event's processing + presentation delay is recorded.
  await page.waitForTimeout(1000);
  return page.evaluate(() => window.__inp);
}
