import { test, expect } from '@playwright/test';

test.describe('X-HET-Also-Override header', () => {
  test('overrides also ids for enhanced links', async ({ page }) => {
    await page.goto('/requests/headers/het-also-override/link');

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main link response.")'),
      page.click('#link'),
    ]);

    await expect(page.locator('#sidebar')).toHaveText('Sidebar link response.');
    await expect(page.locator('#flash')).toHaveText('Flash link response.');
  });

  test('overrides also ids for enhanced forms', async ({ page }) => {
    await page.goto('/requests/headers/het-also-override/form');

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main form response.")'),
      page.click('#submit'),
    ]);

    await expect(page.locator('#sidebar')).toHaveText('Sidebar form response.');
    await expect(page.locator('#flash')).toHaveText('Flash form response.');
  });

  test('clears also override when header is empty for links', async ({ page }) => {
    await page.goto('/requests/headers/het-also-override/link');

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main link response.")'),
      page.click('#clear-link'),
    ]);

    await expect(page.locator('#sidebar')).toHaveText('Sidebar initial.');
    await expect(page.locator('#flash')).toHaveText('Flash initial.');
  });

  test('clears also override when header is empty for forms', async ({ page }) => {
    await page.goto('/requests/headers/het-also-override/form');

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main form response.")'),
      page.click('#clear-submit'),
    ]);

    await expect(page.locator('#sidebar')).toHaveText('Sidebar initial.');
    await expect(page.locator('#flash')).toHaveText('Flash initial.');
  });
});
