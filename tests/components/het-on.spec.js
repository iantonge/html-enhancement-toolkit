import { expect, test } from '@playwright/test';

test.describe('components het-on', () => {
  test('invokes setup method for declared event handler', async ({ page }) => {
    await page.goto('/components/het-on/invokes-method');
    await page.click('#increment-button');
    await expect(page.locator('#count-value')).toHaveText('1');
  });

  test('supports multiple het-on handlers in one attribute', async ({ page }) => {
    await page.goto('/components/het-on/multiple-handlers');
    await page.click('#multi-handler-button');
    await expect(page.locator('#count-a')).toHaveText('1');
    await expect(page.locator('#count-b')).toHaveText('1');
  });

  test('reports error when method is missing', async ({ page }) => {
    await page.goto('/components/het-on/missing-method');
    await expect(page.locator('#error-message')).toHaveText(
      'HET Error: Missing method "doesNotExist"',
    );
  });

  test('reports error for invalid het-on expression', async ({ page }) => {
    await page.goto('/components/het-on/invalid-expression');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Invalid expression 'click'",
    );
  });

  test('reports error for empty het-on method expression', async ({ page }) => {
    await page.goto('/components/het-on/invalid-expression-empty-method');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Invalid expression 'click='",
    );
  });

  test('reports error for extra equals in het-on expression', async ({ page }) => {
    await page.goto('/components/het-on/invalid-expression-extra-equals');
    await expect(page.locator('#error-message')).toHaveText(
      "HET Error: Invalid expression 'click=increment=increment'",
    );
  });
});
