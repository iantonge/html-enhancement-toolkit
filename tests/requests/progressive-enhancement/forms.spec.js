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

  test('uses formaction when provided', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/formaction');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#formaction-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Another GET form submitted');
  });

  test('uses formmethod attribute for POST', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/formmethod');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#formmethod-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('POST form submitted');
  });

  test('includes submitter name/value in request', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/additional');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#additional-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('some value');
  });

  test('intercepts form with method POST', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/post');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('POST form submitted');
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

  test('resolves relative POST form action against current document URL', async ({
    page,
  }) => {
    await page.goto('/requests/progressive-enhancement/forms/relative-action-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#post-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('POST form submitted: relative post value');
  });

  test('honors multipart form enctype', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/multipart');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Multipart form submitted: multipart value');
    expect(content).toContain('multipart/form-data');
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

  test('defaults to GET when method is omitted', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/default-method-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Default form submitted');
  });

  test('defaults to current URL when action is omitted', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/default-action-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Default action submitted');
  });

  test('uses submitter het-target override for form-associated control', async ({
    page,
  }) => {
    await page.goto('/requests/progressive-enhancement/forms/submitter-target-form');
    await Promise.all([
      page.waitForSelector('#child-message'),
      page.click('#submitter-target-submit'),
    ]);
    const childContent = await page.textContent('#child-message');
    expect(childContent).toContain('Child pane updated.');
    const mainContent = await page.textContent('#main-content');
    expect(mainContent).toContain('Original page content.');
  });

  test('throws on cross-origin form submissions', async ({ page }) => {
    await page.goto('/requests/progressive-enhancement/forms/external-form');
    await page.click('#external-submit');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Cross-origin form submissions cannot be progressively enhanced',),
    );
    const errors = await page.evaluate(() => window.hetErrors.map((error) => error.message));
    expect(errors).toContain(
      'HET Error: Cross-origin form submissions cannot be progressively enhanced',
    );
    const cause = await page.evaluate(() => ({
      formElementId: window.hetErrors.at(-1).cause.formElement.id,
      submitterElementId: window.hetErrors.at(-1).cause.submitterElement.id,
      formAction: window.hetErrors.at(-1).cause.formAction,
      submitterAction: window.hetErrors.at(-1).cause.submitterAction,
      formTargetName: window.hetErrors.at(-1).cause.formTargetName,
      submitterTargetName: window.hetErrors.at(-1).cause.submitterTargetName,
      resolvedTargetName: window.hetErrors.at(-1).cause.resolvedTargetName,
      resolvedActionUrl: window.hetErrors.at(-1).cause.resolvedActionUrl,
    }));
    expect(cause).toEqual({
      formElementId: 'form',
      submitterElementId: 'external-submit',
      formAction: '/requests/progressive-enhancement/forms/get-form',
      submitterAction: 'https://example.com/submit',
      formTargetName: 'main',
      submitterTargetName: 'main',
      resolvedTargetName: 'main',
      resolvedActionUrl: 'https://example.com/submit',
    });
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
