import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BASE_URL } from '../../utils/env.js';
import { blockingViolations, formatViolations } from '../../utils/a11y.js';
import { settle } from '../../utils/page.js';
import { recordTc, tc } from '../../utils/tc.js';

// Login is unauthenticated, so no role fixture is needed.
test.describe('Accessibility — login', () => {
  test('AUTH-A11Y-001 login fields are labeled (axe + accessible name)', tc('AUTH-A11Y-001'), async ({ page }, testInfo) => {
    await page.goto(BASE_URL() + '/login');
    await settle(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).exclude('iframe[src*="recaptcha"]').analyze();
    const blocking = blockingViolations(results);

    // The mobile-number input must have an accessible name.
    const phone = page.getByRole('textbox').first();
    const named = await phone.evaluate((el) => {
      const id = el.getAttribute('id');
      return !!(el.getAttribute('aria-label') || el.getAttribute('placeholder') || (id && document.querySelector(`label[for="${id}"]`)) || el.closest('label'));
    }).catch(() => false);

    recordTc(testInfo, { measured: `${blocking.length} serious/critical`, notes: [`mobile input has accessible name: ${named}`, ...blocking.map((v) => v.id)] });
    expect(named, 'mobile-number input has no accessible name').toBe(true);
    expect(blocking, formatViolations(blocking)).toHaveLength(0);
  });
  // AUTH-A11Y-002 (error identification) is manual: whether invalid input should show an inline
  // error or simply keep the submit disabled is a design decision a person must judge.
});
