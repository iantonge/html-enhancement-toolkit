import { test, expect } from '@playwright/test';

test.describe('form het-select', () => {
  test('only replaces selected id', async ({ page }) => {
    await page.goto('/requests/het-select/forms/partial');
    await Promise.all([
      page.waitForSelector('#primary:has-text("Primary response.")'),
      page.click('#submit'),
    ]);
    await expect(page.locator('#secondary')).toHaveText('Secondary content.');
  });

  test('only replaces multiple selected ids', async ({ page }) => {
    await page.goto('/requests/het-select/forms/multi');
    await Promise.all([
      page.waitForSelector('#primary:has-text("Primary response.")'),
      page.click('#submit'),
    ]);
    await expect(page.locator('#secondary')).toHaveText('Secondary response.');
    await expect(page.locator('#tertiary')).toHaveText('Tertiary content.');
  });

  test('throws when selected id is missing in current target', async ({ page }) => {
    await page.goto('/requests/het-select/forms/missing-current');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Selected element not found in the target pane on the page',),
    );
  });

  test('throws when selected id is missing in server response', async ({ page }) => {
    await page.goto('/requests/het-select/forms/missing-response');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Selected element not found in the target pane in the server response',),
    );
  });
});
