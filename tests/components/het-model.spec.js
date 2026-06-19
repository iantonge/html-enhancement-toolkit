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

  test('binds checkbox with two-way updates using change events', async ({ page }) => {
    await page.goto('/components/het-model/checkbox');

    await expect(page.locator('#done-checkbox')).not.toBeChecked();
    await expect(page.locator('#done-value')).toHaveText('false');

    await page.click('#done-checkbox');
    await expect(page.locator('#done-value')).toHaveText('true');

    await page.click('#done-checkbox');
    await expect(page.locator('#done-value')).toHaveText('false');

    await page.click('#set-done');
    await expect(page.locator('#done-checkbox')).toBeChecked();
    await expect(page.locator('#done-value')).toHaveText('true');
  });

});
