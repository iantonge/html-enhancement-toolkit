import { test, expect } from '@playwright/test';

test.describe('form nav panes', () => {
  test('updates browser history when targeting a nav pane', async ({ page }) => {
    await page.goto('/requests/forms/nav-panes/basic');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Nav response.")'),
      page.click('#submit'),
    ]);
    expect(page.url()).toContain('/requests/forms/nav-panes/responses/basic');
  });

});
