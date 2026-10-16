import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../fixtures/auth.fixture.js';
import { PATHS } from '../../fixtures/app-map.js';
import { API_BASE_URL } from '../../utils/env.js';
import { sanitizeHar } from '../../utils/har.js';
import { escapeRegex, settle } from '../../utils/page.js';

// Deterministic state comes from a HAR recording of the API, so the test never needs to know
// the API's response shapes:
//   record:  HAR_UPDATE=1 npm run test:visual:update   (live API → HAR, sanitized, + new baseline)
//   replay:  npm run test:visual                        (API served from the HAR)
const HAR = path.resolve('test-data/har/pharmacy-queue.har');
const FROZEN_NOW = new Date('2026-01-15T10:00:00+05:30');

test.describe('Pharmacy — visual', () => {
  test('PH-VIS-001 /pharmacy/queue matches baseline (HAR-mocked data)', {
    annotation: { type: 'tc', description: 'PH-VIS-001' },
  }, async ({ asRole }) => {
    const update = process.env.HAR_UPDATE === '1';
    test.skip(!update && !fs.existsSync(HAR), 'No HAR yet: record one with HAR_UPDATE=1 npm run test:visual:update');

    if (update) fs.mkdirSync(path.dirname(HAR), { recursive: true });
    const page = await asRole('pharmacy', { viewport: { width: 1440, height: 900 } });
    await page.clock.setFixedTime(FROZEN_NOW);
    await page.routeFromHAR(HAR, {
      url: new RegExp(`^${escapeRegex(API_BASE_URL())}`),
      update,
      updateContent: 'embed',
      notFound: 'fallback',
    });

    await page.goto(PATHS.pharmacy.queue);
    await settle(page);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('pharmacy-queue.png', {
      fullPage: true,
      // TODO(calibrate): mask anything still dynamic (relative times, avatars, live counters).
      mask: [page.locator('time'), page.locator('[data-testid*="clock" i], [data-testid*="timer" i]')],
    });

    if (update) {
      await page.context().close(); // the HAR is written on context close
      sanitizeHar(HAR);
    }
  });
});
