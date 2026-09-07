import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/app.xfree.in/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://www.xfree.in/sitemap.xml',
    host: 'https://www.xfree.in',
  };
}
