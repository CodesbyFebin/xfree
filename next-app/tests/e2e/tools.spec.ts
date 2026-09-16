import { test, expect } from '@playwright/test';

test.describe('Tool catalog', () => {
  test('/tools lists tools with working links', async ({ page }) => {
    const response = await page.goto('/tools');
    expect(response?.status()).toBe(200);
    const jsonFormatterLink = page.getByRole('link', { name: /JSON Formatter/i }).first();
    await expect(jsonFormatterLink).toBeVisible();
  });
});

test.describe('Representative Local tool (json-formatter)', () => {
  test('formats real input entirely client-side', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    await expect(page.locator('h1')).toHaveCount(1);

    const input = page.getByPlaceholder('Paste your JSON here...');
    await input.fill('{"a":1,"b":[1,2,3]}');
    await page.getByRole('button', { name: /Execute/i }).click();

    const output = page.locator('pre').first();
    await expect(output).toContainText('"a": 1');
  });

  test('shows a client-side error for invalid input without a network round-trip', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/')) requests.push(req.url());
    });

    await page.goto('/tools/json-formatter');
    const input = page.getByPlaceholder('Paste your JSON here...');
    await input.fill('{not valid json');
    await page.getByRole('button', { name: /Execute/i }).click();

    await expect(page.getByText(/Error/i)).toBeVisible();
    expect(requests, 'json-formatter should never call an API route').toHaveLength(0);
  });
});

test.describe('Representative server-dependent tool (dns-lookup)', () => {
  test('discloses that it calls a server, unlike the local tools', async ({ page }) => {
    await page.goto('/tools/dns-lookup');
    await expect(page.locator('h1')).toHaveCount(1);
    // The privacyNotice field (lib/data/toolsWithSEO.ts) is the one honest
    // per-tool disclosure this app has today - see docs/PUBLICATION_CONTRACT.md.
    await expect(page.getByText(/sent to XFree's own server/i)).toBeVisible();
  });

  test('actually calls /api/lookup/dns when used', async ({ page }) => {
    await page.goto('/tools/dns-lookup');
    const [apiResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/lookup/dns'), { timeout: 15_000 }).catch(() => null),
      page.getByRole('button', { name: /Lookup/i }).click(),
    ]);
    // A live network dependency (Cloudflare DNS-over-HTTPS via our own
    // /api/lookup/dns) may be unreachable in a sandboxed CI runner - assert
    // the request was actually made (proving this tool is NOT client-only),
    // not that the upstream call necessarily succeeded.
    expect(apiResponse, 'expected a request to /api/lookup/dns').not.toBeNull();
  });
});
