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

  test('supports explicit read sources and het-text bindings', async ({ page }) => {
    await page.goto('/components/acquisition/explicit-sources');

    await expect(page.locator('#text-output')).toHaveText('Ready');
    await expect(page.locator('#count-output')).toHaveText('7');
    await expect(page.locator('#status-output')).toHaveText('open');
    await expect(page.locator('#hidden-output')).toHaveText('true');
    await expect(page.locator('#active-output')).toHaveText('true');
    await expect(page.locator('#responsive-output')).toHaveText('true');
    await expect(page.locator('#answer-output')).toHaveText('42');
  });

  test('reports error when :sync is used on het-model', async ({ page }) => {
    await page.goto('/components/acquisition/invalid-sync-model');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal source cannot contain ":"'),
    );
  });

  test('reports error when the same seeded signal is declared twice', async ({ page }) => {
    await page.goto('/components/acquisition/duplicate-seed-signal');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Duplicate signal initialization'),
    );
    const cause = await page.evaluate(() => ({
      componentName: window.hetErrors.at(-1).cause.componentName,
      signalName: window.hetErrors.at(-1).cause.signalName,
      bindingAttribute: window.hetErrors.at(-1).cause.bindingAttribute,
      bindingDeclaration: window.hetErrors.at(-1).cause.bindingDeclaration,
      bindingElementText: window.hetErrors.at(-1).cause.bindingElement.textContent.trim(),
      existingBindingAttribute: window.hetErrors.at(-1).cause.existingBindingAttribute,
      existingBindingDeclaration: window.hetErrors.at(-1).cause.existingBindingDeclaration,
      existingBindingElementText: window.hetErrors.at(-1).cause.existingBindingElement.textContent.trim(),
    }));
    expect(cause).toEqual({
      componentName: 'acquisition-duplicate-seed',
      signalName: 'count',
      bindingAttribute: 'het-props:seed',
      bindingDeclaration: 'textContent=count[int]',
      bindingElementText: '2',
      existingBindingAttribute: 'het-props:seed',
      existingBindingDeclaration: 'textContent=count[int]',
      existingBindingElementText: '1',
    });
  });

  test('reports error for declarations with multiple colons', async ({ page }) => {
    await page.goto('/components/acquisition/invalid-multiple-colons');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal source cannot contain ":"'),
    );
  });

  test('reports error when negation is used with acquisition', async ({ page }) => {
    await page.goto('/components/acquisition/invalid-negation');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Negation cannot be used with acquisition'),
    );
  });

  test('reports error when negation has no signal name', async ({ page }) => {
    await page.goto('/components/acquisition/empty-negation');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Negation requires a signal name'),
    );
    const cause = await page.evaluate(() => ({
      componentName: window.hetErrors.at(-1).cause.componentName,
      bindingAttribute: window.hetErrors.at(-1).cause.bindingAttribute,
      bindingDeclaration: window.hetErrors.at(-1).cause.bindingDeclaration,
      bindingElementId: window.hetErrors.at(-1).cause.bindingElement.id,
    }));
    expect(cause).toEqual({
      componentName: 'acquisition-empty-negation',
      bindingAttribute: 'het-props',
      bindingDeclaration: 'hidden=!',
      bindingElementId: 'empty-negation-value',
    });
  });

  test('reports error for incomplete acquisition clauses', async ({ page }) => {
    await page.goto('/components/acquisition/incomplete-acquisition');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal source cannot contain ":"'),
    );
    const cause = await page.evaluate(() => ({
      componentName: window.hetErrors.at(-1).cause.componentName,
      bindingAttribute: window.hetErrors.at(-1).cause.bindingAttribute,
      bindingDeclaration: window.hetErrors.at(-1).cause.bindingDeclaration,
      bindingElementId: window.hetErrors.at(-1).cause.bindingElement.id,
    }));
    expect(cause).toEqual({
      componentName: 'acquisition-incomplete',
      bindingAttribute: 'het-props',
      bindingDeclaration: 'textContent=count:',
      bindingElementId: 'incomplete-acquisition-value',
    });
  });

  test('reports error when type hint is unsupported for a directive', async ({ page }) => {
    await page.goto('/components/acquisition/type-hint-unsupported');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Directive does not support type hints'),
    );
  });

  test('reports error for unknown type hint', async ({ page }) => {
    await page.goto('/components/acquisition/unknown-type-hint');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Type hint is not recognised. Expected type hints are "int", "bool" or "float"'),
    );
  });

  test('reports error for unknown acquisition strategy', async ({ page }) => {
    await page.goto('/components/acquisition/unknown-strategy');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal source cannot contain ":"'),
    );
  });

  test('reports error when acquisition clause is used on non-readable directive', async ({ page }) => {
    await page.goto('/components/acquisition/acquisition-not-supported');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Missing component method'),
    );
  });

  test('reports error when a signal is reassigned after initialization', async ({ page }) => {
    await page.goto('/components/acquisition/signal-reassignment');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal override after initialization'),
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
