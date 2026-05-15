import { expect, test } from '@playwright/test';

test.describe('components het-attrs directives', () => {
  test('binds signal values to attributes with het-attrs', async ({ page }) => {
    await page.goto('/components/het-attrs/attrs');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'idle');
    await page.click('#set-status');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'ready');
  });

  test('toggles boolean attributes with het-bool-attrs', async ({ page }) => {
    await page.goto('/components/het-attrs/bool-attrs');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
    await page.click('#disable-target');
    await expect(page.locator('#bool-attr-target')).toBeDisabled();
    await page.click('#enable-target');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
  });

  test('toggles classes with het-class', async ({ page }) => {
    await page.goto('/components/het-attrs/class');
    await expect(page.locator('#class-target')).not.toHaveClass(/active/);
    await page.click('#activate-target');
    await expect(page.locator('#class-target')).toHaveClass(/active/);
    await page.click('#deactivate-target');
    await expect(page.locator('#class-target')).not.toHaveClass(/active/);
  });

  test('binds negated signal values with attrs, bool attrs, and class directives', async ({ page }) => {
    await page.goto('/components/het-attrs/negation');

    await expect(page.locator('#attr-negation-target')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(page.locator('#bool-attr-negation-target')).not.toBeDisabled();
    await expect(page.locator('#class-negation-target')).not.toHaveClass(/active/);

    await page.click('#expand-panel');
    await page.click('#disable-input');
    await page.click('#activate-panel');

    await expect(page.locator('#attr-negation-target')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.locator('#bool-attr-negation-target')).toBeDisabled();
    await expect(page.locator('#class-negation-target')).toHaveClass(/active/);
  });
});
