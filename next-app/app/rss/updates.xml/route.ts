import { NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';

export async function GET() {
  const toolCount = TOOLS.filter((t) => t.indexable).length;

  // Dated feature-announcement entries with no real source-of-truth
  // changelog behind them (invented sequential placeholder dates, a
  // link to a "schema-generator" tool that was never built) have been
  // removed. Keep only entries that describe real, currently-live
  // features, without asserting a specific historical publish date we
  // can't back.
  const updates = [
    {
      title: 'XFree Tools',
      description: `${toolCount} free, privacy-first developer and SEO tools, all running client-side in your browser.`,
      pubDate: new Date().toISOString(),
      link: 'https://www.xfree.in',
    },
    {
      title: 'Pillar System',
      description: 'Tools are organized into thematic pillars for easier discovery.',
      pubDate: new Date().toISOString(),
      link: 'https://www.xfree.in/pillars',
    },
    {
      title: 'Developer Guides',
      description: 'In-depth technical guides on regex, cron expressions, JSON formatting, and SEO.',
      pubDate: new Date().toISOString(),
      link: 'https://www.xfree.in/guides',
    },
    {
      title: 'Machine-Readable API',
      description: '/tools.json, /capabilities.json, and API endpoints for AI agents.',
      pubDate: new Date().toISOString(),
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
