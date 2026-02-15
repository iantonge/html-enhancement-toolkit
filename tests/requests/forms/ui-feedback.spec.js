import { test, expect } from '@playwright/test';

test.describe('form UI feedback', () => {
  test('adds and removes busy state on target', async ({ page }) => {
    await page.goto('/requests/forms/ui-feedback');

    let releaseSlow;
    const slowGate = new Promise((resolve) => {
      releaseSlow = resolve;
    });
    await page.route('**/requests/forms/ui-feedback/responses/slow**', async (route) => {
      await slowGate;
      await route.continue();
    });

    await page.click('#submit', { noWaitAfter: true });

    const target = page.locator('#main-pane');
    await expect(target).toHaveAttribute('data-het-busy', /\d+/);
    await expect(target).toHaveClass(/het-busy/);
    await expect(target).toHaveAttribute('aria-busy', 'true');

    releaseSlow();
    await page.waitForSelector('#main-content:has-text("Form slow response.")');
    await expect(target).not.toHaveAttribute('data-het-busy', /\d+/);
    await expect(target).not.toHaveClass(/het-busy/);
    await expect(target).not.toHaveAttribute('aria-busy', 'true');
  });

  test('does not swap content after destroy during in-flight request', async ({
    page,
  }) => {
    await page.goto('/requests/forms/ui-feedback');

    let releaseSlow;
    const slowGate = new Promise((resolve) => {
      releaseSlow = resolve;
    });
    await page.route('**/requests/forms/ui-feedback/responses/slow**', async (route) => {
      await slowGate;
      await route.continue();
    });

    await page.click('#submit', { noWaitAfter: true });
    await expect(page.locator('#main-pane')).toHaveAttribute('data-het-busy', /\d+/);

    await page.evaluate(() => {
      window.HET.destroy();
    });

    releaseSlow();
    await page.waitForTimeout(700);
    await expect(page.locator('#main-content')).toHaveText('Form UI feedback content.');
  });
});
