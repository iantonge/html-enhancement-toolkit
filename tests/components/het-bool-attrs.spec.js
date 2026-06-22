import { expect, test } from '@playwright/test';

test.describe('components het-bool-attrs directive', () => {
  test('toggles boolean attributes with het-bool-attrs', async ({ page }) => {
    await page.goto('/components/het-bool-attrs');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
    await page.click('#disable-target');
    await expect(page.locator('#bool-attr-target')).toBeDisabled();
    await page.click('#enable-target');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
  });

  test('restores prior values for bool-only attributes', async ({ page }) => {
    await page.goto('/components/het-bool-attrs/coordinated-attrs');

    const valuedBoolTarget = page.locator('#valued-bool-target');
    await expectNotToHaveAttribute(valuedBoolTarget, 'hidden');

    await page.click('#hide-valued-bool');
    await expect(valuedBoolTarget).toHaveAttribute('hidden', 'until-found');

    await page.click('#show-valued-bool');
    await expectNotToHaveAttribute(valuedBoolTarget, 'hidden');
  });

  test('coordinates overlapping value and boolean attribute bindings', async ({ page }) => {
    await page.goto('/components/het-bool-attrs/coordinated-attrs');

    const combinedTarget = page.locator('#combined-target');
    await expectNotToHaveAttribute(combinedTarget, 'hidden');

    await page.click('#hide-combined');
    await expect(combinedTarget).toHaveAttribute('hidden', 'until-found');

    await page.click('#show-combined');
    await expectNotToHaveAttribute(combinedTarget, 'hidden');

    await page.click('#set-combined-hidden');
    await expectNotToHaveAttribute(combinedTarget, 'hidden');

    await page.click('#hide-combined');
    await expect(combinedTarget).toHaveAttribute('hidden', 'hidden');
  });

  test('uses empty value when bool-only attribute has no prior value', async ({ page }) => {
    await page.goto('/components/het-bool-attrs/coordinated-attrs');

    const emptyBoolTarget = page.locator('#empty-bool-target');
    await expectNotToHaveAttribute(emptyBoolTarget, 'hidden');

    await page.click('#show-empty-bool');
    await expect(emptyBoolTarget).toHaveAttribute('hidden', '');
  });
});

function expectNotToHaveAttribute(locator, name) {
  return expect.poll(() => locator.evaluate((el, attrName) => (
    el.hasAttribute(attrName)
  ), name)).toBe(false);
}
