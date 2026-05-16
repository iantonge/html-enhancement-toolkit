import { test, expect } from '@playwright/test';

test.describe('form het-also', () => {
  test('replaces target and also elements', async ({ page }) => {
    await page.goto('/requests/forms/het-also/partial');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main response.")'),
      page.click('#submit'),
    ]);
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar response/);
  });

  test('replaces multiple het-also ids', async ({ page }) => {
    await page.goto('/requests/forms/het-also/multi');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main response.")'),
      page.click('#submit'),
    ]);
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar response/);
    await expect(page.locator('#footer')).toHaveText(/Footer response/);
  });

  test('throws when het-also id is missing in current document', async ({ page }) => {
    await page.goto('/requests/forms/het-also/missing-current');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET Error: het-also element not found on the page',
      ),
    );
  });

  test('throws when het-also id is missing in server response', async ({ page }) => {
    await page.goto('/requests/forms/het-also/missing-response');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET Error: het-also element not found in the server response',
      ),
    );
  });

  test('throws when het-also id is inside the target', async ({ page }) => {
    await page.goto('/requests/forms/het-also/inside-target');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET Error: het-also element found inside the target pane on the page',
      ),
    );
  });

  test('throws when het-also id is inside the target in the response', async ({ page }) => {
    await page.goto('/requests/forms/het-also/inside-response');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET Error: het-also element found inside the target pane in the server response',
      ),
    );
  });
});
