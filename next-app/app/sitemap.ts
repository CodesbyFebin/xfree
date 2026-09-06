import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';
import { CATEGORIES } from '@/lib/data/tools';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.xfree.in';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/pillars`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.filter((t) => t.indexable).map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const pillarRoutes: MetadataRoute.Sitemap = PILLARS.map((pillar) => ({
    url: `${baseUrl}/pillars/${pillar.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...toolRoutes, ...pillarRoutes, ...categoryRoutes];
}
