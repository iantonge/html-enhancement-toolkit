import { expect, test } from '@playwright/test';

test.describe('components base flow', () => {
  test('mounts registered component during init', async ({ page }) => {
    await page.goto('/components/base-flow/mount');
    await expect(page.locator('#mount-component')).toHaveText('Mounted');
    await expect(page.locator('#setup-count')).toHaveText('Setup count: 1');
  });

  test('runs cleanup callbacks on destroy', async ({ page }) => {
    await page.goto('/components/base-flow/destroy');
    await page.evaluate(() => {
      window.HET.destroy();
    });
    await expect(page.locator('#cleanup-count')).toHaveText('Cleanup count: 1');
  });

  test('throws when registering a component without a name', async ({ page }) => {
    await page.goto('/components/base-flow/register-without-name');
    await page.waitForFunction(() =>
      window.hetErrors.includes(
        'HET Error: Component name is required',
      ),
    );
  });

  test('removes het-cloak after initial component mount', async ({ page }) => {
    await page.goto('/components/base-flow/cloak');

    await expect(page.locator('#cloaked-root')).toHaveText('Mounted');
    await expect(page.locator('#cloaked-root')).not.toHaveAttribute('het-cloak', '');
  });

  test('removes het-cloak after nested import/export components mount', async ({ page }) => {
    await page.goto('/components/base-flow/cloak');

    await expect(page.locator('#imported-value')).toHaveText('parent value');
    await expect(page.locator('#cloak-parent')).not.toHaveAttribute('het-cloak', '');
    await expect(page.locator('#cloak-child')).not.toHaveAttribute('het-cloak', '');
  });

  test('keeps het-cloak when a component cannot mount', async ({ page }) => {
    await page.goto('/components/base-flow/cloak');

    await expect(page.locator('#unregistered-root')).toHaveAttribute('het-cloak', '');
    await expect(page.locator('#throwing-root')).toHaveAttribute('het-cloak', '');
    await page.waitForFunction(() =>
      window.hetErrors.includes('HET test error: cloak setup failed'),
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
      button.setAttribute('het-on', 'click=missing');
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
      bindingDeclaration: 'click=missing',
      bindingElementId: 'default-error-button',
      methodName: 'missing',
      errorMessage: 'HET Error: Missing component method',
    });
  });
});
