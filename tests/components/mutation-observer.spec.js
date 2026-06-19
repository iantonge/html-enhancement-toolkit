import { expect, test } from '@playwright/test';

test.describe('components mutation observer', () => {
  test('mounts components added after init', async ({ page }) => {
    await page.goto('/components/mutation-observer/mount-added');
    await page.click('#add-component');
    await expect(page.locator('#mount-state')).toHaveText('mounted');
  });

  test('removes het-mount-pending from components added after init', async ({ page }) => {
    await page.goto('/components/mutation-observer/mount-added');
    await page.click('#add-mount-pending-component');
    await expect(page.locator('#mount-pending-state')).toHaveText('mounted');
    await expect(page.locator('#added-mount-pending')).not.toHaveAttribute('het-mount-pending', '');
  });

  test('runs cleanup when component is removed', async ({ page }) => {
    await page.goto('/components/mutation-observer/unmount-removed');
    await page.click('#remove-component');
    await expect(page.locator('#cleanup-state')).toHaveText('cleaned');
    await expect(page.locator('.pending-unmount')).toHaveCount(0);
  });

  test('mounts shallow-to-deep and cleans up deep-to-shallow', async ({ page }) => {
    await page.goto('/components/mutation-observer/depth-order');

    await page.click('#add-tree');
    await expect(page.locator('#mount-order')).toHaveText('parent,child');

    await page.click('#remove-tree');
    await expect(page.locator('#cleanup-order')).toHaveText('child,parent');
  });

  test('mounts and unmounts when het-component attribute is toggled', async ({ page }) => {
    await page.goto('/components/mutation-observer/attribute-toggle');

    await page.click('#enable-component');
    await expect(page.locator('#toggle-mount-state')).toHaveText('mounted');

    await page.click('#disable-component');
    await expect(page.locator('#toggle-cleanup-state')).toHaveText('cleaned');
    await expect(page.locator('.pending-unmount')).toHaveCount(0);
  });
});
