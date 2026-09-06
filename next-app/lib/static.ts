import { INDEXABLE_TOOL_SLUGS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';

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
  const pages = getAllStaticPages();
  const tools = pages.filter((p) => p.slug.startsWith('tool-'));
  const pillars = pages.filter((p) => p.slug.startsWith('pillar-'));

  const lines = [
    '# XFree App - Free Online Developer & SEO Tools',
    '',
    '## Overview',
    'XFree App provides free, privacy-first browser-based tools for developers and SEO professionals.',
    'All tools execute entirely client-side with zero data transmission.',
    '',
    '## Available Tools',
  ];

  tools.forEach((tool) => {
    const toolName = tool.slug.replace('tool-', '').replace(/-/g, ' ');
    lines.push(`- [${toolName}](https://www.xfree.in${tool.route})`);
  });

  lines.push('', '## Tool Categories');

  const categories = [
    { name: 'Developer Tools', slug: '/categories/dev-tools' },
    { name: 'SEO Tools', slug: '/categories/seo-tools' },
    { name: 'AI Tools', slug: '/categories/ai-tools' },
    { name: 'Security Tools', slug: '/categories/security-tools' },
  ];

  categories.forEach((cat) => {
    lines.push(`- [${cat.name}](https://www.xfree.in${cat.slug})`);
  });

  lines.push('', '## Pillar Pages');

  pillars.forEach((pillar) => {
    const pillarName = pillar.slug.replace('pillar-', '').replace(/-/g, ' ');
    lines.push(`- [${pillarName}](https://www.xfree.in${pillar.route})`);
  });

  lines.push('', '## Privacy', 'All XFree tools are 100% client-side.', 'No data is transmitted to any server.', 'No cookies or tracking.', '');

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
