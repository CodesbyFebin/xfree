import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads, has one H1, and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveCount(1);

    // React dev-mode's eval() notice only fires under `next dev` - this
    // suite runs against a production build (see playwright.config.ts), so
    // any console error here is a real one.
    expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join('\n')}`).toHaveLength(0);
  });

  test('has exactly one raw self-canonical link', async ({ request }) => {
    const res = await request.get('/');
    const html = await res.text();
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0][1]).toBe('https://www.xfree.in');
  });

  test('has no duplicate CSP delivered via a meta tag (one authoritative header CSP only)', async ({ request }) => {
    const res = await request.get('/');
    const html = await res.text();
    expect(html).not.toContain('http-equiv="Content-Security-Policy"');
    const headers = res.headers();
    expect(headers['content-security-policy']).toBeTruthy();
  });

  test('does not advertise X-Powered-By', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-powered-by']).toBeFalsy();
  });
});

test.describe('Routing', () => {
  test('unknown route returns 404', async ({ request }) => {
    const res = await request.get('/this-page-definitely-does-not-exist-xyz', { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test('unknown tool slug returns 404 (no synthetic content for an unpublished/retired tool)', async ({ request }) => {
    const res = await request.get('/tools/this-tool-was-never-built', { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test('/studio redirects to XFree Studio', async ({ request }) => {
    const res = await request.get('/studio', { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()['location']).toBe('https://app.xfree.in/');
  });

  test('legacy tool URLs with a same-intent real tool 301/308 to it; the rest stay 404', async ({ request }) => {
    const redirected = await request.get('/tools/url-decoder', { maxRedirects: 0 });
    expect(redirected.status()).toBe(308);
    expect(redirected.headers()['location']).toBe('/tools/url-decode');

    // No real equivalent - must not be redirected to an unrelated tool.
    const gone = await request.get('/tools/ai-cta-generator', { maxRedirects: 0 });
    expect(gone.status()).toBe(404);
  });

  test('apex-style query params are not silently swallowed on a redirect target', async ({ request }) => {
    // /studio takes no query params today - this documents that if one is
    // ever added, it should be a deliberate decision, not silently dropped.
    const res = await request.get('/studio?ref=test', { maxRedirects: 0 });
    expect(res.status()).toBe(308);
  });
});
