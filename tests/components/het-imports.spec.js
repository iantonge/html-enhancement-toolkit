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
      'HET Error: Imported signal has no exporting ancestor',
    );
    const cause = await page.evaluate(() => ({
      componentName: window.hetLastError.cause.componentName,
      bindingAttribute: window.hetLastError.cause.bindingAttribute,
      importLocalSignalName: window.hetLastError.cause.importLocalSignalName,
      importSourceSignalName: window.hetLastError.cause.importSourceSignalName,
      componentImport: window.hetLastError.cause.componentElement.getAttribute('het-imports'),
    }));
    expect(cause).toEqual({
      componentName: 'imports-missing-parent',
      bindingAttribute: 'het-imports',
      importLocalSignalName: 'count',
      importSourceSignalName: 'count',
      componentImport: 'count',
    });
  });

  test('reports error when nearest exporting parent exists but is not mounted', async ({ page }) => {
    await page.goto('/components/het-imports/parent-not-mounted');
    await expect(page.locator('#error-message')).toHaveText(
      'HET Error: Exporting ancestor component is not mounted',
    );
    const cause = await page.evaluate(() => ({
      componentName: window.hetLastError.cause.componentName,
      bindingAttribute: window.hetLastError.cause.bindingAttribute,
      importLocalSignalName: window.hetLastError.cause.importLocalSignalName,
      importSourceSignalName: window.hetLastError.cause.importSourceSignalName,
      exportingComponentName: window.hetLastError.cause.exportingComponentName,
      parentExports: window.hetLastError.cause.exportingComponentElement.getAttribute('het-exports'),
    }));
    expect(cause).toEqual({
      componentName: 'imports-parent-not-mounted-child',
      bindingAttribute: 'het-imports',
      importLocalSignalName: 'count',
      importSourceSignalName: 'count',
      exportingComponentName: 'imports-unregistered-parent',
      parentExports: 'count',
    });
  });

  test('reports error when exported signal is not found on nearest parent component', async ({ page }) => {
    await page.goto('/components/het-imports/export-missing-signal');
    await expect(page.locator('#error-message')).toHaveText(
      'HET Error: Exporting ancestor does not provide imported signal',
    );
    const cause = await page.evaluate(() => ({
      componentName: window.hetLastError.cause.componentName,
      bindingAttribute: window.hetLastError.cause.bindingAttribute,
      importLocalSignalName: window.hetLastError.cause.importLocalSignalName,
      importSourceSignalName: window.hetLastError.cause.importSourceSignalName,
      exportingComponentName: window.hetLastError.cause.exportingComponentName,
      parentExports: window.hetLastError.cause.exportingComponentElement.getAttribute('het-exports'),
    }));
    expect(cause).toEqual({
      componentName: 'imports-export-missing-child',
      bindingAttribute: 'het-imports',
      importLocalSignalName: 'count',
      importSourceSignalName: 'count',
      exportingComponentName: 'imports-export-missing-parent',
      parentExports: 'count',
    });
  });

  test('reports error for invalid het-imports declarations', async ({ page }) => {
    await page.goto('/components/het-imports/invalid-declaration');
    await expect(page.locator('#error-message')).toHaveText(
      'HET Error: Invalid import declaration',
    );
  });

  test('reports error when imported and local signals conflict', async ({ page }) => {
    await page.goto('/components/het-imports/signal-name-conflict');
    await expect(page.locator('#error-message')).toHaveText(
      'HET Error: Imported signal conflicts with local initialization',
    );
  });
});
