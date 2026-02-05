import { test, expect } from '@playwright/test';

test.describe('X-HET-Select-Override header', () => {
  test('overrides selected ids for enhanced links', async ({ page }) => {
    await page.goto('/requests/headers/het-select-override/link');

    await Promise.all([
      page.waitForSelector('#primary-content:has-text("Primary link response.")'),
      page.click('#link'),
    ]);

    await expect(page.locator('#secondary-content')).toHaveText('Secondary initial.');
  });

  test('overrides selected ids for enhanced forms', async ({ page }) => {
    await page.goto('/requests/headers/het-select-override/form');

    await Promise.all([
      page.waitForSelector('#primary-content:has-text("Primary form response.")'),
      page.click('#submit'),
    ]);

    await expect(page.locator('#secondary-content')).toHaveText('Secondary initial.');
  });

  test('clears selection when override header is empty for links', async ({ page }) => {
    await page.goto('/requests/headers/het-select-override/link');

    await Promise.all([
      page.waitForSelector('#primary-content:has-text("Primary link response.")'),
      page.click('#clear-link'),
    ]);

    await expect(page.locator('#secondary-content')).toHaveText('Secondary link response.');
  });

  test('clears selection when override header is empty for forms', async ({ page }) => {
    await page.goto('/requests/headers/het-select-override/form');

    await Promise.all([
      page.waitForSelector('#primary-content:has-text("Primary form response.")'),
      page.click('#clear-submit'),
    ]);

    await expect(page.locator('#secondary-content')).toHaveText('Secondary form response.');
  });
});
