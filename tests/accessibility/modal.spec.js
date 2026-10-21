import { test, expect } from '../../fixtures/auth.fixture.js';
import { PharmacyQueuePage } from '../../pages/pharmacy.page.js';
import { recordTc, tc } from '../../utils/tc.js';

// GEN-A11Y-011: an open modal must be a proper dialog — role/aria-modal, focus moved inside,
// focus trapped, Esc or an explicit Close dismisses it. Uses the read-only order-details dialog.
test.describe('Accessibility — modal', () => {
  test.use({ role: 'pharmacy' });

  test('GEN-A11Y-011 order-details modal: role, focus trap, Esc/close', tc('GEN-A11Y-011'), async ({ page }, testInfo) => {
    const queue = new PharmacyQueuePage(page);
    await queue.goto();

    // "Create Order" always opens a modal (no existing data needed). We only open it — never submit.
    await page.getByRole('button', { name: /^Create Order/ }).first().click();
    const dialog = page.getByRole('dialog').first();
    await expect(dialog, 'Create Order did not open a dialog').toBeVisible({ timeout: 10_000 });

    const role = await dialog.getAttribute('role');
    const ariaModal = await dialog.getAttribute('aria-modal');
    const focusInside = await dialog.evaluate((d) => d.contains(document.activeElement));

    // Focus trap: Tab several times, focus must stay within the dialog.
    let trapped = true;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      if (!(await dialog.evaluate((d) => d.contains(document.activeElement)))) {
        trapped = false;
        break;
      }
    }

    // Dismiss: Esc, else the Close button.
    await page.keyboard.press('Escape');
    let closed = await dialog.isHidden().catch(() => false);
    let how = 'Esc';
    if (!closed) {
      await page.getByRole('button', { name: /close/i }).first().click().catch(() => {});
      closed = await dialog.isHidden().catch(() => false);
      how = 'Close button (Esc did not work)';
    }

    recordTc(testInfo, { notes: [`role=${role}, aria-modal=${ariaModal}, focusMovedInside=${focusInside}, focusTrapped=${trapped}, dismissedBy=${how}`] });
    expect(role, 'modal has no role="dialog"').toBe('dialog');
    expect(focusInside, 'focus was not moved into the modal').toBe(true);
    expect(trapped, 'focus escaped the modal (no focus trap)').toBe(true);
    expect(closed, 'modal could not be dismissed').toBe(true);
    // aria-modal is advisory; report but do not fail the whole TC on it alone.
    expect.soft(ariaModal, 'modal missing aria-modal="true"').toBe('true');
  });
});
