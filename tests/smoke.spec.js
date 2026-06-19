import { test, expect } from '@playwright/test';

test('loads the skeleton homepage', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'HTML Enhancement Toolkit' })
  ).toBeVisible();
});
