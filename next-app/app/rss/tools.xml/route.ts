import { NextResponse } from 'next/server';
import { TOOLS } from '@/lib/data/tools';

export const runtime = 'edge';

export async function GET() {
  const tools = TOOLS.filter(t => t.indexable);
  const lastBuildDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>XFree Tools - Free Developer &amp; SEO Tools</title>
    <link>https://www.xfree.in</link>
    <description>Latest free privacy-first developer and SEO tools from XFree</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://www.xfree.in/rss/tools.xml" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>
    <image>
      <url>https://www.xfree.in/favicon.ico</url>
      <title>XFree Tools</title>
      <link>https://www.xfree.in</link>
    </image>
    ${tools.map(tool => `
    <item>
      <title><![CDATA[${tool.title}]]></title>
      <link>https://www.xfree.in/tools/${tool.slug}</link>
      <guid isPermaLink="true">https://www.xfree.in/tools/${tool.slug}</guid>
      <description><![CDATA[${tool.shortDescription} - ${tool.explanation}]]></description>
      <dc:creator>XFree</dc:creator>
      <category>${tool.categoryLabel}</category>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <keywords>${tool.tags.join(', ')}</keywords>
    </item>`).join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
