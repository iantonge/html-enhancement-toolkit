import { test, expect } from '@playwright/test';

test.describe('link progressive enhancement (core)', () => {
  test('throws on links targeting a missing pane', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/links/missing-pane');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Target pane not found on the page',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Target pane not found on the page',
    );
  });

  test('does not intercept links without het-target', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/links/no-target');
    await Promise.all([
      page.waitForURL('**/requests/progressive-enhancement/links/responses/internal-link'),
      page.click('#link'),
    ]);
    const content = await page.textContent('#internal-page-message');
    expect(content).toContain('This is an internal page.');
  });

  test('throws when response does not include the target pane', async ({
    page,
  }) => {
    await page.goto('/requests/progressive-enhancement/links/missing-target-response');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Target pane not found in server response',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Target pane not found in server response',
    );
    const cause = await page.evaluate(() => ({
      linkElementId: window.hetErrors.at(-1).cause.linkElement.id,
      linkTargetName: window.hetErrors.at(-1).cause.linkTargetName,
      resolvedTargetName: window.hetErrors.at(-1).cause.resolvedTargetName,
      targetPane: window.hetErrors.at(-1).cause.targetPaneElement.getAttribute('het-pane'),
      requestUrl: window.hetErrors.at(-1).cause.requestUrl,
      requestMethod: window.hetErrors.at(-1).cause.requestMethod,
    }));
    expect(cause).toEqual({
      linkElementId: 'link',
      linkTargetName: 'main',
      resolvedTargetName: 'main',
      targetPane: 'main',
      requestUrl: 'http://127.0.0.1:3000/requests/progressive-enhancement/links/responses/no-target',
      requestMethod: 'GET',
    });
  });

  test('throws when response includes duplicate target panes', async ({
    page,
  }) => {
    await page.goto('/requests/progressive-enhancement/links/duplicate-target-response');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Multiple target panes found in server response',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Multiple target panes found in server response',
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
      await page.goto('/requests/progressive-enhancement/links/internal');
      let requestCount = 0;
      await page.route('**/requests/progressive-enhancement/links/responses/internal-link', async (route) => {
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
    await page.goto('/requests/progressive-enhancement/links/internal');
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
    await page.goto('/requests/progressive-enhancement/links/internal-span');
    await Promise.all([
      page.waitForSelector('#internal-page-message'),
      page.click('#link-span'),
    ]);
    const content = await page.textContent('#internal-page-message');
    expect(content).toContain('This is an internal page.');
  });

  test('throws when current document has duplicate panes', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/links/duplicate-pane-form');
    await page.click('#link');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Multiple target panes found on the page',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Multiple target panes found on the page',
    );
  });
});
