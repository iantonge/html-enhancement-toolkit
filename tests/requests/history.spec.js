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
      window.hetErrors.some((error) => error.message === 'HET Error: Target pane not found on the page',),
    );

    const cause = await page.evaluate(() => ({
      navigationFromUrl: window.hetErrors.at(-1).cause.navigationFromUrl,
      navigationToUrl: window.hetErrors.at(-1).cause.navigationToUrl,
      navigationTargetName: window.hetErrors.at(-1).cause.navigationTargetName,
      resolvedTargetName: window.hetErrors.at(-1).cause.resolvedTargetName,
      targetLookupName: window.hetErrors.at(-1).cause.targetLookupName,
    }));
    expect(cause).toEqual({
      navigationFromUrl: fromUrl,
      navigationToUrl: page.url(),
      navigationTargetName: 'main',
      resolvedTargetName: 'main',
      targetLookupName: 'main',
    });
  });

  test('ignores popstate events without HET-managed state', async ({ page }) => {
    await page.goto('/requests/history/link');

    await page.evaluate(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    });
    await page.waitForTimeout(100);

    await expect(page.locator('#main-content')).toHaveText('Link history content.');
    const hasTargetLookupError = await page.evaluate(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Target pane not found on the page'),
    );
    expect(hasTargetLookupError).toBe(false);
  });

  test('restores select and also replacements on back', async ({ page }) => {
    await page.goto('/requests/history/select-also');
    await expect(page).toHaveTitle(/Select also history/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Initial select also history description',
    );

    await Promise.all([
      page.waitForSelector('#primary:has-text("Response primary history content.")'),
      page.click('#select-also-link'),
    ]);

    await expect(page.locator('#secondary')).toHaveText('Initial secondary history content.');
    await expect(page.locator('#sidebar')).toHaveText(/Response sidebar history content\./);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Response select also history description',
    );

    await Promise.all([
      page.waitForSelector('#primary:has-text("Initial primary history content.")'),
      page.goBack(),
    ]);

    await expect(page.locator('#secondary')).toHaveText('Initial secondary history content.');
    await expect(page.locator('#sidebar')).toHaveText(/Initial sidebar history content\./);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Initial select also history description',
    );
  });
});
