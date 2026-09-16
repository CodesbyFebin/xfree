import { test, expect } from '@playwright/test';
import { locales, defaultLocale } from '../../i18n/routing';

// localePrefix: 'as-needed' (i18n/routing.ts) - the default locale is served
// with no path prefix, every other locale gets one.
function pathFor(locale: string): string {
  return locale === defaultLocale ? '/' : `/${locale}`;
}

test.describe('Locale homepages', () => {
  for (const locale of locales) {
    test(`${locale} homepage returns 200 with a self-canonical and full hreflang set`, async ({ request }) => {
      const res = await request.get(pathFor(locale));
      expect(res.status(), `${locale} homepage should be 200`).toBe(200);

      const html = await res.text();
      const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
      expect(canonicals, `${locale} should have exactly one canonical`).toHaveLength(1);

      const alternates = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)"/g)].map((m) => m[1]);
      // Every locale + x-default should be present as an alternate, regardless
      // of which locale is currently being viewed.
      for (const other of locales) {
        expect(alternates, `${locale} homepage missing hreflang for "${other}"`).toContain(other);
      }
      expect(alternates, `${locale} homepage missing x-default hreflang`).toContain('x-default');
    });
  }

  test('non-default locale homepage is not indexable as a duplicate of "/"', async ({ request }) => {
    const res = await request.get('/es');
    const html = await res.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical).toBe('https://www.xfree.in/es');
  });
});
