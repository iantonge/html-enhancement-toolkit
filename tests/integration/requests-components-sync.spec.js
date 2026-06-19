import { expect, test } from '@playwright/test';

test.describe('integration requests + components sync', () => {
  test('synchronizes existing component signals after request-driven DOM mutation', async ({ page }) => {
    await page.goto('/integration/requests-components-sync');

    await expect(page.locator('#sync-value')).toHaveText('alpha');
    await expect(page.locator('#sync-indicator')).not.toHaveAttribute('hidden', '');
    await expect(page.locator('#sync-sidebar-value')).toHaveText('aside alpha');

    await page.click('#load-response');
    await expect(page.locator('#sync-title')).toHaveText('Requests + Components sync response');
    await expect(page.locator('#sync-value')).toHaveText('beta');
    await expect(page.locator('#sync-indicator')).toHaveAttribute('hidden', '');
    await expect(page.locator('#sync-sidebar-value')).toHaveText('aside beta');
    await expect(page.locator('#sync-component')).not.toHaveAttribute('het-mount-pending', '');
  });
});
