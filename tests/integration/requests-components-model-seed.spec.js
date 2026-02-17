import { expect, test } from '@playwright/test';

test.describe('integration requests + components model seed', () => {
  test('keeps het-model :seed available after request-driven morph', async ({ page }) => {
    await page.goto('/integration/requests-components-model-seed');

    await expect(page.locator('#seed-value')).toHaveText('alpha');

    await page.click('#load-seed-response');

    await expect(page.locator('#seed-title')).toHaveText('Requests + Components model seed response');
    await expect(page.locator('#seed-value')).toHaveText('alpha');
  });
});
