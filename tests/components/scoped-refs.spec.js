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
});
