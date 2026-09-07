import { MetadataRoute } from 'next';
import { PILLARS } from '@/lib/data/pillars';

const BASE_URL = 'https://www.xfree.in';
const LAST_MOD = new Date().toISOString().split('T')[0];

export default function sitemap(): MetadataRoute.Sitemap {
  return PILLARS.map(pillar => ({
    url: `${BASE_URL}/pillars/${pillar.slug}`,
    lastModified: LAST_MOD,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}
