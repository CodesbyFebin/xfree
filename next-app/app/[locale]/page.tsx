'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TOOLS as ALL_TOOLS, CATEGORIES } from '@/lib/data/tools';
import { PILLARS as ALL_PILLARS } from '@/lib/data/pillars';
import { Footer } from '@/components/layout/Footer';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Tool {
  slug: string;
  title: string;
  category: string;
  badge?: string;
  description: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface UseCase {
  title: string;
  tools: string[];
  description: string;
}

const PUBLIC_TOOLS: Tool[] = [
  { slug: 'json-formatter', title: 'JSON Formatter', category: 'Developer', badge: '★ FLAGSHIP', description: 'Format, validate, repair, and minify JSON data with instant tree inspect.' },
  { slug: 'regex-tester', title: 'Regex Tester', category: 'Developer', badge: 'POPULAR', description: 'Test JS regex patterns live with match group tables and replacements.' },
  { slug: 'xml-sitemap-generator', title: 'Sitemap Generator', category: 'SEO', badge: '★ FLAGSHIP', description: 'Extract links from HTML and generate Google XML sitemaps with priority.' },
  { slug: 'meta-tag-generator', title: 'Meta Tag Generator', category: 'SEO', badge: 'ESSENTIAL', description: 'Generate meta titles, descriptions, and preview social cards.' },
  { slug: 'jwt-decoder', title: 'JWT Decoder', category: 'Security', badge: 'POPULAR', description: 'Decode OAuth JWT tokens and convert Base64 strings safely.' },
  { slug: 'cron-generator', title: 'Cron Generator', category: 'Developer', badge: 'NEW', description: 'Generate cron expressions with human-readable output.' },
  { slug: 'hash-generator', title: 'Hash Generator', category: 'Security', description: 'Generate SHA256, MD5, and other hash values instantly.' },
];

// Real counts (ALL_TOOLS.length / ALL_PILLARS.length), not hardcoded
// literals — this replaced a fabricated "100K+ Monthly Users" (no real
// analytics backing it) and "270+ Tools Available" (real count is under
// 60) that shipped here before.
const STATS: { value: string; labelKey: string }[] = [
  { value: `${ALL_TOOLS.length}+`, labelKey: 'statToolsAvailable' },
  { value: `${ALL_PILLARS.length}`, labelKey: 'statPillarHubs' },
  { value: '0', labelKey: 'statSignups' },
  { value: '100%', labelKey: 'statClientSide' },
  { value: 'MIT', labelKey: 'statOpenSource' },
  { value: 'LOCAL', labelKey: 'statLocalMode' },
];

const FAQS: FAQ[] = [
  { q: 'What is XFree app?', a: 'XFree app is the ultimate free online platform for developers offering privacy-first micro-tools including XFree JSON formatters, XFree HTML minifiers, XFree SEO utilities, and XFree crypto tools. All tools run 100% client-side with no signup required.' },
  { q: 'Is XFree really free with no signup?', a: 'Yes. XFree is completely free to use with no sign-up, no account creation, and no usage limits. All tools are open-source under the MIT License and run entirely in your browser.' },
  { q: 'How does XFree ensure privacy?', a: 'XFree tools run in Local Mode by default, processing your data inside your browser session using JavaScript and WebAssembly. Your input is never transmitted to external servers unless clearly disclosed.' },
  { q: 'What is XFree alternative to CodeBeautify?', a: 'XFree is a privacy-first alternative to CodeBeautify. Unlike those platforms, XFree runs 100% client-side with zero tracking, no ads on tool pages, no data collection, and open-source code you can audit.' },
  { q: 'Can I use XFree offline?', a: 'Yes. Because XFree tools are static HTML with embedded JavaScript, you can save any tool page and use it completely offline without an internet connection.' },
  { q: 'Is XFree open source?', a: 'Yes. The entire XFree codebase is open-source under the MIT License. You can audit, fork, and contribute on our GitHub repository.' },
];

const USE_CASES: UseCase[] = [
  { title: 'API Development', tools: ['JSON Formatter', 'JWT Decoder', 'Base64 Encoder'], description: 'Format, decode, and validate API payloads' },
  { title: 'SEO Auditing', tools: ['Sitemap Generator', 'Meta Tag Generator', 'Regex Tester'], description: 'Generate and validate SEO assets' },
  { title: 'Security Testing', tools: ['Hash Generator', 'JWT Decoder', 'Password Generator'], description: 'Test authentication and encryption flows' },
];

// Verified against lib/data/tools.ts's real CATEGORIES.slug and the
// shared components/layout/Header.tsx nav — this replaced a 6-group,
// 70-link NAV_LINKS object where all but a handful of hrefs (e.g.
// /dev-tools, /seo-tools, /web-tools, /agentic-workflows, /mcp-tools)
// matched no real route in the app.
const NAV_ITEMS = [
  {
    labelKey: 'toolsMenu',
    href: '/pillars',
    children: [
      { labelKey: 'allPillars', href: '/pillars' },
      { labelKey: 'developerTools', href: '/categories/developer-tools' },
      { labelKey: 'seoTools', href: '/categories/seo-url-tools' },
      { labelKey: 'aiTools', href: '/categories/ai-tools' },
      { labelKey: 'securityTools', href: '/categories/security-tools' },
    ],
  },
  {
    labelKey: 'resourcesMenu',
    href: '/guides',
    children: [
      { labelKey: 'allGuides', href: '/guides' },
      { labelKey: 'faq', href: '/faq' },
      { labelKey: 'howItWorks', href: '/how-it-works' },
      { labelKey: 'useCases', href: '/use-cases' },
    ],
  },
  {
    labelKey: 'aboutMenu',
    href: '/about',
    children: [
      { labelKey: 'aboutXfree', href: '/about' },
      { labelKey: 'security', href: '/security' },
      { labelKey: 'roadmap', href: '/roadmap' },
      { labelKey: 'xfreeApp', href: '/xfree-app' },
    ],
  },
] as const;

export default function HomePage() {
  const t = useTranslations('Home');
  const tHeader = useTranslations('Header');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoOutput, setDemoOutput] = useState('{\n  "name": "xfree",\n  "type": "micro-tool",\n  "fast": true\n}');
  const [demoStatus, setDemoStatus] = useState({ valid: true, time: '0.1' });
  const [demoCopied, setDemoCopied] = useState(false);
  const demoInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const runDemo = () => {
    if (!demoInputRef.current) return;
    const t0 = performance.now();
    try {
      const parsed = JSON.parse(demoInputRef.current.value);
      const formatted = JSON.stringify(parsed, null, 2);
      setDemoOutput(formatted);
      setDemoStatus({ valid: true, time: (performance.now() - t0).toFixed(1) });
    } catch (e: any) {
      setDemoOutput(`Error: ${e.message}`);
      setDemoStatus({ valid: false, time: '0' });
    }
  };

  const copyDemo = () => {
    navigator.clipboard.writeText(demoOutput).then(() => {
      setDemoCopied(true);
      setTimeout(() => setDemoCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text antialiased">
      <div className="scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />
      {mobileMenuOpen && <div className="mobile-overlay open" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />}

      <a href="#main-content" className="skip-link focus-ring">Skip to main content</a>

      {/* HEADER */}
      <header id="mainNav" className={`sticky-nav fixed top-0 left-0 right-0 z-50 px-4 py-3 ${scrolled ? 'scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="XFree homepage">
            {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size logo, see components/layout/Header.tsx */}
            <picture className="shrink-0">
              <source srcSet="/logo-wordmark-80.webp 1x, /logo-wordmark-160.webp 2x" type="image/webp" />
              <img
                src="/logo-wordmark-80.png"
                srcSet="/logo-wordmark-80.png 1x, /logo-wordmark-160.png 2x"
                alt="XFree"
                width={160}
                height={80}
                decoding="async"
                style={{ height: '36px', width: '72px' }}
              />
            </picture>
            <span className="hidden sm:inline text-[10px] text-cyber-muted font-mono ml-1">{`// ${tHeader('tagline')}`}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <NavDropdown
                key={item.labelKey}
                label={tHeader(item.labelKey)}
                links={item.children.map((c) => ({ href: c.href, label: tHeader(c.labelKey) }))}
              />
            ))}
            <Link href="/contact" className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all">{tHeader('contact')}</Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <Link href="https://app.xfree.in/" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded" rel="noopener">
              <span>{tHeader('launchStudio')} →</span>
            </Link>
            <button className="mobile-menu-btn lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`} role="dialog" aria-label="Mobile navigation">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <nav className="mt-12 space-y-6">
          {NAV_ITEMS.map((item) => (
            <div key={item.labelKey}>
              <h3 className="text-xs font-mono text-cyber-glow mb-2">{`// ${tHeader(item.labelKey)}`}</h3>
              <div className="space-y-2">
                {item.children.map((child) => (
                  <Link key={child.href} href={child.href} className="block text-sm text-cyber-muted hover:text-cyber-glow">{tHeader(child.labelKey)}</Link>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-cyber-border">
            <Link href="/contact" className="block text-sm text-cyber-glow">{tHeader('contact')} →</Link>
          </div>
          <div className="pt-4 border-t border-cyber-border">
            <LocaleSwitcher className="flex flex-wrap items-center gap-2" />
          </div>
        </nav>
      </div>

      <main id="main-content">
        {/* HERO */}
        <section className="relative min-h-[92vh] flex items-center justify-center pt-20 pb-12 overflow-hidden matrix-grid hex-pattern" aria-labelledby="hero-heading">
          <div className="hero-orb w-[500px] h-[500px] bg-cyber-glow -top-40 -left-40" aria-hidden="true" />
          <div className="hero-orb w-[400px] h-[400px] bg-cyber-magenta top-1/4 -right-32" aria-hidden="true" />
          <div className="hero-orb w-[300px] h-[300px] bg-cyber-cyan bottom-20 left-1/3" aria-hidden="true" />

          {/* eslint-disable-next-line @next/next/no-img-element -- decorative, masked/faded background art, not a content image */}
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

          <p className="font-script text-cyber-glow text-2xl sm:text-3xl absolute top-24 right-6 sm:right-12 -rotate-6 opacity-90 hidden sm:block" aria-hidden="true">
            {t('heroHandwritten')}
          </p>

          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow mb-6 neon-box-green anim-slide-up">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow anim-pulse" aria-hidden="true" />
              <span>$ {t('badge')}</span>
            </div>

            <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-cyber-muted mb-3 anim-slide-up">
              {t('heroTagline')}
            </p>

            <h1 id="hero-heading" className="hero-title text-4xl sm:text-5xl lg:text-7xl font-black text-cyber-text leading-[1.05] tracking-tight mb-4 uppercase glitch anim-slide-up" data-text={`${t('titleLine1')}\n${t('titleLine2')}`} style={{ animationDelay: '0.1s' }}>
              {t('titleLine1')}<br />
              <span className="text-cyber-glow neon-green">{t('titleLine2')}</span>
            </h1>

            <p className="text-lg sm:text-xl text-cyber-cyan font-mono mb-2 anim-slide-up" style={{ animationDelay: '0.2s' }}>{t('heroVerbs')}</p>

            <p className="text-base text-cyber-muted max-w-2xl mx-auto mb-10 leading-relaxed anim-slide-up" style={{ animationDelay: '0.3s' }}>
              {t('description')}
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-6 anim-slide-up" style={{ animationDelay: '0.4s' }}>
              <form action="/search" method="get" role="search">
                <div className="cmd-bar relative flex items-center bg-cyber-card rounded-lg p-1.5 border border-cyber-border transition-all duration-300 corner-brackets">
                  <div className="pl-4 pr-2 text-cyber-glow"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                  <label htmlFor="heroSearch" className="sr-only">{t('searchPlaceholder')}</label>
                  <input type="text" id="heroSearch" name="q" placeholder={t('searchPlaceholder')} className="flex-1 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono" />
                  <kbd aria-hidden="true">⌘K</kbd>
                  <button type="submit" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"><span>{t('execute')}</span></button>
                </div>
              </form>
              <nav className="flex items-center justify-center gap-2 mt-3 flex-wrap" aria-label="Popular searches">
                <span className="text-[11px] text-cyber-muted font-mono">{t('popular')}</span>
                <Link href="/tools/json-formatter" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree JSON Formatter</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/regex-tester" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree Regex Tester</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/xml-sitemap-generator" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree Sitemap Generator</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/meta-tag-generator" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree Meta Tags</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/jwt-decoder" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree JWT Decoder</Link>
              </nav>
              <small className="block mt-3 text-[10px] text-cyber-dim font-mono">Pro-tip: Press <kbd>Ctrl+Enter</kbd> to process, <kbd>Ctrl+Shift+C</kbd> to copy.</small>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cyber-muted font-mono mt-6 anim-slide-up" style={{ animationDelay: '0.5s' }}>
              <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">⚡</span> {t('heroFeature1')}</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🔒</span> {t('heroFeature2')}</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🖥️</span> {t('heroFeature3')}</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🌱</span> {t('heroFeature4')}</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">💚</span> {t('heroFeature5')}</span>
            </div>

            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-cyber-dim mt-8 anim-slide-up" style={{ animationDelay: '0.6s' }}>
              {t('heroSideLine1')}<br />
              <span className="text-cyber-text">{t('heroSideLine2')}</span>
            </p>
          </div>
        </section>

        {/* METRICS TICKER */}
        <section className="py-5 border-y border-cyber-border bg-cyber-surface" aria-label="Platform metrics">
          <div className="metric-ticker">
            <div className="ticker-track">
              {[...STATS, ...STATS].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 px-8">
                  <span className="text-2xl font-black text-cyber-glow font-cyber neon-green">{stat.value}</span>
                  <span className="text-xs text-cyber-muted font-mono">{t(stat.labelKey as any)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE DEMO */}
        <section className="py-14 px-4" aria-labelledby="playground-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-cyber-glow text-xs font-mono mb-3 neon-box-green">// {t('liveDemoBadge')}</span>
              <h2 id="playground-heading" className="text-2xl font-bold text-cyber-text mb-2">{t('liveDemoTitle')}</h2>
              <p className="text-cyber-muted text-sm font-mono">$ {t('liveDemoDescription')}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot bg-cyber-red" />
                  <div className="terminal-dot bg-cyber-amber" />
                  <div className="terminal-dot bg-cyber-glow" />
                  <span className="text-xs font-mono text-cyber-muted ml-2">xfree@json-formatter ~ $</span>
                  <span className="text-[10px] px-2 py-0.5 rounded badge-local font-mono ml-auto">LOCAL</span>
                </div>
                <div className="p-4">
                  <label htmlFor="demoInput" className="text-[10px] uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">{' > '} Raw Input JSON:</label>
                  <textarea
                    id="demoInput"
                    ref={demoInputRef}
                    onInput={runDemo}
                    defaultValue='{"name":"xfree","type":"micro-tool","fast":true}'
                    className="live-demo-input w-full h-36 bg-cyber-bg border border-cyber-border rounded p-3 text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors font-mono"
                    aria-label="JSON input"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`flex items-center gap-1 text-[10px] font-mono ${demoStatus.valid ? 'text-cyber-glow' : 'text-cyber-red'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${demoStatus.valid ? 'bg-cyber-glow' : 'bg-cyber-red'}`} />
                      {demoStatus.valid ? 'Valid Syntax' : 'Invalid JSON'}
                    </span>
                    <span className="text-[10px] text-cyber-dim">·</span>
                    <span className="text-[10px] text-cyber-muted font-mono">Execution: {demoStatus.time}ms</span>
                  </div>
                </div>
              </div>
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot bg-cyber-red" />
                  <div className="terminal-dot bg-cyber-amber" />
                  <div className="terminal-dot bg-cyber-glow" />
                  <span className="text-xs font-mono text-cyber-muted ml-2">output ~ formatted</span>
                  <button onClick={copyDemo} className="text-[10px] text-cyber-glow hover:text-cyber-text transition-colors flex items-center gap-1 font-mono ml-auto" aria-label="Copy output">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    {demoCopied ? '✓ COPIED' : 'COPY'}
                  </button>
                </div>
                <div className="p-4">
                  <pre className="live-demo-input h-36 bg-cyber-bg border border-cyber-border rounded p-3 text-cyber-glow overflow-auto whitespace-pre-wrap font-mono text-sm" aria-label="JSON output">
                    {demoOutput}
                  </pre>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-cyber-muted font-mono">In-browser · No server</span>
                    <Link href="/tools/json-formatter" className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono">Open Full XFree JSON Formatter →</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="data-line max-w-7xl mx-auto" aria-hidden="true" />

        {/* FEATURED TOOLS */}
        <section className="py-14 px-4 bg-cyber-surface/50" aria-labelledby="featured-heading">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 id="featured-heading" className="text-xl font-bold text-cyber-text font-mono"><span className="text-cyber-glow">$</span> {t('featuredHeading')}</h2>
                <p className="text-sm text-cyber-muted mt-1 font-mono">// {t('featuredSubheading')} <Link href="https://app.xfree.in/" className="text-cyber-cyan hover:text-cyber-text underline focus-ring" rel="noopener">{t('featuredStudioLink')}</Link></p>
              </div>
              <Link href="/tools" className="text-xs text-cyber-glow hover:text-cyber-text font-mono">{t('viewAll')} →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PUBLIC_TOOLS.slice(0, 6).map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="cyber-card p-4 group block focus-ring" aria-label={`XFree ${tool.title}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-sm font-mono font-bold text-cyber-glow group-hover:neon-box-green transition-all">
                      {tool.slug === 'json-formatter' ? '{ }' : tool.slug === 'regex-tester' ? '.*' : '⚡'}
                    </div>
                    {tool.badge && <span className="text-[9px] px-1.5 py-0.5 rounded badge-flagship font-mono">{tool.badge}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-cyber-text mb-1 group-hover:text-cyber-glow font-mono">XFree {tool.title}</h3>
                  <p className="text-xs text-cyber-muted leading-relaxed mb-3">{tool.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyber-dim font-mono">Category: <span className="text-cyber-muted">{tool.category}</span></span>
                    <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">EXEC →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* AD SLOT 1 */}
        <section className="ad-safe-zone px-4" aria-label="Advertisement">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border border-dashed border-cyber-border p-6 text-center bg-cyber-surface/30">
              <div className="text-[10px] text-cyber-dim uppercase tracking-wider mb-3 font-mono">// Advertisement</div>
              <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true" />
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-14 px-4" aria-labelledby="categories-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 id="categories-heading" className="text-2xl font-bold text-cyber-text mb-2 font-mono"><span className="text-cyber-glow">ls</span> {t('categoriesHeading')}</h2>
              <p className="text-cyber-muted font-mono text-sm">// {t('categoriesSubheading')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/categories/${cat.slug}`} className="cyber-card p-4 text-center block focus-ring">
                  <div className="text-2xl mb-2" aria-hidden="true">{cat.icon}</div>
                  <h3 className="text-sm font-semibold text-cyber-text font-mono">{cat.label}</h3>
                  <p className="text-[11px] text-cyber-muted mt-1">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="data-line max-w-7xl mx-auto" aria-hidden="true" />

        {/* WHY XFREE */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="why-heading">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="why-heading" className="text-3xl font-black text-cyber-text mb-3 font-mono"><span className="text-cyber-glow">&gt;</span> {t('whyHeading')}</h2>
              <p className="text-cyber-muted max-w-xl mx-auto font-mono text-sm">// {t('whySubheading')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '🛡️', title: 'Local Mode by Default', color: 'cyber-glow', desc: 'XFree tools process your data inside your browser session using JavaScript and WebAssembly. Each tool page clearly discloses its processing mode. No data is sent to external servers unless explicitly required and labeled.' },
                { icon: '⚡', title: 'Blazing Fast', color: 'cyber-cyan', desc: 'No uploads, no waits. Get instant results every time. Zero network latency for local processing. All computation happens directly in your browser JavaScript engine with WebAssembly optimization.' },
                { icon: '🎯', title: 'One Problem. One Tool.', color: 'cyber-magenta', desc: 'No clutter. No complexity. Just the right XFree tool to get X done. Each tool is focused on a single task, designed for developers who need fast, reliable results.' },
              ].map((item, i) => (
                <article key={i} className="cyber-card p-6 text-center">
                  <div className={`w-14 h-14 rounded-xl bg-${item.color}/5 border border-${item.color}/20 flex items-center justify-center mx-auto mb-4 neon-box-${item.color}`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-cyber-text mb-2 font-mono">XFree <span className={`text-${item.color}`}>{item.title}</span></h3>
                  <p className="text-sm text-cyber-muted">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 px-4" aria-labelledby="how-heading">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 id="how-heading" className="text-3xl font-black text-cyber-text mb-3 font-mono"><span className="text-cyber-glow">./</span>how_xfree_works.sh</h2>
              <p className="text-cyber-muted font-mono text-sm">{t('howHeading')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '01', icon: '🔍', title: 'Search or Browse XFree Tools', desc: 'Find any XFree tool via search, category filters, or pillar hubs.' },
                { step: '02', icon: '⚡', title: 'Paste & Execute in XFree', desc: 'Drop your input — JSON, text, URLs, code — and get results. Processing runs in XFree Local Mode by default within your browser.' },
                { step: '03', icon: '📋', title: 'Copy & Ship with XFree', desc: 'One-click copy to clipboard. Export as file. Your data stays in your local session by default. Close the tab and everything is cleared.' },
              ].map((item, i) => (
                <article key={i} className="cyber-card p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center mx-auto mb-4"><span className="text-2xl">{item.icon}</span></div>
                  <div className="text-xs font-mono text-cyber-glow mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-bold text-cyber-text mb-2 font-mono">{item.title}</h3>
                  <p className="text-sm text-cyber-muted">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* AD SLOT 2 */}
        <section className="ad-safe-zone px-4" aria-label="Advertisement">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border border-dashed border-cyber-border p-6 text-center bg-cyber-surface/30">
              <div className="text-[10px] text-cyber-dim uppercase tracking-wider mb-3 font-mono">// Advertisement</div>
              <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true" />
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="usecases-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded border border-cyber-magenta/30 bg-cyber-magenta/5 text-cyber-magenta text-xs font-mono mb-4">// Popular Workflows</span>
              <h2 id="usecases-heading" className="text-2xl font-bold text-cyber-text mb-2 font-mono">XFree Tool Combinations for Common Tasks</h2>
              <p className="text-cyber-muted font-mono text-sm">// Chain multiple XFree tools together for powerful workflows.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {USE_CASES.map((uc, i) => (
                <div key={i} className="cyber-card p-5">
                  <h3 className="text-base font-bold text-cyber-text mb-3 font-mono">{uc.title}</h3>
                  <p className="text-xs text-cyber-muted mb-3">{uc.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {uc.tools.map((tool, j) => (
                      <span key={j} className="text-[10px] px-2 py-1 rounded bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/20 font-mono">{tool}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className="py-16 px-4" aria-labelledby="pillars-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan text-xs font-mono mb-4 neon-box-cyan">// XFree Knowledge Graph</span>
              <h2 id="pillars-heading" className="text-3xl font-black text-cyber-text mb-3 font-mono">{t('pillarsHeading')}: <span className="text-cyber-glow">{ALL_PILLARS.length}</span> Pillars, <span className="text-cyber-cyan">Approved</span> Discovery Hubs</h2>
              <p className="text-cyber-muted max-w-2xl mx-auto font-mono text-sm">{t('pillarsSubheading')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ALL_PILLARS.slice(0, 12).map((pillar) => (
                <Link key={pillar.slug} href={`/pillars/${pillar.slug}`} className="pillar-card cyber-card p-3.5 block">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-base flex-shrink-0" aria-hidden="true">{pillar.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono text-cyber-glow">#{pillar.num}</span>
                        <span className="text-[9px] text-cyber-dim font-mono">hub</span>
                      </div>
                      <h3 className="text-xs font-semibold text-cyber-text leading-tight truncate font-mono">XFree {pillar.name}</h3>
                      <p className="text-[10px] text-cyber-muted mt-0.5 line-clamp-1">{pillar.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/pillars" className="cyber-btn text-sm px-6 py-3 rounded inline-block"><span>{t('viewAllPillars')} →</span></Link>
            </div>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="py-12 px-4" aria-labelledby="roadmap-heading">
          <div className="max-w-4xl mx-auto text-center">
            <h2 id="roadmap-heading" className="text-2xl font-bold text-cyber-text mb-3 font-mono"><span className="text-cyber-glow">&gt;</span> {t('roadmapHeading')}</h2>
            <p className="text-cyber-muted mb-6 max-w-2xl mx-auto font-mono text-sm">The XFree taxonomy maps a growing catalog of micro-tool concepts. Tools that are not yet built are tracked on our <Link href="/roadmap" className="text-cyber-glow hover:underline focus-ring">public XFree roadmap</Link>.</p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="cyber-card p-3 text-center corner-brackets">
                <div className="text-xl font-bold text-cyber-glow font-cyber neon-green">{ALL_TOOLS.length}</div>
                <div className="text-[10px] text-cyber-muted font-mono">{t('publishedTools')}</div>
              </div>
              <div className="cyber-card p-3 text-center corner-brackets">
                <div className="text-xl font-bold text-cyber-cyan font-cyber neon-cyan">{ALL_PILLARS.length}</div>
                <div className="text-[10px] text-cyber-muted font-mono">{t('pillarHubs')}</div>
              </div>
              <div className="cyber-card p-3 text-center corner-brackets">
                <div className="text-xl font-bold text-cyber-magenta font-cyber neon-magenta">∞</div>
                <div className="text-[10px] text-cyber-muted font-mono">{t('planned')}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="data-line max-w-7xl mx-auto" aria-hidden="true" />

        {/* FAQ */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 id="faq-heading" className="text-3xl font-black text-cyber-text mb-3 font-mono"><span className="text-cyber-glow">man</span> xfree — FAQ</h2>
              <p className="text-cyber-muted font-mono text-sm">// {t('faqHeading')}</p>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <details key={i} className="cyber-card overflow-hidden" open={i === 0}>
                  <summary className="px-5 py-4 font-semibold text-cyber-text text-sm flex justify-between items-center cursor-pointer font-mono">
                    {faq.q}
                  </summary>
                  <div className="px-5 pb-4 text-sm text-cyber-muted leading-relaxed border-t border-cyber-border pt-3">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* AD SLOT 3 */}
        <section className="ad-safe-zone px-4" aria-label="Advertisement">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border border-dashed border-cyber-border p-6 text-center bg-cyber-surface/30">
              <div className="text-[10px] text-cyber-dim uppercase tracking-wider mb-3 font-mono">// Advertisement</div>
              <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 relative overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 matrix-grid opacity-50" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-black text-cyber-text mb-4 font-mono glitch" data-text={t('ctaHeading')}>
              {t('ctaHeading')}
            </h2>
            <p className="text-cyber-muted mb-8 max-w-lg mx-auto font-mono text-sm">// {t('ctaSubheading')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="https://app.xfree.in/" className="cyber-btn cyber-btn-filled text-sm px-8 py-3.5 rounded inline-flex items-center gap-2" rel="noopener">
                <span>{t('ctaLaunch')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/pillars" className="cyber-btn cyber-btn-cyan text-sm px-8 py-3.5 rounded">{t('ctaBrowse')}</Link>
            </div>
            <p className="font-script text-cyber-glow text-2xl sm:text-3xl mt-10 rotate-2 whitespace-pre-line">
              {t('ctaHandwritten')}
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

function NavDropdown({ label, links }: { label: string; links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nav-dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all flex items-center gap-1" aria-haspopup="true" aria-expanded={open}>
        {label} <span aria-hidden="true">▾</span>
      </button>
      {/* Always rendered — visibility is CSS-driven (:hover/:focus-within on
          .nav-dropdown, see globals.css), matching how the mobile menu
          below shows/hides its always-rendered links via a CSS class.
          Gating this behind the `open` state made the menu never appear:
          mouseenter/mouseleave here don't reliably drive React state for a
          CSS-hover interaction, so the panel was permanently empty. */}
      <div className="nav-dropdown-menu" role="menu">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="nav-dropdown-item" role="menuitem">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
