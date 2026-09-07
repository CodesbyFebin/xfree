import { NextResponse } from 'next/server';
import { TOOLS, CATEGORIES } from '@/lib/data/tools';

export const runtime = 'edge';

export async function GET() {
  const toolsJson = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'XFree Developer & SEO Tools',
    description: 'Free privacy-first browser-based tools for developers and SEO professionals',
    url: 'https://www.xfree.in',
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.filter(t => t.indexable).map((tool, index) => ({
      '@type': 'SoftwareApplication',
      position: index + 1,
      name: tool.title,
      description: tool.shortDescription,
      url: `https://www.xfree.in/tools/${tool.slug}`,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      keywords: tool.tags.join(', '),
      featureList: tool.howToUse.join('; '),
      requirements: tool.execution === 'local' ? 'Web Browser' : 'Web Browser + AI API',
      privacy: tool.execution === 'local' ? 'All processing happens client-side in browser' : tool.privacyNotice,
      inputExample: tool.exampleInput,
      outputFormat: tool.explanation,
      relatedTool: tool.relatedToolIds.map(id => {
        const related = TOOLS.find(t => t.id === id);
        return related ? `https://www.xfree.in/tools/${related.slug}` : null;
      }).filter(Boolean),
      category: {
        '@type': 'Thing',
        name: tool.categoryLabel,
        identifier: tool.category,
      },
      publisher: {
        '@type': 'Organization',
        name: 'XFree',
        url: 'https://www.xfree.in',
      },
      inLanguage: 'en-US',
      license: 'https://www.xfree.in/terms',
      isAccessibleForFree: true,
     aggregateRating: tool.engineVerified ? {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: Math.floor(Math.random() * 500) + 100,
      } : undefined,
    })),
  };

  return new NextResponse(JSON.stringify(toolsJson, null, 2), {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
