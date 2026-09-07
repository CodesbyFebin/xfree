import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { PILLARS } from '@/lib/data/pillars';
import { GUIDES } from '@/lib/data/guides';

const BASE_URL = 'https://www.xfree.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: today, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/pillars`, lastModified: today, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/tools`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/guides`, lastModified: today, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: today, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: today, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/faq`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/how-it-works`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: today, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/security`, lastModified: today, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/roadmap`, lastModified: today, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${BASE_URL}/use-cases`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/xfree-app`, lastModified: today, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.filter(t => t.indexable).map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: tool.searchVolume ? Math.min(0.9, 0.7 + (tool.searchVolume / 1000000)) : 0.8,
    images: tool.exampleInput ? [
      {
        url: `${BASE_URL}/og-image.png`,
        title: tool.title,
        caption: tool.shortDescription,
      }
    ] : undefined,
  }));

  const pillarRoutes: MetadataRoute.Sitemap = PILLARS.map(pillar => ({
    url: `${BASE_URL}/pillars/${pillar.slug}`,
    lastModified: today,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map(guide => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: guide.lastReviewed,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...toolRoutes, ...pillarRoutes, ...guideRoutes];
}
