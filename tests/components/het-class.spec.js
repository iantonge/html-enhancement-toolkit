import { expect, test } from '@playwright/test';

test.describe('components het-class directive', () => {
  test('toggles classes with het-class', async ({ page }) => {
    await page.goto('/components/het-class');
    await expect(page.locator('#class-target')).not.toHaveClass(/active/);
    await page.click('#activate-target');
    await expect(page.locator('#class-target')).toHaveClass(/active/);
    await page.click('#deactivate-target');
    await expect(page.locator('#class-target')).not.toHaveClass(/active/);
  });

  test('keeps matching initial class state without a DOM write', async ({ page }) => {
    await page.addInitScript(() => {
      window.hetInitConfig = {
        ...window.hetInitConfig,
        measureComponents: true,
      };
    });

    await page.goto('/components/het-class');
    await expect(page.locator('#class-target')).not.toHaveClass(/active/);

    const counters = await page.evaluate(() => window.__hetComponentMountMetrics.counters);
    expect(counters.runtimeDomWriteAttempts).toBe(1);
    expect(counters.runtimeDomWriteSkips).toBe(1);
    expect(counters.runtimeDomWrites || 0).toBe(0);
  });
});
