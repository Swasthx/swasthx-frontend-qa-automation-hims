import { expect } from '@playwright/test';
import { PATHS } from '../fixtures/app-map.js';

// ₹ amount with Indian (1,23,456) or western grouping and optional paise.
export const AMOUNT = '₹\\s?\\d{1,3}(?:,\\d{2,3})*(?:\\.\\d{1,2})?';
export const STRICT_AMOUNT = /^₹\s?\d{1,3}(?:,\d{2,3})*\.\d{2}$/; // always 2 decimals

export const parseAmount = (formatted) => Number(formatted.replace(/[^\d.-]/g, ''));

export class PharmacyQueuePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(PATHS.pharmacy.queue);
    await expect(this.page.getByRole('heading', { name: 'Pharmacy Queue', level: 1 })).toBeVisible();
  }

  /** Active Queue tabs: "Order In progress", "Order Ready", "Order Delivered", "Cancelled", "Uncollected". */
  async openActiveTab(name) {
    await this.page.getByRole('button', { name: new RegExp(`^${name}\\b`) }).click();
  }

  /** An order card, found by its visit id (e.g. P-20260914-0001). Cards don't show the order code. */
  card(visitId) {
    return this.page
      .locator('div')
      .filter({ hasText: visitId })
      .filter({ has: this.page.getByRole('button', { name: 'More actions' }) })
      .last();
  }

  /** Card → More actions → View Details. Returns the "Order details" dialog. */
  async openOrderDetails(visitId) {
    const card = this.card(visitId);
    await expect(card, `no order card with visit id ${visitId} in this tab`).toBeVisible();
    await card.getByRole('button', { name: 'More actions' }).click();
    await this.page.getByRole('button', { name: 'View Details', exact: true }).click();
    const dialog = this.page.getByRole('dialog').filter({ has: this.page.getByRole('heading', { name: 'Order details' }) });
    await expect(dialog).toBeVisible();
    return dialog;
  }

  /**
   * Reads the bill summary under the medicines table:
   *   Sub Total ₹1,233 · Item Discounts (0%) ₹0 · CGST (6%) ₹73.98 · SGST (6%) ₹73.98 · Total Amount (IND ₹) ₹1,380.96
   */
  async readBillSummary(dialog) {
    const full = (await dialog.innerText()).replace(/\s+/g, ' ');
    const orderCode = /Order ID\s+(\S+)/.exec(full)?.[1];
    // CGST/SGST/Subtotal are also table column headers; parse only the summary block below.
    const start = full.lastIndexOf('Sub Total');
    expect(start, '"Sub Total" not found in order details').toBeGreaterThanOrEqual(0);
    const text = full.slice(start);
    const grab = (label) => {
      const m = new RegExp(`${label}[^₹]*?(?:\\([^)]*\\)\\s*)?(${AMOUNT})(?!\\d)`).exec(text);
      expect(m, `"${label}" amount not found in order details`).not.toBeNull();
      return { formatted: m[1], value: parseAmount(m[1]) };
    };
    // "Total Amount (IND ₹) ₹1,380.96": skip the ₹ inside the label's parentheses.
    const total = /Total Amount\s*\([^)]*\)\s*(₹\s?\d[\d,]*(?:\.\d{1,2})?)/.exec(text);
    expect(total, '"Total Amount" not found in order details').not.toBeNull();
    return {
      orderCode,
      subtotal: grab('Sub Total'),
      discount: grab('Item Discounts'),
      cgst: grab('CGST'),
      sgst: grab('SGST'),
      total: { formatted: total[1], value: parseAmount(total[1]) },
    };
  }
}
