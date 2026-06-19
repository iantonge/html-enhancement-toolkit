import { expect, test } from '@playwright/test';

test.describe('components het-props', () => {
  test('binds signal values to element properties', async ({ page }) => {
    await page.goto('/components/het-props/binds-signal');
    await expect(page.locator('#count-value')).toHaveText('0');
    await page.click('#increment-button');
    await expect(page.locator('#count-value')).toHaveText('1');
  });

  test('allows a trailing semicolon in multi-binding attributes', async ({ page }) => {
    await page.goto('/components/het-props/trailing-semicolon');
    await expect(page.locator('#trailing-semicolon-output')).toHaveText('3');
    await expect(page.locator('#trailing-semicolon-output')).toHaveAttribute('title', '3');
  });

  test('reports an error when a signal is initialized without signal(...)', async ({ page }) => {
    await page.goto('/components/het-props/invalid-assignment');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal initialized with a non-signal value'),
    );
  });

  test('reports an error when a bound signal is missing', async ({ page }) => {
    await page.goto('/components/het-props/missing-signal');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Bound signal does not exist'),
    );
  });

  test('routes effect write errors through onError', async ({ page }) => {
    await page.goto('/components/het-props/write-error');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET test error: write failed'),
    );
    const hetErrors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(hetErrors).toContain('HET test error: write failed');
  });

  test('attaches binding context to empty binding declaration errors', async ({ page }) => {
    await page.goto('/components/het-props/empty-binding');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Empty binding declaration'),
    );

    const cause = await page.evaluate(() => {
      const { componentElement, bindingElement, ...serializableCause } =
        window.hetErrors.at(-1).cause;
      return {
        ...serializableCause,
        hasComponentName: Object.hasOwn(window.hetErrors.at(-1).cause, 'componentName'),
        componentElementId: componentElement.id,
        bindingElementId: bindingElement.id,
      };
    });

    expect(cause).toEqual({
      hasComponentName: false,
      componentElementId: 'empty-binding-root',
      bindingAttribute: 'het-props',
      bindingDeclaration: 'textContent=count; ; title=count',
      bindingErrorReason: 'Empty binding declaration',
      bindingElementId: 'empty-binding-target',
    });
  });
});
