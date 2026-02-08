import { expect, test } from '@playwright/test';

test.describe('components base flow', () => {
  test('mounts registered component during init', async ({ page }) => {
    await page.goto('/components/base-flow/mount');
    await expect(page.locator('#mount-component')).toHaveText('Mounted');
    await expect(page.locator('#setup-count')).toHaveText('Setup count: 1');
  });

  test('runs cleanup callbacks on destroy', async ({ page }) => {
    await page.goto('/components/base-flow/destroy');
    await page.evaluate(() => {
      window.HET.destroy();
    });
    await expect(page.locator('#cleanup-count')).toHaveText('Cleanup count: 1');
  });

  test('throws when registering a component without a name', async ({ page }) => {
    await page.goto('/components/base-flow/register-without-name');
    await expect(page.locator('#register-error')).toHaveText(
      'HET Error: Component name is required',
    );
    const hetErrors = await page.evaluate(() => window.hetErrors);
    expect(hetErrors).toContain('HET Error: Component name is required');
  });
});
