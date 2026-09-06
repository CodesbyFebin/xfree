import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.xfree.in';
const LAST_MOD = new Date().toISOString().split('T')[0];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, lastModified: LAST_MOD, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/pillars`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/guides`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/faq`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/how-it-works`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: LAST_MOD, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/security`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/roadmap`, lastModified: LAST_MOD, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${BASE_URL}/use-cases`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/xfree-app`, lastModified: LAST_MOD, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
