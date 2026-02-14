import { expect, test } from '@playwright/test';

test.describe('components acquisition strategies and type hints', () => {
  test('seeds a signal from DOM using :seed', async ({ page }) => {
    await page.goto('/components/acquisition/seed');

    await expect(page.locator('#seed-count')).toHaveText('7');
    await page.click('#seed-inc');
    await expect(page.locator('#seed-count')).toHaveText('8');
  });

  test('synchronizes seeded signals from DOM using :sync on het:sync events', async ({ page }) => {
    await page.goto('/components/acquisition/sync');

    await expect(page.locator('#sync-value')).toHaveText('alpha');

    await page.evaluate(() => {
      const input = document.getElementById('sync-input');
      input.value = 'beta';
      const root = document.getElementById('sync-root');
      root.dispatchEvent(new CustomEvent('het:sync', { bubbles: true }));
    });

    await expect(page.locator('#sync-value')).toHaveText('beta');
  });

  test('coerces values using [int], [float], and [bool] type hints', async ({ page }) => {
    await page.goto('/components/acquisition/type-hints');

    await expect(page.locator('#int-value')).toHaveText('7');
    await expect(page.locator('#float-value')).toHaveText('3.5');
    await expect(page.locator('#bool-value')).toHaveText('true');

    await page.click('#int-inc');
    await page.click('#float-inc');
    await page.click('#bool-toggle');

    await expect(page.locator('#int-value')).toHaveText('8');
    await expect(page.locator('#float-value')).toHaveText('4');
    await expect(page.locator('#bool-value')).toHaveText('false');
  });

  test('reports error when :sync is used on het-model', async ({ page }) => {
    await page.goto('/components/acquisition/invalid-sync-model');
    await expect(page.locator('#error-message')).toHaveText(
      "HET error: 'het-model' does not support :sync in 'count:sync'",
    );
  });

  test('reports error when the same seeded signal is declared twice', async ({ page }) => {
    await page.goto('/components/acquisition/duplicate-seed-signal');
    await expect(page.locator('#error-message')).toHaveText(
      'HET Error: Attempting to seed initial value for signal count but it already exists',
    );
  });

  test('reports error for declarations with multiple colons', async ({ page }) => {
    await page.goto('/components/acquisition/invalid-multiple-colons');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Invalid declaration 'textContent=count:seed:int'",
    );
  });

  test('reports error when type hint is unsupported for a directive', async ({ page }) => {
    await page.goto('/components/acquisition/type-hint-unsupported');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Type hints unsupported for het-class: 'active=isActive:seed[int]'",
    );
  });

  test('reports error for unknown type hint', async ({ page }) => {
    await page.goto('/components/acquisition/unknown-type-hint');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Type hint 'string' not recognised in 'textContent=name:seed[string]'",
    );
  });

  test('reports error for unknown acquisition strategy', async ({ page }) => {
    await page.goto('/components/acquisition/unknown-strategy');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Acquisition strategy 'synchronize' not recognised in 'textContent=name:synchronize[int]'",
    );
  });

  test('reports error when acquisition clause is used on non-readable directive', async ({ page }) => {
    await page.goto('/components/acquisition/acquisition-not-supported');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Acquisition clause not supported in binding declaration 'click=increment:seed'",
    );
  });

  test('reports error when a signal is reassigned after initialization', async ({ page }) => {
    await page.goto('/components/acquisition/signal-reassignment');
    await expect(page.locator('#error-message')).toHaveText(
      "HET error: Attempting to override signal 'count' after initialization",
    );
  });

  test('supports :seed on het-model', async ({ page }) => {
    await page.goto('/components/acquisition/model-seed');
    await expect(page.locator('#model-seed-input')).toHaveValue('Seeded');
    await expect(page.locator('#model-seed-value')).toHaveText('Seeded');

    await page.click('#model-seed-set');
    await expect(page.locator('#model-seed-input')).toHaveValue('Updated');
    await expect(page.locator('#model-seed-value')).toHaveText('Updated');
  });

  test('does not process :sync updates after HET.destroy()', async ({ page }) => {
    await page.goto('/components/acquisition/sync-after-destroy');
    await expect(page.locator('#sync-destroy-value')).toHaveText('alpha');

    await page.evaluate(() => {
      window.HET.destroy();
      const input = document.getElementById('sync-destroy-input');
      input.value = 'beta';
      const root = document.getElementById('sync-destroy-root');
      root.dispatchEvent(new CustomEvent('het:sync', { bubbles: true }));
    });

    await expect(page.locator('#sync-destroy-value')).toHaveText('alpha');
  });

  test('parses "false" as false for [bool] type hint', async ({ page }) => {
    await page.goto('/components/acquisition/bool-false');
    await expect(page.locator('#bool-false-value')).toHaveText('false');

    await page.click('#bool-false-toggle');
    await expect(page.locator('#bool-false-value')).toHaveText('true');
  });
});
