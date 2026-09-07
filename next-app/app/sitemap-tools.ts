import { MetadataRoute } from 'next';
import { TOOLS } from '@/lib/data/tools';

const BASE_URL = 'https://www.xfree.in';
const LAST_MOD = new Date().toISOString().split('T')[0];

export default function sitemap(): MetadataRoute.Sitemap {
  return TOOLS.filter(t => t.indexable).map(tool => ({
    url: `${BASE_URL}/tools/${tool.slug}`,
    lastModified: LAST_MOD,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));
}
