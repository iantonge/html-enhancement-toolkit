import { expect, test } from '@playwright/test';

test.describe('components het-model', () => {
  test('binds text input with two-way updates using input events', async ({ page }) => {
    await page.goto('/components/het-model/text-input');

    await expect(page.locator('#name-input')).toHaveValue('Alpha');
    await expect(page.locator('#name-value')).toHaveText('Alpha');

    await page.fill('#name-input', 'Charlie');
    await expect(page.locator('#name-value')).toHaveText('Charlie');

    await page.click('#set-name');
    await expect(page.locator('#name-input')).toHaveValue('Bravo');
    await expect(page.locator('#name-value')).toHaveText('Bravo');
  });

  test('skips redundant initial model writes', async ({ page }) => {
    await countInputValueWrites(page, 'name-input');

    await page.goto('/components/het-model/text-input');
    await expect(page.locator('#name-input')).toHaveValue('Alpha');
    expect(await page.evaluate(() => window.__hetInputValueWrites)).toBe(0);

    await page.click('#set-name');
    await expect(page.locator('#name-input')).toHaveValue('Bravo');
    expect(await page.evaluate(() => window.__hetInputValueWrites)).toBe(1);
  });

  test('binds checkbox with two-way updates using change events', async ({ page }) => {
    await page.goto('/components/het-model/checkbox');

    await expect(page.locator('#done-checkbox')).not.toBeChecked();
    await expect(page.locator('#done-value')).toHaveText('false');

    await page.click('#done-checkbox');
    await expect(page.locator('#done-value')).toHaveText('true');

    await page.click('#done-checkbox');
    await expect(page.locator('#done-value')).toHaveText('false');

    await page.click('#set-done');
    await expect(page.locator('#done-checkbox')).toBeChecked();
    await expect(page.locator('#done-value')).toHaveText('true');
  });

  test('binds checkbox groups to arrays using shared het-model values', async ({ page }) => {
    await page.goto('/components/het-model/checkbox-array');

    await expect(page.locator('#notify-email')).toBeChecked();
    await expect(page.locator('#notify-sms')).not.toBeChecked();
    await expect(page.locator('#notify-push')).not.toBeChecked();
    await expect(page.locator('#channels-value')).toHaveText('email');

    await page.click('#notify-sms');
    await expect(page.locator('#channels-value')).toHaveText('email,sms');

    await page.click('#notify-email');
    await expect(page.locator('#channels-value')).toHaveText('sms');

    await page.click('#set-channels');
    await expect(page.locator('#notify-email')).toBeChecked();
    await expect(page.locator('#notify-sms')).not.toBeChecked();
    await expect(page.locator('#notify-push')).toBeChecked();
    await expect(page.locator('#channels-value')).toHaveText('email,push');
  });

  test('binds radio groups to the selected value using shared het-model values', async ({ page }) => {
    await page.goto('/components/het-model/radio-group');

    await expect(page.locator('#size-small')).not.toBeChecked();
    await expect(page.locator('#size-medium')).toBeChecked();
    await expect(page.locator('#size-large')).not.toBeChecked();
    await expect(page.locator('#size-value')).toHaveText('medium');

    await page.click('#size-large');
    await expect(page.locator('#size-value')).toHaveText('large');

    await page.click('#set-size');
    await expect(page.locator('#size-small')).toBeChecked();
    await expect(page.locator('#size-medium')).not.toBeChecked();
    await expect(page.locator('#size-large')).not.toBeChecked();
    await expect(page.locator('#size-value')).toHaveText('small');
  });

  test('binds typed int models using declaration suffixes', async ({ page }) => {
    await page.goto('/components/het-model/typed-int');

    await expect(page.locator('#count-input')).toHaveValue('7');
    await expect(page.locator('#count-value')).toHaveText('7');

    await page.fill('#count-input', '9');
    await expect(page.locator('#count-value')).toHaveText('9');

    await page.click('#set-count');
    await expect(page.locator('#count-input')).toHaveValue('12');
    await expect(page.locator('#count-value')).toHaveText('12');
  });

  test('reports error for empty het-model expression', async ({ page }) => {
    await page.goto('/components/het-model/invalid-expression-empty');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-model binding requires a signal name'),
    );
  });

  test('reports error for extra equals in het-model expression', async ({ page }) => {
    await page.goto('/components/het-model/invalid-expression-extra-equals');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-model binding must be a signal name'),
    );
  });

  test('reports error for explicit property het-model expression', async ({ page }) => {
    await page.goto('/components/het-model/invalid-property-expression');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-model binding must be a signal name'),
    );
  });

  test('reports error when negation is used with het-model', async ({ page }) => {
    await page.goto('/components/het-model/invalid-negation');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Signal name is required'),
    );
  });
});

async function countInputValueWrites(page, targetId) {
  await page.addInitScript((id) => {
    window.__hetInputValueWrites = 0;
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      configurable: true,
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        if (this.id === id) {
          window.__hetInputValueWrites += 1;
        }
        return descriptor.set.call(this, value);
      },
    });
  }, targetId);
}
