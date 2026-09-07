import { INDEXABLE_TOOL_SLUGS } from '@/lib/data/tools';
import { PILLARS, AUTHORITY_PILLARS } from '@/lib/data/pillars';

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

  AUTHORITY_PILLARS.forEach((pillar) => {
    pages.push({
      slug: `authority-${pillar.slug}`,
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
  const pillars = pages.filter((p) => p.slug.startsWith('pillar-') || p.slug.startsWith('authority-'));

  const lines = [
    '# XFree: 150+ Free Privacy-First Developer & SEO Tools',
    '',
    '## What is XFree?',
    'XFree is the ultimate free online toolbox for developers and SEO professionals. We provide 150+ completely free online tools organized into 55 thematic pillars.',
    '',
    '## Key Features',
    '- 100% free with no signup required',
    '- All tools run client-side in your browser',
    '- Your data never leaves your device',
    '- Privacy-first approach with zero tracking',
    '- Optimized for both humans and AI crawlers',
    '',
    `## Available Tools (${tools.length})`,
    '',
    '### Developer Tools',
    '- JSON Formatter, Minifier, Validator',
    '- Regex Tester, Builder, Explainer',
    '- Base64 Encoder/Decoder',
    '- URL Encoder/Decoder',
    '- Hash Generator (MD5, SHA-256, SHA-512)',
    '- Password Generator',
    '- UUID Generator',
    '- JWT Decoder/Encoder',
    '- SQL Formatter',
    '- Cron Expression Generator',
    '- HTML/CSS/JS Minifier',
    '- YAML Validator',
    '',
    '### SEO Tools',
    '- XML Sitemap Generator',
    '- robots.txt Generator',
    '- Meta Tag Generator (Open Graph, Twitter Cards)',
    '- Schema Markup Generator (FAQ, HowTo, Product)',
    '- URL Slug Generator',
    '- UTM Builder',
    '',
    '### Security & Privacy Tools',
    '- Hash Generator',
    '- Password Generator with strength checker',
    '- JWT Decoder',
    '- Email/URL/Phone Validators',
    '',
    '### Text & Data Tools',
    '- Word Counter, Character Counter',
    '- Diff Tool',
    '- Case Converter',
    '- CSV to JSON Converter',
    '- JSON to CSV Converter',
    '',
    `## Tool Pillars (${pillars.length})`,
    '',
    '### Authority Pillars',
    '- JSON Data Tools Hub',
    '- Regex & Pattern Tools Hub',
    '- Encoding & Conversion Tools Hub',
    '',
    '### Developer Pillars',
    '- Code Formatters Hub',
    '- Validators & Debuggers Hub',
    '- API Development Tools Hub',
    '- Database Tools Hub',
    '- Version Control Tools Hub',
    '- Shell & Command Tools Hub',
    '',
    '### SEO Pillars',
    '- Sitemap Generator Tools Hub',
    '- Meta Tag Generator Tools Hub',
    '- Schema Markup Tools Hub',
    '- SEO Audit Tools Hub',
    '- Performance Optimization Tools Hub',
    '- URL Analysis Tools Hub',
    '',
    '### Security Pillars',
    '- Hash Generator Tools Hub',
    '- Password Generator & Manager Tools Hub',
    '- Token Decoder & Encoder Tools Hub',
    '- Encryption & Decryption Tools Hub',
    '- SSL & Certificate Tools Hub',
    '',
    '### Media & Document Pillars',
    '- PDF Conversion Tools Hub',
    '- PDF Editing Tools Hub',
    '- Document Converter Tools Hub',
    '- Markdown Tools Hub',
    '',
    '### Business Pillars',
    '- Text Analysis & NLP Tools Hub',
    '- Case Conversion Tools Hub',
    '- List & Table Utilities Hub',
    '- Calculator & Converter Tools Hub',
    '- Generator & Random Data Tools Hub',
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
    'Last updated: September 2026',
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
