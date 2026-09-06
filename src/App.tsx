import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { PUBLIC_TOOLS, getPublicToolBySlug } from "./data/publicTools";
import { GENERATED_PUBLISHED_CONTENT } from "./data/generatedPublishedContent";
import { isStaticRoute as isKnownStaticRoute, categorySlugFromPath, guideSlugFromPath } from "./data/routes";
import { findGuide } from "./data/guides";
import { ToolCategory, SavedItem, ToolDefinition, WorkspacePreset } from "./types";
import { Header } from "./components/Header";
import { HeroBanner } from "./components/HeroBanner";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { HowItWorksStrip } from "./components/landing/HowItWorksStrip";
import { ArchitectureSection } from "./components/landing/ArchitectureSection";
import { UseCasesStrip } from "./components/landing/UseCasesStrip";
import { SecuritySection } from "./components/landing/SecuritySection";
import { FaqStrip } from "./components/landing/FaqStrip";
import { FinalCta } from "./components/landing/FinalCta";
import { QuickLinksSection } from "./components/QuickLinksSection";
import { PopularAndCategoriesSection } from "./components/PopularAndCategoriesSection";
import { ResourceHubSection } from "./components/ResourceHubSection";
import { Footer } from "./components/Footer";
import { ToolCard } from "./components/ToolCard";
import { CommandPalette } from "./components/CommandPalette";
import { SavedDrawer } from "./components/SavedDrawer";
import { ToolPageLayout } from "./components/ToolPageLayout";
import { GeminiChatDrawer } from "./components/GeminiChatDrawer";
import { CategoryHubView } from "./components/CategoryHubView";
import { useMetaTags } from "./hooks/useMetaTags";

// Static pages and tool components are route-gated (only one renders at a
// time), so they're lazy-loaded into their own chunks instead of bloating the
// initial bundle every visitor downloads just to see the homepage.
// prerender.ts injects meta/JSON-LD into a static HTML shell without
// server-rendering these components, so there's no SSR/Suspense hazard here.
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { LeadFunnelPopup } from "./components/LeadFunnelPopup";

