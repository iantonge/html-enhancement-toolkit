import { expect, test } from '@playwright/test';

test.describe('components lifecycle and registration', () => {
  test('mounts registered component during init', async ({ page }) => {
    await page.goto('/components/lifecycle/mount');
    await expect(page.locator('#mount-component')).toHaveText('Mounted');
    await expect(page.locator('#setup-count')).toHaveText('Setup count: 1');
  });

  test('default error logging includes cause and continues', async ({ page }) => {
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

});
