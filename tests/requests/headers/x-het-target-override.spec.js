import { test, expect } from '@playwright/test';

test.describe('X-HET-Target-Override header', () => {
  test('overrides target pane for enhanced links', async ({ page }) => {
    await page.goto('/requests/headers/het-target-override/link');

    await Promise.all([
      page.waitForSelector('#child-content:has-text("Overridden child link response.")'),
      page.click('#link'),
    ]);

    await expect(page.locator('#main-content')).toHaveText('Main content.');
  });

  test('overrides target pane for enhanced forms', async ({ page }) => {
    await page.goto('/requests/headers/het-target-override/form');

    await Promise.all([
      page.waitForSelector('#child-content:has-text("Overridden child form response.")'),
      page.click('#submit'),
    ]);

    await expect(page.locator('#main-content')).toHaveText('Main content.');
  });
});
