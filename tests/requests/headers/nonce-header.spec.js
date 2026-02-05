import { test, expect } from '@playwright/test';

test.describe('nonce header', () => {
  test('includes default nonce header when configured', async ({ page }) => {
    await page.goto('/requests/headers/nonce/default');

    let nonceHeader;
    await page.route('**/requests/headers/nonce/responses/default', async (route) => {
      nonceHeader = route.request().headers()['x-het-nonce'];
      await route.continue();
    });

    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#link'),
    ]);

    expect(typeof nonceHeader).toBe('string');
    expect(nonceHeader.length).toBeGreaterThan(0);
    await expect(page.locator('#inline-status')).toHaveCSS('color', 'rgb(1, 2, 3)');
  });

  test('uses custom nonce header name when configured', async ({ page }) => {
    await page.goto('/requests/headers/nonce/custom-header');

    let customHeader;
    let defaultHeader;
    await page.route('**/requests/headers/nonce/responses/custom-header', async (route) => {
      customHeader = route.request().headers()['x-custom-nonce'];
      defaultHeader = route.request().headers()['x-het-nonce'];
      await route.continue();
    });

    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#link'),
    ]);

    expect(typeof customHeader).toBe('string');
    expect(customHeader.length).toBeGreaterThan(0);
    expect(defaultHeader).toBeUndefined();
  });
});
