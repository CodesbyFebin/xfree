import React, { useState, useEffect, useMemo, useCallback } from "react";
import Fuse from "fuse.js";
import { ToolDefinition, IntentDefinition } from "../types";
import { TOOLS_REGISTRY, INDEXABLE_TOOLS, findToolById } from "../data/toolsRegistry";
import { INTENT_REGISTRY } from "../data/intentRegistry";
import { Search, X, CornerDownLeft, Target, CheckCircle2 } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolSlug: string) => void;
  placeholder?: string;
}

interface IntentMatchResult {
  intent: IntentDefinition;
  tool: ToolDefinition | null;
  confidence: "high" | "medium" | "low";
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  placeholder = "Tell XFree what you need to get done...",
}) => {
  const [query, setQuery] = useState("");

  const fuse = useMemo(() => {
    return new Fuse(INDEXABLE_TOOLS, {
      keys: [
        { name: "title", weight: 0.4 },
        { name: "tags", weight: 0.25 },
        { name: "shortDescription", weight: 0.2 },
        { name: "pillarKeyword", weight: 0.1 },
        { name: "categoryLabel", weight: 0.05 },
      ],
      threshold: 0.35,
      distance: 100,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }, []);

  const keyboardShortcutHandlers = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (isOpen) {
        onClose();
      }
    }
    if (e.key === "Escape" && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", keyboardShortcutHandlers);
    return () => window.removeEventListener("keydown", keyboardShortcutHandlers);
  }, [keyboardShortcutHandlers]);

  const getBestIntentMatch = (q: string): IntentMatchResult | null => {
    const lowerQuery = q.toLowerCase().trim();
    if (!lowerQuery) return null;

    const matches = INTENT_REGISTRY
      .map((intent) => {
        const phraseMatch = intent.phrases.some((p) => p === lowerQuery) ? 3 : 0;
        const keywordMatch = intent.keywords.some((k) => k === lowerQuery) ? 2 : 0;
        const phraseContains = intent.phrases.some((p) => lowerQuery.includes(p)) ? 1 : 0;
        const keywordContains = intent.keywords.some((k) => lowerQuery.includes(k)) ? 1 : 0;

        const score = phraseMatch + keywordMatch + phraseContains + keywordContains;
        const confidence: "high" | "medium" | "low" = score >= 4 ? "high" : score >= 2 ? "medium" : "low";

        return {
          intent,
          tool: findToolById(intent.preferredToolId),
          confidence
        };
      })
      .filter((m) => m.intent && m.confidence !== "low")
      .sort((a, b) => {
        const scoreA = INTENT_REGISTRY.findIndex(i => i.id === a.intent.id);
        const scoreB = INTENT_REGISTRY.findIndex(i => i.id === b.intent.id);
        return scoreA - scoreB;
      });

    return matches.length > 0 ? matches[0] : null;
  };

  const filteredTools = useMemo(() => {
    const q = query.trim();
    if (!q) return { tools: INDEXABLE_TOOLS, intent: null };

    const intentMatch = getBestIntentMatch(q);

    const toolResults = fuse.search(q).map((result) => result.item);

    return { tools: toolResults, intent: intentMatch };
  }, [query, fuse]);

  const handleToolSelect = (slug: string) => {
    onSelectTool(slug);
    onClose();
  };

  const handleIntentSelect = () => {
    if (filteredTools.intent?.tool) {
      handleToolSelect(filteredTools.intent.tool.slug);
    }
  };

  const cleared = query.length > 0;
  const hasIntent = filteredTools.intent && query.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Target className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none placeholder:text-slate-500"
          />
          {cleared && (
            <button
              onClick={() => setQuery("")}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasIntent && filteredTools.intent && (
          <div className="p-3 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>Best match for "{query}"</span>
            </div>
            <div
              onClick={handleIntentSelect}
              className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/80 cursor-pointer transition-all border border-transparent hover:border-slate-700/60"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  RECOMMENDED
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {filteredTools.intent.tool?.title || "Loading..."}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 font-normal">
                    {filteredTools.intent.intent.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 hidden sm:inline">
                  Go
                </span>
                <CornerDownLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </div>
        )}

        <div className="p-3 overflow-y-auto flex-1 space-y-1 divide-y divide-slate-800/50">
          {filteredTools.tools.length === 0 && !hasIntent ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs">
              No matching tools found for "{query}".
            </div>
          ) : filteredTools.tools.length > 1 ? (
            filteredTools.tools.map((tool) => {
              if (hasIntent && tool.id === filteredTools.intent?.tool?.id) return null;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.slug)}
                  className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/80 cursor-pointer transition-all border border-transparent hover:border-slate-700/60"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg text-[10px] font-bold font-mono uppercase ${
                      tool.isFlagship
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : tool.isAi
                        ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    }`}>
                      {tool.isFlagship ? "FLAGSHIP" : tool.isAi ? "AI" : tool.categoryLabel.split(" ")[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tool.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 font-normal">
                        {tool.shortDescription}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-cyan-300 hidden sm:inline">
                      Open
                    </span>
                    <CornerDownLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs">
              No matching tools found for "{query}".
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 text-slate-400 text-[11px] font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            XFree Intent Router • Fuzzy Search
          </span>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ESC</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};