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

});
