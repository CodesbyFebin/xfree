import { MetadataRoute } from 'next';
import { TOOLS, CATEGORIES } from '@/lib/data/toolsWithSEO';
import { PILLARS } from '@/lib/data/pillars';
import { GUIDES } from '@/lib/data/guides';
import { routing } from '@/i18n/routing';

const BASE_URL = 'https://www.xfree.in';

function localizedUrl(path: string, locale: string): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  // The real route for a locale's homepage is exactly "/es" (no
  // trailing slash) - appending the root path "/" after the prefix
  // would produce "/es/", which 308-redirects to "/es".
  if (path === '/') {
    return prefix ? `${BASE_URL}${prefix}` : `${BASE_URL}/`;
  }
  return `${BASE_URL}${prefix}${path}`;
}

// One sitemap entry per (path, locale) pair, each carrying the full set of
// hreflang alternates (including itself and x-default) so search engines
// can discover every real translated page and its siblings in one pass.
//
// lastModified is only ever set from a real, tracked content-review date
// (currently only guides have one - guide.lastReviewed below) and omitted
// everywhere else, rather than stamped with the build/deploy date. Google
// documents that it only trusts <lastmod> when it consistently reflects a
// page's actual last significant change - a value that really just means
// "when did we last deploy" teaches it to distrust the field entirely.
// changeFrequency/priority are gone for the same reason from the other
// direction: Google has said for years it doesn't use either for ranking
// or recrawl scheduling, so they were unused weight, not real signal.
function localizedEntries(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const languages: Record<string, string> = { 'x-default': localizedUrl(path, routing.defaultLocale) };
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(path, locale);
  }

  return routing.locales.map((locale) => ({
    url: localizedUrl(path, locale),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

const STATIC_PATHS = [
  '/',
  '/pillars',
  '/tools',
  '/guides',
  '/about',
  '/blog',
  '/contact',
  '/faq',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/security',
  '/roadmap',
  '/use-cases',
  '/xfree-app',
  '/updates',
  '/updates/ai',
  '/updates/web-development',
  '/updates/open-source',
  '/updates/security',
  '/updates/browser',
];

export default function sitemap(): MetadataRoute.Sitemap {
  // None of these carry a tracked "last significant change" date - see
  // localizedEntries' comment on why that means omitting lastModified
  // rather than stamping today's date.
  const staticRoutes = STATIC_PATHS.flatMap((path) => localizedEntries(path));

  // All 58 indexable tools stay in deliberately, including the 39 that
  // aren't yet engineVerified. See scripts/verify-sitemap.ts for the
  // tracked reconciliation: filtering to engineVerified here would drop
  // those 39 real, public, working tool pages from the sitemap before
  // anyone has actually audited which of them deserve that filter, which
  // would be a bigger regression than the inconsistency it "fixes".
  const toolRoutes = TOOLS.filter((tool) => tool.indexable).flatMap((tool) => localizedEntries(`/tools/${tool.slug}`));

  const categoryRoutes = CATEGORIES.flatMap((category) => localizedEntries(`/categories/${category.slug}`));

  const pillarRoutes = PILLARS.flatMap((pillar) => localizedEntries(`/pillars/${pillar.slug}`));

  const guideRoutes = GUIDES.flatMap((guide) => localizedEntries(`/guides/${guide.slug}`, guide.lastReviewed));

  const entries = [...staticRoutes, ...toolRoutes, ...categoryRoutes, ...pillarRoutes, ...guideRoutes];

  // Fails the build rather than silently shipping a sitemap that lists the
  // same canonical URL twice - Search Console treats a duplicate <loc> as
  // a sign something upstream (usually a slug collision) is wrong, not a
  // cosmetic issue to shrug off.
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.url)) duplicates.add(entry.url);
    seen.add(entry.url);
  }
  if (duplicates.size > 0) {
    throw new Error(`Sitemap contains ${duplicates.size} duplicate URL(s): ${[...duplicates].join(', ')}`);
  }

  return entries;
}
