import { expect, test } from '@playwright/test';

test.describe('components het-bool-attrs directive', () => {
  test('toggles boolean attributes with het-bool-attrs', async ({ page }) => {
    await page.goto('/components/het-bool-attrs');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
    await page.click('#disable-target');
    await expect(page.locator('#bool-attr-target')).toBeDisabled();
    await page.click('#enable-target');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
  });
});
