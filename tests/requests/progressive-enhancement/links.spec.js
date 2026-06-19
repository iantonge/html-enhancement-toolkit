import { test, expect } from '@playwright/test';

test.describe('link progressive enhancement (core)', () => {
  test('intercepts internal link with het-target', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/links/internal');
    await Promise.all([
      page.waitForSelector('#internal-page-message'),
      page.click('#link'),
    ]);
    const content = await page.textContent('#internal-page-message');
    expect(content).toContain('This is an internal page.');
  });

});
