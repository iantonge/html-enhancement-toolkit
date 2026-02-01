import { test, expect } from '@playwright/test';

test.describe('history navigation', () => {
  test('restores nav pane on back for links', async ({ page }) => {
    await page.goto('/requests/history/link');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Link response.")'),
      page.click('#nav-link'),
    ]);
    expect(page.url()).toContain('/requests/history/responses/link');

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Link history content.")'),
      page.goBack(),
    ]);
    expect(page.url()).toContain('/requests/history/link');
  });

  test('restores nav pane on back for forms', async ({ page }) => {
    await page.goto('/requests/history/form');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Form response.")'),
      page.click('#submit'),
    ]);
    expect(page.url()).toContain('/requests/history/responses/form');

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Form history content.")'),
      page.goBack(),
    ]);
    expect(page.url()).toContain('/requests/history/form');
  });
});
