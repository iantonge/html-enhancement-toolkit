import { expect, test } from '@playwright/test';

test.describe('components het-attrs directive', () => {
  test('binds signal values to attributes with het-attrs', async ({ page }) => {
    await page.goto('/components/het-attrs');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'idle');
    await page.click('#set-status');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'ready');
  });

  test('skips redundant initial attribute writes', async ({ page }) => {
    await countAttributeWrites(page, 'status-target', 'data-status');

    await page.goto('/components/het-attrs');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'idle');
    expect(await page.evaluate(() => window.__hetAttributeWrites)).toBe(0);

    await page.click('#set-status');
    await expect(page.locator('#status-target')).toHaveAttribute('data-status', 'ready');
    expect(await page.evaluate(() => window.__hetAttributeWrites)).toBe(1);
  });

  test('batches and coalesces initial writes', async ({ page }) => {
    await page.goto('/components/het-attrs/initial-batch');

    await expect(page.locator('#initial-batch-target')).toHaveAttribute('status', 'after');
    await expect(page.locator('#initial-batch-coalesce')).toHaveText('second');

    const counters = await page.evaluate(() => window.__hetComponentMountMetrics.counters);
    expect(counters.runtimeDomWriteQueued).toBeGreaterThan(0);
    expect(counters.runtimeDomWriteFlushed).toBeGreaterThan(0);
    expect(counters.runtimeDomWriteCoalesced).toBeGreaterThan(0);
  });
});

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
