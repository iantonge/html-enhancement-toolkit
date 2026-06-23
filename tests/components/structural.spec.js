import { expect, test } from '@playwright/test';

test.describe('components structural templates', () => {
  test('het-for stamps clones, reuses them by key, and forwards signal writes', async ({ page }) => {
    await page.goto('/components/structural/for-list');

    await expect(page.locator('#for-list > li')).toHaveCount(2);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha', 'Beta']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2']);
    await expect(page.locator('#for-list > li').nth(0)).toHaveAttribute('id', 'a-row');
    await expect(page.locator('#for-list > li').nth(0)).toHaveAttribute('data-key', 'a');
    await expect(page.locator('#for-list > li').nth(1)).toHaveAttribute('data-key', 'b');
    await expect.poll(
      () => page.evaluate(() => window.structuralForHostKey),
    ).toBe(undefined);

    await page.click('#for-list .append-mark');
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha!', 'Beta']);

    await page.click('#swap-list');
    await expect(page.locator('#for-list .item-message')).toHaveText(['Beta', 'Alpha!']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['2', '1']);
    await expect(page.locator('#for-list > li').nth(0)).toHaveAttribute('id', 'b-row');
    await expect(page.locator('#for-list > li').nth(1)).toHaveAttribute('id', 'a-row');
    await expect(page.locator('#for-list > li').nth(0)).toHaveAttribute('data-key', 'b');
    await expect(page.locator('#for-list > li').nth(1)).toHaveAttribute('data-key', 'a');

    await page.click('#grow-list');
    await expect(page.locator('#for-list > li')).toHaveCount(3);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Beta', 'Alpha!', 'Epsilon']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['2', '1', '3']);

    await page.click('#shrink-list');
    await expect(page.locator('#for-list > li')).toHaveCount(1);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Beta']);
    await expect(page.locator('.het-unmounting')).toHaveCount(0);
    const cleanupIds = await page.evaluate(() => window.structuralForCleanupIds.slice());
    expect(cleanupIds).toEqual([1, 3]);
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

  test('het-for defers removals, makes pending clones inert, and does not reuse them', async ({ page }) => {
    await page.goto('/components/structural/for-list-delayed');

    await expect(page.locator('#for-list > li')).toHaveCount(3);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2', '3']);

    await page.click('#remove-middle');
    await expect(page.locator('#for-list > li')).toHaveCount(3);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha', 'Beta', 'Gamma']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2', '3']);
    await expect(page.locator('#for-list .pending-unmount')).toHaveCount(1);
    const pendingClone = page.locator('#for-list .pending-unmount');
    await expect(pendingClone).toHaveAttribute('inert', '');
    await page.waitForTimeout(50);
    const exitOpacity = await pendingClone.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(exitOpacity).toBeGreaterThan(0);
    expect(exitOpacity).toBeLessThan(1);
    await expect.poll(
      () => page.evaluate(() => window.structuralForDelayedCleanupIds.slice()),
    ).toEqual([]);
    await pendingClone.locator('.pending-action').click({ force: true });
    await expect(pendingClone).not.toHaveAttribute('data-clicked', 'true');

    await page.click('#readd-middle');
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha', 'Beta', 'Beta re-added', 'Gamma']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '2', '4', '3']);
    await expect(page.locator('#for-list > li').nth(0)).toHaveAttribute('data-key', 'a');
    await expect(page.locator('#for-list > li').nth(1)).toHaveAttribute('data-key', 'b');
    await expect(page.locator('#for-list > li').nth(2)).toHaveAttribute('data-key', 'b');
    await expect(page.locator('#for-list > li').nth(3)).toHaveAttribute('data-key', 'c');
    await expect(page.locator('#for-list .pending-unmount')).toHaveCount(1);

    await page.waitForTimeout(550);
    await expect(page.locator('#for-list > li')).toHaveCount(3);
    await expect(page.locator('#for-list .item-message')).toHaveText(['Alpha', 'Beta re-added', 'Gamma']);
    await expect(page.locator('#for-list .item-mount')).toHaveText(['1', '4', '3']);
    await expect.poll(
      () => page.evaluate(() => window.structuralForDelayedCleanupIds.slice()),
    ).toEqual([2]);
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

  test('reports error when het-for is missing a key declaration', async ({ page }) => {
    await page.goto('/components/structural/invalid-missing-key');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-for requires a key'),
    );
  });

  test('reports error when a het-for item is missing the key property', async ({ page }) => {
    await page.goto('/components/structural/invalid-missing-key-property');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-for key is missing'),
    );
  });

  test('reports error when a het-for key is not a string or number', async ({ page }) => {
    await page.goto('/components/structural/invalid-key-type');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-for key must be a string or number'),
    );
  });

  test('reports error when het-for keys are duplicated', async ({ page }) => {
    await page.goto('/components/structural/invalid-duplicate-key');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-for keys must be unique'),
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

  test('reports error when $key is used outside het-for', async ({ page }) => {
    await page.goto('/components/structural/key-outside-for');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: $key is only available inside het-for'),
    );
  });
});
