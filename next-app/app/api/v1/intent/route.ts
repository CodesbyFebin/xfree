import { NextRequest, NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';

export const runtime = 'edge';

interface IntentRequest {
  query: string;
  context?: string;
}

interface ToolRecommendation {
  tool: {
    id: string;
    slug: string;
    name: string;
    description: string;
    url: string;
  };
  confidence: number;
  reasoning: string;
}

function calculateIntentMatch(query: string, tool: typeof TOOLS[0]): { score: number; reasoning: string } {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  let score = 0;
  let reasoning = '';

  const titleWords = tool.title.toLowerCase().split(/\s+/);
  const tagWords = tool.tags.join(' ').toLowerCase();
  const descWords = tool.shortDescription.toLowerCase();

  for (const word of queryWords) {
    if (titleWords.some(t => t.includes(word) || word.includes(t))) {
      score += 0.4;
      reasoning += `Title match: "${word}" `;
    }
    if (tagWords.includes(word)) {
      score += 0.3;
      reasoning += `Tag match: "${word}" `;
    }
    if (descWords.includes(word)) {
      score += 0.2;
      reasoning += `Description match: "${word}" `;
    }
  }

  if (queryLower.includes('free') || queryLower.includes('online')) {
    score += 0.1;
  }

  return { score: Math.min(score, 1), reasoning: reasoning.trim() };
}

export async function POST(request: NextRequest) {
  try {
    const body: IntentRequest = await request.json();
    const { query, context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid query parameter' },
        { status: 400 }
      );
    }

    const toolScores = TOOLS.filter(t => t.indexable).map(tool => {
      const { score, reasoning } = calculateIntentMatch(query, tool);
      return {
        tool: {
          id: tool.id,
          slug: tool.slug,
          name: tool.title,
          description: tool.shortDescription,
          url: `https://www.xfree.in/tools/${tool.slug}`,
        },
        confidence: score,
        reasoning,
      };
    });

    const sortedTools = toolScores
      .filter(t => t.confidence > 0.1)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    const primaryIntent = sortedTools.length > 0
      ? `Use ${sortedTools[0].tool.name}`
      : 'General browsing';

    const response = {
      query,
      intent: primaryIntent,
      confidence: sortedTools[0]?.confidence ?? 0,
      tools: sortedTools,
      suggestedAction: sortedTools.length > 0
        ? { type: 'redirect', url: sortedTools[0].tool.url }
        : { type: 'browse', url: 'https://www.xfree.in/pillars' },
      relatedSearches: query.split(' ')
        .filter(w => w.length > 3)
        .map(w => `${w} xfree tool`),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
