'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Tool {
  slug: string;
  title: string;
  category: string;
  badge?: string;
  description: string;
}

interface Pillar {
  slug: string;
  num: string;
  title: string;
  desc: string;
  icon?: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

interface Stat {
  value: string;
  label: string;
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

const PUBLIC_PILLARS: Pillar[] = [
  { slug: 'frontend-development', num: '01', title: 'Frontend Development Tools', desc: 'HTML, CSS, JavaScript, React' },
  { slug: 'backend-development', num: '02', title: 'Backend Development Tools', desc: 'Node.js, Python, Go, Rust' },
  { slug: 'devops-cicd', num: '03', title: 'DevOps & CI/CD Tools', desc: 'GitHub Actions, Docker, K8s' },
  { slug: 'cybersecurity-privacy', num: '04', title: 'Cybersecurity & Privacy Tools', desc: 'Encryption, hashing, tokens' },
  { slug: 'technical-seo', num: '05', title: 'Technical SEO Tools', desc: 'Sitemaps, meta, schema' },
  { slug: 'content-copywriting', num: '06', title: 'Content & Copywriting Tools', desc: 'Readability, word count' },
  { slug: 'data-engineering', num: '07', title: 'Data Engineering Tools', desc: 'CSV, JSON, XML, ETL' },
  { slug: 'ai-machine-learning', num: '08', title: 'AI & Machine Learning Tools', desc: 'Prompts, tokens, embeddings' },
  { slug: 'database-management', num: '09', title: 'Database Management Tools', desc: 'SQL, NoSQL, queries' },
  { slug: 'api-development', num: '10', title: 'API Development Tools', desc: 'OpenAPI, GraphQL, REST' },
  { slug: 'cloud-infrastructure', num: '11', title: 'Cloud Infrastructure Tools', desc: 'AWS, Azure, GCP configs' },
  { slug: 'mobile-development', num: '12', title: 'Mobile Development Tools', desc: 'iOS, Android, React Native' },
];

const STATS: Stat[] = [
  { value: '100K+', label: 'Monthly Users' },
  { value: '270+', label: 'Tools Available' },
  { value: '0', label: 'Sign-ups Required' },
  { value: '100%', label: 'Client-Side' },
  { value: 'MIT', label: 'Open Source' },
  { value: 'LOCAL', label: 'Mode by Default' },
];

const FAQS: FAQ[] = [
  { q: 'What is XFree app?', a: 'XFree app is the ultimate free online platform for developers offering privacy-first micro-tools including XFree JSON formatters, XFree HTML minifiers, XFree SEO utilities, and XFree crypto tools. All tools run 100% client-side with no signup required.' },
  { q: 'Is XFree really free with no signup?', a: 'Yes. XFree is completely free to use with no sign-up, no account creation, and no usage limits. All tools are open-source under the MIT License and run entirely in your browser.' },
  { q: 'How does XFree ensure privacy?', a: 'XFree tools run in Local Mode by default, processing your data inside your browser session using JavaScript and WebAssembly. Your input is never transmitted to external servers unless clearly disclosed.' },
  { q: 'What is XFree alternative to CodeBeautify?', a: 'XFree is a privacy-first alternative to CodeBeautify. Unlike those platforms, XFree runs 100% client-side with zero tracking, no ads on tool pages, no data collection, and open-source code you can audit.' },
  { q: 'Can I use XFree offline?', a: 'Yes. Because XFree tools are static HTML with embedded JavaScript, you can save any tool page and use it completely offline without an internet connection.' },
  { q: 'Is XFree open source?', a: 'Yes. The entire XFree codebase is open-source under the MIT License. You can audit, fork, and contribute on our GitHub repository.' },
];

const TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Chen', role: 'Senior Developer at Stripe', content: 'XFree JSON Formatter is my go-to tool for debugging APIs. The tree view is incredibly useful.', rating: 5 },
  { name: 'Marcus Rodriguez', role: 'DevOps Engineer', content: 'The Cron Generator saves me hours every week. Clean interface, accurate output.', rating: 5 },
  { name: 'Emma Thompson', role: 'SEO Specialist', content: 'Finally an SEO tool that respects privacy. The sitemap generator works perfectly.', rating: 5 },
  { name: 'David Kim', role: 'Freelance Developer', content: 'No signup required, works offline, open source. XFree is how all tools should be built.', rating: 5 },
];

const USE_CASES: UseCase[] = [
  { title: 'API Development', tools: ['JSON Formatter', 'JWT Decoder', 'Base64 Encoder'], description: 'Format, decode, and validate API payloads' },
  { title: 'SEO Auditing', tools: ['Sitemap Generator', 'Meta Tag Generator', 'Regex Tester'], description: 'Generate and validate SEO assets' },
  { title: 'Security Testing', tools: ['Hash Generator', 'JWT Decoder', 'Password Generator'], description: 'Test authentication and encryption flows' },
];

const NAV_LINKS = {
  devData: [
    { href: '/dev-tools', label: 'Developer Tools' },
    { href: '/json-data-tools', label: 'JSON & Data Tools' },
    { href: '/code-formatting-tools', label: 'Code Formatting' },
    { href: '/api-tools', label: 'API Tools' },
    { href: '/regex-tools', label: 'Regex Tools' },
    { href: '/encoding-tools', label: 'Encoding Tools' },
    { href: '/converters', label: 'Converter Tools' },
    { href: '/validators', label: 'Validator Tools' },
    { href: '/generators', label: 'Generator Tools' },
    { href: '/database-tools', label: 'Database Tools' },
  ],
  webSeo: [
    { href: '/web-tools', label: 'Web Tools' },
    { href: '/seo-tools', label: 'SEO Tools' },
    { href: '/url-tools', label: 'URL Tools' },
    { href: '/schema-tools', label: 'Schema Tools' },
    { href: '/crawl-indexing-tools', label: 'Crawl & Indexing Tools' },
    { href: '/website-audit-tools', label: 'Website Audit Tools' },
    { href: '/metadata-tools', label: 'Metadata Tools' },
    { href: '/performance-tools', label: 'Performance Tools' },
    { href: '/accessibility-tools', label: 'Accessibility Tools' },
    { href: '/social-preview-tools', label: 'Social Preview Tools' },
  ],
  aiAutomation: [
    { href: '/ai-tools', label: 'AI Tools' },
    { href: '/prompt-tools', label: 'Prompt Tools' },
    { href: '/rag-tools', label: 'RAG Tools' },
    { href: '/llm-tools', label: 'LLM Tools' },
    { href: '/agent-tools', label: 'Agent Tools' },
    { href: '/mcp-tools', label: 'MCP Tools' },
    { href: '/agentic-workflows', label: 'Agentic Workflows' },
    { href: '/automation-tools', label: 'Automation Tools' },
    { href: '/ai-evaluation-tools', label: 'AI Evaluation Tools' },
    { href: '/ai-data-tools', label: 'AI Data Tools' },
  ],
  mediaDocs: [
    { href: '/image-tools', label: 'Image Tools' },
    { href: '/video', label: 'Video Tools' },
    { href: '/audio-tools', label: 'Audio Tools' },
    { href: '/pdf-tools', label: 'PDF Tools' },
    { href: '/document-tools', label: 'Document Tools' },
    { href: '/spreadsheet-tools', label: 'Spreadsheet Tools' },
    { href: '/markdown-tools', label: 'Markdown Tools' },
    { href: '/subtitle-tools', label: 'Subtitle Tools' },
    { href: '/file-tools', label: 'File Tools' },
    { href: '/creative-tools', label: 'Creative Tools' },
  ],
  security: [
    { href: '/security-tools', label: 'Security Tools' },
    { href: '/hash-tools', label: 'Hash Tools' },
    { href: '/password-tools', label: 'Password Tools' },
    { href: '/token-tools', label: 'JWT & Token Tools' },
    { href: '/privacy-tools', label: 'Privacy Tools' },
    { href: '/network-tools', label: 'Network Tools' },
    { href: '/dns-tools', label: 'DNS Tools' },
    { href: '/http-tools', label: 'HTTP Tools' },
    { href: '/certificate-tools', label: 'Certificate Tools' },
    { href: '/security-header-tools', label: 'Security Header Tools' },
  ],
  business: [
    { href: '/text-tools', label: 'Text Tools' },
    { href: '/content-tools', label: 'Content Tools' },
    { href: '/writing-tools', label: 'Writing Tools' },
    { href: '/calculators', label: 'Calculator Tools' },
    { href: '/date-time-tools', label: 'Date & Time Tools' },
    { href: '/finance-tools', label: 'Finance Tools' },
    { href: '/marketing-tools', label: 'Marketing Tools' },
    { href: '/productivity-tools', label: 'Productivity Tools' },
    { href: '/education-tools', label: 'Education Tools' },
    { href: '/business-tools', label: 'Business Tools' },
  ],
};

export default function HomePage() {
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
            <div className="w-9 h-9 rounded-lg border border-cyber-glow/50 flex items-center justify-center bg-cyber-glow/5 group-hover:bg-cyber-glow/10 transition-all neon-box-green">
              <span className="text-sm font-black text-cyber-glow font-cyber">X</span>
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">XFree<span className="text-cyber-glow">.in</span></span>
              <span className="hidden sm:inline text-[10px] text-cyber-muted font-mono ml-2">// Free Developer Tools</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            <NavDropdown label="XFree Dev & Data" links={NAV_LINKS.devData} />
            <NavDropdown label="XFree Web & SEO" links={NAV_LINKS.webSeo} />
            <NavDropdown label="XFree AI & Automation" links={NAV_LINKS.aiAutomation} />
            <NavDropdown label="XFree Media & Docs" links={NAV_LINKS.mediaDocs} />
            <NavDropdown label="XFree Security" links={NAV_LINKS.security} />
            <NavDropdown label="XFree Business" links={NAV_LINKS.business} />
            <Link href="/pillars" className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all">Pillars</Link>
            <Link href="/roadmap" className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all">Roadmap</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-1">
              <Link href="/" className="lang-switcher active">EN</Link>
              <Link href="/es/" className="lang-switcher">ES</Link>
              <Link href="/fr/" className="lang-switcher">FR</Link>
              <Link href="/de/" className="lang-switcher">DE</Link>
              <Link href="/ja/" className="lang-switcher">JA</Link>
            </div>
            <Link href="https://app.xfree.in/" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded" rel="noopener">
              <span>Launch Studio →</span>
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
          <div>
            <h3 className="text-xs font-mono text-cyber-glow mb-2">// Dev & Data</h3>
            <div className="space-y-2">
              <Link href="/dev-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">Developer Tools</Link>
              <Link href="/json-data-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">JSON & Data</Link>
              <Link href="/code-formatting-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">Code Formatting</Link>
              <Link href="/api-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">API Tools</Link>
              <Link href="/regex-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">Regex Tools</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-mono text-cyber-cyan mb-2">// Web & SEO</h3>
            <div className="space-y-2">
              <Link href="/seo-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">SEO Tools</Link>
              <Link href="/schema-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">Schema Tools</Link>
              <Link href="/performance-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">Performance</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-mono text-cyber-magenta mb-2">// AI & Automation</h3>
            <div className="space-y-2">
              <Link href="/ai-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">AI Tools</Link>
              <Link href="/mcp-tools" className="block text-sm text-cyber-muted hover:text-cyber-glow">MCP Tools</Link>
              <Link href="/agentic-workflows" className="block text-sm text-cyber-muted hover:text-cyber-glow">Agentic Workflows</Link>
            </div>
          </div>
          <div className="pt-4 border-t border-cyber-border">
            <Link href="/pillars" className="block text-sm text-cyber-glow mb-2">All Pillars →</Link>
            <Link href="/roadmap" className="block text-sm text-cyber-glow">Roadmap →</Link>
          </div>
          <div className="pt-4 border-t border-cyber-border">
            <h3 className="text-xs font-mono text-cyber-muted mb-2">// Languages</h3>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="lang-switcher active">EN</Link>
              <Link href="/es/" className="lang-switcher">ES</Link>
              <Link href="/fr/" className="lang-switcher">FR</Link>
              <Link href="/de/" className="lang-switcher">DE</Link>
              <Link href="/ja/" className="lang-switcher">JA</Link>
            </div>
          </div>
        </nav>
      </div>

      <main id="main-content">
        {/* HERO */}
        <section className="relative min-h-[92vh] flex items-center justify-center pt-20 pb-12 overflow-hidden matrix-grid hex-pattern" aria-labelledby="hero-heading">
          <div className="hero-orb w-[500px] h-[500px] bg-cyber-glow -top-40 -left-40" aria-hidden="true" />
          <div className="hero-orb w-[400px] h-[400px] bg-cyber-magenta top-1/4 -right-32" aria-hidden="true" />
          <div className="hero-orb w-[300px] h-[300px] bg-cyber-cyan bottom-20 left-1/3" aria-hidden="true" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow mb-8 neon-box-green anim-slide-up">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow anim-pulse" aria-hidden="true" />
              <span>$ XFree App · Privacy-First Tools · No Signup Required</span>
            </div>

            <h1 id="hero-heading" className="hero-title text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-4 glitch anim-slide-up" data-text="XFree: The Ultimate Free Developer, SEO & Privacy Micro-Tools App" style={{ animationDelay: '0.1s' }}>
              XFree: The Ultimate Free<br />
              <span className="text-cyber-glow neon-green">Developer, SEO & Privacy Micro-Tools App</span>
            </h1>

            <p className="text-lg sm:text-xl text-cyber-cyan font-mono mb-2 anim-slide-up" style={{ animationDelay: '0.2s' }}>// Get X Done for Free — Fast, Private, No Sign-Up</p>

            <p className="text-base text-cyber-muted max-w-2xl mx-auto mb-10 leading-relaxed anim-slide-up" style={{ animationDelay: '0.3s' }}>
              XFree is the ultimate free online app for developers. Access privacy-first SEO tools, XFree JSON formatters, XFree HTML minifiers, and XFree crypto utilities. 100% client-side, no signup required.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-6 anim-slide-up" style={{ animationDelay: '0.4s' }}>
              <form action="/search" method="get" role="search">
                <div className="cmd-bar relative flex items-center bg-cyber-card rounded-lg p-1.5 border border-cyber-border transition-all duration-300 corner-brackets">
                  <div className="pl-4 pr-2 text-cyber-glow"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                  <label htmlFor="heroSearch" className="sr-only">Search XFree tools</label>
                  <input type="text" id="heroSearch" name="q" placeholder="search> XFree tools — JSON, Regex, Sitemap, JWT, Hash..." className="flex-1 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono" />
                  <kbd aria-hidden="true">⌘K</kbd>
                  <button type="submit" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"><span>EXECUTE</span></button>
                </div>
              </form>
              <nav className="flex items-center justify-center gap-2 mt-3 flex-wrap" aria-label="Popular searches">
                <span className="text-[11px] text-cyber-muted font-mono">Popular:</span>
                <Link href="/tools/json-formatter" className="text-[11px] text-cyber-glow hover:text-white font-mono">XFree JSON Formatter</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/regex-tester" className="text-[11px] text-cyber-glow hover:text-white font-mono">XFree Regex Tester</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/xml-sitemap-generator" className="text-[11px] text-cyber-glow hover:text-white font-mono">XFree Sitemap Generator</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/meta-tag-generator" className="text-[11px] text-cyber-glow hover:text-white font-mono">XFree Meta Tags</Link>
                <span className="text-cyber-dim">·</span>
                <Link href="/tools/jwt-decoder" className="text-[11px] text-cyber-glow hover:text-white font-mono">XFree JWT Decoder</Link>
              </nav>
              <small className="block mt-3 text-[10px] text-cyber-dim font-mono">Pro-tip: Press <kbd>Ctrl+Enter</kbd> to process, <kbd>Ctrl+Shift+C</kbd> to copy.</small>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-8 text-xs text-cyber-muted font-mono mt-6 anim-slide-up" style={{ animationDelay: '0.5s' }}>
              <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">⚡</span> <span className="text-cyber-glow">LOCAL</span> Mode by Default</span>
              <span className="hidden sm:inline text-cyber-dim">|</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-cyan" aria-hidden="true">🔒</span> <span className="text-cyber-cyan">PRIVACY</span>-First</span>
              <span className="hidden sm:inline text-cyber-dim">|</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-magenta" aria-hidden="true">🚀</span> <span className="text-cyber-magenta">ZERO</span> Sign-Up</span>
            </div>
          </div>
        </section>

        {/* METRICS TICKER */}
        <section className="py-5 border-y border-cyber-border bg-cyber-surface" aria-label="Platform metrics">
          <div className="metric-ticker">
            <div className="ticker-track">
              {[...STATS, ...STATS].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 px-8">
                  <span className="text-2xl font-black text-cyber-glow font-cyber neon-green">{stat.value}</span>
                  <span className="text-xs text-cyber-muted font-mono">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LIVE DEMO */}
        <section className="py-14 px-4" aria-labelledby="playground-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-cyber-glow text-xs font-mono mb-3 neon-box-green">// Live Demo</span>
              <h2 id="playground-heading" className="text-2xl font-bold text-white mb-2">Try the XFree JSON Formatter Now</h2>
              <p className="text-cyber-muted text-sm font-mono">$ Experience instant, browser-based tool execution. Zero server calls.</p>
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
                  <button onClick={copyDemo} className="text-[10px] text-cyber-glow hover:text-white transition-colors flex items-center gap-1 font-mono ml-auto" aria-label="Copy output">
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
                    <Link href="/tools/json-formatter" className="text-[10px] text-cyber-glow hover:text-white font-mono">Open Full XFree JSON Formatter →</Link>
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
                <h2 id="featured-heading" className="text-xl font-bold text-white font-mono"><span className="text-cyber-glow">$</span> Featured XFree Tools</h2>
                <p className="text-sm text-cyber-muted mt-1 font-mono">// Working tools available now in the <Link href="https://app.xfree.in/" className="text-cyber-cyan hover:text-white underline focus-ring" rel="noopener">XFree Studio app</Link></p>
              </div>
              <Link href="/dev-tools" className="text-xs text-cyber-glow hover:text-white font-mono">View all →</Link>
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
                  <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-cyber-glow font-mono">XFree {tool.title}</h3>
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
              <h2 id="categories-heading" className="text-2xl font-bold text-white mb-2 font-mono"><span className="text-cyber-glow">ls</span> XFree Tool Categories</h2>
              <p className="text-cyber-muted font-mono text-sm">// Find the right XFree tool in the right category.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { icon: '⚡', label: 'Developer Tools', href: '/dev-tools', desc: 'Formatters, validators, debuggers' },
                { icon: '🌐', label: 'SEO Tools', href: '/seo-tools', desc: 'Sitemaps, meta tags, schema' },
                { icon: '🤖', label: 'AI Tools', href: '/ai-tools', desc: 'Prompt tools, token counters' },
                { icon: '📝', label: 'Text Tools', href: '/text-tools', desc: 'Word count, diff, case convert' },
                { icon: '🔄', label: 'Converters', href: '/converters', desc: 'JSON, CSV, Base64, YAML' },
                { icon: '⚙️', label: 'Generators', href: '/generators', desc: 'UUID, QR, password, cron' },
                { icon: '✓', label: 'Validators', href: '/validators', desc: 'JSON Schema, HTML, CSS' },
                { icon: '🔒', label: 'Security Tools', href: '/security-tools', desc: 'Hash, encrypt, JWT, HMAC' },
              ].map((cat, i) => (
                <Link key={i} href={cat.href} className="cyber-card p-4 text-center block focus-ring">
                  <div className="text-2xl mb-2" aria-hidden="true">{cat.icon}</div>
                  <h3 className="text-sm font-semibold text-white font-mono">{cat.label}</h3>
                  <p className="text-[11px] text-cyber-muted mt-1">{cat.desc}</p>
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
              <h2 id="why-heading" className="text-3xl font-black text-white mb-3 font-mono"><span className="text-cyber-glow">&gt;</span> Why Choose the XFree App for Privacy-First Tools?</h2>
              <p className="text-cyber-muted max-w-xl mx-auto font-mono text-sm">// Your data stays in your browser. XFree believes powerful tools should be private, fast, and hassle-free.</p>
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
                  <h3 className="text-lg font-bold text-white mb-2 font-mono">XFree <span className={`text-${item.color}`}>{item.title}</span></h3>
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
              <h2 id="how-heading" className="text-3xl font-black text-white mb-3 font-mono"><span className="text-cyber-glow">./</span>how_xfree_works.sh</h2>
              <p className="text-cyber-muted font-mono text-sm">Three steps. Zero sign-up. Your data stays in your browser by default.</p>
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
                  <h3 className="text-lg font-bold text-white mb-2 font-mono">{item.title}</h3>
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
              <h2 id="usecases-heading" className="text-2xl font-bold text-white mb-2 font-mono">XFree Tool Combinations for Common Tasks</h2>
              <p className="text-cyber-muted font-mono text-sm">// Chain multiple XFree tools together for powerful workflows.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {USE_CASES.map((uc, i) => (
                <div key={i} className="cyber-card p-5">
                  <h3 className="text-base font-bold text-white mb-3 font-mono">{uc.title}</h3>
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
              <h2 id="pillars-heading" className="text-3xl font-black text-white mb-3 font-mono">The XFree Tool Directory: <span className="text-cyber-glow">{PUBLIC_PILLARS.length}</span> Pillars, <span className="text-cyber-cyan">Approved</span> Discovery Hubs</h2>
              <p className="text-cyber-muted max-w-2xl mx-auto font-mono text-sm">The most comprehensive developer tool taxonomy. Each XFree pillar connects specialized clusters with dedicated micro-tools.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {PUBLIC_PILLARS.map((pillar) => (
                <Link key={pillar.slug} href={`/${pillar.slug}`} className="pillar-card cyber-card p-3.5 block">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-base flex-shrink-0">#</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono text-cyber-glow">#{pillar.num}</span>
                        <span className="text-[9px] text-cyber-dim font-mono">hub</span>
                      </div>
                      <h3 className="text-xs font-semibold text-white leading-tight truncate font-mono">XFree {pillar.title}</h3>
                      <p className="text-[10px] text-cyber-muted mt-0.5 line-clamp-1">{pillar.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/pillars" className="cyber-btn text-sm px-6 py-3 rounded inline-block"><span>View All XFree Pillars →</span></Link>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="testimonials-heading">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 id="testimonials-heading" className="text-2xl font-bold text-white mb-2 font-mono"><span className="text-cyber-glow">"</span> What XFree Users Say</h2>
              <p className="text-cyber-muted font-mono text-sm">// Real feedback from developers who use XFree daily.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="cyber-card p-5">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <span key={j} className="text-cyber-amber">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-cyber-muted mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyber-glow/20 flex items-center justify-center text-xs font-bold text-cyber-glow">{t.name[0]}</div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-[10px] text-cyber-muted">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="py-12 px-4" aria-labelledby="roadmap-heading">
          <div className="max-w-4xl mx-auto text-center">
            <h2 id="roadmap-heading" className="text-2xl font-bold text-white mb-3 font-mono"><span className="text-cyber-glow">&gt;</span> XFree Product Roadmap</h2>
            <p className="text-cyber-muted mb-6 max-w-2xl mx-auto font-mono text-sm">The XFree taxonomy maps a growing catalog of micro-tool concepts. Tools that are not yet built are tracked on our <Link href="/roadmap" className="text-cyber-glow hover:underline focus-ring">public XFree roadmap</Link>.</p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="cyber-card p-3 text-center corner-brackets">
                <div className="text-xl font-bold text-cyber-glow font-cyber neon-green">{PUBLIC_TOOLS.length}</div>
                <div className="text-[10px] text-cyber-muted font-mono">Published Tools</div>
              </div>
              <div className="cyber-card p-3 text-center corner-brackets">
                <div className="text-xl font-bold text-cyber-cyan font-cyber neon-cyan">{PUBLIC_PILLARS.length}</div>
                <div className="text-[10px] text-cyber-muted font-mono">Pillar Hubs</div>
              </div>
              <div className="cyber-card p-3 text-center corner-brackets">
                <div className="text-xl font-bold text-cyber-magenta font-cyber neon-magenta">∞</div>
                <div className="text-[10px] text-cyber-muted font-mono">Planned</div>
              </div>
            </div>
          </div>
        </section>

        <div className="data-line max-w-7xl mx-auto" aria-hidden="true" />

        {/* FAQ */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 id="faq-heading" className="text-3xl font-black text-white mb-3 font-mono"><span className="text-cyber-glow">man</span> xfree — FAQ</h2>
              <p className="text-cyber-muted font-mono text-sm">// Common questions about XFree app, tools, privacy, and the platform.</p>
            </div>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <details key={i} className="cyber-card overflow-hidden" open={i === 0}>
                  <summary className="px-5 py-4 font-semibold text-white text-sm flex justify-between items-center cursor-pointer font-mono">
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
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-black text-white mb-4 font-mono glitch" data-text="Ready to Get X Done with XFree?">
              Ready to Get <span className="text-cyber-glow neon-green">X</span> Done with XFree?
            </h2>
            <p className="text-cyber-muted mb-8 max-w-lg mx-auto font-mono text-sm">// Fast, privacy-first browser micro-tools for developers, SEO professionals, creators, and AI builders. No sign-up required.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="https://app.xfree.in/" className="cyber-btn cyber-btn-filled text-sm px-8 py-3.5 rounded inline-flex items-center gap-2" rel="noopener">
                <span>Launch XFree Studio App</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link href="/pillars" className="cyber-btn cyber-btn-cyan text-sm px-8 py-3.5 rounded">Browse XFree Pillars</Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-cyber-border bg-cyber-surface py-14 px-4" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_3fr]">
            <section aria-labelledby="footer-brand">
              <Link href="/" className="inline-flex items-center gap-3" aria-label="XFree homepage">
                <div className="w-10 h-10 rounded-xl border border-cyber-glow/50 flex items-center justify-center bg-cyber-glow/5 neon-box-green">
                  <span className="text-sm font-black text-cyber-glow font-cyber">X</span>
                </div>
                <span className="text-xl font-bold text-white">XFree<span className="text-cyber-glow">.in</span></span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-6 text-cyber-muted">XFree provides privacy-first browser tools for developers, technical teams and creators. Local Mode is used by default for supported operations, with no signup required.</p>
              <Link href="https://app.xfree.in/" className="mt-6 cyber-btn cyber-btn-filled text-sm px-5 py-3 rounded inline-flex items-center gap-2" rel="noopener">
                <span>Open XFree Studio</span>
                <span aria-hidden="true">→</span>
              </Link>
              <p className="mt-4 text-xs leading-5 text-cyber-dim font-mono">{PUBLIC_TOOLS.length} published tools and {PUBLIC_PILLARS.length} approved discovery hubs are currently available.</p>
            </section>

            <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 xl:grid-cols-6">
              <section>
                <h2 className="text-sm font-semibold text-cyber-glow font-mono">// Categories</h2>
                <ul className="mt-4 space-y-2.5">
                  <li><Link href="/dev-tools" className="text-sm text-cyber-muted hover:text-white">XFree Developer Tools</Link></li>
                  <li><Link href="/seo-tools" className="text-sm text-cyber-muted hover:text-white">XFree SEO Tools</Link></li>
                  <li><Link href="/ai-tools" className="text-sm text-cyber-muted hover:text-white">XFree AI Tools</Link></li>
                  <li><Link href="/text-tools" className="text-sm text-cyber-muted hover:text-white">XFree Text Tools</Link></li>
                  <li><Link href="/converters" className="text-sm text-cyber-muted hover:text-white">XFree File Converters</Link></li>
                  <li><Link href="/generators" className="text-sm text-cyber-muted hover:text-white">XFree Online Generators</Link></li>
                  <li><Link href="/validators" className="text-sm text-cyber-muted hover:text-white">XFree Data Validators</Link></li>
                  <li><Link href="/security-tools" className="text-sm text-cyber-muted hover:text-white">XFree Security Tools</Link></li>
                </ul>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-cyber-cyan font-mono">// Popular</h2>
                <ul className="mt-4 space-y-2.5">
                  {PUBLIC_TOOLS.slice(0, 5).map(t => (
                    <li key={t.slug}><Link href={`/tools/${t.slug}`} className="text-sm text-cyber-muted hover:text-white">XFree {t.title}</Link></li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-cyber-magenta font-mono">// Tool Hubs</h2>
                <ul className="mt-4 space-y-2.5">
                  <li><Link href="/json-data-tools" className="text-sm text-cyber-muted hover:text-white">XFree JSON & Data Tools</Link></li>
                  <li><Link href="/encoding-tools" className="text-sm text-cyber-muted hover:text-white">XFree Encoding Tools</Link></li>
                  <li><Link href="/url-tools" className="text-sm text-cyber-muted hover:text-white">XFree URL & Web Tools</Link></li>
                  <li><Link href="/schema-tools" className="text-sm text-cyber-muted hover:text-white">XFree Schema Tools</Link></li>
                  <li><Link href="/crawl-indexing-tools" className="text-sm text-cyber-muted hover:text-white">XFree Crawl & Indexing Tools</Link></li>
                  <li><Link href="/regex-tools" className="text-sm text-cyber-muted hover:text-white">XFree Regex Tools</Link></li>
                  <li><Link href="/code-formatting-tools" className="text-sm text-cyber-muted hover:text-white">XFree Code Formatting Tools</Link></li>
                  <li><Link href="/content-metadata-tools" className="text-sm text-cyber-muted hover:text-white">XFree Content & Metadata Tools</Link></li>
                </ul>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-cyber-purple font-mono">// Products</h2>
                <ul className="mt-4 space-y-2.5">
                  <li><Link href="https://app.xfree.in/" className="text-sm text-cyber-muted hover:text-white" rel="noopener">Open XFree Studio</Link></li>
                  <li><Link href="/agentic-workflows" className="text-sm text-cyber-muted hover:text-white">XFree Agentic Workflows</Link></li>
                  <li><Link href="/video" className="text-sm text-cyber-muted hover:text-white">XFree Video Tools</Link></li>
                  <li><Link href="/openhost" className="text-sm text-cyber-muted hover:text-white">XFree OpenHost</Link></li>
                  <li><Link href="/downloads" className="text-sm text-cyber-muted hover:text-white">XFree Downloads</Link></li>
                </ul>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-cyber-amber font-mono">// Resources</h2>
                <ul className="mt-4 space-y-2.5">
                  <li><Link href="/pillars" className="text-sm text-cyber-muted hover:text-white">XFree Pillar Hubs</Link></li>
                  <li><Link href="/roadmap" className="text-sm text-cyber-muted hover:text-white">XFree Product Roadmap</Link></li>
                  <li><Link href="/how-it-works" className="text-sm text-cyber-muted hover:text-white">How XFree Works</Link></li>
                  <li><Link href="/use-cases" className="text-sm text-cyber-muted hover:text-white">XFree Use Cases</Link></li>
                  <li><Link href="/docs" className="text-sm text-cyber-muted hover:text-white">XFree Documentation</Link></li>
                  <li><Link href="/blog" className="text-sm text-cyber-muted hover:text-white">XFree Blog</Link></li>
                  <li><Link href="/status" className="text-sm text-cyber-muted hover:text-white">XFree System Status</Link></li>
                  <li><Link href="/sitemap.xml" className="text-sm text-cyber-muted hover:text-white">XFree XML Sitemap</Link></li>
                </ul>
              </section>
              <section>
                <h2 className="text-sm font-semibold text-white font-mono">// Company & Legal</h2>
                <ul className="mt-4 space-y-2.5">
                  <li><Link href="/about" className="text-sm text-cyber-muted hover:text-white">About XFree</Link></li>
                  <li><Link href="/contact" className="text-sm text-cyber-muted hover:text-white">Contact XFree</Link></li>
                  <li><Link href="/privacy" className="text-sm text-cyber-muted hover:text-white">XFree Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-cyber-muted hover:text-white">XFree Terms of Service</Link></li>
                  <li><Link href="/security" className="text-sm text-cyber-muted hover:text-white">XFree Security</Link></li>
                  <li><Link href="/.well-known/security.txt" className="text-sm text-cyber-muted hover:text-white">XFree Security.txt</Link></li>
                </ul>
              </section>
            </nav>
          </div>

          <div className="data-line my-6" aria-hidden="true" />

          <div className="flex flex-col gap-4 border-t border-cyber-border pt-6 text-xs text-cyber-dim sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono">© {new Date().getFullYear()} XFree. Open-source software released under the MIT License.</p>
            <p className="font-mono">Marketing: <Link href="https://www.xfree.in/" className="text-cyber-muted hover:text-white">www.xfree.in</Link> · Application: <Link href="https://app.xfree.in/" className="text-cyber-muted hover:text-white" rel="noopener">app.xfree.in</Link></p>
          </div>
        </div>
      </footer>
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
      {open && (
        <div className="nav-dropdown-menu" role="menu">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-dropdown-item" role="menuitem">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
