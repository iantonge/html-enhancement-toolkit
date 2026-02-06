import { expect, test } from '@playwright/test';

test.describe('request lifecycle events', () => {
  test('dispatches fetch/load events', async ({ page }) => {
    await page.addInitScript(() => {
      window.hetLifecycleCounts = {
        beforeFetch: 0,
        afterFetch: 0,
        beforeLoadContent: 0,
        afterLoadContent: 0,
      };

      document.addEventListener('het:beforeFetch', () => {
        window.hetLifecycleCounts.beforeFetch += 1;
      });
      document.addEventListener('het:afterFetch', () => {
        window.hetLifecycleCounts.afterFetch += 1;
      });
      document.addEventListener('het:beforeLoadContent', () => {
        window.hetLifecycleCounts.beforeLoadContent += 1;
      });
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
    expect(counts.beforeFetch).toBe(1);
    expect(counts.afterFetch).toBe(1);
    expect(counts.beforeLoadContent).toBe(1);
    expect(counts.afterLoadContent).toBe(1);
  });
});
