import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PILLAR_EDITORIAL, type PillarEditorialContent } from "./data/pillarEditorial";
import {
  PILLARS_60,
  PILLAR_CATEGORIES,
  type PillarDefinition,
  type PillarCategory,
  getRelatedPillars,
} from "./data/pillarRegistry";

/* ════════════════════════════════════════════════════════════════════
   SEO / AEO / GEO — dynamic document meta tag injection
   ════════════════════════════════════════════════════════════════════ */
interface MetaOptions {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
}

function useDocumentMeta(opts: MetaOptions) {
  useEffect(() => {
    if (opts.title && opts.title !== document.title) {
      document.title = opts.title;
    }
    const setTag = (name: string, content: string) => {
      let tag = document.head.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    const setProperty = (name: string, content: string) => {
      let tag = document.head.querySelector(`meta[property="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    if (opts.description) {
      setTag("description", opts.description);
      setProperty("og:description", opts.description);
      const tw = document.head.querySelector('meta[name="twitter:description"]');
      if (tw) tw.setAttribute("content", opts.description);
    }
    if (opts.title) {
      setProperty("og:title", opts.title);
      const tw = document.head.querySelector('meta[name="twitter:title"]');
      if (tw) tw.setAttribute("content", opts.title);
    }
    if (opts.canonical) {
      let canon = document.head.querySelector('link[rel="canonical"]');
      if (!canon) {
        canon = document.createElement("link");
        canon.setAttribute("rel", "canonical");
        document.head.appendChild(canon);
      }
      canon.setAttribute("href", opts.canonical);
    }
    if (opts.noindex) {
      let robots = document.head.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    }
    if (opts.jsonLd && opts.jsonLd.length > 0) {
      document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
      opts.jsonLd.forEach((schema) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      });
    }
  }, [opts]);
}

/* ════════════════════════════════════════════════════════════════════
   Combined pillar data: definition + editorial content
   ════════════════════════════════════════════════════════════════════ */
interface FullPillar {
  def: PillarDefinition;
  editorial: PillarEditorialContent;
}

const ALL_PILLARS: FullPillar[] = PILLARS_60.map((def) => {
  const editorial = PILLAR_EDITORIAL[def.slug] ?? {
    pillarSlug: def.slug,
    directAnswer: def.description,
    purposeAndAudience: def.description,
    useCases: [],
    howProcessingWorks: "",
    supportedInputs: def.keywords,
    supportedOutputs: [],
    localCloudBoundary: "",
    knownLimitations: [],
    troubleshooting: [],
    faq: [],
    relatedPillarSlugs: def.relatedPillarSlugs,
    lastReviewed: def.lastReviewed,
    maintainerNotes: "",
    testedEdgeCases: [],
    verifiedExamples: [],
  };
  return { def, editorial };
}).filter((p) => p.editorial !== undefined);

const PILLAR_BY_SLUG = new Map(ALL_PILLARS.map((p) => [p.def.slug, p]));

const CATEGORIES = PILLAR_CATEGORIES.map((cat) => ({
  ...cat,
  pillars: ALL_PILLARS.filter((p) => p.def.category === cat.id),
  count: ALL_PILLARS.filter((p) => p.def.category === cat.id).length,
}));

const TOOL_COUNT = 47;
const PILLAR_COUNT = ALL_PILLARS.length;

/* ════════════════════════════════════════════════════════════════════
   Components
   ════════════════════════════════════════════════════════════════════ */

const AppLink: React.FC<{ href: string; children: React.ReactNode; className?: string; onClick?: () => void }> = ({
  href,
  children,
  className,
  onClick,
}) => (
  <a
    href={href}
    className={className}
    onClick={(e) => {
      e.preventDefault();
      const path = href.replace(window.location.origin, "");
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
      onClick?.();
    }}
  >
    {children}
  </a>
);

/* ——————————— Header & Navigation ——————————— */
const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileOpen]);

  return (
    <>
      <header className={`sticky-nav fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all ${
        scrolled ? "scrolled" : ""
      }`} role="banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <AppLink href="/" className="flex items-center gap-2.5 group focus-ring" aria-label="XFree homepage">
            <div className="w-9 h-9 rounded-lg border border-cyber-glow/50 flex items-center justify-center bg-cyber-glow/5 group-hover:bg-cyber-glow/10 transition-all neon-box-green">
              <span className="text-sm font-black text-cyber-glow tracking-tighter font-cyber">X</span>
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">XFree<span className="text-cyber-glow">.in</span></span>
              <span className="hidden sm:inline text-[10px] text-cyber-muted font-mono ml-2">// Free Dev Tools</span>
            </div>
          </AppLink>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="nav-dropdown">
                <button
                  className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all focus-ring flex items-center gap-1"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {cat.label} <span aria-hidden="true">▾</span>
                </button>
                <div className="nav-dropdown-menu" role="menu" aria-label={`${cat.label} tools`}>
                  {cat.pillars.map((p) => (
                    <AppLink
                      key={p.def.slug}
                      href={`/pillars/${p.def.slug}`}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={closeMobile}
                    >
                      {p.def.name}
                    </AppLink>
                  ))}
                </div>
              </div>
            ))}
            <AppLink
              href="/pillars"
              className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all focus-ring"
              aria-label="All pillars"
            >
              Pillars
            </AppLink>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-1 lang-switcher-desktop" role="navigation" aria-label="Language selector">
              <a href="/" className="lang-switcher active" aria-label="English">EN</a>
              <a href="/es/" className="lang-switcher" aria-label="Español">ES</a>
              <a href="/fr/" className="lang-switcher" aria-label="Français">FR</a>
              <a href="/pt/" className="lang-switcher" aria-label="Português">PT</a>
              <a href="/de/" className="lang-switcher" aria-label="Deutsch">DE</a>
              <a href="/ja/" className="lang-switcher" aria-label="日本語">JA</a>
            </div>
            <a
              href="https://app.xfree.in/"
              className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded focus-ring"
              rel="noopener"
            >
              <span>Launch Studio →</span>
            </a>
            <button
              className="mobile-menu-btn"
              onClick={toggleMobile}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobileMenu"
            >
              {mobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobileMenu"
        className={`mobile-menu ${mobileOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <button
          className="mobile-menu-btn"
          onClick={closeMobile}
          aria-label="Close menu"
          style={{ position: "absolute", top: "1rem", right: "1rem" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <nav className="mt-12" aria-label="Mobile navigation">
          <div className="space-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <h3 className="text-xs font-mono text-cyber-glow mb-2">{`// ${cat.label.split(" & ")[0]}`}</h3>
                <div className="space-y-2">
                  {cat.pillars.slice(0, 6).map((p) => (
                    <AppLink
                      key={p.def.slug}
                      href={`/pillars/${p.def.slug}`}
                      className="block text-sm text-cyber-muted hover:text-cyber-glow"
                      onClick={closeMobile}
                    >
                      {p.def.name}
                    </AppLink>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-cyber-border">
              <AppLink
                href="/pillars"
                className="block text-sm text-cyber-glow mb-2"
                onClick={closeMobile}
              >
                All Pillars →
              </AppLink>
            </div>
            <div className="pt-4 border-t border-cyber-border">
              <h3 className="text-xs font-mono text-cyber-muted mb-2">// Languages</h3>
              <div className="flex flex-wrap gap-2">
                <a href="/" className="lang-switcher active">EN</a>
                <a href="/es/" className="lang-switcher">ES</a>
                <a href="/fr/" className="lang-switcher">FR</a>
                <a href="/de/" className="lang-switcher">DE</a>
                <a href="/ja/" className="lang-switcher">JA</a>
              </div>
            </div>
          </div>
        </nav>
      </div>
      <div
        className={`mobile-overlay ${mobileOpen ? "open" : ""}`}
        aria-hidden="true"
        onClick={closeMobile}
      />
    </>
  );
};

/* ——————————— Hero ——————————— */
const Hero: React.FC = () => {
  const [input, setInput] = useState('{"name":"xfree","type":"micro-tool","fast":true}');
  const [output, setOutput] = useState(JSON.stringify(JSON.parse('{"name":"xfree","type":"micro-tool","fast":true}'), null, 2));
  const [valid, setValid] = useState(true);
  const [execTime, setExecTime] = useState("0.1");
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const runDemo = useCallback(() => {
    const t0 = performance.now();
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setOutput(formatted);
      setValid(true);
      setExecTime((performance.now() - t0).toFixed(1));
    } catch {
      setOutput("Error: Invalid JSON syntax");
      setValid(false);
      setExecTime("0.0");
    }
  }, [input]);

  useEffect(() => {
    runDemo();
  }, [runDemo]);

  const copyOutput = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleKeydown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runDemo();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      document.getElementById("heroSearch")?.focus();
    }
  };

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center pt-20 pb-12 overflow-hidden matrix-grid hex-pattern"
      aria-labelledby="hero-heading"
    >
      <div className="hero-orb w-[500px] h-[500px] bg-cyber-glow -top-40 -left-40" aria-hidden="true" />
      <div className="hero-orb w-[400px] h-[400px] bg-cyber-magenta top-1/4 -right-32" aria-hidden="true" />
      <div className="hero-orb w-[300px] h-[300px] bg-cyber-cyan bottom-20 left-1/3" aria-hidden="true" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-32 left-[15%] w-1.5 h-1.5 rounded-full bg-cyber-glow/40 anim-float" />
        <div className="absolute top-48 right-[20%] w-2 h-2 rounded-full bg-cyber-cyan/30 anim-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-40 left-[25%] w-1 h-1 rounded-full bg-cyber-magenta/40 anim-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-60 right-[40%] w-1 h-1 rounded-full bg-cyber-glow/30 anim-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <div
          className="anim-slide-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow mb-8 neon-box-green"
          style={{ animationDelay: ".1s" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow anim-pulse" aria-hidden="true" />
          <span>$ XFree App · Privacy-First Tools · No Signup Required</span>
        </div>

        <h1
          id="hero-heading"
          className="hero-title anim-slide-up text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-4 glitch"
          data-text="XFree: The Ultimate Free Developer, SEO & Privacy Micro-Tools App"
          style={{ animationDelay: ".2s" }}
        >
          XFree: The Ultimate Free<br />
          Developer, SEO &amp; <span className="text-cyber-glow neon-green">Privacy Micro-Tools App</span>
        </h1>

        <p className="anim-slide-up text-lg sm:text-xl text-cyber-cyan font-mono mb-2" style={{ animationDelay: ".25s" }}>
          // Get X Done for Free — Fast, Private, No Sign-Up
        </p>

        <p
          className="anim-slide-up text-base text-cyber-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ animationDelay: ".3s" }}
        >
          XFree is the ultimate free online app for developers. Access privacy-first SEO tools,
          JSON formatters, HTML minifiers, and crypto utilities. 100% client-side, no signup required.
        </p>

        {/* Search */}
        <div className="anim-slide-up max-w-2xl mx-auto mb-6" style={{ animationDelay: ".4s" }}>
          <form action="/search" method="get" role="search" onKeyDown={handleKeydown}>
            <div className="cmd-bar relative flex items-center bg-cyber-card rounded-lg p-1.5 border border-cyber-border transition-all duration-300 corner-brackets">
              <div className="pl-4 pr-2 text-cyber-glow" aria-hidden="true">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <label htmlFor="heroSearch" className="sr-only">
                Search XFree tools
              </label>
              <input
                type="text"
                id="heroSearch"
                name="q"
                placeholder="search> XFree tools — JSON, Regex, Sitemap, JWT, Hash..."
                className="flex-1 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex items-center gap-2 pr-2">
                <kbd aria-hidden="true">⌘K</kbd>
                <button type="submit" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded focus-ring">
                  <span>EXECUTE</span>
                </button>
              </div>
            </div>
          </form>
          <nav className="flex items-center justify-center gap-2 mt-3 flex-wrap" aria-label="Popular XFree tool searches">
            <span className="text-[11px] text-cyber-muted font-mono">Popular:</span>
            <AppLink href="/tools/json-formatter" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">XFree JSON Formatter</AppLink>
            <span className="text-cyber-dim" aria-hidden="true">·</span>
            <AppLink href="/tools/regex-tester" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">XFree Regex Tester</AppLink>
            <span className="text-cyber-dim" aria-hidden="true">·</span>
            <AppLink href="/tools/xml-sitemap-generator" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">XFree Sitemap Generator</AppLink>
            <span className="text-cyber-dim" aria-hidden="true">·</span>
            <AppLink href="/tools/meta-tag-generator" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">XFree Meta Tags</AppLink>
            <span className="text-cyber-dim" aria-hidden="true">·</span>
            <AppLink href="/tools/jwt-decoder" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">XFree JWT Decoder</AppLink>
            <span className="text-cyber-dim" aria-hidden="true">·</span>
            <AppLink href="/tools/cron-generator" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">XFree Cron Gen</AppLink>
          </nav>
          <small className="block mt-3 text-[10px] text-cyber-dim font-mono">
            {" "}
            Pro-tip: Press <kbd>Ctrl+Enter</kbd> to process, <kbd>Ctrl+Shift+C</kbd> to copy.
          </small>
        </div>

        <div
          className="anim-slide-up flex items-center justify-center gap-4 sm:gap-8 text-xs text-cyber-muted font-mono mt-6"
          style={{ animationDelay: ".5s" }}
        >
          <span className="flex items-center gap-1.5">
            <span className="text-cyber-glow" aria-hidden="true">⚡</span> <span className="text-cyber-glow">LOCAL</span> Mode by Default
          </span>
          <span className="hidden sm:inline text-cyber-dim" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyber-cyan" aria-hidden="true">🔒</span> <span className="text-cyber-cyan">PRIVACY</span>-First
          </span>
          <span className="hidden sm:inline text-cyber-dim" aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyber-magenta" aria-hidden="true">🚀</span> <span className="text-cyber-magenta">ZERO</span> Sign-Up
          </span>
        </div>
      </div>

      {/* Live JSON demo */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 mt-12">
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
              <label htmlFor="demoInput" className="text-[10px] uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
                &gt; Raw Input JSON:
              </label>
              <textarea
                id="demoInput"
                className="live-demo-input w-full h-36 bg-cyber-bg border border-cyber-border rounded p-3 text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
                aria-label="JSON input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeydown}
              />
              <div className="flex items-center gap-2 mt-2">
                <span className={`flex items-center gap-1 text-[10px] font-mono ${valid ? "text-cyber-glow" : "text-cyber-red"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${valid ? "bg-cyber-glow" : "bg-cyber-red"}`} />{" "}
                  {valid ? "Valid Syntax" : "Invalid JSON"}
                </span>
                <span className="text-[10px] text-cyber-dim">·</span>
                <span className="text-[10px] text-cyber-muted font-mono">Execution: {execTime}ms</span>
              </div>
            </div>
          </div>

          <div className="terminal">
            <div className="terminal-header">
              <div className="terminal-dot bg-cyber-red" />
              <div className="terminal-dot bg-cyber-amber" />
              <div className="terminal-dot bg-cyber-glow" />
              <span className="text-xs font-mono text-cyber-muted ml-2">output ~ formatted</span>
              <button
                id="demoCopyBtn"
                onClick={copyOutput}
                className="text-[10px] text-cyber-glow hover:text-white transition-colors flex items-center gap-1 focus-ring font-mono ml-auto"
                aria-label="Copy output to clipboard"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="copy-label">{copied ? "✓ COPIED" : "COPY"}</span>
              </button>
            </div>
            <div className="p-4">
              <pre
                id="demoOutput"
                className="live-demo-input h-36 bg-cyber-bg border border-cyber-border rounded p-3 text-cyber-glow overflow-auto whitespace-pre-wrap"
                aria-label="JSON output"
              >
                {output}
              </pre>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-cyber-muted font-mono">In-browser · No server</span>
                <AppLink
                  href="/tools/json-formatter"
                  className="text-[10px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono"
                >
                  Open Full XFree JSON Formatter →
                </AppLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ——————————— Metrics Ticker ——————————— */
const MetricsTicker: React.FC = () => {
  const items = [
    { value: TOOL_COUNT.toString(), label: "Published Tools" },
    { value: PILLAR_COUNT.toString(), label: "Pillar Hubs" },
    { value: "LOCAL", label: "Mode by Default" },
    { value: "0", label: "Required Signups" },
    { value: "MIT", label: "XFree Open Source" },
    { value: "FREE", label: "Forever" },
    { value: "BROWSER", label: "Native Execution" },
  ];

  const track = [...items, ...items];

  return (
    <section className="relative py-5 border-y border-cyber-border bg-cyber-surface" aria-label="Platform metrics">
      <div className="metric-ticker">
        <div className="ticker-track">
          {track.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-8">
              <span className="text-2xl font-black text-cyber-glow font-cyber neon-green">{item.value}</span>
              <span className="text-xs text-cyber-muted font-mono">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ——————————— Featured Tools ——————————— */
const featuredTools = [
  { slug: "json-formatter", title: "XFree JSON Formatter", desc: "Format, validate, repair, and minify JSON data with instant tree inspect.", category: "Developer", badge: "✕ FLAGSHIP", badgeClass: "badge-flagship", color: "cyber-glow", href: "/tools/json-formatter" },
  { slug: "regex-tester", title: "XFree Regex Tester", desc: "Test JS regex patterns live with match group tables and replacements.", category: "Developer", badge: "POPULAR", badgeClass: "badge-popular", color: "cyber-cyan", href: "/tools/regex-tester" },
  { slug: "xml-sitemap-generator", title: "XFree Sitemap Generator", desc: "Extract links from HTML and generate Google XML sitemaps with priority.", category: "SEO & URL", badge: "✕ FLAGSHIP", badgeClass: "badge-flagship", color: "cyber-glow", href: "/tools/xml-sitemap-generator" },
  { slug: "meta-tag-generator", title: "XFree Meta Tag Generator", desc: "Generate meta titles, descriptions, and preview social cards.", category: "SEO & URL", badge: "ESSENTIAL", badgeClass: "badge-essential", color: "cyber-magenta", href: "/tools/meta-tag-generator" },
  { slug: "jwt-decoder", title: "XFree JWT Decoder", desc: "Decode OAuth JWT tokens and convert Base64 strings safely.", category: "Security", badge: "POPULAR", badgeClass: "badge-popular", color: "cyber-cyan", href: "/tools/jwt-decoder" },
  { slug: "cron-generator", title: "XFree Cron Generator", desc: "Generate cron expressions the easy way with human-readable output.", category: "Developer", badge: "NEW", badgeClass: "badge-new", color: "cyber-purple", href: "/tools/cron-generator" },
];

const FeaturedTools: React.FC = () => (
  <section className="py-14 px-4 bg-cyber-surface/50" aria-labelledby="featured-heading">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 id="featured-heading" className="text-xl font-bold text-white font-mono">
            <span className="text-cyber-glow">$</span> Featured XFree Tools
          </h2>
          <p className="text-sm text-cyber-muted mt-1 font-mono">
            // Working tools available now in the{" "}
            <a href="https://app.xfree.in/" className="text-cyber-cyan hover:text-white underline focus-ring" rel="noopener">
              XFree Studio app
            </a>
          </p>
        </div>
        <a href="/dev-tools" className="text-xs text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
          View all →
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {featuredTools.map((tool) => (
          <a
            key={tool.slug}
            href={tool.href}
            className={`pillar-card cyber-card p-4 group block focus-ring`}
            aria-label={tool.title}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg bg-${tool.color}/5 border border-${tool.color}/20 flex items-center justify-center text-sm font-mono font-bold text-${tool.color} group-hover:neon-box-green transition-all`}
              >
                {tool.slug === "json-formatter" ? "{ }" : tool.slug === "regex-tester" ? ".*" : tool.slug === "xml-sitemap-generator" ? "🗺️" : tool.slug === "meta-tag-generator" ? "🏷️" : tool.slug === "jwt-decoder" ? "" : "⏰"}
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${tool.badgeClass} font-mono`}>{tool.badge}</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-cyber-glow transition-colors font-mono">{tool.title}</h3>
            <p className="text-xs text-cyber-muted leading-relaxed mb-3">{tool.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyber-dim font-mono">
                Category: <span className="text-cyber-muted">{tool.category}</span>
              </span>
              <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">EXEC →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  </section>
);

/* ——————————— Categories Grid ——————————— */
const CategoriesSection: React.FC = () => (
  <section className="py-14 px-4" aria-labelledby="categories-heading">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 id="categories-heading" className="text-2xl font-bold text-white mb-2 font-mono">
          <span className="text-cyber-glow">ls</span> Tool Categories
        </h2>
        <p className="text-cyber-muted font-mono text-sm">Find the right tool in the right category.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.id}
            href={`/${cat.id}`}
            className="cyber-card p-4 text-center block focus-ring"
            aria-label={cat.label}
          >
            <div className="text-2xl mb-2" aria-hidden="true">{cat.icon}</div>
            <h3 className="text-sm font-semibold text-white font-mono">{cat.label}</h3>
            <p className="text-[11px] text-cyber-muted mt-1">{cat.description}</p>
          </a>
        ))}
      </div>
    </div>
  </section>
);

/* ——————————— Why XFree ——————————— */
const WhyXFree: React.FC = () => (
  <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="why-heading">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 id="why-heading" className="text-3xl font-black text-white mb-3 font-mono">
          <span className="text-cyber-glow">{'>'}</span> Why Choose the XFree App for Privacy-First Tools?
        </h2>
        <p className="text-cyber-muted max-w-xl mx-auto font-mono text-sm">
          Your data stays in your browser. XFree believes powerful tools should be private, fast, and hassle-free.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="cyber-card p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center mx-auto mb-4 neon-box-green">
            <span className="text-2xl" aria-hidden="true">🛡️</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono">
            XFree <span className="text-cyber-glow">Local Mode</span> by Default
          </h3>
          <p className="text-sm text-cyber-muted">
            Process your data inside your browser using JavaScript and WebAssembly. No data leaves your device.
          </p>
        </article>
        <article className="cyber-card p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-cyber-cyan/5 border border-cyber-cyan/20 flex items-center justify-center mx-auto mb-4 neon-box-cyan">
            <span className="text-2xl" aria-hidden="true">⚡</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono">
            XFree <span className="text-cyber-cyan">Blazing Fast</span>
          </h3>
          <p className="text-sm text-cyber-muted">No uploads, no waits. Zero network latency for local processing.</p>
        </article>
        <article className="cyber-card p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-cyber-magenta/5 border border-cyber-magenta/20 flex items-center justify-center mx-auto mb-4 neon-box-magenta">
            <span className="text-2xl" aria-hidden="true">🎯</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono">
            XFree <span className="text-cyber-magenta">One Problem.</span> One Tool.
          </h3>
          <p className="text-sm text-cyber-muted">No clutter. No complexity. Just the right tool to get X done.</p>
        </article>
      </div>
    </div>
  </section>
);

/* ——————————— How It Works ——————————— */
const HowItWorks: React.FC = () => (
  <section className="py-16 px-4" aria-labelledby="how-heading">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 id="how-heading" className="text-3xl font-black text-white mb-3 font-mono">
          <span className="text-cyber-glow">./</span>how_xfree_works.sh
        </h2>
        <p className="text-cyber-muted font-mono text-sm">Three steps. Zero sign-up. Your data stays in your browser.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="cyber-card p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl" aria-hidden="true">🔍</span>
          </div>
          <div className="text-xs font-mono text-cyber-glow mb-2">STEP 01</div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono">Search or Browse XFree Tools</h3>
          <p className="text-sm text-cyber-muted">
            Find any tool via search, category filters, or pillar hubs. Browse{" "}
            <a href="/dev-tools" className="text-cyber-glow hover:underline focus-ring">categories</a> or explore{" "}
            <a href="/pillars" className="text-cyber-glow hover:underline focus-ring">pillar hubs</a>.
          </p>
        </article>
        <article className="cyber-card p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-cyber-cyan/5 border border-cyber-cyan/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl" aria-hidden="true">⚡</span>
          </div>
          <div className="text-xs font-mono text-cyber-cyan mb-2">STEP 02</div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono">Paste &amp; Execute in XFree</h3>
          <p className="text-sm text-cyber-muted">Drop your input — JSON, text, URLs, code — and get results. Processing runs in LOCAL Mode by default.</p>
        </article>
        <article className="cyber-card p-6 text-center">
          <div className="w-14 h-14 rounded-xl bg-cyber-magenta/5 border border-cyber-magenta/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl" aria-hidden="true">📋</span>
          </div>
          <div className="text-xs font-mono text-cyber-magenta mb-2">STEP 03</div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono">Copy &amp; Ship with XFree</h3>
          <p className="text-sm text-cyber-muted">One-click copy to clipboard. Export as file. Data stays in your local session.</p>
        </article>
      </div>
    </div>
  </section>
);

/* ——————————— Pillars Directory ——————————— */
const PillarsDirectory: React.FC<{ onSelect: (slug: string) => void }> = ({ onSelect }) => {
  const gridItems = ALL_PILLARS.map((p) => ({
    slug: p.def.slug,
    num: p.def.num,
    title: p.def.name,
    desc: p.def.tagline,
    emoji: p.def.emoji,
    category: p.def.category,
    categoryLabel: CATEGORIES.find((c) => c.id === p.def.category)?.label ?? p.def.category,
  }));

  return (
    <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="pillars-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 rounded border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan text-xs font-mono mb-4 neon-box-cyan">
            // XFree Knowledge Graph
          </span>
          <h2 id="pillars-heading" className="text-3xl font-black text-white mb-3 font-mono">
            The XFree Tool Directory: <span className="text-cyber-glow">{PILLAR_COUNT}</span> Pillars, <span className="text-cyber-cyan">Approved</span> Discovery Hubs
          </h2>
          <p className="text-cyber-muted max-w-2xl mx-auto font-mono text-sm">
            The most comprehensive developer tool taxonomy. Each pillar connects specialized clusters with dedicated micro-tools.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {gridItems.map((p) => (
            <button
              key={p.slug}
              onClick={() => onSelect(p.slug)}
              className="pillar-card cyber-card p-3.5 block w-full text-left focus-ring"
              aria-label={p.title}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-base flex-shrink-0" aria-hidden="true">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono text-cyber-glow">#{p.num}</span>
                    <span className="text-[9px] text-cyber-dim font-mono">{p.categoryLabel}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-white leading-tight font-mono truncate">{p.title}</h3>
                  <p className="text-[10px] text-cyber-muted mt-0.5 line-clamp-2">{p.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ——————————— Category Hub ——————————— */
const CategoryHub: React.FC<{ categoryId: string; onBack: () => void; onSelect: (slug: string) => void }> = ({
  categoryId,
  onBack,
  onSelect,
}) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;

  return (
    <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby={`cat-${cat.id}`}>
      <div className="max-w-7xl mx-auto">
        <button onClick={onBack} className="cyber-btn text-xs px-4 py-2 mb-4 rounded focus-ring">
          ← Back to All Categories
        </button>
        <div className="text-center mb-10">
          <h2 id={`cat-${cat.id}`} className="text-3xl font-black text-white mb-3 font-mono">
            <span className="text-cyber-glow">{cat.icon}</span> {cat.label}
          </h2>
          <p className="text-cyber-muted font-mono text-sm">{cat.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cat.pillars.map((p) => (
            <a
              key={p.def.slug}
              href={`/pillars/${p.def.slug}`}
              className="pillar-card cyber-card p-4 block focus-ring"
              aria-label={p.def.name}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-base flex-shrink-0" aria-hidden="true">
                  {p.def.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1 font-mono">{p.def.name}</h3>
                  <p className="text-xs text-cyber-muted leading-relaxed">{p.def.tagline}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ——————————— Pillar Detail Page ——————————— */
const PillarDetail: React.FC<{ slug: string; onBack: () => void }> = ({ slug, onBack }) => {
  const full = PILLAR_BY_SLUG.get(slug);
  if (!full) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Pillar not found</h2>
          <p className="text-cyber-muted">The pillar <code className="text-cyber-glow">{slug}</code> does not exist.</p>
          <button onClick={onBack} className="cyber-btn cyber-btn-cyan mt-4 text-sm px-6 py-2 rounded focus-ring">
            ← Back to pillars
          </button>
        </div>
      </section>
    );
  }

  const { def, editorial } = full;

  const pageTitle = `${def.name} — XFree.in`;
  const pageDesc = editorial.directAnswer.slice(0, 160);
  const canonical = `https://www.xfree.in/pillars/${def.slug}`;
  const breadcrumbs = [
    { name: "Home", url: "https://www.xfree.in/" },
    { name: "Pillars", url: "https://www.xfree.in/pillars" },
    { name: def.name, url: canonical },
  ];

  useDocumentMeta({
    title: pageTitle,
    description: pageDesc,
    canonical,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: def.name,
        description: pageDesc,
        url: canonical,
        dateModified: editorial.lastReviewed,
        publisher: { "@type": "Organization", name: "XFree", url: "https://www.xfree.in/" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: editorial.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  });

  const related = getRelatedPillars(def);
  const relatedEditorials = related.map((r) => PILLAR_EDITORIAL[r.slug]).filter((e): e is PillarEditorialContent => !!e);

  return (
    <article className="prose prose-invert max-w-3xl mx-auto py-12 px-4">
      <div className="cyber-card p-6 sm:p-9 rounded-xl mb-8">
        <button onClick={onBack} className="cyber-btn text-xs px-4 py-2 mb-4 rounded focus-ring">
          ← Back to pillars
        </button>

        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-3xl" aria-hidden="true">
              {def.emoji}
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-cyber-glow text-xs font-mono mb-2 neon-box-green">
                #{def.num} · pillar
              </span>
              <h1 className="text-3xl font-black text-white font-mono">{def.name}</h1>
            </div>
          </div>
          <p className="text-cyber-cyan font-mono text-sm">// {def.tagline}</p>
        </header>

        <p className="text-lg text-cyber-text leading-relaxed mb-6">{editorial.directAnswer}</p>

        <div className="space-y-8">
          {/* Purpose and Audience */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-glow">{'>'}</span> Purpose &amp; Audience
            </h2>
            <p className="text-cyber-muted leading-relaxed">{editorial.purposeAndAudience}</p>
          </section>

          {/* Use Cases */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-cyan">★</span> Use Cases
            </h2>
            <ul className="space-y-3">
              {editorial.useCases.map((uc) => (
                <li key={uc.title} className="cyber-card p-3 border border-cyber-border rounded-lg">
                  <span className="text-sm font-semibold text-white font-mono">{uc.title}</span>
                  <p className="text-sm text-cyber-muted mt-1">{uc.description}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* How Processing Works */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-magenta">{'>'}</span> How Processing Works
            </h2>
            <p className="text-cyber-muted leading-relaxed">{editorial.howProcessingWorks}</p>
          </section>

          {/* Supported Inputs */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-glow">{'input>'}</span> Supported Inputs
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {editorial.supportedInputs.map((input) => (
                <li key={input} className="text-sm text-cyber-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow" /> {input}
                </li>
              ))}
            </ul>
          </section>

          {/* Supported Outputs */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-glow">{'output>'}</span> Supported Outputs
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {editorial.supportedOutputs.map((output) => (
                <li key={output} className="text-sm text-cyber-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" /> {output}
                </li>
              ))}
            </ul>
          </section>

          {/* Local/Cloud Boundary */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-cyan">☁️</span> Local vs Cloud Boundary
            </h2>
            <p className="text-cyber-muted leading-relaxed">{editorial.localCloudBoundary}</p>
          </section>

          {/* Known Limitations */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-magenta">⚠</span> Known Limitations
            </h2>
            <ul className="space-y-2">
              {editorial.knownLimitations.map((limitation, i) => (
                <li key={i} className="text-sm text-cyber-muted flex items-start gap-2">
                  <span className="text-cyber-magenta flex-shrink-0">•</span> {limitation}
                </li>
              ))}
            </ul>
          </section>

          {/* Troubleshooting */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-glow">?</span> Troubleshooting
            </h2>
            <div className="space-y-4">
              {editorial.troubleshooting.map((t, i) => (
                <details key={i} className="cyber-card details">
                  <summary className="px-4 py-3 font-semibold text-white text-sm focus-ring">{t.issue}</summary>
                  <div className="px-4 pb-4 text-sm text-cyber-muted leading-relaxed border-t border-cyber-border pt-3">
                    {t.resolution}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Verified Examples */}
          {editorial.verifiedExamples.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white font-mono mb-3">
                <span className="text-cyber-cyan">✓</span> Verified Examples
              </h2>
              <div className="space-y-4">
                {editorial.verifiedExamples.map((ex, i) => (
                  <details key={i} className="cyber-card details">
                    <summary className="px-4 py-3 font-semibold text-white text-sm focus-ring">
                      {ex.title}
                    </summary>
                    <div className="px-4 pb-4 text-sm text-cyber-muted leading-relaxed border-t border-cyber-border pt-3">
                      <p className="mb-2"><strong>Input:</strong></p>
                      <pre className="bg-cyber-bg border border-cyber-border rounded p-3 text-xs text-cyber-glow overflow-x-auto mb-2">{ex.input}</pre>
                      <p className="mb-2"><strong>Expected:</strong></p>
                      <pre className="bg-cyber-bg border border-cyber-border rounded p-3 text-xs text-cyber-glow overflow-x-auto">{ex.expected}</pre>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-glow">man</span> Editorial FAQ
            </h2>
            <div className="space-y-2">
              {editorial.faq.map((f, i) => (
                <details key={i} className="cyber-card details">
                  <summary className="px-4 py-3 font-semibold text-white text-sm focus-ring">{f.question}</summary>
                  <div className="px-4 pb-4 text-sm text-cyber-muted leading-relaxed border-t border-cyber-border pt-3">
                    {f.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Tested Edge Cases */}
          {editorial.testedEdgeCases.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white font-mono mb-3">
                <span className="text-cyber-magenta">🧪</span> Tested Edge Cases
              </h2>
              <ul className="space-y-2">
                {editorial.testedEdgeCases.map((edge, i) => (
                  <li key={i} className="text-sm text-cyber-muted flex items-start gap-2">
                    <span className="text-cyber-magenta flex-shrink-0">•</span> {edge}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Maintainer Notes */}
          {editorial.maintainerNotes && (
            <section>
              <h2 className="text-xl font-bold text-white font-mono mb-3">
                <span className="text-cyber-dim">🔧</span> Maintainer Notes
              </h2>
              <p className="text-sm text-cyber-dim leading-relaxed">{editorial.maintainerNotes}</p>
            </section>
          )}

          {/* Related Pillars */}
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-cyan">🔗</span> Related Pillars
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedEditorials.map((e) => {
                const rp = PILLARS_60.find((p) => p.slug === e.pillarSlug);
                if (!rp) return null;
                return (
                  <a
                    key={e.pillarSlug}
                    href={`/pillars/${e.pillarSlug}`}
                    className="cyber-btn cyber-btn-cyan text-xs px-4 py-2 rounded focus-ring"
                  >
                    <span>{rp.name} →</span>
                  </a>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
};

/* ——————————— FAQ Section ——————————— */
const faqItems = [
  { question: "What is XFree app?", answer: "XFree app is the ultimate free online platform for developers offering privacy-first micro-tools including JSON formatters, HTML minifiers, SEO utilities, and crypto tools. All tools run 100% client-side with no signup required." },
  { question: "Is XFree really free with no signup?", answer: "Yes. XFree is completely free to use with no sign-up, no account creation, and no usage limits. All tools are open-source under the MIT License and run entirely in your browser." },
  { question: "How does XFree ensure privacy?", answer: "XFree tools run in Local Mode by default, processing your data inside your browser session using JavaScript and WebAssembly. Your input is never transmitted to external servers unless clearly disclosed." },
  { question: "What is XFree alternative to CodeBeautify?", answer: "XFree is a privacy-first alternative to CodeBeautify and similar tools. Unlike those platforms, XFree runs 100% client-side with zero tracking, no ads on tool pages, no data collection, and open-source code you can audit." },
  { question: "Can I use XFree offline?", answer: "Yes. Because XFree tools are static HTML with embedded JavaScript, you can save any tool page and use it completely offline without an internet connection." },
  { question: "Is XFree open source?", answer: "Yes. The entire XFree codebase is open-source under the MIT License. You can audit, fork, and contribute on our GitHub repository." },
  { question: "How many tools are on XFree?", answer: "XFree currently publishes a growing catalog organized across approved pillar categories and topic clusters. The exact count is displayed dynamically on the homepage." },
  { question: "What is XFree JSON formatter online?", answer: "The XFree JSON Formatter online is a free, privacy-first tool that beautifies, minifies, validates, and repairs JSON data instantly in your browser." },
];

const FAQSection: React.FC = () => (
  <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="faq-heading">
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 id="faq-heading" className="text-3xl font-black text-white mb-3 font-mono">
          <span className="text-cyber-glow">man</span> xfree — FAQ
        </h2>
        <p className="text-cyber-muted font-mono text-sm">Common questions about XFree app, tools, privacy, and the platform.</p>
      </div>
      <div className="space-y-2">
        {faqItems.map((f, i) => (
          <details key={i} className="cyber-card details overflow-hidden" open={i === 0}>
            <summary className="px-5 py-4 font-semibold text-white text-sm flex justify-between items-center focus-ring font-mono">
              {f.question}
            </summary>
            <div className="px-5 pb-4 text-sm text-cyber-muted leading-relaxed border-t border-cyber-border pt-3">
              {f.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  </section>
);

/* ——————————— CTA Section ——————————— */
const CTASection: React.FC = () => (
  <section className="py-16 px-4 relative overflow-hidden" aria-labelledby="cta-heading">
    <div className="absolute inset-0 matrix-grid opacity-50" aria-hidden="true" />
    <div className="relative max-w-3xl mx-auto text-center">
      <h2 id="cta-heading" className="text-3xl sm:text-4xl font-black text-white mb-4 font-mono glitch" data-text="Ready to Get X Done with XFree?">
        Ready to Get <span className="text-cyber-glow neon-green">X</span> Done with XFree?
      </h2>
      <p className="text-cyber-muted mb-8 max-w-lg mx-auto font-mono text-sm">
        Fast, privacy-first browser micro-tools for developers, SEO professionals, creators, and AI builders.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="https://app.xfree.in/"
          className="cyber-btn cyber-btn-filled text-sm px-8 py-3.5 rounded focus-ring inline-flex items-center gap-2"
          rel="noopener"
        >
          <span>Launch XFree Studio App</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <a href="/pillars" className="cyber-btn cyber-btn-cyan text-sm px-8 py-3.5 rounded focus-ring inline-block">
          <span>Browse XFree Pillars</span>
        </a>
      </div>
    </div>
  </section>
);

/* ——————————— Footer ——————————— */
const Footer: React.FC = () => {
  const [year] = useState(() => new Date().getFullYear());
  const footerPopularTools = ["json-formatter", "regex-tester", "xml-sitemap-generator", "meta-tag-generator", "jwt-decoder", "cron-generator"];

  return (
    <footer className="border-t border-cyber-border bg-cyber-surface py-14 px-4" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_3fr]">
          <section aria-labelledby="footer-brand">
            <a href="/" className="inline-flex items-center gap-3" aria-label="XFree homepage">
              <div className="w-10 h-10 rounded-xl border border-cyber-glow/50 flex items-center justify-center bg-cyber-glow/5 neon-box-green">
                <span className="text-sm font-black text-cyber-glow font-cyber">X</span>
              </div>
              <span id="footer-brand" className="text-xl font-bold text-white">XFree<span className="text-cyber-glow">.in</span></span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-6 text-cyber-muted">
              XFree provides privacy-first browser tools for developers, technical teams and creators.
              Local Mode is used by default for supported operations, with no signup required.
            </p>
            <a
              href="https://app.xfree.in/"
              className="mt-6 cyber-btn cyber-btn-filled text-sm px-5 py-3 rounded focus-ring inline-flex items-center gap-2"
              rel="noopener"
            >
              <span>Open XFree Studio</span>
              <span aria-hidden="true" className="ml-1">→</span>
            </a>
            <p className="mt-4 text-xs leading-5 text-cyber-dim font-mono">
              {TOOL_COUNT} published tools and {PILLAR_COUNT} approved discovery hubs are available.
            </p>
          </section>

          <nav aria-label="XFree footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 xl:grid-cols-6">
            <section aria-labelledby="footer-categories">
              <h2 id="footer-categories" className="text-sm font-semibold text-cyber-glow font-mono">// Categories</h2>
              <ul className="mt-4 space-y-2.5">
                <li><a href="/dev-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Developer Tools</a></li>
                <li><a href="/seo-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree SEO Tools</a></li>
                <li><a href="/ai-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree AI Tools</a></li>
                <li><a href="/text-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Text Tools</a></li>
                <li><a href="/converters" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree File Converters</a></li>
                <li><a href="/generators" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Generators</a></li>
                <li><a href="/validators" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Data Validators</a></li>
                <li><a href="/security-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Security Tools</a></li>
              </ul>
            </section>

            <section aria-labelledby="footer-popular">
              <h2 id="footer-popular" className="text-sm font-semibold text-cyber-cyan font-mono">// Popular</h2>
              <ul className="mt-4 space-y-2.5">
                {footerPopularTools.map((slug) => {
                  const def = PILLARS_60.find((p) => p.slug === slug);
                  return (
                    <li key={slug}>
                      <a href={`/tools/${slug}`} className="text-sm text-cyber-muted transition-colors hover:text-white">
                        XFree {def?.name ?? slug}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="footer-hubs">
              <h2 id="footer-hubs" className="text-sm font-semibold text-cyber-magenta font-mono">// Tool Hubs</h2>
              <ul className="mt-4 space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <a href={`/${cat.id}`} className="text-sm text-cyber-muted transition-colors hover:text-white">{cat.label}</a>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="footer-products">
              <h2 id="footer-products" className="text-sm font-semibold text-cyber-purple font-mono">// Products</h2>
              <ul className="mt-4 space-y-2.5">
                <li><a href="https://app.xfree.in/" className="text-sm text-cyber-muted transition-colors hover:text-white" rel="noopener">Open XFree Studio</a></li>
                <li><a href="/agentic-workflows" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Agentic Workflows</a></li>
                <li><a href="/video" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Video Tools</a></li>
                <li><a href="/openhost" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree OpenHost</a></li>
                <li><a href="/downloads" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Downloads</a></li>
              </ul>
            </section>

            <section aria-labelledby="footer-resources">
              <h2 id="footer-resources" className="text-sm font-semibold text-cyber-amber font-mono">// Resources</h2>
              <ul className="mt-4 space-y-2.5">
                <li><a href="/pillars" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Pillar Hubs</a></li>
                <li><a href="/roadmap" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Product Roadmap</a></li>
                <li><a href="/how-it-works" className="text-sm text-cyber-muted transition-colors hover:text-white">How XFree Works</a></li>
                <li><a href="/use-cases" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Use Cases</a></li>
                <li><a href="/docs" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Documentation</a></li>
                <li><a href="/blog" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Blog</a></li>
                <li><a href="/status" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree System Status</a></li>
                <li><a href="/sitemap.xml" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree XML Sitemap</a></li>
              </ul>
            </section>

            <section aria-labelledby="footer-legal">
              <h2 id="footer-legal" className="text-sm font-semibold text-white font-mono">// Company &amp; Legal</h2>
              <ul className="mt-4 space-y-2.5">
                <li><a href="/about" className="text-sm text-cyber-muted transition-colors hover:text-white">About XFree</a></li>
                <li><a href="/contact" className="text-sm text-cyber-muted transition-colors hover:text-white">Contact XFree</a></li>
                <li><a href="/privacy" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Privacy Policy</a></li>
                <li><a href="/terms" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Terms of Service</a></li>
                <li><a href="/security" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Security</a></li>
                <li><a href="/.well-known/security.txt" className="text-sm text-cyber-muted transition-colors hover:text-white">XFree Security.txt</a></li>
              </ul>
            </section>
          </nav>
        </div>

        <div className="data-line my-6" aria-hidden="true" />

        <div className="flex flex-col gap-4 border-t border-cyber-border pt-6 text-xs text-cyber-dim sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">© {year} XFree. Open-source software released under the MIT License.</p>
          <p className="font-mono">
            Marketing: <a href="https://www.xfree.in/" className="text-cyber-muted hover:text-white">www.xfree.in</a> ·
            Application: <a href="https://app.xfree.in/" className="text-cyber-muted hover:text-white" rel="noopener">app.xfree.in</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

/* ——————————— Ad Slot ——————————— */
const AdSlot: React.FC<{ label?: string }> = ({ label = "Advertisement" }) => (
  <section className="ad-safe-zone px-4" aria-label={label}>
    <div className="max-w-7xl mx-auto">
      <div className="rounded-lg border border-dashed border-cyber-border p-6 text-center bg-cyber-surface/30">
        <div className="text-[10px] text-cyber-dim uppercase tracking-wider mb-3 font-mono">
          // {label}
        </div>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  </section>
);

/* ════════════════════════════════════════════════════════════════════
   Main App Component
   ════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  }, []);

  /* Route parsing */
  const route = useMemo(() => {
    const path = currentPath.replace(/\/$/, "") || "/";
    if (path === "/") return { type: "home" as const };
    if (path === "/pillars") return { type: "pillars-list" as const };
    const pillarMatch = path.match(/^\/pillars\/(.+)$/);
    if (pillarMatch && PILLAR_BY_SLUG.has(pillarMatch[1])) {
      return { type: "pillar-detail" as const, slug: pillarMatch[1] };
    }
    const catMatch = CATEGORIES.find((c) => path === `/${c.id}`);
    if (catMatch) return { type: "category-hub" as const, categoryId: catMatch.id };
    return { type: "not-found" as const };
  }, [currentPath]);

  /* Homepage SEO */
  useDocumentMeta({
    title: "XFree App: Free Developer, SEO & Privacy Micro-Tools | No Signup",
    description: "XFree is the ultimate free online app for developers. Access privacy-first SEO tools, JSON formatters, HTML minifiers, and crypto utilities. 100% client-side, no signup required.",
    canonical: "https://www.xfree.in/",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "XFree",
        url: "https://www.xfree.in",
        logo: { "@type": "ImageObject", url: "https://www.xfree.in/logo.png", width: 1200, height: 630 },
        description: "XFree is the ultimate free online app for developers offering privacy-first micro-tools.",
        license: "https://opensource.org/licenses/MIT",
        sameAs: ["https://github.com/xfree-in/xfree", "https://twitter.com/xfreein"],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.xfree.in/" },
          { "@type": "ListItem", position: 2, name: "Pillar Hubs", item: "https://www.xfree.in/pillars" },
        ],
      },
    ],
  });

  const renderContent = () => {
    switch (route.type) {
      case "home":
        return (
          <>
            <Hero />
            <MetricsTicker />
            <div className="data-line max-w-7xl mx-auto" aria-hidden="true" />
            <FeaturedTools />
            <AdSlot label="Advertisement" />
            <CategoriesSection />
            <div className="data-line max-w-7xl mx-auto" aria-hidden="true" />
            <WhyXFree />
            <HowItWorks />
            <AdSlot label="Advertisement" />
            <PillarsDirectory onSelect={(slug) => navigate(`/pillars/${slug}`)} />
            <AdSlot label="Advertisement" />
            <FAQSection />
            <CTASection />
          </>
        );

      case "pillars-list":
        return (
          <section className="py-16 px-4 bg-cyber-surface/50 pt-28">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block px-3 py-1 rounded border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan text-xs font-mono mb-4 neon-box-cyan">
                  // XFree Knowledge Graph
                </span>
                <h1 className="text-3xl font-black text-white mb-3 font-mono">
                  The XFree Tool Directory: <span className="text-cyber-glow">{PILLAR_COUNT}</span> Pillars
                </h1>
                <p className="text-cyber-muted max-w-2xl mx-auto font-mono text-sm">
                  The most comprehensive developer tool taxonomy. Each pillar connects specialized clusters with dedicated micro-tools.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {ALL_PILLARS.map((p) => (
                  <button
                    key={p.def.slug}
                    onClick={() => navigate(`/pillars/${p.def.slug}`)}
                    className="pillar-card cyber-card p-4 text-left block w-full focus-ring"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">
                        {p.def.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-mono text-cyber-glow">#{p.def.num}</span>
                          <span className="text-[9px] text-cyber-dim font-mono">
                            {CATEGORIES.find((c) => c.id === p.def.category)?.label ?? p.def.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white font-mono">{p.def.name}</h3>
                        <p className="text-[11px] text-cyber-muted mt-1 line-clamp-2">{p.def.tagline}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        );

      case "category-hub": {
        const cat = CATEGORIES.find((c) => c.id === route.categoryId);
        if (!cat) return <div className="py-16 px-4"><p className="text-cyber-muted">Category not found</p></div>;
        return (
          <CategoryHub
            categoryId={route.categoryId}
            onBack={() => navigate("/")}
            onSelect={(slug) => navigate(`/pillars/${slug}`)}
          />
        );
      }

      case "pillar-detail":
        return <PillarDetail slug={route.slug} onBack={() => navigate("/pillars")} />;

      case "not-found":
        return (
          <section className="py-16 px-4 pt-20">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl font-black text-white mb-4 font-mono">404 — Page not found</h1>
              <p className="text-cyber-muted mb-6">This URL doesn't map to an indexable tool or page. Try the homepage.</p>
              <a href="/" className="cyber-btn cyber-btn-filled text-sm px-6 py-3 rounded focus-ring inline-block">
                <span>Back to Home →</span>
              </a>
            </div>
          </section>
        );
    }
  };

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <div className="crt-vignette" aria-hidden="true" />
      <a href="#main-content" className="skip-link focus-ring">Skip to main content</a>

      <Header />

      <main id="main-content" tabIndex={-1}>
        {renderContent()}
      </main>

      <Footer />
    </>
  );
}
