import React, { useState, useEffect, useMemo, useCallback } from "react";
import { TOOLS_REGISTRY, INDEXABLE_TOOLS, findIndexableTool } from "./data/toolsRegistry";
import { isStaticRoute as isKnownStaticRoute, categorySlugFromPath, guideSlugFromPath } from "./data/routes";
import { findGuide } from "./data/guides";
import { ToolCategory, SavedItem, ToolDefinition, WorkspacePreset } from "./types";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ToolCard } from "./components/ToolCard";
import { CommandPalette } from "./components/CommandPalette";
import { SavedDrawer } from "./components/SavedDrawer";
import { ToolPageLayout } from "./components/ToolPageLayout";
import { ClusterDirectory } from "./components/ClusterDirectory";
import { GeminiChatDrawer } from "./components/GeminiChatDrawer";
import { ThinkingModeComponent } from "./components/ThinkingModeComponent";
import { CategoryHubView } from "./components/CategoryHubView";
import { useMetaTags } from "./hooks/useMetaTags";
import { IntentHomepage } from "./components/IntentHomepage";
import { Search } from "lucide-react";

import { HowItWorksPage } from "./components/pages/HowItWorksPage";
import { UseCasesPage } from "./components/pages/UseCasesPage";
import { DocsHubPage } from "./components/pages/DocsHubPage";
import { BlogPage } from "./components/pages/BlogPage";
import { FaqPage } from "./components/pages/FaqPage";
import { AboutPage } from "./components/pages/AboutPage";
import { ContactPage } from "./components/pages/ContactPage";
import { PrivacyPage } from "./components/pages/PrivacyPage";
import { TermsPage } from "./components/pages/TermsPage";
import { SecurityPage } from "./components/pages/SecurityPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { XFreeAppPage } from "./components/pages/XFreeAppPage";
import { GuideIndexPage } from "./components/pages/GuideIndexPage";
import { GuidePage } from "./components/pages/GuidePage";
import { LeadFunnelPopup } from "./components/LeadFunnelPopup";

import { BulkUrlExtractorSitemap } from "./components/tools/BulkUrlExtractorSitemap";
import { RobotsTxtGenerator } from "./components/tools/RobotsTxtGenerator";
import { MetaTagOpenGraphPreview } from "./components/tools/MetaTagOpenGraphPreview";
import { SchemaMarkupGenerator } from "./components/tools/SchemaMarkupGenerator";
import { UrlSlugUtmBuilder } from "./components/tools/UrlSlugUtmBuilder";
import { JsonFormatterValidatorDiff } from "./components/tools/JsonFormatterValidatorDiff";
import { RegexTesterExplainer } from "./components/tools/RegexTesterExplainer";
import { CronExpressionGenerator } from "./components/tools/CronExpressionGenerator";
import { Base64JwtDecoder } from "./components/tools/Base64JwtDecoder";
import { TimestampColorConverter } from "./components/tools/TimestampColorConverter";
import { TextDiffChecker } from "./components/tools/TextDiffChecker";
import { AiMicroToolComponent } from "./components/tools/AiMicroToolComponent";

