import { expect, test } from '@playwright/test';

test.describe('components scoped refs', () => {
  test('collects root and descendant refs for the component', async ({ page }) => {
    await page.goto('/components/scoped-refs/collects-own-refs');
    await expect(page.locator('#refs-result')).toHaveText('action,first,root');
  });

  test('excludes refs inside nested component subtree', async ({ page }) => {
    await page.goto('/components/scoped-refs/excludes-nested-component-refs');
    await expect(page.locator('#parent-refs-result')).toHaveText(
      'parent-label,parent-root',
    );
  });

  test('reports missing ref access with component context', async ({ page }) => {
    await page.goto('/components/scoped-refs/missing-ref-error');

    const error = await page.evaluate(() => {
      const [hetError] = window.hetErrors;
      return {
        message: hetError.message,
        cause: {
          componentName: hetError.cause.componentName,
          componentElementId: hetError.cause.componentElement.id,
          refName: hetError.cause.refName,
          availableRefs: hetError.cause.availableRefs,
        },
      };
    });

    expect(error).toEqual({
      message: 'HET Error: Component ref is not defined',
      cause: {
        componentName: 'refs-missing',
        componentElementId: 'missing-ref-component',
        refName: 'fooo',
        availableRefs: ['root', 'foo'],
      },
    });
  });
});
