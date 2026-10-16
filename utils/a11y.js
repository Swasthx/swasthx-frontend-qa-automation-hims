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

// One readable line per violation, so the assertion message alone says what to fix.
export function formatViolations(violations) {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) e.g. ${v.nodes[0]?.target?.join(' ')} — ${v.helpUrl}`)
    .join('\n');
}
