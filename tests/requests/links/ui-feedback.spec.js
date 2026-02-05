import { test, expect } from '@playwright/test';

test.describe('link UI feedback', () => {
  test('adds and removes busy state on target', async ({ page }) => {
    await page.goto('/requests/links/ui-feedback');

    let releaseSlow;
    const slowGate = new Promise((resolve) => {
      releaseSlow = resolve;
    });
    await page.route('**/requests/links/ui-feedback/responses/slow**', async (route) => {
      await slowGate;
      await route.continue();
    });

    await page.click('#slow-link');

    const target = page.locator('#main-pane');
    await expect(target).toHaveAttribute('data-het-busy', /\d+/);
    await expect(target).toHaveClass(/het-busy/);
    await expect(target).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#inline-button')).toBeDisabled();

    releaseSlow();
    await page.waitForSelector('#main-content:has-text("Slow response.")');
    await expect(target).not.toHaveAttribute('data-het-busy', /\d+/);
    await expect(target).not.toHaveClass(/het-busy/);
    await expect(target).not.toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#inline-button')).toBeEnabled();
  });

  test('does not clear busy state for a newer request', async ({ page }) => {
    await page.goto('/requests/links/ui-feedback');

    let releaseSlow;
    const slowGate = new Promise((resolve) => {
      releaseSlow = resolve;
    });
    let releaseSlow2;
    const slow2Gate = new Promise((resolve) => {
      releaseSlow2 = resolve;
    });
    await page.route('**/requests/links/ui-feedback/responses/slow**', async (route) => {
      await slowGate;
      try {
        await route.continue();
      } catch {}
    });
    await page.route('**/requests/links/ui-feedback/responses/slow-2**', async (route) => {
      await slow2Gate;
      await route.continue();
    });

    await page.click('#slow-link');
    const target = page.locator('#main-pane');
    await expect(target).toHaveAttribute('data-het-busy', /\d+/);
    const firstBusy = await target.getAttribute('data-het-busy');

    await page.click('#slow-link-2');
    await expect(target).toHaveAttribute('data-het-busy', /\d+/);
    const secondBusy = await target.getAttribute('data-het-busy');
    expect(secondBusy).not.toBe(firstBusy);

    releaseSlow2();
    await page.waitForSelector('#main-content:has-text("Second response.")');

    const finalBusy = await target.getAttribute('data-het-busy');
    expect(finalBusy).toBe(null);

    releaseSlow();
  });

  test('uses custom busy class when configured', async ({ page }) => {
    await page.goto('/requests/links/ui-feedback/custom-class');

    let releaseSlow;
    const slowGate = new Promise((resolve) => {
      releaseSlow = resolve;
    });
    await page.route('**/requests/links/ui-feedback/responses/slow**', async (route) => {
      await slowGate;
      await route.continue();
    });

    await page.click('#slow-link', { noWaitAfter: true });
    const target = page.locator('#main-pane');
    await expect(target).toHaveClass(/custom-busy/);
    await expect(target).not.toHaveClass(/het-busy/);

    releaseSlow();
    await page.waitForSelector('#main-content:has-text("Slow response.")');
    await expect(target).not.toHaveClass(/custom-busy/);
  });
});
