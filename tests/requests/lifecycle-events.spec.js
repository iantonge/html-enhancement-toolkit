import { expect, test } from '@playwright/test';

test.describe('request lifecycle events', () => {
  test('dispatches after-load event', async ({ page }) => {
    await page.addInitScript(() => {
      window.hetLifecycleCounts = {
        afterLoadContent: 0,
      };

      document.addEventListener('het:afterLoadContent', (event) => {
        window.hetLifecycleCounts.afterLoadContent += 1;
      });
      document.addEventListener('het:sync', () => {
        window.hetLifecycleCounts.sync += 1;
      });
    });

    await page.goto('/requests/lifecycle-events');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#link'),
    ]);

    const counts = await page.evaluate(() => window.hetLifecycleCounts);
    expect(counts.afterLoadContent).toBe(1);
  });
});
