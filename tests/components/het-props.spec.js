import { expect, test } from '@playwright/test';

test.describe('components het-props', () => {
  test('binds signal values to element properties', async ({ page }) => {
    await page.goto('/components/het-props/binds-signal');
    await expect(page.locator('#count-value')).toHaveText('0');
    await page.click('#increment-button');
    await expect(page.locator('#count-value')).toHaveText('1');
  });

  test('binds negated signal values to element properties', async ({ page }) => {
    await page.goto('/components/het-props/negation');
    await expect(page.locator('#prop-negation-target')).toBeVisible();
    await page.click('#hide-target');
    await expect(page.locator('#prop-negation-target')).toBeHidden();
  });

  test('reports an error when a signal is initialized without signal(...)', async ({ page }) => {
    await page.goto('/components/het-props/invalid-assignment');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Signal 'count' must be initialized with signal(...)",
    );
  });

  test('reports an error when a bound signal is missing', async ({ page }) => {
    await page.goto('/components/het-props/missing-signal');
    await expect(page.locator('#error-message')).toHaveText(
      'HET Error: Attempting to bind signal count but it does not exist',
    );
  });

  test('routes effect write errors through onError', async ({ page }) => {
    await page.goto('/components/het-props/write-error');
    await expect(page.locator('#error-message')).toHaveText(
      'HET test error: write failed',
    );
    const hetErrors = await page.evaluate(() => window.hetErrors);
    expect(hetErrors).toContain('HET test error: write failed');
  });
});
