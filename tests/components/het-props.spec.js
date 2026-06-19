import { expect, test } from '@playwright/test';

test.describe('components het-props', () => {
  test('binds signal values to element properties', async ({ page }) => {
    await page.goto('/components/het-props/binds-signal');
    await expect(page.locator('#count-value')).toHaveText('0');
    await page.click('#increment-button');
    await expect(page.locator('#count-value')).toHaveText('1');
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

});
