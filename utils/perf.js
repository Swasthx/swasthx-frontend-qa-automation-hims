// Runtime-performance helpers built on the DevTools protocol + PerformanceObserver.
// Lab measurements on one machine — directional, not field data.

/** Forces GC (needs CDP) and returns the JS heap used, in bytes. */
export async function heapUsed(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable').catch(() => {});
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {});
  await cdp.send('Performance.enable').catch(() => {}); // required before getMetrics returns JSHeapUsedSize
  const { metrics } = await cdp.send('Performance.getMetrics');
  await cdp.detach().catch(() => {});
  const heap = metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0;
  // Fallback to performance.memory if the CDP metric is unavailable.
  return heap || (await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0).catch(() => 0));
}

/** Counts DOM nodes (to catch detached-node / mount leaks that heap alone can miss). */
export const domNodeCount = (page) => page.evaluate(() => document.getElementsByTagName('*').length);

/**
 * Runs `action` while a PerformanceObserver records long tasks (>50ms). Returns the count and
 * total blocking time (sum of task durations beyond 50ms) during the action.
 */
export async function measureLongTasks(page, action, settleMs = 1500) {
  await page.evaluate(() => {
    window.__lt = [];
    window.__ltObs = new PerformanceObserver((list) => list.getEntries().forEach((e) => window.__lt.push(e.duration)));
    window.__ltObs.observe({ entryTypes: ['longtask'] });
  });
  await action();
  await page.waitForTimeout(settleMs);
  const durations = await page.evaluate(() => {
    window.__ltObs?.disconnect();
    return window.__lt || [];
  });
  return { count: durations.length, totalBlockingMs: Math.round(durations.reduce((s, d) => s + Math.max(0, d - 50), 0)), longest: Math.round(Math.max(0, ...durations)) };
}

/** Samples requestAnimationFrame during `action` and returns approximate FPS. */
export async function measureFps(page, action, durationMs = 2500) {
  await page.evaluate((ms) => {
    window.__frames = 0;
    const start = performance.now();
    const tick = () => {
      window.__frames++;
      if (performance.now() - start < ms) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, durationMs);
  await action();
  await page.waitForTimeout(durationMs + 200);
  const frames = await page.evaluate(() => window.__frames);
  return Math.round((frames / durationMs) * 1000);
}

/**
 * Repeats navigate-away / navigate-back (or any iteration) N times and reports heap growth.
 * `iterate(i)` performs one cycle. Returns start/end heap and % growth after GC.
 */
export async function measureLeak(page, iterate, iterations = 15) {
  await page.waitForTimeout(500);
  const before = await heapUsed(page);
  const nodesBefore = await domNodeCount(page);
  for (let i = 0; i < iterations; i++) await iterate(i);
  await page.waitForTimeout(1000);
  const after = await heapUsed(page);
  const nodesAfter = await domNodeCount(page);
  return {
    beforeMB: +(before / 1048576).toFixed(1),
    afterMB: +(after / 1048576).toFixed(1),
    growthPct: before ? +(((after - before) / before) * 100).toFixed(1) : 0,
    nodesBefore,
    nodesAfter,
    nodeGrowth: nodesAfter - nodesBefore,
  };
}
