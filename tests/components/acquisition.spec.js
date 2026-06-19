import { expect, test } from '@playwright/test';

test.describe('components acquisition and sync expressions', () => {
  test('seeds a signal from DOM using het-seed', async ({ page }) => {
    await page.goto('/components/acquisition/seed');

    await expect(page.locator('#seed-count')).toHaveText('7');
  });

  test('supports contextual reads and het-text bindings', async ({ page }) => {
    await page.goto('/components/acquisition/explicit-sources');

    await expect(page.locator('#text-output')).toHaveText('Ready');
    await expect(page.locator('#count-output')).toHaveText('7');
    await expect(page.locator('#answer-output')).toHaveText('42');
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

});
