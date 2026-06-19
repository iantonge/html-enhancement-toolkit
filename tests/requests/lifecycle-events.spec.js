import { expect, test } from '@playwright/test';

test.describe('request lifecycle events', () => {
  test('dispatches fetch/load events', async ({ page }) => {
    await page.addInitScript(() => {
      window.hetLifecycleCounts = {
        beforeFetch: 0,
        afterLoadContent: 0,
      };

      document.addEventListener('het:beforeFetch', () => {
        window.hetLifecycleCounts.beforeFetch += 1;
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
    expect(counts.afterLoadContent).toBe(1);
  });

  test('allows het:beforeFetch to cancel enhancement', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/requests/lifecycle-events/response', async (route) => {
      requestCount += 1;
      await route.continue();
    });
    await page.addInitScript(() => {
      document.addEventListener('het:beforeFetch', (event) => {
        event.preventDefault();
      });
    });

    await page.goto('/requests/lifecycle-events');
    await page.click('#link');
    await page.waitForTimeout(200);

    expect(requestCount).toBe(0);
    await expect(page.locator('#original-content')).toHaveText('Original lifecycle page content.');
  });

});
