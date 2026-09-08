export type SignalCategory = 'ai' | 'web-development' | 'open-source' | 'security' | 'browser';

export interface SignalSource {
  id: string;
  name: string;
  feedUrl: string;
  /** Categories this source's items get tagged with by default when
   *  keyword classification (see classify.ts) finds no stronger match. */
  defaultCategories: SignalCategory[];
  /** Share of the merged pool this source is allowed to occupy (sums to
   *  1 across all sources). Chrome/web.dev/MDN + GitHub + Cloudflare are
   *  weighted highest since they're the closest match to XFree's actual
   *  developer/web-platform/open-source identity; Vercel/Stack Overflow
   *  lowest so the feed doesn't drift into generic tech-news territory. */
  weight: number;
  /** Set for feeds whose response exceeds Next.js's ~2MB data-cache
   *  entry limit (verified: vercel.com/atom is ~3.5MB) - Next silently
   *  fails to cache these regardless of `revalidate`, so requesting
   *  caching for them just repeats a doomed cache-write attempt (and
   *  logs a warning) on every fetch instead of once per hour. */
  skipCache?: boolean;
}

// Real, publicly documented feed URLs for each source - verified against
// each site's own published RSS/Atom endpoint, not guessed.
export const SIGNAL_SOURCES: SignalSource[] = [
  { id: 'chrome-dev', name: 'Chrome for Developers', feedUrl: 'https://developer.chrome.com/blog/feed.xml', defaultCategories: ['browser', 'web-development'], weight: 0.10 },
  { id: 'github-blog', name: 'GitHub Blog', feedUrl: 'https://github.blog/feed/', defaultCategories: ['open-source'], weight: 0.15 },
  { id: 'cloudflare-blog', name: 'Cloudflare Blog', feedUrl: 'https://blog.cloudflare.com/rss/', defaultCategories: ['web-development', 'security'], weight: 0.15 },
  { id: 'google-developers', name: 'Google Developers Blog', feedUrl: 'https://developers.googleblog.com/feeds/posts/default/', defaultCategories: ['web-development'], weight: 0.10 },
  { id: 'web-dev', name: 'web.dev', feedUrl: 'https://web.dev/feed.xml', defaultCategories: ['web-development', 'browser'], weight: 0.10 },
  { id: 'hugging-face', name: 'Hugging Face Blog', feedUrl: 'https://huggingface.co/blog/feed.xml', defaultCategories: ['ai', 'open-source'], weight: 0.10 },
  { id: 'openai-news', name: 'OpenAI News', feedUrl: 'https://openai.com/news/rss.xml', defaultCategories: ['ai'], weight: 0.10 },
  { id: 'vercel-blog', name: 'Vercel Blog', feedUrl: 'https://vercel.com/atom', defaultCategories: ['web-development'], weight: 0.05, skipCache: true },
  { id: 'stack-overflow', name: 'Stack Overflow Blog', feedUrl: 'https://stackoverflow.blog/feed/', defaultCategories: ['web-development'], weight: 0.05 },
  { id: 'mdn', name: 'MDN Web Docs', feedUrl: 'https://developer.mozilla.org/en-US/blog/rss.xml', defaultCategories: ['browser', 'web-development'], weight: 0.10 },
];

export const SIGNAL_CATEGORIES: { id: SignalCategory; label: string }[] = [
  { id: 'ai', label: 'AI' },
  { id: 'web-development', label: 'Web Development' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'security', label: 'Security' },
  { id: 'browser', label: 'Browser' },
];
