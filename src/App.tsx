"use client";

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { PILLAR_EDITORIAL, type PillarEditorialContent } from "./data/pillarEditorial";
import {
  PILLARS_60,
  PILLAR_CATEGORIES,
  type PillarDefinition,
  type PillarCategory,
  getRelatedPillars,
} from "./data/pillarRegistry";
import { INDEXABLE_TOOLS, INDEXABLE_TOOL_SLUGS } from "./data/toolsRegistry";
import { STATIC_ROUTES } from "./data/routes";
import { GUIDES, findGuide } from "./data/guides";
import type { ToolDefinition, SavedItem } from "./types";
import { CommandPalette } from "./components/CommandPalette";
import { GeminiChatDrawer } from "./components/GeminiChatDrawer";
import { SavedDrawer } from "./components/SavedDrawer";
import { ThinkingModeComponent } from "./components/ThinkingModeComponent";
import { ClusterDirectory } from "./components/ClusterDirectory";

// Only these 10 tools have a real, dedicated interactive component (see
// src/components/tools/). Everything else renders ToolDetail's informational
// content only, with no working widget, until it gets a real implementation —
// see auditTools.ts's GUIDE_STYLE_TOOL_IDS exemption list, which must stay in
// sync with this switch.
const BulkUrlExtractorSitemap = lazy(() => import("./components/tools/BulkUrlExtractorSitemap").then((m) => ({ default: m.BulkUrlExtractorSitemap })));
const RobotsTxtGenerator = lazy(() => import("./components/tools/RobotsTxtGenerator").then((m) => ({ default: m.RobotsTxtGenerator })));
const MetaTagOpenGraphPreview = lazy(() => import("./components/tools/MetaTagOpenGraphPreview").then((m) => ({ default: m.MetaTagOpenGraphPreview })));
const SchemaMarkupGenerator = lazy(() => import("./components/tools/SchemaMarkupGenerator").then((m) => ({ default: m.SchemaMarkupGenerator })));
const UrlSlugUtmBuilder = lazy(() => import("./components/tools/UrlSlugUtmBuilder").then((m) => ({ default: m.UrlSlugUtmBuilder })));
const JsonFormatterValidatorDiff = lazy(() => import("./components/tools/JsonFormatterValidatorDiff").then((m) => ({ default: m.JsonFormatterValidatorDiff })));
const RegexTesterExplainer = lazy(() => import("./components/tools/RegexTesterExplainer").then((m) => ({ default: m.RegexTesterExplainer })));
const CronExpressionGenerator = lazy(() => import("./components/tools/CronExpressionGenerator").then((m) => ({ default: m.CronExpressionGenerator })));
const Base64JwtDecoder = lazy(() => import("./components/tools/Base64JwtDecoder").then((m) => ({ default: m.Base64JwtDecoder })));
const PasswordGenerator = lazy(() => import("./components/tools/PasswordGenerator").then((m) => ({ default: m.PasswordGenerator })));
const JpgToPdf = lazy(() => import("./components/tools/JpgToPdf").then((m) => ({ default: m.JpgToPdf })));
const AiDetector = lazy(() => import("./components/tools/AiDetector").then((m) => ({ default: m.AiDetector })));
const MobileTester = lazy(() => import("./components/tools/MobileTester").then((m) => ({ default: m.MobileTester })));
const OnlineGames = lazy(() => import("./components/tools/OnlineGames").then((m) => ({ default: m.OnlineGames })));
const PhotoEditor = lazy(() => import("./components/tools/PhotoEditor").then((m) => ({ default: m.PhotoEditor })));

function renderInteractiveTool(tool: ToolDefinition, onSaveHistory: (input: string, output: string) => void): React.ReactNode | null {
  switch (tool.id) {
    case "password-generator":
      return <PasswordGenerator tool={tool} onSaveHistory={onSaveHistory} />;
    case "photo-editor":
      return <PhotoEditor tool={tool} onSaveHistory={onSaveHistory} />;
    case "jpg-to-pdf":
      return <JpgToPdf tool={tool} onSaveHistory={onSaveHistory} />;
    case "ai-detector":
      return <AiDetector tool={tool} onSaveHistory={onSaveHistory} />;
    case "mobile-tester":
      return <MobileTester tool={tool} onSaveHistory={onSaveHistory} />;
    case "online-games":
      return <OnlineGames tool={tool} onSaveHistory={onSaveHistory} />;
    case "bulk-url-sitemap":
    case "xml-sitemap-generator":
      return <BulkUrlExtractorSitemap tool={tool} onSaveHistory={onSaveHistory} />;
    case "robots-txt-generator":
      return <RobotsTxtGenerator tool={tool} onSaveHistory={onSaveHistory} />;
    case "meta-tag-generator":
      return <MetaTagOpenGraphPreview tool={tool} onSaveHistory={onSaveHistory} />;
    case "schema-markup-generator":
      return <SchemaMarkupGenerator tool={tool} onSaveHistory={onSaveHistory} />;
    case "url-slug-utm-builder":
      return <UrlSlugUtmBuilder tool={tool} onSaveHistory={onSaveHistory} />;
    case "json-formatter":
      return <JsonFormatterValidatorDiff tool={tool} onSaveHistory={onSaveHistory} />;
    case "regex-tester":
      return <RegexTesterExplainer tool={tool} onSaveHistory={onSaveHistory} />;
    case "cron-expression-generator":
      return <CronExpressionGenerator tool={tool} onSaveHistory={onSaveHistory} />;
    case "base64-encoder-decoder":
      return <Base64JwtDecoder tool={tool} onSaveHistory={onSaveHistory} />;
    default:
      return null;
  }
}

// ===== SEO / AEO / GEO — dynamic document meta tag injection =====
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

// ===== Combined pillar data: definition + editorial content =====
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

const TOOL_COUNT = INDEXABLE_TOOLS.length;
const PILLAR_COUNT = ALL_PILLARS.length;

// ===== Navigation routing =====
type Route =
  | { type: "home" }
  | { type: "pillars-list" }
  | { type: "pillar-detail"; slug: string }
  | { type: "category-hub"; categoryId: string }
  | { type: "tool-detail"; slug: string }
  | { type: "guides-list" }
  | { type: "guide-detail"; slug: string }
  | { type: "signals" }
  | { type: "thinking" }
  | { type: "clusters" }
  | { type: "static-page"; path: string }
  | { type: "not-found" };

const STATIC_ROUTE_SET = new Set<string>(STATIC_ROUTES);

function getRouteFromPath(pathname: string): Route {
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  if (normalizedPath === "/") return { type: "home" };
  if (normalizedPath === "/pillars") return { type: "pillars-list" };
  const pillarMatch = normalizedPath.match(/^\/pillars\/(.+)$/);
  if (pillarMatch && PILLAR_BY_SLUG.has(pillarMatch[1])) {
    return { type: "pillar-detail", slug: pillarMatch[1] };
  }
  const toolMatch = normalizedPath.match(/^\/tools\/(.+)$/);
  if (toolMatch && INDEXABLE_TOOL_SLUGS.has(toolMatch[1])) {
    return { type: "tool-detail", slug: toolMatch[1] };
  }
  const catMatch = CATEGORIES.find((c) => normalizedPath === `/${c.id}`);
  if (catMatch) return { type: "category-hub", categoryId: catMatch.id };
  if (normalizedPath === "/guides") return { type: "guides-list" };
  if (normalizedPath === "/updates") return { type: "signals" };
  if (normalizedPath === "/thinking") return { type: "thinking" };
  if (normalizedPath === "/clusters") return { type: "clusters" };
  const guideMatch = normalizedPath.match(/^\/guides\/(.+)$/);
  if (guideMatch && findGuide(guideMatch[1])) {
    return { type: "guide-detail", slug: guideMatch[1] };
  }
  // "/" is handled above; every other STATIC_ROUTES entry (privacy, terms,
  // about, contact, faq, etc.) renders via StaticPage. These previously had
  // no case at all here — prerendered content flashed on load, then flipped
  // to a 404 view the moment React hydrated and hit this function's old
  // fallthrough to "not-found".
  if (normalizedPath !== "/" && STATIC_ROUTE_SET.has(normalizedPath)) {
    return { type: "static-page", path: normalizedPath };
  }
  return { type: "not-found" };
}

// ===== Components =====

