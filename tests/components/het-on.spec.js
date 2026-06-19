import { expect, test } from '@playwright/test';

test.describe('components het-on', () => {
  test('invokes setup method for declared event handler', async ({ page }) => {
    await page.goto('/components/het-on/invokes-method');
    await page.click('#increment-button');
    await expect(page.locator('#count-value')).toHaveText('1');
  });

});
