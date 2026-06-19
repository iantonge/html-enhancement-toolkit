import { expect, test } from '@playwright/test';

test.describe('components acquisition and sync expressions', () => {
  test('seeds a signal from DOM using het-seed', async ({ page }) => {
    await page.goto('/components/acquisition/seed');

    await expect(page.locator('#seed-count')).toHaveText('7');
    await page.click('#seed-inc');
    await expect(page.locator('#seed-count')).toHaveText('8');
  });

  test('synchronizes seeded signals from DOM using het-sync on het:sync events', async ({ page }) => {
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

  test('coerces values using $int, $float, and $bool intrinsics', async ({ page }) => {
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

  test('supports contextual reads and het-text bindings', async ({ page }) => {
    await page.goto('/components/acquisition/explicit-sources');

    await expect(page.locator('#text-output')).toHaveText('Ready');
    await expect(page.locator('#count-output')).toHaveText('7');
    await expect(page.locator('#status-output')).toHaveText('open');
    await expect(page.locator('#bracket-status-output')).toHaveText('open');
    await expect(page.locator('#bracket-label-output')).toHaveText('bracket camel');
    await expect(page.locator('#colon-attr-output')).toHaveText('bracket colon');
    await expect(page.locator('#hidden-output')).toHaveText('true');
    await expect(page.locator('#bracket-hidden-output')).toHaveText('true');
    await expect(page.locator('#colon-bool-attr-output')).toHaveText('true');
    await expect(page.locator('#active-output')).toHaveText('true');
    await expect(page.locator('#responsive-output')).toHaveText('true');
    await expect(page.locator('#answer-output')).toHaveText('42');
  });

  test('rejects dynamic computed attribute contextual reads', async ({ page }) => {
    await page.goto('/components/acquisition/invalid-attrs-computed');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid expression'),
    );

    await page.goto('/components/acquisition/invalid-bool-attrs-computed');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid expression'),
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
      bindingAttribute: 'het-seed',
      bindingDeclaration: 'count=$int($text)',
      bindingElementText: '2',
      existingBindingAttribute: 'het-seed',
      existingBindingDeclaration: 'count=$int($text)',
      existingBindingElementText: '1',
    });
  });

  test('reports error when a signal is reassigned after initialization', async ({ page }) => {
    await page.goto('/components/acquisition/signal-reassignment');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal override after initialization'),
    );
  });

  test('seeds signals through het-model', async ({ page }) => {
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

  test('parses "false" as false with $bool', async ({ page }) => {
    await page.goto('/components/acquisition/bool-false');
    await expect(page.locator('#bool-false-value')).toHaveText('false');

    await page.click('#bool-false-toggle');
    await expect(page.locator('#bool-false-value')).toHaveText('true');
  });
});
