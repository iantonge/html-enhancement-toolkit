import { expect, test } from '@playwright/test';

test.describe('components het-exports / het-imports', () => {
  test('resolves imports from the nearest exporting ancestor', async ({ page }) => {
    await page.goto('/components/het-imports/nearest-ancestor');

    await expect(page.locator('#nearest-value')).toHaveText('0');

    await page.click('#increment-nearest');
    await expect(page.locator('#nearest-value')).toHaveText('1');
  });

  test('supports import alias declarations', async ({ page }) => {
    await page.goto('/components/het-imports/alias');

    await expect(page.locator('#alias-value')).toHaveText('0');

    await page.click('#increment-alias');
    await expect(page.locator('#alias-value')).toHaveText('1');
  });

  test('reports error when no exporting ancestor is found', async ({ page }) => {
    await page.goto('/components/het-imports/missing-parent');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Unable to resolve import 'count' for 'count' (no exporting parent found)",
    );
  });

  test('reports error when nearest exporting parent exists but is not mounted', async ({ page }) => {
    await page.goto('/components/het-imports/parent-not-mounted');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Exported signal 'count' is unavailable because the parent component is not mounted",
    );
  });

  test('reports error when exported signal is not found on nearest parent component', async ({ page }) => {
    await page.goto('/components/het-imports/export-missing-signal');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Exported signal 'count' not found on nearest parent component",
    );
  });

  test('reports error for invalid het-imports declarations', async ({ page }) => {
    await page.goto('/components/het-imports/invalid-declaration');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Invalid het-imports declaration 'local=source=extra'",
    );
  });

  test('reports error when imported and local signals conflict', async ({ page }) => {
    await page.goto('/components/het-imports/signal-name-conflict');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Signal name conflict for 'count' (import vs local)",
    );
  });
});
