import { expect, test } from '@playwright/test';

test.describe('components acquisition and sync expressions', () => {
  test('seeds a signal from DOM using het-seed', async ({ page }) => {
    await page.goto('/components/acquisition/seed');

    await expect(page.locator('#seed-count')).toHaveText('7');
  });

});
