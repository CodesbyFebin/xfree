import { NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';
import { GUIDES } from '@/lib/data/guides';

export const runtime = 'edge';

export async function GET() {
  const content = `# XFree App - Complete Machine-Readable Documentation
Source: https://www.xfree.in
Last Updated: ${new Date().toISOString()}

## About XFree
XFree is a free, privacy-first web application offering developer and SEO tools.
All tool execution happens entirely in your browser - no data is transmitted to servers.
No signup required. No cookies. No tracking.

## Organization
- Name: XFree
- URL: https://www.xfree.in
- Contact: https://www.xfree.in/contact
- Privacy Policy: https://www.xfree.in/privacy
- Terms: https://www.xfree.in/terms

## Available Tools (${TOOLS.filter(t => t.indexable).length})

### Developer Tools
${TOOLS.filter(t => t.category === 'developer-tools' && t.indexable).map(t => `
#### ${t.title}
- ID: ${t.id}
- URL: https://www.xfree.in/tools/${t.slug}
- Description: ${t.shortDescription}
- Privacy: ${t.execution === 'local' ? 'Client-side only' : 'Server-processed'}
- Tags: ${t.tags.join(', ')}
- How to use: ${t.howToUse.join(' -> ')}
`).join('\n')}

### SEO & URL Tools
${TOOLS.filter(t => t.category === 'seo-tools' && t.indexable).map(t => `
#### ${t.title}
- ID: ${t.id}
- URL: https://www.xfree.in/tools/${t.slug}
- Description: ${t.shortDescription}
- Privacy: ${t.execution === 'local' ? 'Client-side only' : 'Server-processed'}
- Tags: ${t.tags.join(', ')}
`).join('\n')}

### AI Tools
${TOOLS.filter(t => t.category === 'ai-tools' && t.indexable).map(t => `
#### ${t.title}
- ID: ${t.id}
- URL: https://www.xfree.in/tools/${t.slug}
- Description: ${t.shortDescription}
- Privacy: ${t.execution === 'local' ? 'Client-side only' : 'Server-processed'}
`).join('\n')}

### Security Tools
${TOOLS.filter(t => t.category === 'security-tools' && t.indexable).map(t => `
#### ${t.title}
- ID: ${t.id}
- URL: https://www.xfree.in/tools/${t.slug}
- Description: ${t.shortDescription}
- Privacy: Client-side only
`).join('\n')}

## Tool Pillars (${PILLARS.length})
${PILLARS.map(p => `
### ${p.name}
- URL: https://www.xfree.in/pillars/${p.slug}
- Category: ${p.category}
- Description: ${p.description}
`).join('\n')}

## Developer Guides (${GUIDES.length})
${GUIDES.map(g => `
### ${g.title}
- URL: https://www.xfree.in/guides/${g.slug}
- Description: ${g.description}
- Last Reviewed: ${g.lastReviewed}
`).join('\n')}

## API Endpoints

### GET /tools.json
Returns machine-readable list of all tools.

### GET /capabilities.json
Returns API capabilities and endpoint documentation.

### GET /workflows.json
Returns predefined workflow templates.

### GET /api/v1/capabilities/tools
Returns Schema.org compatible tool metadata.

### POST /api/v1/intent
Intent parsing endpoint for AI agents.
Input: { "query": "string" }
Output: { "intent": "string", "tools": [] }

### POST /api/v1/solve
Direct tool execution endpoint.
Input: { "toolId": "string", "input": "string" }
Output: { "success": boolean, "result": "any" }

## Licensing
- All tools are free to use
- No attribution required
- Commercial use allowed
- View Terms: https://www.xfree.in/terms

## Privacy
- All client-side tools: 100% privacy
- No data transmission
- No cookies
- No tracking
- No account required

## Content Categories
- Developer Tools: JSON, regex, encoding, formatting
- SEO Tools: Sitemaps, meta tags, schema markup
- AI Tools: Prompt engineering, token counting
- Security Tools: Hashing, JWT, password generation
- Text Tools: Diff, word count, case conversion
- Media Tools: Image optimization, document conversion
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