// ===== Header & Navigation =====
const Header: React.FC<{ onNavigate: (path: string) => void; currentPath: string; onOpenSaved: () => void; savedCount: number }> = ({ onNavigate, currentPath, onOpenSaved, savedCount }) => {
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

  const a: React.FC<{ href: string; children: React.ReactNode; className?: string; onClick?: () => void }> = ({
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
        onNavigate(href);
        onClick?.();
      }}
    >
      {children}
    </a>
  );

  return (
    <>
      <header className={`sticky-nav fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all ${scrolled ? "scrolled" : ""}`} role="banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group focus-ring" aria-label="XFree homepage">
            <picture className="shrink-0">
              <source srcSet="/logo-wordmark-80.webp 1x, /logo-wordmark-160.webp 2x" type="image/webp" />
              <img
                src="/logo-wordmark-80.png"
                srcSet="/logo-wordmark-80.png 1x, /logo-wordmark-160.png 2x"
                alt="XFree"
                width={160}
                height={80}
                decoding="async"
                style={{ height: "36px", width: "72px" }}
              />
            </picture>
          </a>

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
                    <a
                      key={p.def.slug}
                      href={`/pillars/${p.def.slug}`}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={closeMobile}
                    >
                      {p.def.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <a
              href="/pillars"
              className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all focus-ring"
              aria-label="All pillars"
            >
              Pillars
            </a>
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
            <button
              onClick={onOpenSaved}
              className="relative p-2 text-cyber-muted hover:text-cyber-glow transition-colors focus-ring"
              aria-label="Saved tools and history"
              title="Saved tools and history"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
              </svg>
              {savedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyber-glow text-cyber-bg text-[9px] font-bold flex items-center justify-center">
                  {savedCount > 9 ? "9+" : savedCount}
                </span>
              )}
            </button>
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
                    <a
                      key={p.def.slug}
                      href={`/pillars/${p.def.slug}`}
                      className="block text-sm text-cyber-muted hover:text-cyber-glow"
                      onClick={closeMobile}
                    >
                      {p.def.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-cyber-border">
              <a
                href="/pillars"
                className="block text-sm text-cyber-glow mb-2"
                onClick={closeMobile}
              >
                All Pillars →
              </a>
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

// ===== Hero Section =====
const Hero: React.FC<{ onNavigate: (path: string) => void; onOpenSearch: (query?: string) => void }> = ({ onOpenSearch }) => {
  const [search, setSearch] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenSearch(search);
  };

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center pt-20 pb-12 overflow-hidden matrix-grid hex-pattern"
      aria-labelledby="hero-heading"
    >
      <div className="hero-orb w-[500px] h-[500px] bg-cyber-glow -top-40 -left-40" aria-hidden="true" />
      <div className="hero-orb w-[400px] h-[400px] bg-cyber-magenta top-1/4 -right-32" aria-hidden="true" />
      <div className="hero-orb w-[300px] h-[300px] bg-cyber-cyan bottom-20 left-1/3" aria-hidden="true" />

      <div className="relative z-10 w-full min-w-0 max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="min-w-0 text-center lg:text-left">
            <div
              className="anim-slide-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow mb-6 neon-box-green"
              style={{ animationDelay: ".1s" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow anim-pulse" aria-hidden="true" />
              <span>$ XFree App · Privacy-First Tools · No Signup Required</span>
            </div>

            <h1
              id="hero-heading"
              className="hero-title anim-slide-up text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4"
              style={{ animationDelay: ".2s" }}
            >
              XFree App: Free Developer,<br />
              SEO &amp; <span className="text-cyber-glow">Privacy Micro-Tools</span>
            </h1>

            <h2
              id="hero-subheading"
              className="anim-slide-up text-lg sm:text-xl text-cyber-cyan font-mono mb-2 font-medium"
              style={{ animationDelay: ".25s" }}
            >
              XFree is a free, browser-based toolkit for developers, SEO professionals &amp; privacy-conscious builders
            </h2>

            <p
              className="anim-slide-up text-base text-cyber-muted max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              style={{ animationDelay: ".3s" }}
            >
              {TOOL_COUNT} published tools — JSON formatters, sitemap generators, password checkers, and more —
              run entirely in Local Mode inside your browser. No account, no installs, no cost.
            </p>

            <div
              className="anim-slide-up flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8"
              style={{ animationDelay: ".35s" }}
            >
              <a href="#hero-search" className="cyber-btn cyber-btn-filled text-sm px-6 py-3 rounded focus-ring">
                Explore All Tools →
              </a>
              <a href="https://app.xfree.in/" rel="noopener" className="cyber-btn text-sm px-6 py-3 rounded focus-ring">
                Open XFree Studio
              </a>
            </div>

            <div
              className="anim-slide-up grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-cyber-muted font-mono mb-10"
              style={{ animationDelay: ".4s" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-cyber-glow" aria-hidden="true">🔒</span> 100% Private
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyber-glow" aria-hidden="true">⚡</span> Browser Based
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyber-glow" aria-hidden="true">🔓</span> Open Source
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyber-glow" aria-hidden="true">👥</span> For Everyone
              </span>
            </div>

            {/* Search */}
            <div
              id="hero-search"
              className="anim-slide-up max-w-2xl mx-auto lg:mx-0 scroll-mt-24"
              style={{ animationDelay: ".45s" }}
            >
              <form role="search" onSubmit={handleSubmit}>
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
                    placeholder="search> JSON, Regex, Sitemap, JWT, Hash..."
                    className="flex-1 min-w-0 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono"
                    autoComplete="off"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => onOpenSearch(search)}
                  />
                  <div className="flex items-center gap-2 pr-2 shrink-0">
                    <kbd aria-hidden="true" className="hidden sm:inline-flex">⌘K</kbd>
                    <button type="submit" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded focus-ring">
                      <span>EXECUTE</span>
                    </button>
                  </div>
                </div>
              </form>
              <nav
                className="flex items-center justify-center lg:justify-start gap-2 mt-3 flex-wrap"
                aria-label="Popular XFree tool searches"
              >
                <span className="text-[11px] text-cyber-muted font-mono">Popular:</span>
                <a href="/tools/json-formatter" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
                  XFree JSON Formatter
                </a>
                <span className="text-cyber-dim" aria-hidden="true">·</span>
                <a href="/tools/regex-tester" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
                  XFree Regex Tester
                </a>
                <span className="text-cyber-dim" aria-hidden="true">·</span>
                <a href="/tools/xml-sitemap-generator" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
                  XFree Sitemap Generator
                </a>
                <span className="text-cyber-dim" aria-hidden="true">·</span>
                <a href="/tools/meta-tag-generator" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
                  XFree Meta Tags
                </a>
                <span className="text-cyber-dim" aria-hidden="true">·</span>
                <a href="/tools/jwt-decoder" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
                  XFree JWT Decoder
                </a>
                <span className="text-cyber-dim" aria-hidden="true">·</span>
                <a href="/tools/cron-generator" className="text-[11px] text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
                  XFree Cron Gen
                </a>
              </nav>
              <small className="block mt-3 text-[10px] text-cyber-dim font-mono text-center lg:text-left">
                Pro-tip: Press <kbd>⌘K</kbd> to jump to search from anywhere.
              </small>
            </div>
          </div>

          <img
            src="/favicon-512x512.png"
            alt=""
            width={320}
            height={320}
            className="hidden lg:block w-72 h-72 xl:w-80 xl:h-80 opacity-95 anim-float"
            aria-hidden="true"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};

// ===== Metrics Ticker =====
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
    <section
      className="relative py-5 border-y border-cyber-border bg-cyber-surface"
      aria-label="Platform metrics"
    >
      <div className="metric-ticker">
        <div className="ticker-track">
          {track.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-8">
              <span className="text-2xl font-black text-cyber-glow font-cyber neon-green">
                {item.value}
              </span>
              <span className="text-xs text-cyber-muted font-mono">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===== Featured Tools =====
const featuredTools = [
  { slug: "json-formatter", title: "XFree JSON Formatter", desc: "Format, validate, repair, and minify JSON data with instant tree inspect.", category: "Developer", badge: "FLAGSHIP", badgeClass: "badge-flagship", color: "cyber-glow", href: "/tools/json-formatter" },
  { slug: "regex-tester", title: "XFree Regex Tester", desc: "Test JS regex patterns live with match group tables and replacements.", category: "Developer", badge: "POPULAR", badgeClass: "badge-popular", color: "cyber-cyan", href: "/tools/regex-tester" },
  { slug: "xml-sitemap-generator", title: "XFree Sitemap Generator", desc: "Extract links from HTML and generate Google XML sitemaps with priority.", category: "SEO & URL", badge: "FLAGSHIP", badgeClass: "badge-flagship", color: "cyber-glow", href: "/tools/xml-sitemap-generator" },
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
            <a
              href="https://app.xfree.in/"
              className="text-cyber-cyan hover:text-white underline focus-ring"
              rel="noopener"
            >
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

// ===== Categories Grid =====
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

// ===== Why XFree Section =====
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

// ===== XFree Studio Promo =====
const StudioPromo: React.FC = () => (
  <section className="py-16 px-4" aria-labelledby="studio-heading">
    <div className="max-w-5xl mx-auto cyber-card p-8 sm:p-10 rounded-xl grid md:grid-cols-[1fr_auto] gap-8 items-center">
      <div>
        <h2 id="studio-heading" className="text-2xl sm:text-3xl font-black text-white mb-3 font-mono">
          XFree <span className="text-cyber-glow">Studio</span>
        </h2>
        <p className="text-cyber-muted leading-relaxed mb-6 max-w-xl">
          A single workspace for every XFree tool — search, run, and switch between {TOOL_COUNT} tools without
          leaving the page. Installable as a Progressive Web App for one-tap access, offline-capable, still 100%
          local by default.
        </p>
        <ul className="space-y-2 mb-6 text-sm text-cyber-text">
          <li className="flex items-center gap-2"><span className="text-cyber-glow" aria-hidden="true">✓</span> All {TOOL_COUNT} tools in one workspace</li>
          <li className="flex items-center gap-2"><span className="text-cyber-glow" aria-hidden="true">✓</span> Installable PWA — works offline</li>
          <li className="flex items-center gap-2"><span className="text-cyber-glow" aria-hidden="true">✓</span> No account, no tracking</li>
          <li className="flex items-center gap-2"><span className="text-cyber-glow" aria-hidden="true">✓</span> Open source and self-hostable</li>
        </ul>
        <a href="https://app.xfree.in/" rel="noopener" className="cyber-btn cyber-btn-filled text-sm px-6 py-3 rounded focus-ring inline-block">
          Open XFree Studio →
        </a>
      </div>
      <img
        src="/logo-wordmark-160.png"
        srcSet="/logo-wordmark-80.png 1x, /logo-wordmark-160.png 2x"
        alt=""
        width={321}
        height={160}
        className="hidden md:block w-56 h-auto opacity-90"
        aria-hidden="true"
        decoding="async"
      />
    </div>
  </section>
);

// ===== Latest Guides =====
const LatestGuides: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const latest = [...GUIDES].sort((a, b) => (a.lastReviewed < b.lastReviewed ? 1 : -1)).slice(0, 4);
  if (!latest.length) return null;
  return (
    <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="guides-heading">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="guides-heading" className="text-xl font-bold text-white font-mono">
              <span className="text-cyber-glow">$</span> Latest Guides
            </h2>
            <p className="text-sm text-cyber-muted mt-1 font-mono">// Learn. Build. Go deeper.</p>
          </div>
          <button onClick={() => onNavigate("/guides")} className="text-xs text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
            View all →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {latest.map((g) => (
            <a
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="cyber-card p-4 block focus-ring hover:border-cyber-glow/40 transition-colors"
            >
              <h3 className="text-sm font-semibold text-white mb-2 font-mono leading-snug">{g.title}</h3>
              <p className="text-xs text-cyber-muted leading-relaxed mb-3">{g.description}</p>
              <span className="text-[10px] text-cyber-dim font-mono">{g.lastReviewed}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===== How It Works Section =====
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

// ===== Pillars Directory =====
const PillarsDirectory: React.FC<{ onSelect: (slug: string) => void; limit?: number; onViewAll?: () => void }> = ({ onSelect, limit, onViewAll }) => {
  const allItems = ALL_PILLARS.map((p) => ({
    slug: p.def.slug,
    num: p.def.num,
    title: p.def.name,
    desc: p.def.tagline,
    emoji: p.def.emoji,
    category: p.def.category,
    categoryLabel: CATEGORIES.find((c) => c.id === p.def.category)?.label ?? p.def.category,
  }));
  const gridItems = limit ? allItems.slice(0, limit) : allItems;

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
        {limit && limit < allItems.length && onViewAll && (
          <div className="text-center mt-8">
            <button onClick={onViewAll} className="cyber-btn cyber-btn-cyan text-sm px-6 py-2.5 rounded focus-ring">
              <span>View All {allItems.length} Pillars →</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// ===== Category Hub =====
const CategoryHub: React.FC<{ categoryId: string; onBack: () => void; onSelect: (slug: string) => void }> = ({
  categoryId,
  onBack,
  onSelect,
}) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;

  const otherCategories = CATEGORIES.filter((c) => c.id !== cat.id);

  return (
    <>
      {/* Category hero */}
      <section className="relative overflow-hidden border-b border-cyber-border" aria-labelledby={`cat-${cat.id}`}>
        <div className="absolute inset-0 matrix-grid hex-pattern opacity-40" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-14 lg:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-mono text-cyber-muted">
            <button onClick={onBack} className="hover:text-cyber-glow transition-colors focus-ring">Home</button>
            <span className="mx-2 text-cyber-dim" aria-hidden="true">/</span>
            <span className="text-cyber-glow">{cat.label}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="min-w-0">
              <p className="text-xs font-mono tracking-[0.2em] text-cyber-glow mb-3">
                XFREE / {cat.label.toUpperCase()}
              </p>
              <h1 id={`cat-${cat.id}`} className="text-4xl sm:text-5xl font-black text-white leading-[1.05] tracking-tight mb-4">
                {cat.label}
              </h1>
              <p className="text-cyber-muted max-w-xl leading-relaxed mb-8">{cat.description}</p>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <a
                  href="#category-tools"
                  className="cyber-btn cyber-btn-filled text-sm px-5 py-2.5 rounded focus-ring"
                >
                  Explore {cat.count} {cat.count === 1 ? "Topic" : "Topics"} →
                </a>
                <a
                  href="https://app.xfree.in/"
                  rel="noopener"
                  className="cyber-btn text-sm px-5 py-2.5 rounded focus-ring"
                >
                  Open XFree Studio
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl text-xs font-mono text-cyber-muted">
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🔒</span> 100% Private</span>
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">⚡</span> Browser Based</span>
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🔓</span> Open Source</span>
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">👥</span> For Everyone</span>
              </div>
            </div>

            <img
              src="/favicon-512x512.png"
              alt=""
              width={180}
              height={180}
              className="hidden lg:block w-44 h-44 opacity-90"
              aria-hidden="true"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Topics in this category */}
      <section id="category-tools" className="py-16 px-4 bg-cyber-surface/50 scroll-mt-20" aria-label={`${cat.label} topics`}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-white font-mono mb-6">
            <span className="text-cyber-glow">{cat.icon}</span> {cat.label} — {cat.count} {cat.count === 1 ? "topic" : "topics"}
          </h2>
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

      {/* Other categories */}
      <section className="py-14 px-4" aria-label="Explore other categories">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white font-mono">Explore Other Categories</h2>
            <a href="/pillars" className="text-xs text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
              View All Pillars →
            </a>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {otherCategories.map((c) => (
              <a
                key={c.id}
                href={`/${c.id}`}
                className="cyber-card p-4 text-center focus-ring hover:border-cyber-glow/40 transition-colors"
              >
                <span className="text-2xl block mb-2" aria-hidden="true">{c.icon}</span>
                <span className="text-xs font-semibold text-white font-mono block">{c.label}</span>
                <span className="text-[10px] text-cyber-muted font-mono">{c.count} topics</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

// ===== Pillar Detail Page =====
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
  const cat = CATEGORIES.find((c) => c.id === def.category);

  return (
    <>
      {/* Pillar hero */}
      <section className="relative overflow-hidden border-b border-cyber-border" aria-labelledby="pillar-heading">
        <div className="absolute inset-0 matrix-grid hex-pattern opacity-40" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-14 lg:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-mono text-cyber-muted">
            <button onClick={onBack} className="hover:text-cyber-glow transition-colors focus-ring">Home</button>
            {cat && (
              <>
                <span className="mx-2 text-cyber-dim" aria-hidden="true">/</span>
                <a href={`/${cat.id}`} className="hover:text-cyber-glow transition-colors focus-ring">{cat.label}</a>
              </>
            )}
            <span className="mx-2 text-cyber-dim" aria-hidden="true">/</span>
            <span className="text-cyber-glow">{def.name}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="min-w-0">
              <p className="text-xs font-mono tracking-[0.2em] text-cyber-glow mb-3">XFREE / PILLAR #{def.num}</p>
              <h1 id="pillar-heading" className="text-4xl sm:text-5xl font-black text-white leading-[1.05] tracking-tight mb-4">
                {def.name}
              </h1>
              <p className="text-cyber-cyan font-mono text-sm mb-4">// {def.tagline}</p>
              <p className="text-cyber-muted max-w-xl leading-relaxed mb-8">{editorial.directAnswer}</p>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                {cat && (
                  <a href={`/${cat.id}`} className="cyber-btn cyber-btn-filled text-sm px-5 py-2.5 rounded focus-ring">
                    Back to {cat.label} →
                  </a>
                )}
                <a href="https://app.xfree.in/" rel="noopener" className="cyber-btn text-sm px-5 py-2.5 rounded focus-ring">
                  Open XFree Studio
                </a>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-cyber-muted">
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🔒</span> 100% Private</span>
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">⚡</span> Browser Based</span>
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">🔓</span> Open Source</span>
                <span className="flex items-center gap-1.5"><span className="text-cyber-glow" aria-hidden="true">👥</span> For Everyone</span>
              </div>
            </div>

            <div className="hidden lg:flex w-44 h-44 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 items-center justify-center text-7xl" aria-hidden="true">
              {def.emoji}
            </div>
          </div>
        </div>
      </section>

      <article className="prose prose-invert max-w-3xl mx-auto py-12 px-4">
      <div className="cyber-card p-6 sm:p-9 rounded-xl mb-8">
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
    </>
  );
};

// ===== Tool Detail Page =====
const ToolDetail: React.FC<{
  slug: string;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (toolId: string) => void;
  onSaveHistory: (toolId: string, toolTitle: string, input: string, output: string) => void;
}> = ({ slug, onBack, favorites, onToggleFavorite, onSaveHistory }) => {
  const tool = INDEXABLE_TOOLS.find((t) => t.slug === slug);
  if (!tool) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Tool not found</h2>
          <p className="text-cyber-muted">The tool <code className="text-cyber-glow">{slug}</code> does not exist.</p>
          <button onClick={onBack} className="cyber-btn cyber-btn-cyan mt-4 text-sm px-6 py-2 rounded focus-ring">
            ← Back
          </button>
        </div>
      </section>
    );
  }

  const pageTitle = `${tool.title} — XFree.in`;
  const pageDesc = tool.shortDescription;
  const canonical = `https://www.xfree.in/tools/${tool.slug}`;

  useDocumentMeta({
    title: pageTitle,
    description: pageDesc,
    canonical,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.title,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Any (browser)",
        description: pageDesc,
        url: canonical,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: (tool.faqs || []).slice(0, 6).map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  });

  const handleSaveHistory = (input: string, output: string) => onSaveHistory(tool.id, tool.title, input, output);
  const interactiveTool = renderInteractiveTool(tool, handleSaveHistory);
  const isFavorite = favorites.includes(tool.id);

  return (
    <article className="prose prose-invert max-w-3xl mx-auto py-12 px-4">
      <div className="cyber-card p-6 sm:p-9 rounded-xl mb-8">
        <button onClick={onBack} className="cyber-btn text-xs px-4 py-2 mb-4 rounded focus-ring">
          ← Back
        </button>

        <header className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-3xl" aria-hidden="true">
                ⚡
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-cyber-glow text-xs font-mono mb-2 neon-box-green">
                  {tool.categoryLabel}
                </span>
                <h1 className="text-3xl font-black text-white font-mono">{tool.title}</h1>
              </div>
            </div>
            <button
              onClick={() => onToggleFavorite(tool.id)}
              className={`shrink-0 p-2.5 rounded-lg border transition-colors focus-ring ${
                isFavorite
                  ? "border-cyber-glow bg-cyber-glow/10 text-cyber-glow"
                  : "border-cyber-border text-cyber-muted hover:text-cyber-glow hover:border-cyber-glow/40"
              }`}
              aria-label={isFavorite ? "Remove from saved tools" : "Save this tool"}
              aria-pressed={isFavorite}
              title={isFavorite ? "Saved" : "Save for later"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
          <p className="text-cyber-cyan font-mono text-sm">// {tool.shortDescription}</p>
        </header>

        {interactiveTool && (
          <section className="not-prose mb-8 rounded-xl border border-cyber-glow/30 bg-cyber-surface/40 p-4 sm:p-6" aria-label="Interactive tool">
            <h2 className="text-lg font-bold text-white font-mono mb-4">
              <span className="text-cyber-glow">{'run>'}</span> Try it now
            </h2>
            <Suspense fallback={<div className="py-12 text-center text-sm text-cyber-muted">Loading…</div>}>
              {interactiveTool}
            </Suspense>
          </section>
        )}

        <p className="text-lg text-cyber-text leading-relaxed mb-6">{tool.explanation}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-glow">{'input>'}</span> How to Use
            </h2>
            <ol className="space-y-2">
              {(tool.howToUse || []).map((step, i) => (
                <li key={i} className="text-cyber-muted flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center flex-shrink-0 text-xs text-cyber-glow font-bold">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-cyan">🔒</span> Privacy
            </h2>
            <p className="text-cyber-muted leading-relaxed">{tool.privacyNotice}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white font-mono mb-3">
              <span className="text-cyber-glow">man</span> FAQ
            </h2>
            <div className="space-y-2">
              {(tool.faqs || []).map((f, i) => (
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
          </section>
        </div>
      </div>
    </article>
  );
};

// Adds/updates a single, uniquely-IDed JSON-LD <script>, without touching
// any other script tags (unlike useDocumentMeta, which wipes and replaces
// every ld+json script on the page — safe for tool/pillar detail pages that
// own their entire schema set, but not for a section that should coexist
// with the Organization/WebSite schema prerender.ts already injected for
// the home route). Removes its own tag on unmount so it never leaks onto
// another route.
function useAppendJsonLd(id: string, schema: Record<string, unknown>) {
  useEffect(() => {
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
    return () => {
      document.getElementById(id)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}

const HOME_FAQS = [
  {
    q: "What is XFree?",
    a: `XFree is a free, browser-based toolkit of ${TOOL_COUNT} published developer, SEO, and privacy micro-tools. Every published tool runs in Local Mode by default, processing your input inside your own browser.`,
  },
  {
    q: "Is XFree really free, with no signup?",
    a: "Yes. Every published XFree tool is free to use with no account, no signup, and no usage cap. The project is MIT-licensed and open source.",
  },
  {
    q: "Does XFree send my data anywhere?",
    a: "Published tools run in Local Mode: your input is processed by JavaScript inside your browser tab and is not uploaded to XFree's servers. Where a tool explicitly uses a cloud AI provider, that is disclosed on the tool's own page before you submit anything.",
  },
  {
    q: "What's a \"pillar\" on XFree?",
    a: `A pillar is a topic hub that groups related tools — for example, JSON & Data Tools or Security & Privacy Tools. XFree organizes ${PILLAR_COUNT} pillars across its tool taxonomy; not every pillar has a published, working tool yet.`,
  },
  {
    q: "Can I use XFree tools on mobile?",
    a: "Yes. Every published tool is built with a responsive layout for phones, tablets, and desktop browsers.",
  },
];

// ===== XFree Signals =====
interface SignalItem {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
}

const SIGNAL_SOURCE_META: Record<string, { icon: string }> = {
  "chrome-dev": { icon: "🌐" },
  "github-blog": { icon: "🐙" },
  "cloudflare-blog": { icon: "☁️" },
  "mdn-blog": { icon: "📘" },
};

function formatSignalDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ===== Deep Reasoning Mode page =====
// ===== Keyword Cluster directory page =====
const ClustersPage: React.FC<{ onNavigate: (path: string) => void; onOpenSearch: (query?: string) => void }> = ({ onNavigate, onOpenSearch }) => {
  const canonical = "https://www.xfree.in/clusters";
  useDocumentMeta({
    title: "Keyword Clusters — XFree.in",
    description: "Search-intent keyword clusters mapped to XFree.in's real, published tool catalogue.",
    canonical,
  });

  return (
    <section className="py-16 px-4" aria-labelledby="clusters-heading">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => onNavigate("/")} className="cyber-btn text-xs px-4 py-2 mb-6 rounded focus-ring">
          ← Back home
        </button>
        <h1 id="clusters-heading" className="sr-only">Keyword cluster directory</h1>
        <ClusterDirectory
          onSelectKeywordTool={(keyword) => {
            // No direct keyword -> tool-slug mapping exists in the cluster
            // data, so route through the real fuzzy-search palette rather
            // than guessing/fabricating a link — it'll surface whatever
            // published tools actually match.
            onOpenSearch(keyword);
          }}
        />
      </div>
    </section>
  );
};

const ThinkingModePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const canonical = "https://www.xfree.in/thinking";
  useDocumentMeta({
    title: "Deep Reasoning Mode — XFree.in",
    description: "XFree's deep, step-by-step reasoning endpoint, powered by Google Gemini.",
    canonical,
  });

  return (
    <section className="py-16 px-4" aria-labelledby="thinking-heading">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => onNavigate("/")} className="cyber-btn text-xs px-4 py-2 mb-6 rounded focus-ring">
          ← Back home
        </button>
        <h1 id="thinking-heading" className="text-3xl font-black text-white mb-3 font-mono">Deep Reasoning Mode</h1>
        <p className="text-cyber-muted mb-8 max-w-xl">
          For hard problems: complex SQL, regex, and architecture questions. Cloud Mode — your prompt is sent to
          Google Gemini for step-by-step analysis.
        </p>
        <ThinkingModeComponent />
      </div>
    </section>
  );
};

const SignalsPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [items, setItems] = useState<SignalItem[] | null>(null);
  const [error, setError] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/signals")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.success) setItems(data.items);
        else setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canonical = "https://www.xfree.in/updates";
  useDocumentMeta({
    title: "XFree Signals — Open Web & Developer Updates",
    description: "A live, curated feed of developer news from Chrome for Developers, GitHub, Cloudflare, and MDN — with source attribution and links to the originals.",
    canonical,
  });

  const sources = Array.from(new Map((items || []).map((i) => [i.sourceId, i.sourceName])).entries());
  const filtered = items ? (sourceFilter ? items.filter((i) => i.sourceId === sourceFilter) : items) : null;

  return (
    <section className="py-16 px-4" aria-labelledby="signals-heading">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => onNavigate("/")} className="cyber-btn text-xs px-4 py-2 mb-6 rounded focus-ring">
          ← Back home
        </button>
        <h1 id="signals-heading" className="text-3xl font-black text-white mb-3 font-mono">XFree Signals</h1>
        <p className="text-cyber-muted mb-2 max-w-xl">
          A live feed of real posts from a small set of authoritative developer sources, refreshed regularly.
          Every item links straight to the original — nothing here is republished XFree content.
        </p>
        <p className="text-xs text-cyber-dim font-mono mb-8">
          Sources: Chrome for Developers · GitHub Blog · Cloudflare Blog · MDN Web Docs
        </p>

        {sources.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSourceFilter(null)}
              className={`text-xs px-3 py-1.5 rounded border font-mono transition-colors ${!sourceFilter ? "border-cyber-glow text-cyber-glow bg-cyber-glow/10" : "border-cyber-border text-cyber-muted hover:text-white"}`}
            >
              All
            </button>
            {sources.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setSourceFilter(id)}
                className={`text-xs px-3 py-1.5 rounded border font-mono transition-colors ${sourceFilter === id ? "border-cyber-glow text-cyber-glow bg-cyber-glow/10" : "border-cyber-border text-cyber-muted hover:text-white"}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="cyber-card p-6 text-center text-cyber-muted text-sm">
            Unable to load updates right now. Try refreshing in a moment.
          </div>
        )}

        {!error && !items && (
          <div className="cyber-card p-6 text-center text-cyber-muted text-sm font-mono">Loading updates…</div>
        )}

        {!error && filtered && filtered.length === 0 && (
          <div className="cyber-card p-6 text-center text-cyber-muted text-sm">No updates available right now.</div>
        )}

        {!error && filtered && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((item) => (
              <article key={item.link} className="cyber-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-cyber-glow flex items-center gap-1.5">
                    <span aria-hidden="true">{SIGNAL_SOURCE_META[item.sourceId]?.icon || "🔗"}</span> {item.sourceName}
                  </span>
                  <span className="text-[10px] text-cyber-dim font-mono">{formatSignalDate(item.publishedAt)}</span>
                </div>
                <h2 className="text-sm font-semibold text-white mb-2 leading-snug">{item.title}</h2>
                {item.summary && <p className="text-xs text-cyber-muted leading-relaxed mb-3">{item.summary}</p>}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-cyber-glow hover:text-white transition-colors font-mono inline-flex items-center gap-1"
                >
                  Read on {item.sourceName} ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ===== Guides list =====
const GuidesList: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const canonical = "https://www.xfree.in/guides";
  useDocumentMeta({
    title: "Guides — XFree.in",
    description: "Practical, reviewed guides for developers and SEOs — regex, cron, JSON, hashing, and more.",
    canonical,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "XFree Guides",
        url: canonical,
        hasPart: GUIDES.map((g) => ({
          "@type": "Article",
          headline: g.title,
          url: `https://www.xfree.in/guides/${g.slug}`,
        })),
      },
    ],
  });

  return (
    <section className="py-16 px-4" aria-labelledby="guides-list-heading">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => onNavigate("/")} className="cyber-btn text-xs px-4 py-2 mb-6 rounded focus-ring">
          ← Back home
        </button>
        <h1 id="guides-list-heading" className="text-3xl font-black text-white mb-3 font-mono">Guides</h1>
        <p className="text-cyber-muted mb-10 max-w-xl">
          Short, practical guides for developers and SEOs, each a standalone reference with runnable examples.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GUIDES.map((g) => (
            <a key={g.slug} href={`/guides/${g.slug}`} className="cyber-card p-5 block focus-ring hover:border-cyber-glow/40 transition-colors">
              <h2 className="text-base font-semibold text-white mb-2 font-mono">{g.title}</h2>
              <p className="text-sm text-cyber-muted leading-relaxed mb-3">{g.description}</p>
              <span className="text-[10px] text-cyber-dim font-mono">Last reviewed {g.lastReviewed}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// ===== Guide detail =====
const GuideDetail: React.FC<{ slug: string; onNavigate: (path: string) => void }> = ({ slug, onNavigate }) => {
  const guide = findGuide(slug);
  if (!guide) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Guide not found</h1>
          <button onClick={() => onNavigate("/guides")} className="cyber-btn cyber-btn-cyan mt-4 text-sm px-6 py-2 rounded focus-ring">
            ← Back to guides
          </button>
        </div>
      </section>
    );
  }

  const canonical = `https://www.xfree.in/guides/${guide.slug}`;
  useDocumentMeta({
    title: `${guide.title} — XFree.in`,
    description: guide.description,
    canonical,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        url: canonical,
        dateModified: guide.lastReviewed,
        publisher: { "@type": "Organization", name: "XFree", url: "https://www.xfree.in/" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.xfree.in/" },
          { "@type": "ListItem", position: 2, name: "Guides", item: "https://www.xfree.in/guides" },
          { "@type": "ListItem", position: 3, name: guide.title, item: canonical },
        ],
      },
    ],
  });

  const relatedTools = (guide.relatedToolSlugs || [])
    .map((s) => INDEXABLE_TOOLS.find((t) => t.slug === s))
    .filter((t): t is ToolDefinition => !!t);
  const relatedGuides = (guide.relatedGuideSlugs || [])
    .map((s) => findGuide(s))
    .filter((g): g is (typeof GUIDES)[number] => !!g);

  return (
    <article className="prose prose-invert max-w-3xl mx-auto py-12 px-4">
      <div className="cyber-card p-6 sm:p-9 rounded-xl">
        <nav className="text-xs font-mono text-cyber-muted mb-6">
          <button onClick={() => onNavigate("/guides")} className="hover:text-cyber-glow transition-colors focus-ring">← All guides</button>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-white font-mono mb-3">{guide.title}</h1>
          <p className="text-lg text-cyber-text leading-relaxed">{guide.intro}</p>
        </header>

        <div className="space-y-8">
          {guide.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-white font-mono mb-3">
                <span className="text-cyber-glow">{'>'}</span> {section.heading}
              </h2>
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="text-cyber-muted leading-relaxed mb-2">{p}</p>
              ))}
              {section.bullets && (
                <ul className="space-y-1.5 mt-2">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-cyber-muted flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow mt-1.5 shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              )}
              {section.code && (
                <pre className="bg-cyber-bg border border-cyber-border rounded-lg p-4 text-xs text-cyber-glow overflow-x-auto whitespace-pre mt-2">
                  {section.code.body}
                </pre>
              )}
            </section>
          ))}
        </div>

        {(relatedGuides.length || relatedTools.length) ? (
          <section className="mt-10 pt-6 border-t border-cyber-border">
            <h2 className="text-lg font-bold text-white font-mono mb-3">Related</h2>
            <div className="flex flex-wrap gap-2">
              {relatedGuides.map((g) => (
                <a key={g.slug} href={`/guides/${g.slug}`} className="px-3 py-1.5 rounded-lg cyber-card text-xs focus-ring hover:border-cyber-glow/40 transition-colors">
                  {g.title}
                </a>
              ))}
              {relatedTools.map((t) => (
                <a key={t.slug} href={`/tools/${t.slug}`} className="px-3 py-1.5 rounded-lg cyber-card text-xs text-cyber-glow focus-ring hover:border-cyber-glow/40 transition-colors">
                  {t.title}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <p className="text-xs text-cyber-dim italic pt-6 mt-6 border-t border-cyber-border">
          Authored by the XFree.in team. Last reviewed {guide.lastReviewed}.
        </p>
      </div>
    </article>
  );
};

const FAQSection: React.FC = () => {
  useAppendJsonLd("home-faq-jsonld", {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });

  return (
    <section className="py-16 px-4" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 id="faq-heading" className="text-3xl font-black text-white mb-3 font-mono">
            <span className="text-cyber-glow">man</span> xfree — FAQ
          </h2>
          <p className="text-cyber-muted font-mono text-sm">// Common questions about the XFree app</p>
        </div>
        <div className="space-y-2">
          {HOME_FAQS.map((f, i) => (
            <details key={i} className="cyber-card details overflow-hidden" open={i === 0}>
              <summary className="px-5 py-4 font-semibold text-white text-sm flex justify-between items-center focus-ring font-mono cursor-pointer">
                {f.q}
              </summary>
              <div className="px-5 pb-4 text-sm text-cyber-muted leading-relaxed border-t border-cyber-border pt-3">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

const ClosingCta: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <section className="py-16 px-4 border-t border-cyber-border" aria-labelledby="closing-cta-heading">
    <div className="max-w-2xl mx-auto text-center">
      <h2 id="closing-cta-heading" className="text-2xl sm:text-3xl font-black text-white mb-3 font-mono">
        Ready to get X done with XFree?
      </h2>
      <p className="text-cyber-muted mb-8 font-mono text-sm">
        // {TOOL_COUNT} free tools, {PILLAR_COUNT} pillars, zero signup.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a href="https://app.xfree.in/" className="cyber-btn cyber-btn-filled text-sm px-6 py-3 rounded focus-ring" rel="noopener">
          <span>Launch XFree Studio →</span>
        </a>
        <button onClick={() => onNavigate("/pillars")} className="cyber-btn cyber-btn-cyan text-sm px-6 py-3 rounded focus-ring">
          <span>Browse All Pillars</span>
        </button>
      </div>
    </div>
  </section>
);

// ===== Static pages =====
// These 14 routes (STATIC_ROUTES) had prerendered HTML but no client-side
// route case at all — real content flashed on load, then got wiped by
// getRouteFromPath's old fallthrough to "not-found" the moment React
// hydrated. Content below is grounded in this codebase's actual, verified
// behavior (see README.md, src/server/env.ts, src/server/app.ts) — not
// generic boilerplate.
interface StaticPageSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
}
interface StaticPageContent {
  title: string;
  description: string;
  h1: string;
  updated?: string;
  sections: StaticPageSection[];
}

const STATIC_PAGE_CONTENT: Record<string, StaticPageContent> = {
  "/privacy": {
    title: "Privacy Policy — XFree.in",
    description: "How XFree.in handles data: local tools stay local; AI-assisted tools proxy to Google Gemini or NVIDIA NIM. What we log and what we don't.",
    h1: "Privacy Policy",
    updated: "2026-09-07",
    sections: [
      {
        paragraphs: [
          "XFree.in (\"XFree\", \"we\", \"us\") provides free, browser-based developer, SEO, and AI micro-tools. This page explains what happens to your data when you use them.",
        ],
      },
      {
        heading: "Local Mode tools",
        paragraphs: [
          "Most published tools run entirely in your browser using client-side JavaScript. Input you paste or upload into a Local Mode tool is processed on your device and is never transmitted to XFree's servers. Closing the tab clears it from memory.",
        ],
      },
      {
        heading: "AI-assisted tools (Cloud Mode)",
        paragraphs: [
          "Tools that use AI send your input to XFree's server, which forwards it to Google Gemini or the NVIDIA NIM API to generate a response. This is disclosed on the tool itself before you submit anything. We do not send client-supplied system prompts to either provider — only a fixed, server-defined instruction for that specific task.",
          "Requests are rate-limited per IP address and capped by a global daily limit to prevent abuse. We do not use your input to train models we operate.",
        ],
      },
      {
        heading: "Contact, feedback, and lead forms",
        paragraphs: [
          "If you submit the contact, feedback, or tool-request forms, the email address and message you provide are sent to our inbox (via Resend, when configured) or logged server-side for review. We use this solely to respond to you or improve XFree.",
        ],
      },
      {
        heading: "Cookies and advertising",
        paragraphs: [
          "XFree displays Google AdSense advertising, which sets its own cookies and may use them for ad personalization, subject to Google's own privacy policy. You can manage ad personalization through Google's Ad Settings or your browser's cookie controls. XFree itself does not set tracking or analytics cookies beyond what AdSense requires to function.",
        ],
      },
      {
        heading: "Accounts and data retention",
        paragraphs: [
          "XFree requires no account or sign-up for any published tool. We don't maintain user profiles. Rate-limit counters are held in memory (or Redis, if configured) and expire automatically; they are not a record of what you processed.",
        ],
      },
      {
        heading: "Children's privacy",
        paragraphs: [
          "XFree is not directed at children under 13 and we do not knowingly collect personal information from them.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We'll update the date above when this policy changes. Continued use of XFree after a change means you accept the update.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about this policy: use the contact form, or email contact@xfree.in.",
        ],
      },
    ],
  },
  "/terms": {
    title: "Terms of Service — XFree.in",
    description: "Terms of service for XFree.in's free browser-based developer and AI micro-tools.",
    h1: "Terms of Service",
    updated: "2026-09-07",
    sections: [
      {
        paragraphs: [
          "By using XFree.in (\"XFree\"), you agree to these terms. If you don't agree, please don't use the service.",
        ],
      },
      {
        heading: "The service",
        paragraphs: [
          "XFree provides free, browser-based developer, SEO, and single-purpose AI tools. No account or payment is required for any published tool. We may add, change, or remove tools at any time.",
        ],
      },
      {
        heading: "Acceptable use",
        list: [
          "Don't use XFree for anything illegal, or to process data you don't have the right to process.",
          "Don't attempt to bypass rate limits, security controls, or the AI task allowlist.",
          "Don't use automated scraping against XFree's tool pages beyond what robots.txt permits.",
          "Don't submit confidential or sensitive data to AI-assisted (Cloud Mode) tools — see the Privacy Policy for how that data is handled.",
        ],
      },
      {
        heading: "AI-generated output",
        paragraphs: [
          "AI-assisted tools can produce inaccurate, incomplete, or misleading output. Review any AI-generated content before relying on it, especially for production, legal, medical, or financial use.",
        ],
      },
      {
        heading: "No warranty",
        paragraphs: [
          "XFree is provided \"as is\" and \"as available,\" without warranties of any kind, express or implied. We don't guarantee the service will be uninterrupted, error-free, or fit for a particular purpose.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "To the fullest extent permitted by law, XFree and its operators aren't liable for any indirect, incidental, or consequential damages arising from your use of the service, including data loss or reliance on tool output.",
        ],
      },
      {
        heading: "Third-party services",
        paragraphs: [
          "XFree's AI features rely on Google Gemini and NVIDIA NIM; the site displays Google AdSense. Your use of features backed by these providers is also subject to their own terms.",
        ],
      },
      {
        heading: "Changes to these terms",
        paragraphs: [
          "We may update these terms; the date above reflects the last change. Continued use after an update means you accept it.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about these terms: use the contact form, or email contact@xfree.in.",
        ],
      },
    ],
  },
  "/trust": {
    title: "Trust & Security — XFree.in",
    description: "XFree.in's security posture: CSP, rate limits, request validation, and how AI endpoints are hardened against abuse.",
    h1: "Trust & Security",
    sections: [
      {
        paragraphs: [
          "XFree is built with a security-first server, even though most tools process data entirely in your browser.",
        ],
      },
      {
        heading: "What we do",
        list: [
          "Zod schema validation on every AI, contact, feedback, and lead request body — malformed or oversized requests are rejected before any processing.",
          "A fixed, server-side task allowlist for AI features — the browser can select a task, but never supply its own system prompt.",
          "Per-IP and global daily rate limits on AI endpoints, with a stricter separate cap on deep-reasoning requests.",
          "A strict Content-Security-Policy, HSTS, X-Frame-Options: DENY, and a restrictive Permissions-Policy on every response, including static files.",
          "A central error handler that returns a request ID instead of a stack trace in production.",
          "API keys (Google Gemini, NVIDIA NIM, Resend) are read from server-side environment variables only and never reach the browser.",
        ],
      },
      {
        heading: "Reporting a vulnerability",
        paragraphs: [
          "Please report security issues privately via the contact form rather than a public issue — see the project's SECURITY.md for the full policy.",
        ],
      },
    ],
  },
  "/about": {
    title: "About XFree.in",
    description: "About the XFree.in micro-tools platform: what it is, and the principles it's built on.",
    h1: "About XFree.in",
    sections: [
      {
        paragraphs: [
          "XFree.in is a small, focused platform of free, browser-based developer, SEO, and single-purpose AI tools — built for developers, SEOs, and technical writers who want a quick utility without an account, a paywall, or a data-collection catch.",
        ],
      },
      {
        heading: "Principles",
        list: [
          "Local Mode by default — most tools process your input in your browser, not on a server.",
          "No account or signup required for any published tool.",
          "AI features are opt-in and clearly labelled before you submit anything.",
          "We publish only what actually works — draft or planned tools are excluded from navigation, search, and the sitemap until they're real.",
        ],
      },
    ],
  },
  "/contact": {
    title: "Contact XFree.in",
    description: "Contact XFree.in for bug reports, tool requests, or partnership inquiries.",
    h1: "Contact us",
    sections: [
      {
        paragraphs: [
          "Found a bug, have a tool request, or a partnership inquiry? Email contact@xfree.in — we read every message. For security issues specifically, please report them privately (see the Security page) rather than publicly.",
        ],
      },
    ],
  },
  "/faq": {
    title: "Frequently Asked Questions — XFree.in",
    description: "Common questions about XFree.in: pricing, privacy, AI features, and how tools work.",
    h1: "FAQ",
    sections: [
      {
        heading: "Is XFree really free?",
        paragraphs: ["Yes — every published tool is free, with no account, signup, or usage cap."],
      },
      {
        heading: "Does XFree see my data?",
        paragraphs: ["Only if you use an AI-assisted (Cloud Mode) tool, and only what you submit to it — clearly disclosed on that tool's page. Local Mode tools never send your input anywhere."],
      },
      {
        heading: "Which AI providers does XFree use?",
        paragraphs: ["Google Gemini for the AI task endpoints, and NVIDIA NIM for XFree Studio's Cloud Mode chat gateway. Both are proxied server-side — no API key ever reaches your browser."],
      },
      {
        heading: "Why are some pillars not linked to a working tool yet?",
        paragraphs: ["XFree organizes its catalogue into topic pillars ahead of building every tool in them. A pillar page describes the category honestly even where not every listed capability has shipped yet."],
      },
    ],
  },
  "/how-it-works": {
    title: "How XFree.in Works",
    description: "How the XFree.in micro-tools platform works: local execution vs. AI proxy, and where your data goes.",
    h1: "How XFree.in works",
    sections: [
      {
        heading: "1. Search or browse",
        paragraphs: ["Find a tool via search, the category dropdowns, or the pillar directory."],
      },
      {
        heading: "2. Paste & execute",
        paragraphs: ["Drop in your input — JSON, text, a URL, code. Local Mode tools process it immediately in your browser; AI-assisted tools send it to XFree's rate-limited server, which proxies to Google Gemini or NVIDIA NIM."],
      },
      {
        heading: "3. Copy & ship",
        paragraphs: ["One-click copy to clipboard, or export as a file. Nothing is saved server-side unless the tool explicitly says so."],
      },
    ],
  },
  "/use-cases": {
    title: "Use Cases — XFree.in",
    description: "Real-world workflows powered by XFree.in developer and SEO micro-tools.",
    h1: "Use cases",
    sections: [
      {
        paragraphs: ["A few ways teams use XFree in day-to-day work:"],
        list: [
          "Auditing a site's crawlability with the sitemap generator and robots.txt tools before a launch.",
          "Debugging an API response by formatting and diffing JSON payloads.",
          "Testing a regex pattern against real sample strings before shipping it.",
          "Generating and sanity-checking a cron schedule for a new background job.",
          "Building UTM-tagged campaign links without a spreadsheet.",
          "Checking password strength or generating a strong password before setting up a new account.",
        ],
      },
    ],
  },
  "/docs": {
    title: "Documentation — XFree.in",
    description: "Documentation for XFree.in tools: how they work, their limits, and how the platform is built.",
    h1: "Documentation",
    sections: [
      {
        paragraphs: [
          "Each published tool page includes its own \"How to use\" steps, an explanation of what it does, and an FAQ covering its specific limits. That's the primary reference — open any tool from the homepage or a pillar page to see it.",
          "For how the platform itself is built — architecture, security, deployment — see the project's README on GitHub.",
        ],
      },
    ],
  },
  "/blog": {
    title: "Blog — XFree.in",
    description: "Articles and updates from the XFree.in team.",
    h1: "Blog",
    sections: [
      {
        paragraphs: ["No posts published yet — check back soon."],
      },
    ],
  },
  "/xfree-app": {
    title: "XFree App — Install the Free Browser-Based Developer & SEO Toolkit",
    description: "Install XFree as a Progressive Web App on desktop, Android, or iOS to use free developer, SEO, formatting, and AI tools without a browser tab.",
    h1: "XFree App",
    sections: [
      {
        paragraphs: [
          "XFree is installable as a Progressive Web App. Add it to your desktop dock or mobile home screen for one-tap access to every tool. Everything still runs in your browser — installing is just a shortcut, not a separate binary.",
        ],
      },
      {
        heading: "Install",
        list: [
          "Desktop Chrome/Edge: click the install icon in the address bar, or the browser menu → \"Install XFree.\"",
          "Android Chrome: browser menu → \"Add to Home screen.\"",
          "iOS Safari: Share → \"Add to Home Screen.\"",
        ],
      },
    ],
  },
  "/guides": {
    title: "Guides — XFree.in",
    description: "Practical guides for developers and SEOs on regex, cron, JSON errors, canonical vs redirect, and more.",
    h1: "Guides",
    sections: [
      {
        paragraphs: ["Short, practical guides for developers and SEOs, each a standalone reference with runnable examples."],
      },
    ],
  },
};

const StaticPage: React.FC<{ path: string; onNavigate: (path: string) => void }> = ({ path, onNavigate }) => {
  const content = STATIC_PAGE_CONTENT[path];

  const canonical = `https://www.xfree.in${path}`;
  useDocumentMeta({
    title: content?.title || "XFree.in",
    description: content?.description,
    canonical,
    jsonLd: content
      ? [
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: content.title,
            description: content.description,
            url: canonical,
          },
        ]
      : undefined,
  });

  if (!content) {
    return (
      <section className="py-16 px-4 pt-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Page not found</h1>
        <button onClick={() => onNavigate("/")} className="cyber-btn cyber-btn-filled text-sm px-6 py-3 rounded focus-ring">
          <span>Back to Home →</span>
        </button>
      </section>
    );
  }

  return (
    <article className="prose prose-invert max-w-3xl mx-auto py-12 px-4">
      <div className="cyber-card p-6 sm:p-9 rounded-xl mb-8">
        <button onClick={() => onNavigate("/")} className="cyber-btn text-xs px-4 py-2 mb-6 rounded focus-ring">
          ← Back
        </button>
        <h1 className="text-3xl font-black text-white font-mono mb-2">{content.h1}</h1>
        {content.updated && (
          <p className="text-cyber-muted text-xs font-mono mb-8">Last updated {content.updated}</p>
        )}
        <div className="space-y-8">
          {content.sections.map((section, i) => (
            <section key={i}>
              {section.heading && (
                <h2 className="text-lg font-bold text-white font-mono mb-3">{section.heading}</h2>
              )}
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="text-cyber-text leading-relaxed mb-3">{p}</p>
              ))}
              {section.list && (
                <ul className="list-disc list-inside space-y-1.5 text-cyber-muted">
                  {section.list.map((li, k) => (
                    <li key={k}>{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
};

// ===== Main App Component =====
// ===== Saved workspace (favorites + history) =====
// Real localStorage-backed persistence for SavedDrawer. Deliberately does
// NOT implement workspacePresets (save/load a tool's full input/output
// config) — that needs each interactive tool component to expose its
// current state for saving, which none of them do today. Leaving that tab
// as SavedDrawer's own real "empty" state rather than faking it.
const FAVORITES_KEY = "xfree_favorites";
const HISTORY_KEY = "xfree_history";
const HISTORY_LIMIT = 30;

function useSavedWorkspace() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [history, setHistory] = useState<SavedItem[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Storage full or unavailable (private browsing) — favorites just
      // won't persist across reloads; not worth surfacing as an error.
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // See above.
    }
  }, [history]);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [toolId, ...prev]));
  }, []);

  const removeFavorite = useCallback((toolId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== toolId));
  }, []);

  const addHistory = useCallback((toolId: string, toolTitle: string, inputSnippet: string, outputSnippet: string) => {
    setHistory((prev) => {
      const entry: SavedItem = {
        id: `${toolId}-${Date.now()}`,
        toolId,
        toolTitle,
        timestamp: Date.now(),
        inputSnippet: inputSnippet.slice(0, 80),
        outputSnippet: outputSnippet.slice(0, 80),
      };
      return [entry, ...prev].slice(0, HISTORY_LIMIT);
    });
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { favorites, history, toggleFavorite, removeFavorite, addHistory, clearHistory };
}

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>(() => getRouteFromPath(window.location.pathname));
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const saved = useSavedWorkspace();
  const [searchInitialQuery, setSearchInitialQuery] = useState("");

  const navigate = useCallback((path: string) => {
    setRoute(getRouteFromPath(path));
    window.history.pushState({}, "", path);
  }, []);

  const openSearch = useCallback((query = "") => {
    setSearchInitialQuery(query);
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      setRoute(getRouteFromPath(path));
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Global ⌘K / Ctrl+K: works from anywhere on the site, not just while a
  // page-local search input has focus.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const renderContent = useCallback(() => {
    switch (route.type) {
      case "home":
        return (
          <>
            <Hero onNavigate={navigate} onOpenSearch={openSearch} />
            <MetricsTicker />
            <CategoriesSection />
            <FeaturedTools />
            <WhyXFree />
            <StudioPromo />
            <LatestGuides onNavigate={navigate} />
            <HowItWorks />
            <PillarsDirectory
              onSelect={(slug) => navigate(`/pillars/${slug}`)}
              limit={16}
              onViewAll={() => navigate("/pillars")}
            />
            <FAQSection />
            <ClosingCta onNavigate={navigate} />
          </>
        );

      case "pillars-list":
        return <PillarsDirectory onSelect={(slug) => navigate(`/pillars/${slug}`)} />;

      case "pillar-detail":
        return <PillarDetail slug={route.slug} onBack={() => navigate("/pillars")} />;

      case "category-hub":
        return <CategoryHub categoryId={route.categoryId} onBack={() => navigate("/")} onSelect={(slug) => navigate(`/pillars/${slug}`)} />;

      case "tool-detail":
        return (
          <ToolDetail
            slug={route.slug}
            onBack={() => navigate("/")}
            favorites={saved.favorites}
            onToggleFavorite={saved.toggleFavorite}
            onSaveHistory={saved.addHistory}
          />
        );

      case "guides-list":
        return <GuidesList onNavigate={navigate} />;

      case "guide-detail":
        return <GuideDetail slug={route.slug} onNavigate={navigate} />;

      case "signals":
        return <SignalsPage onNavigate={navigate} />;

      case "thinking":
        return <ThinkingModePage onNavigate={navigate} />;

      case "clusters":
        return <ClustersPage onNavigate={navigate} onOpenSearch={openSearch} />;

      case "static-page":
        return <StaticPage path={route.path} onNavigate={navigate} />;

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
    // saved.favorites/history are read inside the "tool-detail" case above
    // (for the star toggle + history log) — without them here this callback
    // memoizes a stale closure that never sees favorite/history updates,
    // even though saved.* state does change and re-renders App.
  }, [route, navigate, saved.favorites, saved.history]);

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
        // Only real, verified profiles belong here — an unverifiable or
        // wrong sameAs URL is a false entity-authority signal, not a
        // harmless placeholder.
        sameAs: ["https://github.com/CodesbyFebin/xfree"],
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

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text">
      <Header
        onNavigate={navigate}
        currentPath={window.location.pathname}
        onOpenSaved={() => setSavedOpen(true)}
        savedCount={saved.favorites.length}
      />

      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        initialQuery={searchInitialQuery}
        tools={INDEXABLE_TOOLS}
        onSelectTool={(slug) => navigate(`/tools/${slug}`)}
      />

      <GeminiChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <SavedDrawer
        isOpen={savedOpen}
        onClose={() => setSavedOpen(false)}
        favorites={saved.favorites}
        history={saved.history}
        tools={INDEXABLE_TOOLS}
        onSelectTool={(toolId) => {
          const t = INDEXABLE_TOOLS.find((t) => t.id === toolId);
          if (t) navigate(`/tools/${t.slug}`);
        }}
        onClearHistory={saved.clearHistory}
        onRemoveFavorite={saved.removeFavorite}
      />

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-cyber-glow text-cyber-bg shadow-lg shadow-cyber-glow/30 flex items-center justify-center hover:scale-105 transition-transform focus-ring"
          aria-label="Open XFree AI Assistant"
          title="Ask the XFree AI Assistant"
        >
          <span className="text-xl" aria-hidden="true">✦</span>
        </button>
      )}

      <main id="main-content" className="relative">
        {renderContent()}
      </main>

      <footer className="border-t border-cyber-border bg-cyber-surface py-14 px-4" role="contentinfo">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 pb-8 border-b border-cyber-border">
            <span className="text-2xl font-black text-white font-cyber">
              XFree<span className="text-cyber-glow">.in</span>
            </span>
            <p className="mt-2 text-sm text-cyber-muted max-w-xl">
              XFree provides privacy-first browser tools for developers, technical teams, and creators. Local Mode
              is used by default for supported operations, with no signup required.
            </p>
            <a
              href="https://app.xfree.in/"
              rel="noopener"
              className="inline-block mt-3 text-sm text-cyber-glow hover:text-white transition-colors"
            >
              Open XFree Studio →
            </a>
            <p className="mt-3 text-xs text-cyber-dim font-mono">
              {TOOL_COUNT} published tools and {PILLAR_COUNT} pillar hubs are currently available.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-10">
            <nav aria-label="Category links">
              <h2 className="text-xs font-bold text-white uppercase tracking-wide mb-3 font-mono">Categories</h2>
              <ul className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => navigate(`/${cat.id}`)}
                      className="text-sm text-cyber-muted hover:text-white text-left cursor-pointer"
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Popular tool links">
              <h2 className="text-xs font-bold text-white uppercase tracking-wide mb-3 font-mono">Popular Tools</h2>
              <ul className="space-y-2">
                <li><a href="/tools/json-formatter" className="text-sm text-cyber-muted hover:text-white">JSON Formatter</a></li>
                <li><a href="/tools/regex-tester" className="text-sm text-cyber-muted hover:text-white">Regex Tester</a></li>
                <li><a href="/tools/xml-sitemap-generator" className="text-sm text-cyber-muted hover:text-white">Sitemap Generator</a></li>
                <li><a href="/tools/meta-tag-generator" className="text-sm text-cyber-muted hover:text-white">Meta Tag Generator</a></li>
                <li><a href="/tools/jwt-decoder" className="text-sm text-cyber-muted hover:text-white">JWT Decoder</a></li>
                <li><a href="/tools/cron-generator" className="text-sm text-cyber-muted hover:text-white">Cron Generator</a></li>
              </ul>
            </nav>

            <nav aria-label="Tool hub links">
              <h2 className="text-xs font-bold text-white uppercase tracking-wide mb-3 font-mono">Tool Hubs</h2>
              <ul className="space-y-2">
                <li><a href="/pillars/json-data-tools" className="text-sm text-cyber-muted hover:text-white">JSON &amp; Data Tools</a></li>
                <li><a href="/pillars/encoding-tools" className="text-sm text-cyber-muted hover:text-white">Encoding Tools</a></li>
                <li><a href="/pillars/url-tools" className="text-sm text-cyber-muted hover:text-white">URL &amp; Web Tools</a></li>
                <li><a href="/pillars/schema-tools" className="text-sm text-cyber-muted hover:text-white">Schema Tools</a></li>
                <li><a href="/pillars/regex-tools" className="text-sm text-cyber-muted hover:text-white">Regex Tools</a></li>
                <li><a href="/pillars/security-tools" className="text-sm text-cyber-muted hover:text-white">Security Tools</a></li>
              </ul>
            </nav>

            <nav aria-label="Explore links">
              <h2 className="text-xs font-bold text-white uppercase tracking-wide mb-3 font-mono">Explore</h2>
              <ul className="space-y-2">
                <li><a href="/pillars" className="text-sm text-cyber-muted hover:text-white">All Pillars</a></li>
                <li><a href="/guides" className="text-sm text-cyber-muted hover:text-white">Guides</a></li>
                <li><a href="/updates" className="text-sm text-cyber-muted hover:text-white">XFree Signals</a></li>
                <li><a href="/use-cases" className="text-sm text-cyber-muted hover:text-white">Use Cases</a></li>
                <li><a href="/how-it-works" className="text-sm text-cyber-muted hover:text-white">How It Works</a></li>
                <li><a href="/docs" className="text-sm text-cyber-muted hover:text-white">Documentation</a></li>
              </ul>
            </nav>

            <nav aria-label="Company links">
              <h2 className="text-xs font-bold text-white uppercase tracking-wide mb-3 font-mono">Company</h2>
              <ul className="space-y-2">
                <li><a href="/about" className="text-sm text-cyber-muted hover:text-white">About</a></li>
                <li><a href="/contact" className="text-sm text-cyber-muted hover:text-white">Contact</a></li>
                <li><a href="/faq" className="text-sm text-cyber-muted hover:text-white">FAQ</a></li>
                <li><a href="/trust" className="text-sm text-cyber-muted hover:text-white">Trust &amp; Security</a></li>
                <li><a href="https://github.com/CodesbyFebin/xfree" className="text-sm text-cyber-muted hover:text-white" rel="noopener">GitHub</a></li>
              </ul>
            </nav>

            <nav aria-label="Legal links">
              <h2 className="text-xs font-bold text-white uppercase tracking-wide mb-3 font-mono">Legal</h2>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-sm text-cyber-muted hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="text-sm text-cyber-muted hover:text-white">Terms of Service</a></li>
                <li><a href="/.well-known/security.txt" className="text-sm text-cyber-muted hover:text-white">Security.txt</a></li>
                <li><a href="/sitemap.xml" className="text-sm text-cyber-muted hover:text-white">Sitemap</a></li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-cyber-border pt-6 text-center">
            <p className="text-xs text-cyber-dim">
              © {new Date().getFullYear()} XFree. MIT License. {PILLAR_COUNT} approved pillars, {TOOL_COUNT} verified tools.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;