import { expect, test } from '@playwright/test';

test.describe('components acquisition and sync expressions', () => {
  test('seeds a signal from DOM using het-seed', async ({ page }) => {
    await page.goto('/components/acquisition/seed');

    await expect(page.locator('#seed-count')).toHaveText('7');
  });

  test('supports contextual reads and het-text bindings', async ({ page }) => {
    await page.goto('/components/acquisition/explicit-sources');

    await expect(page.locator('#text-output')).toHaveText('Ready');
    await expect(page.locator('#count-output')).toHaveText('7');
    await expect(page.locator('#answer-output')).toHaveText('42');
  });

});
