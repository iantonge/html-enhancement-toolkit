import { test, expect } from '@playwright/test';

test.describe('link het-select', () => {
  test('only replaces selected id', async ({ page }) => {
    await page.goto('/requests/links/het-select/partial');
    await Promise.all([
      page.waitForSelector('#primary:has-text("Primary response.")'),
      page.click('#partial-link'),
    ]);
    await expect(page.locator('#secondary')).toHaveText('Secondary content.');
  });

  test('only replaces multiple selected ids', async ({ page }) => {
    await page.goto('/requests/links/het-select/multi');
    await Promise.all([
      page.waitForSelector('#primary:has-text("Primary response.")'),
      page.click('#multi-link'),
    ]);
    await expect(page.locator('#secondary')).toHaveText('Secondary response.');
    await expect(page.locator('#tertiary')).toHaveText('Tertiary content.');
  });

  test('throws when selected id is missing in current target', async ({ page }) => {
    await page.goto('/requests/links/het-select/missing-current');
    await page.click('#missing-current-link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Element with id missing-current not found in current target',
      ),
    );
  });

  test('throws when selected id is missing in server response', async ({ page }) => {
    await page.goto('/requests/links/het-select/missing-response');
    await page.click('#missing-response-link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Element with id missing-response not found in server response',
      ),
    );
  });
});
