import { NextResponse } from 'next/server';
import { GUIDES } from '@/lib/data/guides';

export const runtime = 'edge';

export async function GET() {
  const lastBuildDate = new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>XFree Guides - Developer &amp; SEO Resources</title>
    <link>https://www.xfree.in/guides</link>
    <description>In-depth guides on developer tools, SEO best practices, and how-to articles</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://www.xfree.in/rss/guides.xml" rel="self" type="application/rss+xml"/>
    <ttl>3600</ttl>
    <image>
      <url>https://www.xfree.in/favicon.ico</url>
      <title>XFree Guides</title>
      <link>https://www.xfree.in/guides</link>
    </image>
    ${GUIDES.map(guide => `
    <item>
      <title><![CDATA[${guide.title}]]></title>
      <link>https://www.xfree.in/guides/${guide.slug}</link>
      <guid isPermaLink="true">https://www.xfree.in/guides/${guide.slug}</guid>
      <description><![CDATA[${guide.intro}]]></description>
      <dc:creator>XFree</dc:creator>
      <category>Guide</category>
      <pubDate>${new Date(guide.lastReviewed).toUTCString()}</pubDate>
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
