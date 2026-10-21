import AxeBuilder from '@axe-core/playwright';

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
export const BLOCKING_IMPACTS = ['serious', 'critical'];

/** Runs axe on the current page and attaches the full result to the test report. */
export async function runAxe(page, testInfo, { include, exclude = [], tags = WCAG_TAGS } = {}) {
  let builder = new AxeBuilder({ page }).withTags(tags);
  if (include) builder = builder.include(include);
  // reCAPTCHA's third-party iframe is outside our control.
  for (const sel of ['iframe[src*="recaptcha"]', ...exclude]) builder = builder.exclude(sel);

  const results = await builder.analyze();
  await testInfo.attach('axe-results.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  return results;
}

export function blockingViolations(results, impacts = BLOCKING_IMPACTS) {
  return results.violations.filter((v) => impacts.includes(v.impact));
}

export function violationsByRule(results, ruleIds) {
  return results.violations.filter((v) => ruleIds.includes(v.id));
}

/**
 * Scans one authenticated route with axe, caching by role+route so several TCs on the same
 * screen reuse one navigation. `attach` lets the caller attach the raw results to its report.
 */
const scanCache = new Map();
export function scanRoute(asRole, role, route, { settleFn } = {}) {
  const key = `${role}|${route}`;
  if (!scanCache.has(key)) {
    scanCache.set(
      key,
      (async () => {
        const page = await asRole(role);
        try {
          await page.goto(route);
          if (settleFn) await settleFn(page);
          const AxeBuilder = (await import('@axe-core/playwright')).default;
          let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude('iframe[src*="recaptcha"]');
          return { results: await builder.analyze(), finalUrl: page.url() };
        } finally {
          await page.context().close();
        }
      })(),
    );
  }
  return scanCache.get(key);
}

// One readable line per violation, so the assertion message alone says what to fix.
export function formatViolations(violations) {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) e.g. ${v.nodes[0]?.target?.join(' ')} — ${v.helpUrl}`)
    .join('\n');
}
