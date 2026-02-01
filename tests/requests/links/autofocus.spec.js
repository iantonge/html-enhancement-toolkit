import { test, expect } from '@playwright/test';

test.describe('autofocus', () => {
  test('honors autofocus in het-also replacements', async ({ page }) => {
    await page.goto('/requests/links/autofocus');
    await Promise.all([
      page.waitForSelector('#sidebar-input'),
      page.click('#autofocus-link'),
    ]);
    await expect(page.locator('#sidebar-input')).toBeFocused();
  });

  test('honors autofocus in target replacement', async ({ page }) => {
    await page.goto('/requests/links/autofocus');
    await Promise.all([
      page.waitForSelector('#target-input'),
      page.click('#autofocus-target-link'),
    ]);
    await expect(page.locator('#target-input')).toBeFocused();
  });
});
