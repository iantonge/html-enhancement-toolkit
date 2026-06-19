import { expect, test } from '@playwright/test';

test.describe('components het-attrs directive', () => {
  test('binds signal values to attributes with het-attrs', async ({ page }) => {
    await page.goto('/components/het-attrs');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'idle');
    await page.click('#set-status');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'ready');
  });
});
