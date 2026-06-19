import { expect, test } from '@playwright/test';

test.describe('components structural templates', () => {
  test('het-for stamps clones, reuses them by position, and forwards signal writes', async ({ page }) => {
    await page.goto('/components/structural/for-list');

    await expect(page.locator('#for-list > li')).toHaveCount(2);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha', 'Beta']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2']);

    await page.click('#for-list .append-mark');
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha!', 'Beta']);

    await page.click('#swap-list');
    await expect(page.locator('#for-list .item-message')).toHaveText(['Gamma', 'Delta']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2']);

    await page.click('#grow-list');
    await expect(page.locator('#for-list > li')).toHaveCount(3);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Gamma', 'Delta', 'Epsilon']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2', '3']);

    await page.click('#shrink-list');
    await expect(page.locator('#for-list > li')).toHaveCount(1);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Gamma']);
    const cleanupIds = await page.evaluate(() => window.structuralForCleanupIds.slice());
    expect(cleanupIds).toEqual([3, 2]);
  });

  test('het-if mounts, unmounts, and reuses the existing clone when the source stays truthy', async ({ page }) => {
    await page.goto('/components/structural/if-toggle');

    await expect(page.locator('#if-host > article')).toHaveCount(0);

    await page.click('#show-item');
    await expect(page.locator('#if-host .if-label')).toHaveText('Primary');
    await expect(page.locator('#if-host .if-mount')).toHaveText('1');

    await page.click('#if-mutate');
    await expect(page.locator('#if-host .if-label')).toHaveText('Primary!');

    await page.click('#swap-item');
    await expect(page.locator('#if-host .if-label')).toHaveText('Replacement');
    await expect(page.locator('#if-host .if-mount')).toHaveText('1');

    await page.click('#hide-item');
    await expect(page.locator('#if-host > article')).toHaveCount(0);
    const cleanupIds = await page.evaluate(() => window.structuralIfCleanupIds.slice());
    expect(cleanupIds).toEqual(['1']);
  });

  test('reports error when het-for source is not an array', async ({ page }) => {
    await page.goto('/components/structural/invalid-non-array');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-for source must be an array'),
    );
  });

});
