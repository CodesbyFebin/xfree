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
function localizedEntries(
  path: string,
  options: { changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number; lastModified?: string }
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = { 'x-default': localizedUrl(path, routing.defaultLocale) };
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(path, locale);
  }

  return routing.locales.map((locale) => ({
    url: localizedUrl(path, locale),
    lastModified: options.lastModified ?? new Date().toISOString().split('T')[0],
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/pillars', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/tools', changeFrequency: 'daily', priority: 0.9 },
    { path: '/guides', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/how-it-works', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/security', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/roadmap', changeFrequency: 'weekly', priority: 0.4 },
    { path: '/use-cases', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/xfree-app', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/updates', changeFrequency: 'hourly', priority: 0.6 },
    { path: '/updates/ai', changeFrequency: 'hourly', priority: 0.5 },
    { path: '/updates/web-development', changeFrequency: 'hourly', priority: 0.5 },
    { path: '/updates/open-source', changeFrequency: 'hourly', priority: 0.5 },
    { path: '/updates/security', changeFrequency: 'hourly', priority: 0.5 },
    { path: '/updates/browser', changeFrequency: 'hourly', priority: 0.5 },
  ];
  const staticRoutes = staticPaths.flatMap((p) => localizedEntries(p.path, p));

  const toolRoutes = TOOLS.filter((t) => t.indexable).flatMap((tool) =>
    localizedEntries(`/tools/${tool.slug}`, {
      changeFrequency: 'weekly',
      // Rounded to 2dp - the raw computation (0.7 + volume/1000000) hits
      // binary floating-point imprecision for most inputs (e.g. produces
      // 0.7739999999999999 instead of 0.774), which XML sitemaps render
      // as literal 16-digit decimals. Real sitemap validators/crawlers
      // don't need that precision; a clean 2-decimal value is standard.
      priority: Math.round(Math.min(0.9, tool.searchVolume ? 0.7 + tool.searchVolume / 1000000 : 0.8) * 100) / 100,
    })
  );

  const categoryRoutes = CATEGORIES.flatMap((cat) =>
    localizedEntries(`/categories/${cat.slug}`, { changeFrequency: 'weekly', priority: 0.7 })
  );

  const pillarRoutes = PILLARS.flatMap((pillar) =>
    localizedEntries(`/pillars/${pillar.slug}`, { changeFrequency: 'weekly', priority: 0.7 })
  );

  const guideRoutes = GUIDES.flatMap((guide) =>
    localizedEntries(`/guides/${guide.slug}`, {
      changeFrequency: 'monthly',
      priority: 0.6,
      lastModified: guide.lastReviewed,
    })
  );

  return [...staticRoutes, ...toolRoutes, ...categoryRoutes, ...pillarRoutes, ...guideRoutes];
}
