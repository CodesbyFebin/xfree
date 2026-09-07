import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { PILLARS } from '@/lib/data/pillars';
import { GUIDES } from '@/lib/data/guides';
import { LOCALES } from '@/lib/i18n';

const BASE_URL = 'https://www.xfree.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    'pillars', 'tools', 'guides', 'about', 'blog', 'contact', 'faq',
    'how-it-works', 'privacy', 'terms', 'security', 'roadmap', 'use-cases', 'xfree-app',
  ];

  const localeRoutes: MetadataRoute.Sitemap = [];
  LOCALES.forEach(locale => {
    staticRoutes.forEach(route => {
      localeRoutes.push({
        url: `${BASE_URL}/${locale}/${route}`,
        lastModified: today,
        changeFrequency: 'weekly' as const,
        priority: route === 'pillars' || route === 'tools' ? 0.9 : 0.6,
      });
    });
    localeRoutes.push({
      url: `${BASE_URL}/${locale}/`,
      lastModified: today,
      changeFrequency: 'daily' as const,
      priority: 1,
    });
  });

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.filter(t => t.indexable).flatMap(tool =>
    LOCALES.map(locale => ({
      url: `${BASE_URL}/${locale}/tools/${tool.slug}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: Math.min(0.9, 0.7 + ((tool.searchVolume ?? 50000) / 1000000)),
    }))
  );

  const pillarRoutes: MetadataRoute.Sitemap = PILLARS.flatMap(pillar =>
    LOCALES.map(locale => ({
      url: `${BASE_URL}/${locale}/pillars/${pillar.slug}`,
      lastModified: today,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.flatMap(guide =>
    LOCALES.map(locale => ({
      url: `${BASE_URL}/${locale}/guides/${guide.slug}`,
      lastModified: guide.lastReviewed,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  );

  return [...localeRoutes, ...toolRoutes, ...pillarRoutes, ...guideRoutes];
}