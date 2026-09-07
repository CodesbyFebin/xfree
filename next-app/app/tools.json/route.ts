import { NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';

export const runtime = 'edge';

export async function GET() {
  const toolsData = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    totalTools: TOOLS.filter(t => t.indexable).length,
    tools: TOOLS.filter(t => t.indexable).map(tool => ({
      id: tool.id,
      slug: tool.slug,
      name: tool.title,
      tagline: tool.shortDescription,
      description: tool.explanation,
      category: tool.category,
      categoryLabel: tool.categoryLabel,
      tags: tool.tags,
      inputExample: tool.exampleInput,
      outputFormat: 'text/html',
      privacy: tool.execution === 'local' ? 'client-side' : 'server-processed',
      relatedTools: tool.relatedToolIds,
      url: `https://www.xfree.in/tools/${tool.slug}`,
    })),
  };

  return new NextResponse(JSON.stringify(toolsData, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
