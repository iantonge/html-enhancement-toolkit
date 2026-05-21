import { test, expect } from '@playwright/test';

test.describe('form het-also', () => {
  test('replaces target and also elements', async ({ page }) => {
    await page.goto('/requests/het-also/forms/partial');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main response.")'),
      page.click('#submit'),
    ]);
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar response/);
  });

  test('empty submitter het-also clears form het-also', async ({ page }) => {
    await page.goto('/requests/het-also/forms/partial');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main response.")'),
      page.click('#clear-submit'),
    ]);
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar content/);
  });

  test('replaces multiple het-also ids', async ({ page }) => {
    await page.goto('/requests/het-also/forms/multi');
    await Promise.all([
      page.waitForSelector('#main-content:has-text("Main response.")'),
      page.click('#submit'),
    ]);
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar response/);
    await expect(page.locator('#footer')).toHaveText(/Footer response/);
  });

  test('throws when het-also id is missing in current document', async ({ page }) => {
    await page.goto('/requests/het-also/forms/missing-current');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-also element not found on the page',),
    );
  });

  test('throws when het-also id is missing in server response', async ({ page }) => {
    await page.goto('/requests/het-also/forms/missing-response');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-also element not found in the server response',),
    );
  });

  test('throws when het-also id is inside the target', async ({ page }) => {
    await page.goto('/requests/het-also/forms/inside-target');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-also element found inside the target pane on the page',),
    );
  });

  test('throws when het-also id is inside the target in the response', async ({ page }) => {
    await page.goto('/requests/het-also/forms/inside-response');
    await page.click('#submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-also element found inside the target pane in the server response',),
    );
  });
});
