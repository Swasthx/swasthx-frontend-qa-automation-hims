import { expect } from '@playwright/test';
import { escapeRegex } from '../utils/page.js';

// Amount with currency symbol and exactly 2 decimals. Accepts Indian (1,23,456.00) and
// western (123,456.00) grouping as well as ungrouped digits.
export function currencyRegex(symbol = process.env.CURRENCY_SYMBOL || '₹') {
  return new RegExp(`${escapeRegex(symbol)}\\s?-?(?:\\d{1,3}(?:,\\d{2,3})+|\\d+)\\.\\d{2}`, 'g');
}

export const parseAmount = (formatted) => Number(formatted.replace(/[^\d.-]/g, ''));

// TODO(calibrate): label wording on the cart summary. Prefer data-testid if the app adds them.
export const CART_LABELS = {
  subtotal: /^\s*sub[\s-]?total/i,
  gst: /^\s*(gst|tax)\b/i,
  total: /^\s*(grand\s+|net\s+)?total\b/i,
};

export class PharmacyPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Finds the label, then walks up the DOM until an ancestor also contains an amount
   * (handles <dt>/<dd>, flex rows and table rows). Returns the last amount in that row.
   */
  async summaryAmount(labelRegex) {
    const label = this.page.getByText(labelRegex).first();
    await expect(label, `cart summary label ${labelRegex} not found`).toBeVisible();
    const source = currencyRegex().source;
    const rowText = await label.evaluate((el, src) => {
      const re = new RegExp(src);
      for (let node = el, depth = 0; node && depth < 5; node = node.parentElement, depth++) {
        if (re.test(node.innerText)) return node.innerText;
      }
      return el.innerText;
    }, source);
    const matches = rowText.match(currencyRegex());
    expect(matches, `no currency-formatted amount next to "${rowText.trim()}"`).not.toBeNull();
    const formatted = matches.at(-1);
    return { formatted, value: parseAmount(formatted) };
  }
}
