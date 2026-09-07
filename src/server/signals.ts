/**
 * XFree Signals — curated developer news, sourced live from a small,
 * hand-picked set of real RSS feeds. This is discovery/attribution
 * material, not XFree content: every item links to the original source,
 * nothing is republished in full, and no editorial commentary is
 * fabricated per item. Scoped intentionally to 4 sources for the first
 * pass (Chrome for Developers, GitHub Blog, Cloudflare Blog, MDN); more
 * can be added the same way once this is verified working.
 */

export interface SignalSource {
  id: string;
  name: string;
  feedUrl: string;
  siteUrl: string;
}

export interface SignalItem {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string; // ISO 8601
}

export const SIGNAL_SOURCES: SignalSource[] = [
  {
    id: "chrome-dev",
    name: "Chrome for Developers",
    feedUrl: "https://developer.chrome.com/static/blog/feed.xml",
    siteUrl: "https://developer.chrome.com/blog/",
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    feedUrl: "https://github.blog/feed/",
    siteUrl: "https://github.blog/",
  },
  {
    id: "cloudflare-blog",
    name: "Cloudflare Blog",
    feedUrl: "https://blog.cloudflare.com/rss/",
    siteUrl: "https://blog.cloudflare.com/",
  },
  {
    id: "mdn-blog",
    name: "MDN Web Docs",
    feedUrl: "https://developer.mozilla.org/en-US/blog/rss.xml",
    siteUrl: "https://developer.mozilla.org/en-US/blog/",
  },
];

const CACHE_TTL_MS = 45 * 60_000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_ITEMS_PER_SOURCE = 8;
const MAX_TOTAL_ITEMS = 40;
const SUMMARY_MAX_LEN = 220;

let cache: { items: SignalItem[]; fetchedAt: number } | null = null;
let inFlight: Promise<SignalItem[]> | null = null;

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripCdata(input: string): string {
  const m = input.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return m ? m[1] : input;
}

function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  return decodeEntities(stripCdata(m[1]).trim());
}

function parseRss2(xml: string, source: SignalSource): SignalItem[] {
  const items: SignalItem[] = [];
  const itemBlocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

  for (const block of itemBlocks.slice(0, MAX_ITEMS_PER_SOURCE)) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDateRaw = extractTag(block, "pubDate");
    const descriptionRaw = extractTag(block, "description") || extractTag(block, "content:encoded") || "";

    if (!title || !link) continue;

    const parsedDate = pubDateRaw ? new Date(pubDateRaw) : null;
    const publishedAt = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

    const summaryText = stripTags(descriptionRaw);
    const summary = summaryText.length > SUMMARY_MAX_LEN ? `${summaryText.slice(0, SUMMARY_MAX_LEN).trim()}…` : summaryText;

    items.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.siteUrl,
      title,
      link,
      summary,
      publishedAt,
    });
  }

  return items;
}

async function fetchOneSource(source: SignalSource): Promise<SignalItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "XFreeSignals/1.0 (+https://www.xfree.in/updates)" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss2(xml, source);
  } catch {
    // A single source failing (timeout, network, malformed feed) should
    // never take the whole signals page down — just contribute nothing.
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAllSources(): Promise<SignalItem[]> {
  const results = await Promise.all(SIGNAL_SOURCES.map(fetchOneSource));
  const merged = results.flat();
  merged.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  const seen = new Set<string>();
  const deduped: SignalItem[] = [];
  for (const item of merged) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    deduped.push(item);
    if (deduped.length >= MAX_TOTAL_ITEMS) break;
  }
  return deduped;
}

export async function getSignals(): Promise<{ items: SignalItem[]; fetchedAt: string; stale: boolean }> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { items: cache.items, fetchedAt: new Date(cache.fetchedAt).toISOString(), stale: false };
  }

  if (!inFlight) {
    inFlight = fetchAllSources().finally(() => {
      inFlight = null;
    });
  }

  try {
    const items = await inFlight;
    cache = { items, fetchedAt: now };
    return { items, fetchedAt: new Date(now).toISOString(), stale: false };
  } catch {
    // Refetch failed entirely — serve the last good cache if we have one
    // rather than a hard error.
    if (cache) {
      return { items: cache.items, fetchedAt: new Date(cache.fetchedAt).toISOString(), stale: true };
    }
    return { items: [], fetchedAt: new Date(now).toISOString(), stale: true };
  }
}
