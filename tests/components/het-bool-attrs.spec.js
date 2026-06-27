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

  test('skips redundant initial boolean attribute removals', async ({ page }) => {
    await countAttributeRemovals(page, 'bool-attr-target', 'disabled');

    await page.goto('/components/het-bool-attrs');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
    expect(await page.evaluate(() => window.__hetAttributeRemovals)).toBe(0);

    await page.click('#disable-target');
    await expect(page.locator('#bool-attr-target')).toBeDisabled();
    await page.click('#enable-target');
    await expect(page.locator('#bool-attr-target')).not.toBeDisabled();
    expect(await page.evaluate(() => window.__hetAttributeRemovals)).toBe(1);
  });

  test('skips redundant initial valued boolean attribute writes', async ({ page }) => {
    await countAttributeWrites(page, 'initial-valued-bool-target', 'hidden');

    await page.goto('/components/het-bool-attrs/initial-matching');
    await expect(page.locator('#initial-valued-bool-target')).toHaveAttribute('hidden', 'until-found');
    expect(await page.evaluate(() => window.__hetAttributeWrites)).toBe(0);
  });

  test('skips redundant initial coordinated attribute writes', async ({ page }) => {
    await countAttributeWrites(page, 'initial-combined-target', 'hidden');

    await page.goto('/components/het-bool-attrs/initial-matching');
    await expect(page.locator('#initial-combined-target')).toHaveAttribute('hidden', 'until-found');
    expect(await page.evaluate(() => window.__hetAttributeWrites)).toBe(0);
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

async function countAttributeWrites(page, targetId, attrName) {
  await page.addInitScript(({ id, name }) => {
    window.__hetAttributeWrites = 0;
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function setAttribute(nextName, value) {
      if (this.id === id && nextName === name) {
        window.__hetAttributeWrites += 1;
      }
      return originalSetAttribute.call(this, nextName, value);
    };
  }, { id: targetId, name: attrName });
}

async function countAttributeRemovals(page, targetId, attrName) {
  await page.addInitScript(({ id, name }) => {
    window.__hetAttributeRemovals = 0;
    const originalRemoveAttribute = Element.prototype.removeAttribute;
    Element.prototype.removeAttribute = function removeAttribute(nextName) {
      if (this.id === id && nextName === name) {
        window.__hetAttributeRemovals += 1;
      }
      return originalRemoveAttribute.call(this, nextName);
    };
  }, { id: targetId, name: attrName });
}
