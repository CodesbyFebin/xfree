'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { PILLARS } from '@/lib/data/pillars';
import { InteractiveX } from './InteractiveX';

// Real categories only (lib/data/toolsWithSEO.ts's CATEGORIES) - "Data" and
// "Web" from the design reference aren't real category ids on this site, so
// the two closest genuine categories stand in rather than 404ing.
const CATEGORY_SHORTCUTS = [
  { label: 'Developer Tools', href: '/categories/developer-tools' },
  { label: 'AI Tools', href: '/categories/ai-tools' },
  { label: 'SEO Tools', href: '/categories/seo-url-tools' },
  { label: 'Security Tools', href: '/categories/security-tools' },
  { label: 'Converters', href: '/categories/converters' },
  { label: 'Generators', href: '/categories/generators' },
] as const;

const POPULAR_SEARCHES = [
  { slug: 'json-formatter', label: 'XFree JSON Formatter' },
  { slug: 'regex-tester', label: 'XFree Regex Tester' },
  { slug: 'xml-sitemap-generator', label: 'XFree Sitemap Generator' },
  { slug: 'meta-tag-generator', label: 'XFree Meta Tags' },
  { slug: 'jwt-decoder', label: 'XFree JWT Decoder' },
] as const;

/** Deterministic best-match search over the real tool registry - title
 *  match first, then tag match, then seoKeywords phrase match. No fake
 *  "/search" route: this is the same registry-driven matching approach
 *  already used by Signals (lib/signals/matchTools.ts), reused here so
 *  the hero's search bar - previously wired to `action="/search"`, a
 *  route that has never existed in this app - actually does something. */
function findBestToolMatch(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  let best: { slug: string; score: number } | null = null;
  for (const tool of TOOLS) {
    if (!tool.indexable) continue;
    let score = 0;
    const title = tool.title.toLowerCase();
    if (title === q) score += 10;
    else if (title.includes(q) || q.includes(title)) score += 5;
    if (tool.slug.includes(q.replace(/\s+/g, '-'))) score += 4;
    for (const tag of tool.tags ?? []) {
      if (q.includes(tag.toLowerCase()) || tag.toLowerCase().includes(q)) score += 2;
    }
    for (const kw of tool.seoKeywords ?? []) {
      if (kw.toLowerCase().includes(q)) score += 3;
    }
    if (score > 0 && (!best || score > best.score)) best = { slug: tool.slug, score };
  }
  return best?.slug ?? null;
}

