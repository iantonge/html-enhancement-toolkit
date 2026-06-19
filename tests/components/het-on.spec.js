import { expect, test } from '@playwright/test';

test.describe('components het-on', () => {
  test('invokes setup method for declared event handler', async ({ page }) => {
    await page.goto('/components/het-on/invokes-method');
    await page.click('#increment-button');
    await expect(page.locator('#count-value')).toHaveText('1');
  });

  test('assigns signals from contextual values, signals, literals, and intrinsics', async ({ page }) => {
    await page.goto('/components/het-on/assigns-signal');

    await expect(page.locator('#assignment-count')).toHaveText('0');
    await expect(page.locator('#assignment-enabled')).toHaveText('false');

    await page.fill('#assignment-input', '12');

    await expect(page.locator('#assignment-count')).toHaveText('12');
    await expect(page.locator('#assignment-label')).toHaveText('ready');
    await expect(page.locator('#assignment-copy')).toHaveText('ready');
    await expect(page.locator('#assignment-status')).toHaveText('done');
    await expect(page.locator('#assignment-enabled')).toHaveText('true');
  });

});
