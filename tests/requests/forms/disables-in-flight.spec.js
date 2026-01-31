import { test, expect } from '@playwright/test';

test.describe('form disables-in-flight', () => {
  test('disables form controls while request is in flight', async ({ page }) => {
    await page.goto('/requests/forms/disables-in-flight/form-controls');

    let releaseResponse;
    const responseGate = new Promise((resolve) => {
      releaseResponse = resolve;
    });

    await page.route('**/requests/forms/disables-in-flight/child-target**', async (route) => {
      await responseGate;
      await route.continue();
    });

    await page.click('#submit');

    await expect(page.locator('#field')).toBeDisabled();
    await expect(page.locator('#submit')).toBeDisabled();

    releaseResponse();

    await page.waitForSelector('#child-message');
    await expect(page.locator('#field')).not.toBeDisabled();
    await expect(page.locator('#submit')).not.toBeDisabled();
  });

  test('disables external form controls while request is in flight', async ({ page }) => {
    await page.goto('/requests/forms/disables-in-flight/external-controls');

    let releaseResponse;
    const responseGate = new Promise((resolve) => {
      releaseResponse = resolve;
    });

    await page.route('**/requests/forms/disables-in-flight/child-target**', async (route) => {
      await responseGate;
      await route.continue();
    });

    await page.click('#associated-submit');

    await expect(page.locator('#field')).toBeDisabled();
    await expect(page.locator('#associated-field')).toBeDisabled();
    await expect(page.locator('#associated-submit')).toBeDisabled();

    releaseResponse();

    await page.waitForSelector('#child-message');
    await expect(page.locator('#field')).not.toBeDisabled();
    await expect(page.locator('#associated-field')).not.toBeDisabled();
    await expect(page.locator('#associated-submit')).not.toBeDisabled();
  });

  test('does not enable controls that were already disabled', async ({ page }) => {
    await page.goto('/requests/forms/disables-in-flight/pre-disabled');

    let releaseResponse;
    const responseGate = new Promise((resolve) => {
      releaseResponse = resolve;
    });

    await page.route('**/requests/forms/disables-in-flight/child-target**', async (route) => {
      await responseGate;
      await route.continue();
    });

    await page.click('#submit');

    await expect(page.locator('#field')).toBeDisabled();
    await expect(page.locator('#pre-disabled-field')).toBeDisabled();
    await expect(page.locator('#submit')).toBeDisabled();

    releaseResponse();

    await page.waitForSelector('#child-message');
    await expect(page.locator('#field')).not.toBeDisabled();
    await expect(page.locator('#submit')).not.toBeDisabled();
    await expect(page.locator('#pre-disabled-field')).toBeDisabled();
  });
});
