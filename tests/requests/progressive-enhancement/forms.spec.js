import { test, expect } from '@playwright/test';

test.describe('form progressive enhancement (core)', () => {
  test('intercepts GET form submission', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/get');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('GET form submitted');
  });

  test('resolves relative GET form action against current document URL', async ({
    page,
  }) => {
    await page.goto('/requests/progressive-enhancement/forms/relative-action-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#get-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('GET form submitted: relative get value');
  });

  test('does not intercept forms without het-target', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/no-target-form');
    await Promise.all([
      page.waitForURL('**/requests/progressive-enhancement/forms/get-form**'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('GET form submitted');
  });

  test('throws when response does not include the target pane', async ({
    page,
  }) => {
    await page.goto('/requests/progressive-enhancement/forms/missing-target-response-form');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Target pane not found in server response',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Target pane not found in server response',
    );
  });

  test('throws when response includes duplicate target panes', async ({
    page,
  }) => {
    await page.goto('/requests/progressive-enhancement/forms/duplicate-target-response-form');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Multiple target panes found in server response',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Multiple target panes found in server response',
    );
  });

  test('throws when current document has duplicate panes', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/duplicate-pane-form');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Multiple target panes found on the page',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Multiple target panes found on the page',
    );
  });
});
