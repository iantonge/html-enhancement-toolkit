import { expect, test } from '@playwright/test';

test.describe('request lifecycle events', () => {
  test('dispatches fetch/load events', async ({ page }) => {
    await page.addInitScript(() => {
      window.hetLifecycleCounts = {
        beforeFetch: 0,
        afterFetch: 0,
        beforeLoadContent: 0,
        afterLoadContent: 0,
      };

      document.addEventListener('het:beforeFetch', () => {
        window.hetLifecycleCounts.beforeFetch += 1;
      });
      document.addEventListener('het:afterFetch', () => {
        window.hetLifecycleCounts.afterFetch += 1;
      });
      document.addEventListener('het:beforeLoadContent', () => {
        window.hetLifecycleCounts.beforeLoadContent += 1;
      });
      document.addEventListener('het:afterLoadContent', (event) => {
        window.hetLifecycleCounts.afterLoadContent += 1;
      });
      document.addEventListener('het:sync', () => {
        window.hetLifecycleCounts.sync += 1;
      });
    });

    await page.goto('/requests/lifecycle-events');
    await Promise.all([
      page.waitForSelector('#response-message'),
      page.click('#link'),
    ]);

    const counts = await page.evaluate(() => window.hetLifecycleCounts);
    expect(counts.beforeFetch).toBe(1);
    expect(counts.afterFetch).toBe(1);
    expect(counts.beforeLoadContent).toBe(1);
    expect(counts.afterLoadContent).toBe(1);
  });

  test('allows het:beforeFetch to cancel enhancement', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/requests/lifecycle-events/response', async (route) => {
      requestCount += 1;
      await route.continue();
    });
    await page.addInitScript(() => {
      document.addEventListener('het:beforeFetch', (event) => {
        event.preventDefault();
      });
    });

    await page.goto('/requests/lifecycle-events');
    await page.click('#link');
    await page.waitForTimeout(200);

    expect(requestCount).toBe(0);
    await expect(page.locator('#original-content')).toHaveText('Original lifecycle page content.');
  });

  test('allows het:beforeFetch to replace the request', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('het:beforeFetch', (event) => {
        const url = new URL(event.detail.request.url);
        url.searchParams.set('variant', 'alternate');
        event.detail.request = new Request(url.toString(), {
          method: event.detail.request.method,
          headers: event.detail.request.headers,
        });
      });
    });

    await page.goto('/requests/lifecycle-events');
    await Promise.all([
      page.waitForSelector('#response-message:has-text("Alternate lifecycle response loaded.")'),
      page.click('#link'),
    ]);
  });

  test('allows het:afterFetch to replace the response', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('het:afterFetch', (event) => {
        event.detail.response = new Response(`
          <section het-pane="main" class="card shadow-sm border-0">
            <div class="card-body">
              <h1 class="h4 mb-3">Replaced after fetch</h1>
              <p id="response-message">After fetch replacement loaded.</p>
            </div>
          </section>
        `, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
          },
        });
      });
    });

    await page.goto('/requests/lifecycle-events');
    await Promise.all([
      page.waitForSelector('#response-message:has-text("After fetch replacement loaded.")'),
      page.click('#link'),
    ]);
  });

  test('allows het:beforeLoadContent to cancel swapping', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('het:beforeLoadContent', (event) => {
        event.preventDefault();
      });
    });

    await page.goto('/requests/lifecycle-events');
    await page.click('#link');
    await page.waitForTimeout(200);

    await expect(page.locator('#original-content')).toHaveText('Original lifecycle page content.');
    await expect(page.locator('#response-message')).toHaveCount(0);
  });

  test('allows het:beforeLoadContent to replace new content', async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('het:beforeLoadContent', (event) => {
        const replacement = event.detail.newContent.cloneNode(true);
        replacement.querySelector('#response-message').textContent = 'Before load replacement loaded.';
        event.detail.newContent = replacement;
      });
    });

    await page.goto('/requests/lifecycle-events');
    await Promise.all([
      page.waitForSelector('#response-message:has-text("Before load replacement loaded.")'),
      page.click('#link'),
    ]);
  });
});