export function Hero() {
  const t = useTranslations('Home');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const toolCount = useMemo(() => TOOLS.filter((tool) => tool.indexable).length, []);
  const pillarCount = PILLARS.length;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const match = findBestToolMatch(query);
    router.push(match ? `/tools/${match}` : '/tools');
  }

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center pt-20 pb-12 overflow-hidden matrix-grid hex-pattern"
      aria-labelledby="hero-heading"
    >
      <div className="hero-orb w-[500px] h-[500px] bg-cyber-glow -top-40 -left-40" aria-hidden="true" />
      <div className="hero-orb w-[400px] h-[400px] bg-cyber-magenta top-1/4 -right-32" aria-hidden="true" />
      <div className="hero-orb w-[300px] h-[300px] bg-cyber-cyan bottom-20 left-1/3" aria-hidden="true" />

      <picture>
        <source srcSet="/hero-earth-960.webp 960w, /hero-earth-1920.webp 1920w" type="image/webp" />
        <img
          src="/hero-earth-1920.webp"
          alt=""
          className="hero-earth-bg"
          width={1920}
          height={800}
          decoding="async"
          fetchPriority="high"
        />
      </picture>

      <div className="relative z-10 max-w-5xl w-full min-w-0 mx-auto px-4 text-center">
        {/* Brand promise - the eyebrow above the X mark, per the approved
            hero reference. Hardcoded (not run through next-intl) like
            several other hero strings already are in this file - see
            FAQS in ../../app/[locale]/page.tsx for the existing precedent
            of English-only marketing copy on this page; translating this
            properly across all 10 locales is a separate follow-up. */}
        <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.35em] text-cyber-muted mb-4 anim-slide-up">
          Root Access For Everyone
        </p>

        <InteractiveX />

        {/* Exactly one H1 on this page. */}
        <h1
          id="hero-heading"
          className="text-4xl sm:text-5xl lg:text-7xl font-black text-cyber-text leading-[1.05] tracking-tight mb-4 anim-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          XFree <span className="text-cyber-glow neon-green">— Free Tools. Real Freedom.</span>
        </h1>

        <h2
          className="text-base sm:text-lg text-cyber-cyan font-mono mb-4 max-w-3xl mx-auto leading-snug anim-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          Meet the XFree App and <Link href="https://app.xfree.in/" className="underline underline-offset-2 hover:no-underline" rel="noopener">XFree Studio</Link> — the new XFree workspace for developer, AI, data, SEO and web tools.
        </h2>

        <p className="text-base text-cyber-muted max-w-2xl mx-auto mb-8 leading-relaxed anim-slide-up" style={{ animationDelay: '0.3s' }}>
          Discover free developer tools, AI utilities, data tools, SEO tools, converters and web utilities through XFree.
          Use XFree Studio to search, create, convert, analyze and build from one privacy-first workspace.
        </p>

        {/* Category shortcuts - real anchors to real category routes. */}
        <nav aria-label="Tool categories" className="flex flex-wrap items-center justify-center gap-2 mb-8 anim-slide-up" style={{ animationDelay: '0.35s' }}>
          {CATEGORY_SHORTCUTS.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="px-3.5 py-2 rounded-lg border border-cyber-border bg-cyber-card text-xs font-mono text-cyber-muted hover:text-cyber-glow hover:border-cyber-glow/40 transition-colors focus-ring"
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-6 anim-slide-up" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSearchSubmit} role="search">
            <div className="cmd-bar relative flex items-center bg-cyber-card rounded-lg p-1.5 border border-cyber-border transition-all duration-300 corner-brackets">
              <div className="pl-4 pr-2 text-cyber-glow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <label htmlFor="heroSearch" className="sr-only">{t('searchPlaceholder')}</label>
              <input
                type="text"
                id="heroSearch"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="flex-1 min-w-0 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono"
              />
              <kbd aria-hidden="true" className="hidden sm:inline">⏎</kbd>
              <button type="submit" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded">
                <span>Explore Now →</span>
              </button>
            </div>
          </form>
          <nav className="flex items-center justify-center gap-2 mt-3 flex-wrap" aria-label="Popular searches">
            <span className="text-[11px] text-cyber-muted font-mono">{t('popular')}</span>
            {POPULAR_SEARCHES.map((item, i) => (
              <span key={item.slug} className="contents">
                <Link href={`/tools/${item.slug}`} className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">
                  {item.label}
                </Link>
                {i < POPULAR_SEARCHES.length - 1 && <span className="text-cyber-dim" aria-hidden="true">·</span>}
              </span>
            ))}
          </nav>
        </div>

        {/* Trust signals - hedged, not absolute (see docs/PUBLICATION_CONTRACT.md
            and this pass's content-truth work: 3 of {toolCount} tools call a
            server, so a blanket "never leaves your device" claim is false). */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cyber-muted font-mono mb-8 anim-slide-up" style={{ animationDelay: '0.5s' }}>
          <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">⚡</span> {t('heroFeature1')}</span>
          <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🔒</span> {t('heroFeature2')}</span>
          <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🖥️</span> {t('heroFeature3')}</span>
          <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🌱</span> {t('heroFeature4')}</span>
          <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">💚</span> {t('heroFeature5')}</span>
        </div>

        {/* Real, live counts - never hardcoded. */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10 anim-slide-up" style={{ animationDelay: '0.55s' }}>
          <div className="text-center">
            <div className="text-xl font-black text-cyber-glow font-cyber">{toolCount}+</div>
            <div className="text-[10px] uppercase tracking-wider text-cyber-muted font-mono">{t('statToolsAvailable')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-cyber-glow font-cyber">{pillarCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-cyber-muted font-mono">{t('statPillarHubs')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-cyber-glow font-cyber">0</div>
            <div className="text-[10px] uppercase tracking-wider text-cyber-muted font-mono">{t('statSignups')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-cyber-glow font-cyber">100%</div>
            <div className="text-[10px] uppercase tracking-wider text-cyber-muted font-mono">Free</div>
          </div>
        </div>

        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyber-dim anim-slide-up" style={{ animationDelay: '0.6s' }}>
          {t('heroTagline')}
        </p>
      </div>
    </section>
  );
}
