import { expect, test } from '@playwright/test';

test.describe('components lifecycle and registration', () => {
  test('mounts registered component during init', async ({ page }) => {
    await page.goto('/components/lifecycle/mount');
    await expect(page.locator('#mount-component')).toHaveText('Mounted');
    await expect(page.locator('#setup-count')).toHaveText('Setup count: 1');
  });

  test('mounts anonymous component during init', async ({ page }) => {
    await page.goto('/components/registration/anonymous');
    await expect(page.locator('#anonymous-output')).toHaveText('Anonymous mounted');
  });

  test('omits component name from anonymous component error causes', async ({ page }) => {
    await page.goto('/components/registration/anonymous-error');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: het-text binding requires an expression'),
    );

    const cause = await page.evaluate(() => {
      const { componentElement, bindingElement, ...serializableCause } =
        window.hetErrors.at(-1).cause;
      return {
        ...serializableCause,
        hasComponentName: Object.hasOwn(window.hetErrors.at(-1).cause, 'componentName'),
        componentElementId: componentElement.id,
        bindingElementId: bindingElement.id,
      };
    });

    expect(cause).toEqual({
      hasComponentName: false,
      componentElementId: 'anonymous-error-root',
      bindingAttribute: 'het-text',
      bindingDeclaration: '',
      bindingErrorReason: 'het-text binding requires an expression',
      bindingElementId: 'anonymous-error-binding',
    });
  });

  test('runs cleanup callbacks on destroy', async ({ page }) => {
    await page.goto('/components/lifecycle/destroy');
    await page.evaluate(() => {
      window.HET.destroy();
    });
    await expect(page.locator('#cleanup-count')).toHaveText('Cleanup count: 1');
  });

  test('throws when registering a component without a name', async ({ page }) => {
    await page.goto('/components/registration/register-without-name');
    await page.waitForFunction(() =>
      window.hetErrors.some((error) => error.message === 'HET Error: Component name is required',),
    );
  });

  test('default onError logs errors with cause and continues', async ({ page }) => {
    await page.goto('/');

    const logged = await page.evaluate(async () => {
      window.HET.destroy();
      const originalError = console.error;
      const calls = [];
      console.error = (...args) => {
        calls.push(args);
      };

      document.body.textContent = '';
      const root = document.createElement('div');
      root.setAttribute('het-component', 'default-error');
      const button = document.createElement('button');
      button.id = 'default-error-button';
      button.type = 'button';
      button.setAttribute('het-on', 'click->missing');
      root.append(button);
      document.body.append(root);

      const HET = await import(`/js/het/het.js?default-error=${Date.now()}`);
      HET.registerComponent('default-error');
      HET.init();
      console.error = originalError;
      HET.destroy();

      const [error] = calls[0];
      return {
        argumentCount: calls[0].length,
        componentName: error.cause.componentName,
        bindingAttribute: error.cause.bindingAttribute,
        bindingDeclaration: error.cause.bindingDeclaration,
        bindingElementId: error.cause.bindingElement.id,
        methodName: error.cause.methodName,
        errorMessage: error.message,
      };
    });

    expect(logged).toEqual({
      argumentCount: 2,
      componentName: 'default-error',
      bindingAttribute: 'het-on',
      bindingDeclaration: 'click->missing',
      bindingElementId: 'default-error-button',
      methodName: 'missing',
      errorMessage: 'HET Error: Missing component method',
    });
  });

  test('reports error when init receives a non-function onError', async ({ page }) => {
    await page.goto('/');

    const errorMessage = await page.evaluate(async () => {
      window.HET.destroy();
      const HET = await import(`/js/het/het.js?invalid-on-error=${Date.now()}`);
      try {
        HET.init({ onError: 'invalid' });
      } catch (error) {
        return error.message;
      }
      HET.destroy();
    });

    expect(errorMessage).toBe('HET Error: onError must be a function');
  });

});
