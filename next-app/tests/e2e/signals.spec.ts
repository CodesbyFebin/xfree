import { test, expect } from '@playwright/test';

test.describe('XFree Signals (/updates)', () => {
  // Fetches 10 live external RSS feeds server-side (lib/signals/fetchSignals.ts,
  // cached for 1h via Next's data cache) - a slow or unreachable source in a
  // sandboxed CI runner degrades gracefully to fewer items (each source
  // failure just contributes zero items, per that file's own design), so
  // this asserts the page renders correctly rather than a specific item count.
  test('loads and renders signal cards with a deterministic related-tool link', async ({ page }) => {
    test.slow();
    const response = await page.goto('/updates');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);

    const cards = page.locator('article');
    const count = await cards.count();
    test.skip(count === 0, 'no signal items available in this environment (all 10 upstream feeds unreachable) - not a regression in this app');

    // At least one card should show a related-tool link if any signal
    // scored above matchTools.ts's confidence threshold or hit the
    // category fallback - not guaranteed for every single card, so check
    // the page as a whole rather than the first card specifically.
    const toolLinks = page.locator('a[href^="/tools/"]');
    expect(await toolLinks.count()).toBeGreaterThan(0);
  });

  test('a category filter page loads', async ({ page }) => {
    const response = await page.goto('/updates/web-development');
    expect(response?.status()).toBe(200);
  });
});
