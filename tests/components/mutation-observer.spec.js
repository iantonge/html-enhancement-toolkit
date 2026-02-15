import { expect, test } from '@playwright/test';

test.describe('components mutation observer', () => {
  test('mounts components added after init', async ({ page }) => {
    await page.goto('/components/mutation-observer/mount-added');
    await page.click('#add-component');
    await expect(page.locator('#mount-state')).toHaveText('mounted');
  });

  test('runs cleanup when component is removed', async ({ page }) => {
    await page.goto('/components/mutation-observer/unmount-removed');
    await page.click('#remove-component');
    await expect(page.locator('#cleanup-state')).toHaveText('cleaned');
  });

  test('mounts shallow-to-deep and cleans up deep-to-shallow', async ({ page }) => {
    await page.goto('/components/mutation-observer/depth-order');

    await page.click('#add-tree');
    await expect(page.locator('#mount-order')).toHaveText('parent,child');

    await page.click('#remove-tree');
    await expect(page.locator('#cleanup-order')).toHaveText('child,parent');
  });
});
