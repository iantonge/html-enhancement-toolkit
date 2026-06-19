import { expect, test } from '@playwright/test';

test.describe('components het-model', () => {
  test('binds text input with two-way updates using input events', async ({ page }) => {
    await page.goto('/components/het-model/text-input');

    await expect(page.locator('#name-input')).toHaveValue('Alpha');
    await expect(page.locator('#name-value')).toHaveText('Alpha');

    await page.fill('#name-input', 'Charlie');
    await expect(page.locator('#name-value')).toHaveText('Charlie');

    await page.click('#set-name');
    await expect(page.locator('#name-input')).toHaveValue('Bravo');
    await expect(page.locator('#name-value')).toHaveText('Bravo');
  });

});
