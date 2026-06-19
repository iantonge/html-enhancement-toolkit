import { expect, test } from '@playwright/test';

test.describe('components het-class directive', () => {
  test('toggles classes with het-class', async ({ page }) => {
    await page.goto('/components/het-class');
    await expect(page.locator('#class-target')).not.toHaveClass(/active/);
    await page.click('#activate-target');
    await expect(page.locator('#class-target')).toHaveClass(/active/);
    await page.click('#deactivate-target');
    await expect(page.locator('#class-target')).not.toHaveClass(/active/);
  });
});
