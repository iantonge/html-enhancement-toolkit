import { expect, test } from '@playwright/test';

test.describe('components negation', () => {
  test('binds negated signal values with attrs and bool attrs', async ({ page }) => {
    await page.goto('/components/negation');

    await expect(page.locator('#attr-negation-target')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(page.locator('#bool-attr-negation-target')).not.toBeDisabled();

    await page.click('#expand-panel');
    await page.click('#disable-input');

    await expect(page.locator('#attr-negation-target')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.locator('#bool-attr-negation-target')).toBeDisabled();
  });
});
