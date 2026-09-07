import { routing, type Locale } from '@/i18n/routing';

const BASE_URL = 'https://www.xfree.in';

function urlFor(path: string, locale: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${BASE_URL}${prefix}${normalized}`;
}

/** Canonical URL for `path` under the given locale (defaults to "en"). */
export function buildCanonical(path: string, locale: string = routing.defaultLocale): string {
  return urlFor(path, locale);
}

/**
 * Full hreflang alternates map for `path` - every real locale plus
 * x-default - for use in a page's `alternates.languages`.
 */
export function buildLanguageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = { 'x-default': urlFor(path, routing.defaultLocale) };
  for (const locale of routing.locales) {
    languages[locale] = urlFor(path, locale);
  }
  return languages;
}

/** Canonical + full hreflang alternates for `path` under `locale`, ready to spread into `alternates`. */
export function buildAlternates(path: string, locale: Locale) {
  return {
    canonical: buildCanonical(path, locale),
    languages: buildLanguageAlternates(path),
  };
}
