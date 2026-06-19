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

});
