import { test, expect } from '@playwright/test';

test.describe('form request coordination', () => {
  test('aborts previous request when a new one targets the same pane', async ({ page }) => {
    await page.goto('/requests/request-coordination/forms/abort-previous');

    let releaseFirst;
    const firstGate = new Promise((resolve) => {
      releaseFirst = resolve;
    });
    let releaseSecond;
    const secondGate = new Promise((resolve) => {
      releaseSecond = resolve;
    });

    await page.route('**/requests/request-coordination/forms/responses/first**', async (route) => {
      await firstGate;
      await route.continue();
    });
    await page.route('**/requests/request-coordination/forms/responses/second**', async (route) => {
      await secondGate;
      await route.continue();
    });

    await page.click('#first-submit');
    await page.click('#second-submit');

    releaseSecond();

    await page.waitForSelector('#response-message');
    expect(await page.textContent('#response-message')).toBe('Second form response.');

    releaseFirst();
    await page.waitForTimeout(1000);

    expect(await page.textContent('#response-message')).toBe('Second form response.');
  });

  test('skips child request while parent pane request is in flight', async ({ page }) => {
    await page.goto('/requests/request-coordination/forms/child-from-parent');

    let releaseMain;
    const mainGate = new Promise((resolve) => {
      releaseMain = resolve;
    });
    let childRequestCount = 0;

    await page.route('**/requests/request-coordination/forms/responses/main**', async (route) => {
      await mainGate;
      await route.continue();
    });
    await page.route('**/requests/request-coordination/forms/responses/child**', async (route) => {
      childRequestCount += 1;
      await route.continue();
    });

    await page.click('#main-submit');
    await page.click('#child-submit');

    releaseMain();

    await page.waitForSelector('#response-message');
    expect(await page.textContent('#response-message')).toBe('Main form response.');
    expect(childRequestCount).toBe(0);
  });

  test('aborts child request when a parent pane request starts', async ({ page }) => {
    await page.goto('/requests/request-coordination/forms/parent-from-child');

    let releaseMain;
    const mainGate = new Promise((resolve) => {
      releaseMain = resolve;
    });
    let releaseChild;
    const childGate = new Promise((resolve) => {
      releaseChild = resolve;
    });

    await page.route('**/requests/request-coordination/forms/responses/main**', async (route) => {
      await mainGate;
      await route.continue();
    });
    await page.route('**/requests/request-coordination/forms/responses/child**', async (route) => {
      await childGate;
      await route.continue();
    });

    await page.click('#child-submit');
    await page.click('#main-submit');

    releaseMain();

    await page.waitForSelector('#response-message');
    expect(await page.textContent('#response-message')).toBe('Main form response.');

    releaseChild();
    await page.waitForTimeout(100);
    expect(await page.textContent('#response-message')).toBe('Main form response.');
  });
});
