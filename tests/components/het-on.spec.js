import { expect, test } from '@playwright/test';

test.describe('components het-on', () => {
  test('invokes setup method for declared event handler', async ({ page }) => {
    await page.goto('/components/het-on/invokes-method');
    await page.click('#increment-button');
    await expect(page.locator('#count-value')).toHaveText('1');
  });

  test('supports multiple het-on handlers in one attribute', async ({ page }) => {
    await page.goto('/components/het-on/multiple-handlers');
    await page.click('#multi-handler-button');
    await expect(page.locator('#count-a')).toHaveText('1');
    await expect(page.locator('#count-b')).toHaveText('1');
  });

  test('supports custom event names containing colons on the left-hand side', async ({ page }) => {
    await page.goto('/components/het-on/custom-event-colon');
    await page.click('#dispatch-custom-event');
    await expect(page.locator('#custom-event-count')).toHaveText('1');
  });

  test('reports error when method is missing', async ({ page }) => {
    await page.goto('/components/het-on/missing-method');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Missing component method'),
    );
    const cause = await page.evaluate(() => ({
      componentName: window.hetErrors.at(-1).cause.componentName,
      bindingAttribute: window.hetErrors.at(-1).cause.bindingAttribute,
      bindingDeclaration: window.hetErrors.at(-1).cause.bindingDeclaration,
      bindingElementId: window.hetErrors.at(-1).cause.bindingElement.id,
      methodName: window.hetErrors.at(-1).cause.methodName,
    }));
    expect(cause).toEqual({
      componentName: 'het-on-missing',
      bindingAttribute: 'het-on',
      bindingDeclaration: 'click=doesNotExist',
      bindingElementId: 'missing-method-button',
      methodName: 'doesNotExist',
    });
  });

  test('reports error for invalid het-on expression', async ({ page }) => {
    await page.goto('/components/het-on/invalid-expression');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid binding expression'),
    );
  });

  test('reports error for empty het-on method expression', async ({ page }) => {
    await page.goto('/components/het-on/invalid-expression-empty-method');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid binding expression'),
    );
  });

  test('reports error for extra equals in het-on expression', async ({ page }) => {
    await page.goto('/components/het-on/invalid-expression-extra-equals');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid binding expression'),
    );
  });

  test('reports error when negation is used with het-on', async ({ page }) => {
    await page.goto('/components/het-on/invalid-negation');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Unsupported negation'),
    );
  });
});