export type ActiveView = "intent" | "tools" | "clusters" | "thinking" | "category-hub" | "page";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [activeView, setActiveView] = useState<ActiveView>("intent");
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

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

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
      window.scrollTo(0, 0);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("xfree_favorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem("xfree_history", JSON.stringify(savedHistory));
  }, [savedHistory]);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    if (path === "/") {
      setActiveView("intent");
    } else if (["/how-it-works", "/use-cases", "/docs", "/blog", "/faq", "/about", "/contact", "/privacy", "/terms", "/security", "/xfree-app", "/guides"].includes(path)) {
      setActiveView("page");
    } else if (path.startsWith("/tools/")) {
      setActiveView("tools");
    } else if (path.startsWith("/category/")) {
      setActiveView("category-hub");
    } else if (path.startsWith("/clusters")) {
      setActiveView("clusters");
    } else if (path.startsWith("/thinking")) {
      setActiveView("thinking");
    }
    window.scrollTo(0, 0);
  }, []);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  }, []);

  const handleSaveHistory = useCallback((toolId: string, toolTitle: string, inputSnippet: string, outputSnippet: string) => {
    const newItem: SavedItem = {
      id: `${toolId}-${Date.now()}`,
      toolId,
      toolTitle,
      timestamp: Date.now(),
      inputSnippet,
      outputSnippet,
    };
    setSavedHistory((prev) => [newItem, ...prev.slice(0, 19)]);
  }, []);

  const handleSaveWorkspace = useCallback((presetData: Omit<WorkspacePreset, "id" | "timestamp">) => {
    const newPreset: WorkspacePreset = {
      ...presetData,
      id: `preset_${Date.now()}`,
      timestamp: Date.now(),
    };
    setWorkspacePresets((prev) => [newPreset, ...prev]);
  }, []);

  const handleDeleteWorkspace = useCallback((presetId: string) => {
    setWorkspacePresets((prev) => prev.filter((p) => p.id !== presetId));
  }, []);

  const handleLoadWorkspacePreset = useCallback((preset: WorkspacePreset) => {
    navigateTo(`/tools/${preset.toolSlug}`);
  }, [navigateTo]);

  const clearHistory = useCallback(() => {
    setSavedHistory([]);
  }, []);

  const activeToolSlug = currentPath.startsWith("/tools/") ? currentPath.replace("/tools/", "").replace(/\/$/, "") : null;
  const activeTool = useMemo(() => {
    if (!activeToolSlug) return null;
    return findIndexableTool(activeToolSlug) ?? null;
  }, [activeToolSlug]);

  const activeGuideSlug = guideSlugFromPath(currentPath);
  const activeGuide = useMemo(() => (activeGuideSlug ? findGuide(activeGuideSlug) ?? null : null), [activeGuideSlug]);

  const isKnownRoute = useMemo(() => {
    if (currentPath === "/") return true;
    if (isKnownStaticRoute(currentPath)) return true;
    if (categorySlugFromPath(currentPath)) return true;
    if (activeToolSlug) return Boolean(activeTool);
    if (activeGuideSlug) return Boolean(activeGuide);
    return false;
  }, [currentPath, activeTool, activeToolSlug, activeGuide, activeGuideSlug]);

  useMetaTags({
    tool: activeTool,
    isClusterPage: activeView === "clusters",
    isThinkingPage: activeView === "thinking",
    currentPath,
  });

  const filteredTools = useMemo(() => {
    if (!searchQuery) return INDEXABLE_TOOLS;
    const q = searchQuery.toLowerCase().trim();
    return INDEXABLE_TOOLS.filter((tool) => {
      const matchesQuery =
        tool.title.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (tool.pillarKeyword && tool.pillarKeyword.toLowerCase().includes(q));
      return matchesQuery;
    });
  }, [searchQuery]);

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

  const isStaticRoute = ["/how-it-works", "/use-cases", "/docs", "/blog", "/faq", "/about", "/contact", "/privacy", "/terms", "/security", "/xfree-app", "/guides"].includes(currentPath) || activeGuideSlug !== null;

  const popularTools = INDEXABLE_TOOLS.filter((t) => t.isFlagship || t.isAi).slice(0, 6);
  const allToolsByCategory: Record<string, ToolDefinition[]> = {};
  INDEXABLE_TOOLS.forEach((tool) => {
    const cat = tool.category;
    if (!allToolsByCategory[cat]) allToolsByCategory[cat] = [];
    allToolsByCategory[cat].push(tool);
  });

  return (
    <div className="min-h-screen starry-bg text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-slate-950 focus:font-bold focus:rounded-lg"
      >
        Skip to main content
      </a>

      <Header
        onOpenSearch={() => setCommandPaletteOpen(true)}
        onOpenSaved={() => setSavedDrawerOpen(true)}
        onOpenChat={() => setChatDrawerOpen(true)}
        onOpenThinking={() => {
          setActiveView("thinking");
          if (currentPath.startsWith("/tools/") || isStaticRoute) navigateTo("/");
        }}
        activeCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId as any);
          setActiveView("category-hub");
          if (isStaticRoute || currentPath.startsWith("/tools/")) navigateTo("/");
        }}
        favoritesCount={favoriteIds.length}
        historyCount={savedHistory.length}
        onGoHome={() => {
          setActiveView("intent");
          navigateTo("/");
        }}
        onGoClusters={() => {
          setActiveView("clusters");
          if (currentPath.startsWith("/tools/") || isStaticRoute) {
            navigateTo("/");
          }
        }}
        activeView={activeView}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
        {!isKnownRoute ? (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <NotFoundPage onGoHome={() => navigateTo("/")} path={currentPath} />
          </div>
        ) : isStaticRoute ? (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            {renderStaticPage()}
          </div>
        ) : activeTool ? (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <ToolPageLayout
              tool={activeTool}
              isFavorite={favoriteIds.includes(activeTool.id)}
              onToggleFavorite={() => toggleFavorite(activeTool.id)}
              onBackToHome={() => navigateTo("/")}
              onSelectTool={(id) => navigateTo(`/tools/${id}`)}
              allTools={TOOLS_REGISTRY}
              onSaveWorkspace={handleSaveWorkspace}
            >
              {renderToolComponent(activeTool)}
            </ToolPageLayout>
          </div>
        ) : activeView === "thinking" ? (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <ThinkingModeComponent />
          </div>
        ) : activeView === "category-hub" ? (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <CategoryHubView
              categorySlug={activeCategory === "all" ? "seo-tools" : activeCategory}
              onSelectTool={(slug) => navigateTo(`/tools/${slug}`)}
              onNavigateToCategory={(catSlug) => setActiveCategory(catSlug as any)}
              onToggleFavorite={toggleFavorite}
              favoriteIds={favoriteIds}
            />
          </div>
        ) : activeView === "clusters" ? (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <ClusterDirectory
              onSelectKeywordTool={(kw) => {
                const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                navigateTo(`/tools/${slug}`);
              }}
            />
          </div>
        ) : activeView === "intent" ? (
          <IntentHomepage
            onNavigateToTool={(slug) => navigateTo(`/tools/${slug}`)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          />
        ) : (
          <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full">
            <div className="space-y-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
                  The fastest way to get things done online.
                </h1>
                <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mt-6 mb-8">
                  Tell XFree what you need to accomplish. We'll find the right capability, open the right tool, and help you complete the task.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="relative mb-6">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="What do you need to get done? (e.g. format json, remove duplicates, generate sitemap)"
                    className="w-full h-14 pl-14 pr-32 bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-400 text-base rounded-2xl focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    onClick={() => searchQuery && navigateTo(`/tools/${filteredTools[0]?.slug || "json-formatter"}`)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    disabled={!searchQuery || filteredTools.length === 0}
                  >
                    Go
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-white mb-6">Try These Tasks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { task: "Format JSON", toolSlug: "json-formatter" },
                    { task: "Test regex pattern", toolSlug: "regex-tester" },
                    { task: "Generate sitemap", toolSlug: "xml-sitemap-generator" },
                    { task: "Create robots.txt", toolSlug: "robots-txt-generator" },
                    { task: "Decode JWT token", toolSlug: "base64-encoder-decoder" },
                    { task: "Build meta tags", toolSlug: "meta-tag-generator" },
                    { task: "Extract URLs from text", toolSlug: "bulk-url-extractor" },
                    { task: "Generate cron schedule", toolSlug: "cron-expression-generator" },
                    { task: "Generate schema markup", toolSlug: "schema-markup-generator" },
                    { task: "Validate JSON", toolSlug: "json-formatter" },
                  ].map((item) => (
                    <div
                      key={item.toolSlug}
                      onClick={() => navigateTo(`/tools/${item.toolSlug}`)}
                      className="glass-panel rounded-xl p-4 hover:scale-[1.02] transition-all cursor-pointer border border-transparent hover:border-cyan-500/30"
                    >
                      <div className="text-xs text-cyan-400 font-semibold mb-1">{item.task}</div>
                      <div className="text-sm text-slate-200">Click to execute instantly</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Popular Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      isFavorite={favoriteIds.includes(tool.id)}
                      onToggleFavorite={() => toggleFavorite(tool.id)}
                      onSelectTool={() => navigateTo(`/tools/${tool.slug}`)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {["seo-tools", "developer-tools", "validators", "generators", "converters", "ai-tools"].map((catId) => {
                    const cat = [{ id: "seo-tools", label: "SEO & URL Tools", description: "Sitemaps, robots.txt, meta tags" },
                      { id: "developer-tools", label: "Developer Tools", description: "JSON, CSS, HTML, XML" },
                      { id: "validators", label: "Validators", description: "JSON, XML, Schema, Robots" },
                      { id: "generators", label: "Generators", description: "UUIDs, Cron, UTM links" },
                      { id: "converters", label: "Converters", description: "Date, Color, Base64" },
                      { id: "ai-tools", label: "AI Tools", description: "Code generation, debugging" }].find(c => c.id === catId);
                    if (!cat) return null;
                    const tools = allToolsByCategory[catId as ToolCategory]?.slice(0, 3) || [];
                    return (
                      <div key={catId} className="glass-panel rounded-2xl p-4">
                        <h3 className="text-lg font-bold text-white mb-2">{cat.label}</h3>
                        <p className="text-slate-400 text-sm mb-3">{cat.description}</p>
                        <div className="space-y-2">
                          {tools.map((tool) => (
                            <div
                              key={tool.id}
                              onClick={() => navigateTo(`/tools/${tool.slug}`)}
                              className="text-xs text-slate-300 hover:text-cyan-300 cursor-pointer"
                            >
                              {tool.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer
        onSelectCategory={(catId) => {
          setActiveCategory(catId as any);
          setActiveView("category-hub");
          navigateTo("/");
        }}
        onSelectTool={(slug) => navigateTo(`/tools/${slug}`)}
        onNavigatePage={navigateTo}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTool={(slug) => {
          navigateTo(`/tools/${slug}`);
          setCommandPaletteOpen(false);
        }}
      />

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

      <GeminiChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        initialContext={activeTool ? activeTool.title : undefined}
      />

      <LeadFunnelPopup
        currentPath={currentPath}
        onOpenTool={(slug) => navigateTo(`/tools/${slug}`)}
      />
    </div>
  );
}