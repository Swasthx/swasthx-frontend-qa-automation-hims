import { test, expect } from '../../fixtures/auth.fixture.js';
import { getRole } from '../../fixtures/roles.js';
import { isBundleFresh, loadBundle } from '../../utils/session.js';
import { runLighthouse } from '../../utils/webvitals.js';

// Run against a production build (`vite build && vite preview`) or QA. Vite's dev server
// serves unbundled modules, so its LCP says nothing about what users get.
test.describe('Pharmacy — web vitals', () => {
  test.describe.configure({ timeout: 180_000, retries: 0 });

  test('PH-WV-001 Lighthouse LCP ≤ 2.5s on /pharmacy (mobile profile)', {
    annotation: { type: 'tc', description: 'PH-WV-001' },
  }, async ({ baseURL }, testInfo) => {
    const bundle = loadBundle('pharmacy');
    test.skip(!isBundleFresh(bundle, 0), 'No valid pharmacy token (see GEN-FUN-001)');

    const budget = Number(process.env.WV_LCP_BUDGET_MS || 2500);
    const url = new URL(getRole('pharmacy').landing, baseURL).href;
    const { metrics, htmlPath, finalUrl } = await runLighthouse(url, {
      session: bundle.session,
      formFactor: 'mobile',
      outDir: testInfo.outputPath('lighthouse'),
    });

    await testInfo.attach('lighthouse.html', { path: htmlPath, contentType: 'text/html' });
    await testInfo.attach('metrics.json', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' });

    expect(new URL(finalUrl).pathname, 'Lighthouse was redirected (auth not applied?)').toMatch(/^\/pharmacy/);
    expect(metrics.lcp, `LCP ${Math.round(metrics.lcp)}ms exceeds ${budget}ms`).toBeLessThanOrEqual(budget);
  });
});
