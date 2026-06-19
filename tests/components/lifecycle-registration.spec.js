import { expect, test } from '@playwright/test';

test.describe('components lifecycle and registration', () => {
  test('mounts registered component during init', async ({ page }) => {
    await page.goto('/components/lifecycle/mount');
    await expect(page.locator('#mount-component')).toHaveText('Mounted');
    await expect(page.locator('#setup-count')).toHaveText('Setup count: 1');
  });

});
