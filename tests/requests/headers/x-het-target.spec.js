import { test, expect } from '@playwright/test';

test.describe('X-HET-Target header', () => {
  test('includes target pane header for enhanced links', async ({ page }) => {
    await page.goto('/requests/headers/x-het-target/link');

    let targetHeader;
    await page.route('**/requests/headers/x-het-target/responses/link', async (route) => {
      targetHeader = route.request().headers()['x-het-target'];
      await route.continue();
    });

    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#link'),
    ]);

    expect(targetHeader).toBe('main');
  });

  test('includes target pane header for enhanced forms', async ({ page }) => {
    await page.goto('/requests/headers/x-het-target/form');

    let targetHeader;
    await page.route('**/requests/headers/x-het-target/responses/form**', async (route) => {
      targetHeader = route.request().headers()['x-het-target'];
      await route.continue();
    });

    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);

    expect(targetHeader).toBe('main');
  });
});
