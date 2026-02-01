import { test, expect } from '@playwright/test';

test.describe('link het-also', () => {
  test('replaces target and also elements', async ({ page }) => {
    await page.goto('/requests/links/het-also/partial');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main response.")'),
      page.click('#also-link'),
    ]);
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar response/);
  });

  test('replaces multiple het-also ids', async ({ page }) => {
    await page.goto('/requests/links/het-also/multi');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main response.")'),
      page.click('#multi-link'),
    ]);
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar response/);
    await expect(page.locator('#footer')).toHaveText(/Footer response/);
  });

  test('throws when het-also id is missing in current document', async ({ page }) => {
    await page.goto('/requests/links/het-also/missing-current');
    await page.click('#missing-current-link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Element with id missing-current not found in current document',
      ),
    );
  });

  test('throws when het-also id is missing in server response', async ({ page }) => {
    await page.goto('/requests/links/het-also/missing-response');
    await page.click('#missing-response-link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Element with id sidebar not found in server response',
      ),
    );
  });

  test('throws when het-also id is inside the target', async ({ page }) => {
    await page.goto('/requests/links/het-also/inside-target');
    await page.click('#inside-target-link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: het-also id inside-target must refer to an element outside the target',
      ),
    );
  });

  test('throws when het-also id is inside the target in the response', async ({ page }) => {
    await page.goto('/requests/links/het-also/inside-response');
    await page.click('#inside-response-link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: het-also id sidebar must refer to an element outside the target in server response',
      ),
    );
  });
});
