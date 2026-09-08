import { XMLParser } from 'fast-xml-parser';
import { SIGNAL_SOURCES, type SignalSource } from './sources';
import { classify } from './classify';
import type { SignalItem } from './types';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function stripHtml(value: unknown): string {
  return String(value ?? '').replace(/<[^>]*>/g, '').trim();
}

/** Parses either RSS 2.0 (<rss><channel><item>) or Atom (<feed><entry>)
 *  feeds - the 10 sources use a mix of both. */
function parseFeed(xml: string, source: SignalSource): SignalItem[] {
  let doc: any;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }

  const rssItems = toArray(doc?.rss?.channel?.item);
  if (rssItems.length > 0) {
    return rssItems.map((item: any) => {
      const title = stripHtml(item.title);
      return {
        sourceId: source.id,
        sourceName: source.name,
        title,
        url: String(item.link ?? '').trim(),
        publishedAt: new Date(item.pubDate ?? Date.now()).toISOString(),
        categories: classify(title, source),
      };
    });
  }

  const atomEntries = toArray(doc?.feed?.entry);
  return atomEntries.map((entry: any) => {
    const title = stripHtml(entry.title);
    const links = toArray(entry.link);
    const htmlLink = links.find((l: any) => !l['@_rel'] || l['@_rel'] === 'alternate');
    const url = htmlLink?.['@_href'] ?? (typeof entry.link === 'string' ? entry.link : '');
    return {
      sourceId: source.id,
      sourceName: source.name,
      title,
      url: String(url).trim(),
      publishedAt: new Date(entry.updated ?? entry.published ?? Date.now()).toISOString(),
      categories: classify(title, source),
    };
  });
}

async function fetchOneFeed(source: SignalSource): Promise<SignalItem[]> {
  try {
    const res = await fetch(source.feedUrl, {
      headers: { 'User-Agent': 'XFreeSignals/1.0 (+https://www.xfree.in)' },
      next: { revalidate: 3600 },
      // Any one of 10 external feeds going slow shouldn't stall the
      // whole page - Promise.all below waits for the slowest source.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml, source).filter((item) => item.title && item.url);
  } catch {
    // A single source failing (timeout, feed format change, temporary
    // outage) must not take down the whole page - just contributes
    // zero items for this refresh cycle.
    return [];
  }
}

/** Cap per-source before merging, not just overall - and cap
 *  proportionally to each source's `weight` (see sources.ts), not
 *  equally. Without this, a source that posts daily (Vercel, OpenAI)
 *  fills the entire global top-N by pure recency and squeezes out
 *  sources that post less often but are still core to XFree's identity
 *  (MDN, web.dev, Chrome) - the exact "generic tech-news aggregator"
 *  outcome the curation is meant to avoid. Oversample the pool 1.5x
 *  past `limit` before the final recency sort/slice, so a lower-weight
 *  source's cap isn't so small it starves out entirely once merged. */
function sourceCap(weight: number, poolSize: number): number {
  return Math.max(2, Math.round(weight * poolSize * 1.5));
}

/** Fetches all 10 sources in parallel, caps each source's contribution
 *  proportionally to its configured weight, deduplicates by URL, sorts
 *  by recency, and caps the overall result. Cached for 1 hour via each
 *  fetch()'s own `next.revalidate` (Next.js's data cache), so this is
 *  cheap to call from multiple pages/categories without re-fetching
 *  every feed on every request. */
export async function getSignals(limit = 60): Promise<SignalItem[]> {
  const results = await Promise.all(SIGNAL_SOURCES.map(fetchOneFeed));

  const balanced = results.flatMap((items, i) => {
    const cap = sourceCap(SIGNAL_SOURCES[i].weight, limit);
    const sorted = [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    return sorted.slice(0, cap);
  });

  const seen = new Set<string>();
  const deduped = balanced.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  deduped.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return deduped.slice(0, limit);
}
