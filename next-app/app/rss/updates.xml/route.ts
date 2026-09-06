import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const updates = [
    {
      title: 'XFree Launch',
      description: 'XFree app launched with 26 free developer and SEO tools',
      pubDate: '2026-01-01',
      link: 'https://www.xfree.in',
    },
    {
      title: 'Pillar System Introduction',
      description: 'New organized pillar system for grouping related tools',
      pubDate: '2026-02-15',
      link: 'https://www.xfree.in/pillars',
    },
    {
      title: 'AI Tools Category Added',
      description: 'New category for AI-powered tools including prompt engineering and token counting',
      pubDate: '2026-03-01',
      link: 'https://www.xfree.in/categories/ai-tools',
    },
    {
      title: 'Developer Guides Section',
      description: 'In-depth technical guides on regex, cron expressions, JSON formatting, and SEO',
      pubDate: '2026-04-01',
      link: 'https://www.xfree.in/guides',
    },
    {
      title: 'Schema Markup Tools',
      description: 'New JSON-LD generator and schema validator for structured data SEO',
      pubDate: '2026-05-01',
      link: 'https://www.xfree.in/tools/schema-generator',
    },
    {
      title: 'Machine-Readable API',
      description: 'New /tools.json, /capabilities.json, and API endpoints for AI agents',
      pubDate: '2026-06-01',
      link: 'https://www.xfree.in/capabilities.json',
    },
  ];

  const lastBuildDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>XFree Updates - New Tools &amp; Features</title>
    <link>https://www.xfree.in</link>
    <description>Latest updates, new tools, and feature announcements from XFree</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://www.xfree.in/rss/updates.xml" rel="self" type="application/rss+xml"/>
    <ttl>86400</ttl>
    <image>
      <url>https://www.xfree.in/favicon.ico</url>
      <title>XFree Updates</title>
      <link>https://www.xfree.in</link>
    </image>
    ${updates.map(update => `
    <item>
      <title><![CDATA[${update.title}]]></title>
      <link>${update.link}</link>
      <guid isPermaLink="true">${update.link}</guid>
      <description><![CDATA[${update.description}]]></description>
      <dc:creator>XFree</dc:creator>
      <category>Update</category>
      <pubDate>${new Date(update.pubDate).toUTCString()}</pubDate>
    </item>`).join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
