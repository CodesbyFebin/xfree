export type SignalCategory = 'ai' | 'web-development' | 'open-source' | 'security' | 'browser';

export interface SignalSource {
  id: string;
  name: string;
  feedUrl: string;
  /** Categories this source's items get tagged with by default when
   *  keyword classification (see classify.ts) finds no stronger match. */
  defaultCategories: SignalCategory[];
}

// Real, publicly documented feed URLs for each source - verified against
// each site's own published RSS/Atom endpoint, not guessed.
export const SIGNAL_SOURCES: SignalSource[] = [
  { id: 'chrome-dev', name: 'Chrome for Developers', feedUrl: 'https://developer.chrome.com/blog/feed.xml', defaultCategories: ['browser', 'web-development'] },
  { id: 'github-blog', name: 'GitHub Blog', feedUrl: 'https://github.blog/feed/', defaultCategories: ['open-source'] },
  { id: 'cloudflare-blog', name: 'Cloudflare Blog', feedUrl: 'https://blog.cloudflare.com/rss/', defaultCategories: ['web-development', 'security'] },
  { id: 'google-developers', name: 'Google Developers Blog', feedUrl: 'https://developers.googleblog.com/feeds/posts/default/', defaultCategories: ['web-development'] },
  { id: 'web-dev', name: 'web.dev', feedUrl: 'https://web.dev/feed.xml', defaultCategories: ['web-development', 'browser'] },
  { id: 'hugging-face', name: 'Hugging Face Blog', feedUrl: 'https://huggingface.co/blog/feed.xml', defaultCategories: ['ai', 'open-source'] },
  { id: 'openai-news', name: 'OpenAI News', feedUrl: 'https://openai.com/news/rss.xml', defaultCategories: ['ai'] },
  { id: 'vercel-blog', name: 'Vercel Blog', feedUrl: 'https://vercel.com/atom', defaultCategories: ['web-development'] },
  { id: 'stack-overflow', name: 'Stack Overflow Blog', feedUrl: 'https://stackoverflow.blog/feed/', defaultCategories: ['web-development'] },
  { id: 'mdn', name: 'MDN Web Docs', feedUrl: 'https://developer.mozilla.org/en-US/blog/rss.xml', defaultCategories: ['browser', 'web-development'] },
];

export const SIGNAL_CATEGORIES: { id: SignalCategory; label: string }[] = [
  { id: 'ai', label: 'AI' },
  { id: 'web-development', label: 'Web Development' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'security', label: 'Security' },
  { id: 'browser', label: 'Browser' },
];
