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
    await expect(page.locator('.het-unmounting')).toHaveCount(0);
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
    await expect(page.locator('.het-unmounting')).toHaveCount(0);
    const cleanupIds = await page.evaluate(() => window.structuralIfCleanupIds.slice());
    expect(cleanupIds).toEqual(['1']);
  });

  test('het-if defers structural teardown, then cleans up after the delay', async ({ page }) => {
    await page.goto('/components/structural/if-toggle-delayed');

    await page.click('#show-item');
    await expect(page.locator('#if-host .if-mount')).toHaveText('1');

    await page.click('#hide-item');
    await expect(page.locator('#if-host > article')).toHaveCount(1);
    await expect(page.locator('#if-host > article')).toHaveClass(/pending-unmount/);
    await expect.poll(
      () => page.evaluate(() => window.structuralIfDelayedCleanupIds.slice()),
    ).toEqual([]);

    await page.waitForTimeout(150);
    await expect(page.locator('#if-host > article')).toHaveCount(0);
    await expect.poll(
      () => page.evaluate(() => window.structuralIfDelayedCleanupIds.slice()),
    ).toEqual(['1']);
  });

  test('het-if cancels a pending structural teardown and reuses the clone', async ({ page }) => {
    await page.goto('/components/structural/if-toggle-delayed');

    await page.click('#show-item');
    await expect(page.locator('#if-host .if-mount')).toHaveText('1');

    await page.click('#hide-item');
    await expect(page.locator('#if-host > article')).toHaveClass(/pending-unmount/);

    await page.click('#swap-item');
    await expect(page.locator('#if-host > article')).not.toHaveClass(/pending-unmount/);
    await expect(page.locator('#if-host .if-label')).toHaveText('Replacement');
    await expect(page.locator('#if-host .if-mount')).toHaveText('1');

    await page.waitForTimeout(150);
    await expect(page.locator('#if-host > article')).toHaveCount(1);
    await expect.poll(
      () => page.evaluate(() => window.structuralIfDelayedCleanupIds.slice()),
    ).toEqual([]);
  });

  test('het-if supports per-root unmount delay overrides', async ({ page }) => {
    await page.goto('/components/structural/if-toggle-override');

    await page.click('#show-item');
    await expect(page.locator('#if-host .if-mount')).toHaveText('1');

    await page.click('#hide-item');
    await expect(page.locator('#if-host > article')).toHaveClass(/pending-unmount/);

    await page.waitForTimeout(100);
    await expect(page.locator('#if-host > article')).toHaveCount(1);

    await page.waitForTimeout(160);
    await expect(page.locator('#if-host > article')).toHaveCount(0);
    await expect.poll(
      () => page.evaluate(() => window.structuralIfOverrideCleanupIds.slice()),
    ).toEqual(['1']);
  });

  test('het-for defers trailing removals and reuses pending clones when the list regrows', async ({ page }) => {
    await page.goto('/components/structural/for-list-delayed');

    await expect(page.locator('#for-list > li')).toHaveCount(3);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2', '3']);

    await page.click('#shrink-list');
    await expect(page.locator('#for-list > li')).toHaveCount(3);
    await expect(page.locator('#for-list .pending-unmount')).toHaveCount(2);
    await expect.poll(
      () => page.evaluate(() => window.structuralForDelayedCleanupIds.slice()),
    ).toEqual([]);

    await page.click('#regrow-list');
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha', 'Delta', 'Gamma']);
    await expect(page.locator('#for-list .item-mount').nth(0)).toHaveText('1');
    await expect(page.locator('#for-list .item-mount').nth(1)).toHaveText('2');
    await expect(page.locator('#for-list .pending-unmount')).toHaveCount(1);

    await page.waitForTimeout(150);
    await expect(page.locator('#for-list > li')).toHaveCount(2);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha', 'Delta']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2']);
    await expect.poll(
      () => page.evaluate(() => window.structuralForDelayedCleanupIds.slice()),
    ).toEqual([3]);
  });

  test('mounts structural templates when a component tree is added after init', async ({ page }) => {
    await page.goto('/components/structural/mount-added');
    await page.click('#add-structural-component');
    await expect(page.locator('#mount-added-state')).toHaveText('Mounted after init');
    await expect(page.locator('.mounted-label')).toHaveText('Mounted after init');
  });

  test('reports error when het-for source is not an array', async ({ page }) => {
    await page.goto('/components/structural/invalid-non-array');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-for source must be an array'),
    );
  });

  test('reports error when a forwarded property is not a signal', async ({ page }) => {
    await page.goto('/components/structural/invalid-property');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Structural item property must be a signal'),
    );
  });

  test('reports error when the structural template root is not a component', async ({ page }) => {
    await page.goto('/components/structural/invalid-root');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Structural template root must be a component'),
    );
  });

  test('reports error when forwarded and local initialization conflict', async ({ page }) => {
    await page.goto('/components/structural/signal-name-conflict');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Imported signal conflicts with local initialization'),
    );
  });

  test('reports error when a structural clone receives a different forwarded signal shape', async ({ page }) => {
    await page.goto('/components/structural/shape-change');
    await page.click('#shape-change');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Structural clone signal shape changed'),
    );
  });
});
