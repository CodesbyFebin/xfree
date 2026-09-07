import { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/data/tools';

const BASE_URL = 'https://www.xfree.in';
const LAST_MOD = new Date().toISOString().split('T')[0];

export default function sitemap(): MetadataRoute.Sitemap {
  return CATEGORIES.map(cat => ({
    url: `${BASE_URL}/categories/${cat.slug}`,
    lastModified: LAST_MOD,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}
