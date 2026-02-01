import { test, expect } from '@playwright/test';

test.describe('link nav panes', () => {
  test('updates browser history when targeting a nav pane', async ({ page }) => {
    await page.goto('/requests/links/nav-panes/basic');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Nav response.")'),
      page.click('#nav-link'),
    ]);
    expect(page.url()).toContain('/requests/links/nav-panes/responses/basic');
  });

  test('throws when response is missing nav pane', async ({ page }) => {
    await page.goto('/requests/links/nav-panes/missing-response');
    await page.click('#missing-link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: No pane named main found in server response',
      ),
    );
  });
});
