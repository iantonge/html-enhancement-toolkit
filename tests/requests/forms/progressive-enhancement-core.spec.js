import { test, expect } from '@playwright/test';

test.describe('form progressive enhancement (core)', () => {
  test('intercepts GET form submission', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/get');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('GET form submitted');
  });

  test('uses formaction when provided', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/formaction');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#formaction-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Another GET form submitted');
  });

  test('uses formmethod attribute for POST', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/formmethod');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#formmethod-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('POST form submitted');
  });

  test('includes submitter name/value in request', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/additional');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#additional-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('some value');
  });

  test('intercepts form with method POST', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/post');
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
    await page.goto('/requests/forms/progressive-enhancement-core/relative-action-form');
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
    await page.goto('/requests/forms/progressive-enhancement-core/relative-action-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#post-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('POST form submitted: relative post value');
  });

  test('honors multipart form enctype', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/multipart');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Multipart form submitted: multipart value');
    expect(content).toContain('multipart/form-data');
  });

  test('submitter enctype overrides form enctype', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/enctype-override-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#override-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Override form submitted: override value');
    expect(content).toContain('application/x-www-form-urlencoded');
  });

  test('submitter enctype can set multipart on default form', async ({
    page,
  }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/submitter-enctype-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submitter-enctype-submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Submitter enctype submitted: submitter enctype value');
    expect(content).toContain('multipart/form-data');
  });

  test('does not intercept forms without het-target', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/no-target-form');
    await Promise.all([
      page.waitForURL('**/requests/forms/progressive-enhancement-core/get-form**'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('GET form submitted');
  });

  test('defaults to GET when method is omitted', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/default-method-form');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#submit'),
    ]);
    const content = await page.textContent('#response-message');
    expect(content).toContain('Default form submitted');
  });

  test('defaults to current URL when action is omitted', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/default-action-form');
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
    await page.goto('/requests/forms/progressive-enhancement-core/submitter-target-form');
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
    await page.goto('/requests/forms/progressive-enhancement-core/external-form');
    await page.click('#external-submit');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET error: Cannot progressively enhance cross-origin form submissions',
      ),
    );
    const errors = await page.evaluate(() => window.hetErrors);
    expect(errors).toContain(
      'HET error: Cannot progressively enhance cross-origin form submissions',
    );
  });

  test('throws when response does not include the target pane', async ({
    page,
  }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/missing-target-response-form');
    await page.click('#submit');
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
    await page.goto('/requests/forms/progressive-enhancement-core/duplicate-target-response-form');
    await page.click('#submit');
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

  test('throws when current document has duplicate panes', async ({ page }) => {
    await page.goto('/requests/forms/progressive-enhancement-core/duplicate-pane-form');
    await page.click('#submit');
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
