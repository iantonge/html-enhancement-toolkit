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
      bindingDeclaration: 'click->doesNotExist',
      bindingElementId: 'missing-method-button',
      methodName: 'doesNotExist',
    });
  });

  test('assigns signals from contextual values, signals, literals, and intrinsics', async ({ page }) => {
    await page.goto('/components/het-on/assigns-signal');

    await expect(page.locator('#assignment-count')).toHaveText('0');
    await expect(page.locator('#assignment-enabled')).toHaveText('false');

    await page.fill('#assignment-input', '12');

    await expect(page.locator('#assignment-count')).toHaveText('12');
    await expect(page.locator('#assignment-label')).toHaveText('ready');
    await expect(page.locator('#assignment-copy')).toHaveText('ready');
    await expect(page.locator('#assignment-status')).toHaveText('done');
    await expect(page.locator('#assignment-enabled')).toHaveText('true');
  });

  test('supports prevent, stop, capture, debounce, throttle, and key filters', async ({ page }) => {
    await page.goto('/components/het-on/modifiers');

    await page.click('#modifier-submit');
    await expect(page.locator('#modifier-submitted')).toHaveText('true');
    expect(page.url()).toContain('/components/het-on/modifiers');

    await page.click('#stop-child');
    await expect(page.locator('#modifier-child-clicks')).toHaveText('1');
    await expect(page.locator('#modifier-parent-clicks')).toHaveText('0');

    await page.click('#capture-child');
    await expect(page.locator('#modifier-capture-order')).toHaveText('parent child');

    await page.fill('#debounce-input', 'alpha');
    await expect(page.locator('#modifier-debounced')).toHaveText('alpha');

    await page.click('#throttle-button');
    await expect(page.locator('#modifier-throttled')).toHaveText('1');
    await page.click('#throttle-button');
    await expect(page.locator('#modifier-throttled')).toHaveText('1');
    await page.waitForTimeout(350);
    await page.click('#throttle-button');
    await expect(page.locator('#modifier-throttled')).toHaveText('2');

    await page.focus('#key-input');
    await page.keyboard.press('KeyA');
    await expect(page.locator('#modifier-key')).toHaveText('');
    await page.keyboard.press('Escape');
    await expect(page.locator('#modifier-key')).toHaveText('esc');
    await page.keyboard.press('Enter');
    await expect(page.locator('#modifier-key')).toHaveText('enter');
    await page.keyboard.press('Space');
    await expect(page.locator('#modifier-key')).toHaveText('space');
  });

  test('reports error when assignment source signal is missing', async ({ page }) => {
    await page.goto('/components/het-on/assignment-missing-source');
    await page.click('#assignment-missing-source-button');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Bound signal does not exist'),
    );
  });

  test('reports error for invalid modifier duration', async ({ page }) => {
    await page.goto('/components/het-on/invalid-modifier-duration');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid event modifier'),
    );
  });

  test('reports error for duplicate timing modifiers', async ({ page }) => {
    await page.goto('/components/het-on/invalid-modifier-duplicate-timing');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid event modifier'),
    );
  });

  test('reports error for duplicate key modifiers', async ({ page }) => {
    await page.goto('/components/het-on/invalid-modifier-duplicate-key');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid event modifier'),
    );
  });

  test('reports error for key modifiers on non-key events', async ({ page }) => {
    await page.goto('/components/het-on/invalid-modifier-key-event');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Invalid event modifier'),
    );
  });

});
