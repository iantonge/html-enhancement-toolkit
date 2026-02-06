import { test, expect } from '@playwright/test';

test.describe('replaceContent hook', () => {
  test('uses custom replaceContent to swap target', async ({ page }) => {
    await page.addInitScript(() => {
      window.hetInitConfig = {
        replaceContent: (currentEl, replacementEl) => {
          const importedNode = document.importNode(replacementEl, true);
          importedNode.setAttribute('data-replaced', 'true');
          currentEl.replaceWith(importedNode);
          return importedNode;
        },
      };
    });

    await page.goto('/requests/replace-content');
    await Promise.all([
      page.waitForSelector('#main-pane[data-replaced="true"]'),
      page.click('#replace-link'),
    ]);
    await expect(page.locator('#main-content')).toHaveText('Replaced content.');
  });
});
