import { test, expect } from '@playwright/test';

test.describe('link debounce clicks', () => {
  test('debounces link clicks while request is in flight', async ({ page }) => {
    await page.goto('/requests/links/debounce-clicks');
    let releaseResponse;
    const responseGate = new Promise((resolve) => {
      releaseResponse = resolve;
    });
    let requestCount = 0;
    await page.route('**/requests/links/debounce-clicks/responses/internal-link', async (route) => {
      requestCount += 1;
      await responseGate;
      await route.continue();
    });

    await page.click('#link');
    await page.click('#link');

    releaseResponse();

    await page.waitForSelector('#internal-page-message');
    expect(requestCount).toBe(1);
  });
});
