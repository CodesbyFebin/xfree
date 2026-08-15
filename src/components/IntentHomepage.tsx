import React, { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, BookOpen, List, Clock, Star } from "lucide-react";
import { ToolDefinition, ToolCategory } from "../types";
import { INDEXABLE_TOOLS, findToolById, CATEGORIES } from "../data/toolsRegistry";
import { recommendTool } from "../utils/recommendTool";

interface IntentHomepageProps {
  onNavigateToTool: (slug: string) => void;
  onOpenCommandPalette: () => void;
}

export const IntentHomepage: React.FC<IntentHomepageProps> = ({
  onNavigateToTool,
  onOpenCommandPalette,
}) => {
  const [intentQuery, setIntentQuery] = useState("");
  const [recommendation, setRecommendation] = useState<ReturnType<typeof recommendTool> | null>(null);

  const handleSearch = () => {
    if (intentQuery.trim()) {
      const result = recommendTool(intentQuery);
      setRecommendation(result);
      if (result.tool) {
        onNavigateToTool(result.tool.slug);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const recentTools: ToolDefinition[] = [];
  const savedTools: string[] = [];

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">
            The fastest way to get things done online.
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            Tell XFree what you need to accomplish. We'll find the right capability, open the right tool,
            and help you complete the task.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <div className="relative mb-6">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="What do you need to get done? (e.g. format json, remove duplicates, generate sitemap)"
              className="w-full h-16 pl-14 pr-32 bg-slate-900/80 border border-slate-800 text-white placeholder:text-slate-400 text-base rounded-2xl focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
              value={intentQuery}
              onChange={(e) => setIntentQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              disabled={!intentQuery.trim()}
            >
              Go
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {getTrySuggestions().map((suggestion) => (
              <button
                key={suggestion.text}
                onClick={() => {
                  setIntentQuery(suggestion.text);
                  handleSearch();
                }}
                className="px-4 py-1.5 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white text-sm rounded-xl transition-all cursor-pointer"
              >
                {suggestion.text}
              </button>
            ))}
          </div>

          {recommendation && recommendation.tool && (
            <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold mb-3">
                <Star className="w-4 h-4" />
                <span>
                  {recommendation.confidence === "high" ? "Opening:" : "Did you mean:"}
                </span>
              </div>
              <div className="text-white font-medium text-lg">
                {recommendation.tool.title}
              </div>
              <p className="text-emerald-200 text-sm mt-1">{recommendation.tool.pillarKeyword}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-16">
          <div className="glass-panel rounded-2xl p-5 text-center">
            <Clock className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-2">Recent Tools</h3>
            <p className="text-slate-400 text-xs">Pick up where you left off</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 text-center">
            <Star className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-2">Saved Tools</h3>
            <p className="text-slate-400 text-xs">Your bookmarked utilities</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 text-center">
            <BookOpen className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-2">Popular Problems</h3>
            <p className="text-slate-400 text-xs">Solve common tasks quickly</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
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
          ].map((item) => (
            <div
              key={item.toolSlug}
              onClick={() => onNavigateToTool(item.toolSlug)}
              className="glass-panel rounded-xl p-4 hover:scale-[1.02] transition-all cursor-pointer border border-transparent hover:border-cyan-500/30"
            >
              <div className="text-xs text-cyan-400 font-semibold mb-1">{item.task}</div>
              <div className="text-sm text-slate-200">Click to execute instantly</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function getTrySuggestions(): { text: string; confidence: "high" | "medium" | "low" }[] {
  return [
    { text: "format json", confidence: "high" },
    { text: "test regex", confidence: "high" },
    { text: "generate sitemap", confidence: "high" },
    { text: "extract urls", confidence: "high" },
    { text: "decode jwt", confidence: "medium" },
    { text: "validate json", confidence: "medium" },
    { text: "remove duplicates", confidence: "medium" },
    { text: "create robots.txt", confidence: "medium" },
    { text: "base64 encode", confidence: "low" },
    { text: "generate cron", confidence: "low" },
  ];
}