import React, { useState, useEffect, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { ToolDefinition, ToolCategory } from "../../types";
import { TOOLS_REGISTRY, INDEXABLE_TOOLS } from "../../data/toolsRegistry";
import { CATEGORIES } from "../../data/toolsRegistry";
import { Search, X, ChevronDown, CornerDownLeft, Sparkles, Globe, Code2, Wand2, CheckCircle2, Hash, FileText, ArrowLeftRight } from "lucide-react";

interface IntentBarProps {
  onExecuteTool: (toolSlug: string) => void;
  onSearchIntent: (query: string) => void;
  recentInputs?: string[];
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  "seo-tools": <Globe className="w-4 h-4" />,
  "developer-tools": <Code2 className="w-4 h-4" />,
  "ai-tools": <Sparkles className="w-4 h-4" />,
  "text-tools": <FileText className="w-4 h-4" />,
  "converters": <ArrowLeftRight className="w-4 h-4" />,
  "generators": <Wand2 className="w-4 h-4" />,
  "validators": <CheckCircle2 className="w-4 h-4" />,
};

export const IntentBar: React.FC<IntentBarProps> = ({
  onExecuteTool,
  onSearchIntent,
  recentInputs = [],
}) => {
  const [query, setQuery] = useState("");
  const [showTools, setShowTools] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => {
    return new Fuse(INDEXABLE_TOOLS, {
      keys: [
        { name: "title", weight: 0.4 },
        { name: "tags", weight: 0.25 },
        { name: "shortDescription", weight: 0.2 },
        { name: "pillarKeyword", weight: 0.1 },
      ],
      threshold: 0.35,
      distance: 100,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, []);

  const filteredTools = useMemo(() => {
    const q = query.trim();
    if (!q) return INDEXABLE_TOOLS;
    return fuse.search(q).map((result) => result.item);
  }, [query, fuse]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchIntent(query.trim());
    }
  };

  const handleToolSelect = (slug: string) => {
    onExecuteTool(slug);
    setQuery("");
    setShowTools(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowTools(true)}
            placeholder="What do you need to get done? (e.g. format JSON, generate sitemap)"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl transition-colors shadow-lg shadow-cyan-500/25"
        >
          Solve
        </button>
      </form>

      {/* Tool Picker Dropdown */}
      {showTools && (
        <div
          ref={(el) => {
            if (el) {
              el.addEventListener("mousedown", (e) => e.stopPropagation());
            }
          }}
          className="absolute z-40 mt-2 w-full bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl shadow-cyan-500/10 max-h-[400px] overflow-hidden"
        >
          <div className="max-h-[380px] overflow-y-auto">
            {filteredTools.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-semibold text-xs">
                No matching micro-tools found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.slug)}
                    className="group flex items-center gap-4 mx-2 my-1 p-3 rounded-2xl hover:bg-slate-800/80 cursor-pointer transition-all border border-transparent hover:border-slate-700/60"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {CATEGORY_ICON_MAP[tool.category] ?? <Globe className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {tool.title}
                        </h4>
                        {tool.isFlagship && (
                          <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.25 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            FLAGSHIP
                          </span>
                        )}
                        {tool.isAi && (
                          <span className="text-[9px] font-bold font-mono uppercase px-1.5 py-0.25 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {tool.shortDescription}
                      </p>
                    </div>
                    <CornerDownLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 transition-all" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentInputs.length > 0 && query.length === 0 && (
            <>
              <div className="px-4 py-2 border-t border-slate-800 text-xs font-semibold text-slate-400">
                Recent
              </div>
              <div className="pb-2">
                {recentInputs.slice(0, 5).map((input) => (
                  <div
                    key={input}
                    onClick={() => onSearchIntent(input)}
                    className="mx-2 my-1 p-3 rounded-2xl hover:bg-slate-800/80 cursor-pointer transition-all"
                  >
                    <p className="text-sm text-slate-300 truncate">{input}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Category Quick-Access Row */}
      {!showTools && (
        <div className="flex flex-wrap gap-2 mt-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                const toolsInCat = INDEXABLE_TOOLS.filter((t) => t.category === cat.id);
                if (toolsInCat.length === 1) {
                  handleToolSelect(toolsInCat[0].slug);
                } else {
                  setQuery(cat.label.split("&")[0].trim().toLowerCase());
                  setShowTools(true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-cyan-300 hover:border-slate-600 transition-all cursor-pointer"
            >
              {CATEGORY_ICON_MAP[cat.id] ?? <Globe className="w-3 h-3" />}
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
