import { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/data/guides';

const BASE_URL = 'https://www.xfree.in';

export default function sitemap(): MetadataRoute.Sitemap {
  return GUIDES.map(guide => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: guide.lastReviewed,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
}
