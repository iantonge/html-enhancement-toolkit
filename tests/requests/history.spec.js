import { test, expect } from '@playwright/test';

test.describe('history navigation', () => {
  test('restores nav pane on back for links', async ({ page }) => {
    await page.goto('/requests/history/link');
    await expect(page).toHaveTitle(/Link popstate/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Initial link history description',
    );
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Link response.")'),
      page.click('#nav-link'),
    ]);
    expect(page.url()).toContain('/requests/history/responses/link');
    await expect(page).toHaveTitle(/Link response/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Response link history description',
    );

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Link history content.")'),
      page.goBack(),
    ]);
    expect(page.url()).toContain('/requests/history/link');
    await expect(page).toHaveTitle(/Link popstate/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Initial link history description',
    );
  });

  test('restores nav pane on back for forms', async ({ page }) => {
    await page.goto('/requests/history/form');
    await expect(page).toHaveTitle(/Form popstate/);
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Form response.")'),
      page.click('#submit'),
    ]);
    expect(page.url()).toContain('/requests/history/responses/form');
    await expect(page).toHaveTitle(/Form response/);

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Form history content.")'),
      page.goBack(),
    ]);
    expect(page.url()).toContain('/requests/history/form');
    await expect(page).toHaveTitle(/Form popstate/);
  });

  test('honors headContentSelectors config', async ({ page }) => {
    await page.addInitScript(() => {
      window.hetInitConfig = { headContentSelectors: ['title'] };
    });
    await page.goto('/requests/history/link');
    await expect(page).toHaveTitle(/Link popstate/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Initial link history description',
    );

    await Promise.all([
      page.waitForSelector('#main-content:has-text("Link response.")'),
      page.click('#nav-link'),
    ]);
    await expect(page).toHaveTitle(/Link response/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Initial link history description',
    );
  });

  test('includes browser navigation context in popstate errors', async ({ page }) => {
    await page.goto('/requests/history/link');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Link response.")'),
      page.click('#nav-link'),
    ]);
    const fromUrl = page.url();

    await page.locator('[het-pane="main"]').evaluate((el) => {
      el.removeAttribute('het-pane');
    });

    await page.goBack();
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET Error: Target pane not found on the page',
      ),
    );

    const cause = await page.evaluate(() => ({
      navigationFromUrl: window.hetLastError.cause.navigationFromUrl,
      navigationToUrl: window.hetLastError.cause.navigationToUrl,
      navigationTargetName: window.hetLastError.cause.navigationTargetName,
      resolvedTargetName: window.hetLastError.cause.resolvedTargetName,
      targetLookupName: window.hetLastError.cause.targetLookupName,
    }));
    expect(cause).toEqual({
      navigationFromUrl: fromUrl,
      navigationToUrl: page.url(),
      navigationTargetName: 'main',
      resolvedTargetName: 'main',
      targetLookupName: 'main',
    });
  });
});
