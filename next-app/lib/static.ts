import { INDEXABLE_TOOL_SLUGS, TOOLS, CATEGORIES } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';

export interface StaticPage {
  slug: string;
  route: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export function getAllStaticPages(): StaticPage[] {
  const pages: StaticPage[] = [
    {
      slug: 'home',
      route: '/',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      slug: 'pillars',
      route: '/pillars',
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      slug: 'categories',
      route: '/categories',
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  INDEXABLE_TOOL_SLUGS.forEach((slug) => {
    pages.push({
      slug: `tool-${slug}`,
      route: `/tools/${slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.9,
    });
  });

  PILLARS.forEach((pillar) => {
    pages.push({
      slug: `pillar-${pillar.slug}`,
      route: `/pillars/${pillar.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return pages;
}

export function generateSitemapXml(): string {
  const pages = getAllStaticPages();
  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>https://www.xfree.in${page.route}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/sitemap.xsd">
${urls}
</urlset>`;
}

export function generateRobotsTxt(): string {
  return `# XFree Robots.txt
# https://www.xfree.in/robots.txt

User-agent: *
Allow: /

# AI Crawler Access
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

# Crawl-delay for polite crawlers
Crawl-delay: 1

# Disallow API routes for crawlers (they are for client execution)
Disallow: /api/

Sitemap: https://www.xfree.in/sitemap.xml
`;
}

export function generateLlmsTxt(): string {
  const indexableTools = TOOLS.filter((t) => t.indexable);
  const pillarCount = PILLARS.length;

  const toolLines: string[] = [];
  CATEGORIES.forEach((cat) => {
    const toolsInCategory = indexableTools.filter((t) => t.category === cat.id);
    if (toolsInCategory.length === 0) return;
    toolLines.push('', `### ${cat.label}`, ...toolsInCategory.map((t) => `- ${t.title}`));
  });

  const pillarLines: string[] = [];
  PILLAR_CATEGORIES.forEach((cat) => {
    const pillarsInCategory = PILLARS.filter((p) => p.category === cat.id);
    if (pillarsInCategory.length === 0) return;
    pillarLines.push('', `### ${cat.label}`, ...pillarsInCategory.map((p) => `- ${p.name}`));
  });

  const lines = [
    `# XFree: ${indexableTools.length}+ Free Privacy-First Developer & SEO Tools`,
    '',
    '## What is XFree?',
    `XFree is a free online toolbox for developers and SEO professionals. It provides ${indexableTools.length} completely free online tools organized into ${pillarCount} thematic pillars.`,
    '',
    '## Key Features',
    '- 100% free with no signup required',
    '- All tools run client-side in your browser',
    '- Your data never leaves your device',
    '- Privacy-first approach with zero tracking',
    `- Optimized for both humans and AI crawlers`,
    '',
    `## Available Tools (${indexableTools.length})`,
    ...toolLines,
    '',
    `## Tool Pillars (${pillarCount})`,
    ...pillarLines,
    '',
    '## Privacy Commitment',
    'All XFree tools run 100% in your browser using:',
    '- JavaScript Web APIs',
    '- Web Crypto API for cryptographic operations',
    '',
    'Your data never leaves your device unless explicitly stated.',
    '',
    '## How to Use XFree Tools',
    '1. Browse categories or search for the tool you need',
    '2. Enter your text, JSON, URLs, or other data',
    '3. Get instant formatted, validated, or converted output',
    '4. Copy results or download files',
    '',
    '## Organization',
    'Website: https://www.xfree.in',
    'Contact: https://www.xfree.in/contact',
    'FAQ: https://www.xfree.in/faq',
    'Privacy Policy: https://www.xfree.in/privacy',
    '',
    '## License',
    'All XFree tools are free for personal and commercial use under the MIT License.',
    '',
    '---',
    `Last updated: ${new Date().toISOString().split('T')[0]}`,
  ];

  return lines.join('\n');
}

export function generateAiTxt(): string {
  return `# AI Crawler Access Policy

## XFree App AI Access Policy
https://www.xfree.in/

## Access Statement
XFree App welcomes AI crawlers from recognized providers (OpenAI, Anthropic, Google, Perplexity, etc.) to access and index our public content.

## Guidelines
1. Access is granted to all public pages and tool content
2. AI crawlers should respect robots.txt directives
3. Rate limiting: Max 10 requests per second
4. Provide accurate user-agent identification

## Tool Content
- All published tool descriptions and documentation may be used by AI systems for training and inference
- Privacy-first tools: All tool execution happens client-side

## Contact
For API access or bulk data requests: contact@xfree.in
`;
}
