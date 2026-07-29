import React, { useState, useEffect, useMemo } from "react";
import Fuse from "fuse.js";
import { ToolDefinition } from "../types";
import { TOOLS_REGISTRY } from "../data/toolsRegistry";
import { Search, X, CornerDownLeft } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tools?: ToolDefinition[];
  onSelectTool: (toolSlug: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tools = TOOLS_REGISTRY,
  onSelectTool,
}) => {
  const [query, setQuery] = useState("");

  // Initialize Fuse instance for high-performance fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(tools, {
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
  }, [tools]);

  // Keyboard shortcut handlers for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Perform fuzzy search or return all tools
  const filteredTools = useMemo(() => {
    const q = query.trim();
    if (!q) return tools;
    return fuse.search(q).map((result) => result.item);
  }, [query, fuse, tools]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 400+ micro-tools (e.g. sitemap, json, regex, meta, cron)..."
            className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none placeholder:text-slate-500"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1 divide-y divide-slate-800/50">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs">
              No matching micro-tools found for "{query}".
            </div>
          ) : (
            filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.slug);
                  onClose();
                }}
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
            ))
          )}
        </div>

        {/* Footer shortcuts indicator */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 text-slate-400 text-[11px] font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            XFree Micro-Tools • Fuse.js Search
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
