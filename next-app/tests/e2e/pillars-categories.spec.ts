import { test, expect } from '@playwright/test';

test.describe('Pillar pages', () => {
  test('a pillar page loads with real tool links', async ({ page }) => {
    const response = await page.goto('/pillars/json-data-tools');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /JSON Formatter/i }).first()).toBeVisible();
  });

  test('the DNS-lookup-tools pillar does not claim "100% in your browser" (it contains server-dependent tools)', async ({ page }) => {
    await page.goto('/pillars/dns-lookup-tools');
    await expect(page.getByText(/^All tools in this pillar run 100% in your browser/)).toHaveCount(0);
    await expect(page.getByText(/A few need to reach a server/i)).toBeVisible();
  });

  test('an all-local pillar keeps the unqualified 100% claim', async ({ page }) => {
    await page.goto('/pillars/json-data-tools');
    await expect(page.getByText(/All tools in this pillar run 100% in your browser/i)).toBeVisible();
  });
});

test.describe('Category pages', () => {
  test('a category page loads', async ({ page }) => {
    const response = await page.goto('/categories/developer-tools');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
  });
});
