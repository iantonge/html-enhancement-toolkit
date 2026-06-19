import { expect, test } from '@playwright/test';

test.describe('components het-exports / het-imports', () => {
  test('resolves imports from the nearest exporting ancestor', async ({ page }) => {
    await page.goto('/components/het-imports/nearest-ancestor');

    await expect(page.locator('#nearest-value')).toHaveText('0');

    await page.click('#increment-nearest');
    await expect(page.locator('#nearest-value')).toHaveText('1');
  });

  test('supports import alias declarations', async ({ page }) => {
    await page.goto('/components/het-imports/alias');

    await expect(page.locator('#alias-value')).toHaveText('0');

    await page.click('#increment-alias');
    await expect(page.locator('#alias-value')).toHaveText('1');
  });

});
