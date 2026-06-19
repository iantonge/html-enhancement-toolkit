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

  test('uses custom replaceContent for het-select replacements', async ({ page }) => {
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

    await page.goto('/requests/het-select/links/partial');
    await Promise.all([
      page.waitForSelector('#primary[data-replaced="true"]'),
      page.click('#partial-link'),
    ]);
    await expect(page.locator('#primary')).toHaveText('Primary response.');
    await expect(page.locator('#secondary')).toHaveText('Secondary content.');
  });

  test('uses custom replaceContent for het-also replacements', async ({ page }) => {
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

    await page.goto('/requests/het-also/links/partial');
    await Promise.all([
      page.waitForSelector('#sidebar[data-replaced="true"]'),
      page.click('#also-link'),
    ]);
    await expect(page.locator('#main-content')).toHaveText('Main response.');
    await expect(page.locator('#sidebar')).toHaveText(/Sidebar response/);
  });
});
