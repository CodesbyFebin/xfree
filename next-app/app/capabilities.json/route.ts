import { NextResponse } from 'next/server';
import { TOOLS, CATEGORIES } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';

export const runtime = 'edge';

export async function GET() {
  const capabilities = {
    '@context': [
      'https://schema.org',
      'https://nextapi.org/v1/capabilities'
    ],
    '@type': 'API',
    name: 'XFree Tools API',
    description: 'Free privacy-first developer and SEO tools platform. All tools execute client-side for maximum privacy.',
    version: '1.0.0',
    contact: {
      '@type': 'ContactPage',
      url: 'https://www.xfree.in/contact',
    },
    documentation: {
      '@type': 'TechArticle',
      url: 'https://www.xfree.in/how-it-works',
    },
    url: 'https://www.xfree.in',
    status: 'active',
    security: {
      type: 'none',
      description: 'No authentication required. All tool execution is client-side for privacy.',
    },
    pricing: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    category: [
      {
        id: 'developer-tools',
        name: 'Developer Tools',
        slug: 'developer-tools',
        icon: '⚡',
        toolCount: TOOLS.filter(t => t.category === 'developer-tools' && t.indexable).length,
        tools: TOOLS.filter(t => t.category === 'developer-tools' && t.indexable).map(t => ({
          id: t.id,
          name: t.title,
          slug: t.slug,
          description: t.shortDescription,
          inputType: 'text',
          outputType: 'text',
          privacy: 'client-side',
        })),
      },
      {
        id: 'seo-tools',
        name: 'SEO & URL Tools',
        slug: 'seo-url-tools',
        icon: '🌐',
        toolCount: TOOLS.filter(t => t.category === 'seo-tools' && t.indexable).length,
        tools: TOOLS.filter(t => t.category === 'seo-tools' && t.indexable).map(t => ({
          id: t.id,
          name: t.title,
          slug: t.slug,
          description: t.shortDescription,
          inputType: 'text',
          outputType: 'text',
          privacy: 'client-side',
        })),
      },
      {
        id: 'ai-tools',
        name: 'AI Tools',
        slug: 'ai-tools',
        icon: '🧠',
        toolCount: TOOLS.filter(t => t.category === 'ai-tools' && t.indexable).length,
        tools: TOOLS.filter(t => t.category === 'ai-tools' && t.indexable).map(t => ({
          id: t.id,
          name: t.title,
          slug: t.slug,
          description: t.shortDescription,
          inputType: 'text',
          outputType: 'text',
          privacy: t.execution === 'local' ? 'client-side' : 'server-processed',
        })),
      },
      {
        id: 'security-tools',
        name: 'Security & Privacy Tools',
        slug: 'security-tools',
        icon: '🔒',
        toolCount: TOOLS.filter(t => t.category === 'security-tools' && t.indexable).length,
        tools: TOOLS.filter(t => t.category === 'security-tools' && t.indexable).map(t => ({
          id: t.id,
          name: t.title,
          slug: t.slug,
          description: t.shortDescription,
          inputType: 'text',
          outputType: 'text',
          privacy: 'client-side',
        })),
      },
    ],
    endpoints: [
      {
        path: '/api/v1/intent',
        method: 'POST',
        description: 'Parse natural language intent and return tool recommendations',
        input: { type: 'object', properties: { query: { type: 'string' } } },
        output: { type: 'object', properties: { tools: { type: 'array' }, intent: { type: 'string' } } },
      },
      {
        path: '/api/v1/solve',
        method: 'POST',
        description: 'Execute a tool directly via API',
        input: { type: 'object', properties: { toolId: { type: 'string' }, input: { type: 'string' } } },
        output: { type: 'object', properties: { result: { type: 'any' }, success: { type: 'boolean' } } },
      },
      {
        path: '/api/v1/capabilities/tools',
        method: 'GET',
        description: 'Get complete list of all available tools with metadata',
        output: { type: 'object', properties: { tools: { type: 'array' } } },
      },
      {
        path: '/api/v1/workflows',
        method: 'GET',
        description: 'Get predefined workflow templates',
        output: { type: 'object', properties: { workflows: { type: 'array' } } },
      },
    ],
    supportedLanguages: ['en'],
    accessibility: {
      '@type': 'WebContent',
      accessibilityFeatures: ['alternativeText', 'readingDirection'],
    },
    browserRequirements: 'Requires JavaScript enabled browser',
    operatingSystem: 'Any',
    softwareVersion: '1.0.0',
    installMode: 'no-install',
    deployment: 'cloud',
    host: 'xfree.in',
  };

  return new NextResponse(JSON.stringify(capabilities, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