const HowItWorksPage = lazy(() => import("./components/pages/HowItWorksPage").then((m) => ({ default: m.HowItWorksPage })));
const UseCasesPage = lazy(() => import("./components/pages/UseCasesPage").then((m) => ({ default: m.UseCasesPage })));
const DocsHubPage = lazy(() => import("./components/pages/DocsHubPage").then((m) => ({ default: m.DocsHubPage })));
const BlogPage = lazy(() => import("./components/pages/BlogPage").then((m) => ({ default: m.BlogPage })));
const FaqPage = lazy(() => import("./components/pages/FaqPage").then((m) => ({ default: m.FaqPage })));
const AboutPage = lazy(() => import("./components/pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("./components/pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import("./components/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./components/pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const SecurityPage = lazy(() => import("./components/pages/SecurityPage").then((m) => ({ default: m.SecurityPage })));
const XFreeAppPage = lazy(() => import("./components/pages/XFreeAppPage").then((m) => ({ default: m.XFreeAppPage })));
const GuideIndexPage = lazy(() => import("./components/pages/GuideIndexPage").then((m) => ({ default: m.GuideIndexPage })));
const GuidePage = lazy(() => import("./components/pages/GuidePage").then((m) => ({ default: m.GuidePage })));
const StudioPage = lazy(() => import("./components/pages/StudioPage").then((m) => ({ default: m.StudioPage })));
const GeneratedToolPage = lazy(() => import("./components/pages/GeneratedToolPage").then((m) => ({ default: m.GeneratedToolPage })));

const BulkUrlExtractorSitemap = lazy(() => import("./components/tools/BulkUrlExtractorSitemap").then((m) => ({ default: m.BulkUrlExtractorSitemap })));
const RobotsTxtGenerator = lazy(() => import("./components/tools/RobotsTxtGenerator").then((m) => ({ default: m.RobotsTxtGenerator })));
const MetaTagOpenGraphPreview = lazy(() => import("./components/tools/MetaTagOpenGraphPreview").then((m) => ({ default: m.MetaTagOpenGraphPreview })));
const SchemaMarkupGenerator = lazy(() => import("./components/tools/SchemaMarkupGenerator").then((m) => ({ default: m.SchemaMarkupGenerator })));
const UrlSlugUtmBuilder = lazy(() => import("./components/tools/UrlSlugUtmBuilder").then((m) => ({ default: m.UrlSlugUtmBuilder })));
const JsonFormatterValidatorDiff = lazy(() => import("./components/tools/JsonFormatterValidatorDiff").then((m) => ({ default: m.JsonFormatterValidatorDiff })));
const RegexTesterExplainer = lazy(() => import("./components/tools/RegexTesterExplainer").then((m) => ({ default: m.RegexTesterExplainer })));
const CronExpressionGenerator = lazy(() => import("./components/tools/CronExpressionGenerator").then((m) => ({ default: m.CronExpressionGenerator })));
const Base64JwtDecoder = lazy(() => import("./components/tools/Base64JwtDecoder").then((m) => ({ default: m.Base64JwtDecoder })));
const TimestampColorConverter = lazy(() => import("./components/tools/TimestampColorConverter").then((m) => ({ default: m.TimestampColorConverter })));
const TextDiffChecker = lazy(() => import("./components/tools/TextDiffChecker").then((m) => ({ default: m.TextDiffChecker })));
const AiMicroToolComponent = lazy(() => import("./components/tools/AiMicroToolComponent").then((m) => ({ default: m.AiMicroToolComponent })));

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm" role="status" aria-live="polite">
      Loading…
    </div>
  );
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [activeView, setActiveView] = useState<"tools" | "category-hub" | "page">("tools");
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  // Persistence State
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("xfree_favorites") || "[]");
    } catch {
      return [];
    }
  });

  const [savedHistory, setSavedHistory] = useState<SavedItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("xfree_history") || "[]");
    } catch {
      return [];
    }
  });

  const [workspacePresets, setWorkspacePresets] = useState<WorkspacePreset[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("xfree_workspace_configs") || "[]");
    } catch {
      return [];
    }
  });

  // Handle browser popstate / back / forward navigation
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      window.scrollTo(0, 0);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem("xfree_favorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem("xfree_history", JSON.stringify(savedHistory));
  }, [savedHistory]);

  const navigateTo = (path: string) => {
    const url = new URL(path, window.location.origin);
    window.history.pushState({}, "", `${url.pathname}${url.search}`);
    setCurrentPath(url.pathname);
    if (["/how-it-works", "/use-cases", "/docs", "/blog", "/faq", "/about", "/contact", "/privacy", "/terms", "/security", "/xfree-app"].includes(path)) {
      setActiveView("page");
    } else if (path === "/") {
      setActiveView("tools");
    }
    window.scrollTo(0, 0);
  };

  const toggleFavorite = (toolId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSaveHistory = (toolId: string, toolTitle: string, inputSnippet: string, outputSnippet: string) => {
    const newItem: SavedItem = {
      id: `${toolId}-${Date.now()}`,
      toolId,
      toolTitle,
      timestamp: Date.now(),
      inputSnippet,
      outputSnippet,
    };
    setSavedHistory((prev) => [newItem, ...prev.slice(0, 19)]);
  };

  const handleSaveWorkspace = (presetData: Omit<WorkspacePreset, "id" | "timestamp">) => {
    const newPreset: WorkspacePreset = {
      ...presetData,
      id: `preset_${Date.now()}`,
      timestamp: Date.now(),
    };
    setWorkspacePresets((prev) => [newPreset, ...prev]);
  };

  const handleDeleteWorkspace = (presetId: string) => {
    setWorkspacePresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  const handleLoadWorkspacePreset = (preset: WorkspacePreset) => {
    navigateTo(`/tools/${preset.toolSlug}`);
  };

  const clearHistory = () => {
    setSavedHistory([]);
  };

  // Find active tool if path is /tools/:slug — no dynamic thin-content generation.
  const activeToolSlug = currentPath.startsWith("/tools/") ? currentPath.replace("/tools/", "").replace(/\/$/, "") : null;
  const activeTool = useMemo(() => {
    if (!activeToolSlug) return null;
    // IMPORTANT: only INDEXABLE tools render. Draft/planned slugs fall through
    // to the 404 view so the client agrees with the server's HTTP 404 rather
    // than hydrating a fake "planned utility" page over a 404 shell.
    return getPublicToolBySlug(activeToolSlug) ?? null;
  }, [activeToolSlug]);
  const activeGeneratedPage = useMemo(
    () => activeToolSlug && !activeTool ? GENERATED_PUBLISHED_CONTENT[activeToolSlug] ?? null : null,
    [activeTool, activeToolSlug],
  );

  const activeGuideSlug = guideSlugFromPath(currentPath);
  const activeGuide = useMemo(() => (activeGuideSlug ? findGuide(activeGuideSlug) ?? null : null), [activeGuideSlug]);

  const isKnownRoute = useMemo(() => {
    if (currentPath === "/") return true;
    if (isKnownStaticRoute(currentPath)) return true;
    if (categorySlugFromPath(currentPath)) return true;
    if (activeToolSlug) return Boolean(activeTool || activeGeneratedPage);
    if (activeGuideSlug) return Boolean(activeGuide);
    return false;
  }, [currentPath, activeTool, activeToolSlug, activeGeneratedPage, activeGuide, activeGuideSlug]);

  // Hook for dynamic head meta tag management (SEO pSEO pillar keywords & JSON-LD schemas)
  useMetaTags({
    tool: activeTool,
    generatedPage: activeGeneratedPage,
    currentPath,
  });

  // Filter tools based on category and search
  const filteredTools = useMemo(() => {
    return PUBLIC_TOOLS.filter((tool) => {
      const matchesCategory =
        activeCategory === "all" ||
        tool.category === activeCategory ||
        (activeCategory === "seo-tools" && (tool.category as string) === "seo-url") ||
        (activeCategory === "developer-tools" && (tool.category as string) === "developer");

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesQuery =
        tool.title.toLowerCase().includes(query) ||
        tool.shortDescription.toLowerCase().includes(query) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        (tool.pillarKeyword && tool.pillarKeyword.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  // Render micro-tool component based on ID or fallback
  const renderToolComponent = (tool: ToolDefinition) => {
    const saveHist = (inSnip: string, outSnip: string) => {
      handleSaveHistory(tool.id, tool.title, inSnip, outSnip);
    };

    switch (tool.id) {
      case "bulk-url-sitemap":
      case "xml-sitemap-generator":
        return <BulkUrlExtractorSitemap tool={tool} onSaveHistory={saveHist} />;
      case "robots-txt-generator":
        return <RobotsTxtGenerator tool={tool} onSaveHistory={saveHist} />;
      case "meta-tag-generator":
        return <MetaTagOpenGraphPreview tool={tool} onSaveHistory={saveHist} />;
      case "schema-markup-generator":
        return <SchemaMarkupGenerator tool={tool} onSaveHistory={saveHist} />;
      case "url-slug-utm-builder":
        return <UrlSlugUtmBuilder tool={tool} onSaveHistory={saveHist} />;
      case "json-formatter":
        return <JsonFormatterValidatorDiff tool={tool} onSaveHistory={saveHist} />;
      case "regex-tester":
        return <RegexTesterExplainer tool={tool} onSaveHistory={saveHist} />;
      case "cron-expression-generator":
        return <CronExpressionGenerator tool={tool} onSaveHistory={saveHist} />;
      case "base64-encoder-decoder":
        return <Base64JwtDecoder tool={tool} onSaveHistory={saveHist} />;
      case "timestamp-color-converter":
        return <TimestampColorConverter tool={tool} onSaveHistory={saveHist} />;
      case "text-diff-checker":
        return <TextDiffChecker tool={tool} onSaveHistory={saveHist} />;
      default:
        return <AiMicroToolComponent tool={tool} onSaveHistory={saveHist} />;
    }
  };

  // Render Static SEO/Trust Page Content if path matches
  const renderStaticPage = () => {
    switch (currentPath) {
      case "/how-it-works":
        return <HowItWorksPage onGoHome={() => navigateTo("/")} onSelectCategory={(cat) => { setActiveCategory(cat as any); navigateTo("/"); }} />;
      case "/use-cases":
        return <UseCasesPage onGoHome={() => navigateTo("/")} onSelectCategory={(cat) => { setActiveCategory(cat as any); navigateTo("/"); }} onSelectTool={(slug) => navigateTo(`/tools/${slug}`)} />;
      case "/docs":
        return <DocsHubPage onGoHome={() => navigateTo("/")} onSelectTool={(slug) => navigateTo(`/tools/${slug}`)} />;
      case "/blog":
        return <BlogPage onGoHome={() => navigateTo("/")} onSelectTool={(slug) => navigateTo(`/tools/${slug}`)} onNavigatePage={navigateTo} />;
      case "/faq":
        return <FaqPage onGoHome={() => navigateTo("/")} />;
      case "/about":
        return <AboutPage onGoHome={() => navigateTo("/")} />;
      case "/contact":
        return <ContactPage onGoHome={() => navigateTo("/")} />;
      case "/privacy":
        return <PrivacyPage />;
      case "/terms":
        return <TermsPage />;
      case "/security":
        return <SecurityPage />;
      case "/xfree-app":
        return <XFreeAppPage onGoHome={() => navigateTo("/")} onOpenTools={() => navigateTo("/")} />;
      case "/studio":
        return <StudioPage />;
      case "/guides":
        return <GuideIndexPage onSelectGuide={(slug) => navigateTo(`/guides/${slug}`)} />;
      default:
        if (activeGuide) {
          return (
            <GuidePage
              guide={activeGuide}
              onGoIndex={() => navigateTo("/guides")}
              onSelectTool={(slug) => navigateTo(`/tools/${slug}`)}
              onSelectGuide={(slug) => navigateTo(`/guides/${slug}`)}
            />
          );
        }
        return null;
    }
  };

  const isStaticRoute = ["/how-it-works", "/use-cases", "/docs", "/blog", "/faq", "/about", "/contact", "/privacy", "/terms", "/security", "/xfree-app", "/studio", "/guides"].includes(currentPath) || activeGuideSlug !== null;

  return (
    <div className="min-h-screen starry-bg text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Skip-to-content link — visible only when keyboard-focused (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-slate-950 focus:font-bold focus:rounded-lg"
      >
        Skip to main content
      </a>
      {/* Global Application Navigation Header */}
      <Header
        totalTools={PUBLIC_TOOLS.length}
        onOpenSearch={() => setCommandPaletteOpen(true)}
        onOpenSaved={() => setSavedDrawerOpen(true)}
        onOpenChat={() => setChatDrawerOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId as any);
          setActiveView("category-hub");
          if (isStaticRoute || currentPath.startsWith("/tools/")) navigateTo("/");
        }}
        favoritesCount={favoriteIds.length}
        historyCount={savedHistory.length}
        onGoHome={() => {
          setActiveView("tools");
          navigateTo("/");
        }}
        activeView={activeView}
      />

      {/* Main Layout Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
        {!isKnownRoute ? (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <NotFoundPage onGoHome={() => navigateTo("/")} path={currentPath} />
          </div>
        ) : isStaticRoute ? (
          /* Render Static Page View */
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <Suspense fallback={<PageLoadingFallback />}>{renderStaticPage()}</Suspense>
          </div>
        ) : activeGeneratedPage ? (
          <div className="flex-1 p-4 sm:p-8">
            <Suspense fallback={<PageLoadingFallback />}>
              <GeneratedToolPage page={activeGeneratedPage} />
            </Suspense>
          </div>
        ) : activeTool ? (
          /* Tool Detail Screen */
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <ToolPageLayout
              tool={activeTool}
              isFavorite={favoriteIds.includes(activeTool.id)}
              onToggleFavorite={() => toggleFavorite(activeTool.id)}
              onBackToHome={() => navigateTo("/")}
              onSelectTool={(id) => navigateTo(`/tools/${id}`)}
              allTools={PUBLIC_TOOLS}
              onSaveWorkspace={handleSaveWorkspace}
            >
              <Suspense fallback={<PageLoadingFallback />}>{renderToolComponent(activeTool)}</Suspense>
            </ToolPageLayout>
          </div>
        ) : activeView === "category-hub" ? (
          /* Dedicated Category Hub View */
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <CategoryHubView
              categorySlug={activeCategory === "all" ? "seo-tools" : activeCategory}
              onSelectTool={(slug) => navigateTo(`/tools/${slug}`)}
              onNavigateToCategory={(catSlug) => setActiveCategory(catSlug as any)}
              onToggleFavorite={toggleFavorite}
              favoriteIds={favoriteIds}
            />
          </div>
        ) : (
          /* Micro-Tools Suite Directory Grid Screen */
          <div className="p-4 sm:p-8 space-y-12 max-w-7xl mx-auto w-full flex-1">
            {/* Hero Banner Section */}
            <HeroBanner
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              totalTools={PUBLIC_TOOLS.length}
              onExploreFreeTools={() => setActiveCategory("all")}
              onBrowseAiTools={() => setActiveCategory("all")}
              onOpenStudio={() => { window.location.href = "https://app.xfree.in/studio"; }}
            />

            {/* Platform sections — intent engine, agents, Studio engines, content pipeline */}
            <FeaturesSection />
            <HowItWorksStrip />
            <ArchitectureSection />

            {/* Quick Links Section */}
            <QuickLinksSection onSelectTool={(slug) => navigateTo(`/tools/${slug}`)} />

            {/* Micro-Tools Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 tracking-wide">
                <span>
                  Showing {filteredTools.length} {activeCategory !== "all" ? activeCategory : ""} Tools
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>

              {filteredTools.length === 0 ? (
                <div className="p-12 text-center glass-panel rounded-3xl space-y-2">
                  <div className="text-white font-bold text-base">
                    No micro-tools found matching "{searchQuery}"
                  </div>
                  <p className="text-slate-400 text-xs">
                    Try searching for "sitemap", "json", "regex", "cron", or "meta tags".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isFavorite={favoriteIds.includes(tool.id)}
                      onToggleFavorite={() => toggleFavorite(tool.id)}
                      onSelectTool={() => navigateTo(`/tools/${tool.slug}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Use Cases & Security — platform-level, not just tool-usage */}
            <UseCasesStrip onExplore={() => navigateTo("/use-cases")} />
            <SecuritySection onReadMore={() => navigateTo("/security")} />

            {/* Popular Tools, Categories & Privacy Section */}
            <PopularAndCategoriesSection
              onSelectTool={(slug) => navigateTo(`/tools/${slug}`)}
              onSelectCategory={(catId) => {
                setActiveCategory(catId as any);
                setActiveView("category-hub");
              }}
            />

            <ResourceHubSection onNavigate={navigateTo} />

            {/* FAQ & final CTA */}
            <FaqStrip onSeeFullFaq={() => navigateTo("/faq")} />
            <FinalCta
              onOpenStudio={() => { window.location.href = "https://app.xfree.in/studio"; }}
              onExploreFreeTools={() => setActiveCategory("all")}
              onReadDocs={() => navigateTo("/docs")}
            />
          </div>
        )}
      </main>

      {/* Expanded 5-Column Footer Component */}
      <Footer
        onSelectCategory={(catId) => {
          setActiveCategory(catId as any);
          setActiveView("category-hub");
          navigateTo("/");
        }}
        onSelectTool={(slug) => navigateTo(`/tools/${slug}`)}
        onNavigatePage={navigateTo}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTool={(slug) => {
          navigateTo(`/tools/${slug}`);
          setCommandPaletteOpen(false);
        }}
      />

      {/* Saved Drawer Slideout */}
      <SavedDrawer
        isOpen={savedDrawerOpen}
        onClose={() => setSavedDrawerOpen(false)}
        workspacePresets={workspacePresets}
        onLoadPreset={handleLoadWorkspacePreset}
        onDeletePreset={handleDeleteWorkspace}
        savedItems={savedHistory}
        favorites={favoriteIds}
        onClearHistory={clearHistory}
        onRemoveFavorite={toggleFavorite}
        onSelectTool={(id) => navigateTo(`/tools/${id}`)}
      />

      {/* Gemini Chatbot Slideout Drawer */}
      <GeminiChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        initialContext={activeTool ? activeTool.title : undefined}
      />

      {/* Lead-funnel popup: fires after dwell / exit-intent on non-tool pages */}
      <LeadFunnelPopup
        currentPath={currentPath}
        onOpenTool={(slug) => navigateTo(`/tools/${slug}`)}
      />
    </div>
  );
}
