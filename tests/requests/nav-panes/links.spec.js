import { test, expect } from '@playwright/test';

test.describe('link nav panes', () => {
  test('updates browser history when targeting a nav pane', async ({ page }) => {
    await page.goto('/requests/nav-panes/links/basic');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Nav response.")'),
      page.click('#nav-link'),
    ]);
    expect(page.url()).toContain('/requests/nav-panes/links/responses/basic');
  });

});
