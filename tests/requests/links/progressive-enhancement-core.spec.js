import { test, expect } from '@playwright/test';

test.describe('link progressive enhancement (core)', () => {
  test('throws on external link with het-target', async ({ page }) => {
    await page.goto('/requests/links/progressive-enhancement-core/external');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Cannot progressively enhance external links',
      ),
    );
    const errors = await page.evaluate(() => window.hetErrors);
    expect(errors).toContain(
      'HET error: Cannot progressively enhance external links',
    );
  });

  test('throws on internal link with target attribute', async ({ page }) => {
    await page.goto('/requests/links/progressive-enhancement-core/target-attr');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Cannot progressively enhance links with target attribute',
      ),
    );
    const errors = await page.evaluate(() => window.hetErrors);
    expect(errors).toContain(
      'HET error: Cannot progressively enhance links with target attribute',
    );
  });

  test('throws on links targeting a missing pane', async ({ page }) => {
    await page.goto('/requests/links/progressive-enhancement-core/missing-pane');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: No pane named missing found in current document',
      ),
    );
    const errors = await page.evaluate(() => window.hetErrors);
    expect(errors).toContain(
      'HET error: No pane named missing found in current document',
    );
  });

  test('does not intercept links without het-target', async ({ page }) => {
    await page.goto('/requests/links/progressive-enhancement-core/no-target');
    await Promise.all([
      page.waitForURL('**/requests/links/progressive-enhancement-core/responses/internal-link'),
      page.click('#link'),
    ]);
    const content = await page.textContent('#internal-page-message');
    expect(content).toContain('This is an internal page.');
  });

  test('throws when response does not include the target pane', async ({
    page,
  }) => {
    await page.goto('/requests/links/progressive-enhancement-core/missing-target-response');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: No pane named main found in server response',
      ),
    );
    const errors = await page.evaluate(() => window.hetErrors);
    expect(errors).toContain(
      'HET error: No pane named main found in server response',
    );
  });

  test('throws when response includes duplicate target panes', async ({
    page,
  }) => {
    await page.goto('/requests/links/progressive-enhancement-core/duplicate-target-response');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Multiple panes named main found in server response',
      ),
    );
    const errors = await page.evaluate(() => window.hetErrors);
    expect(errors).toContain(
      'HET error: Multiple panes named main found in server response',
    );
  });

  const modifiers = [
    { name: 'Ctrl key', options: { modifiers: ['Control'] }, skipWebkit: false },
    { name: 'Shift key', options: { modifiers: ['Shift'] }, skipWebkit: false },
    { name: 'Middle mouse button', options: { button: 'middle' }, skipWebkit: true },
  ];

  for (const { name, options, skipWebkit } of modifiers) {
    test(`skips click events when ${name} modifier used`, async ({
      page,
      browserName,
    }) => {
      test.skip(skipWebkit && browserName === 'webkit', `Webkit doesn't support synthetic ${name} events`);
      await page.goto('/requests/links/progressive-enhancement-core/internal');
      let requestCount = 0;
      await page.route('**/requests/links/progressive-enhancement-core/responses/internal-link', async (route) => {
        requestCount += 1;
        await route.continue();
      });

      await page.click('#link', options);
      await page.waitForTimeout(250);

      const content = await page.textContent('#original-content');
      expect(content).toContain('Original page content.');
      expect(requestCount).toBe(0);
    });
  }

  test('intercepts internal link with het-target', async ({ page }) => {
    await page.goto('/requests/links/progressive-enhancement-core/internal');
    await Promise.all([
      page.waitForSelector('#internal-page-message'),
      page.click('#link'),
    ]);
    const content = await page.textContent('#internal-page-message');
    expect(content).toContain('This is an internal page.');
  });

  test('intercepts internal link when clicking nested span', async ({
    page,
  }) => {
    await page.goto('/requests/links/progressive-enhancement-core/internal-span');
    await Promise.all([
      page.waitForSelector('#internal-page-message'),
      page.click('#link-span'),
    ]);
    const content = await page.textContent('#internal-page-message');
    expect(content).toContain('This is an internal page.');
  });

  test('throws when current document has duplicate panes', async ({ page }) => {
    await page.goto('/requests/links/progressive-enhancement-core/duplicate-pane-form');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Multiple panes named main found in current document',
      ),
    );
    const errors = await page.evaluate(() => window.hetErrors);
    expect(errors).toContain(
      'HET error: Multiple panes named main found in current document',
    );
  });
});
