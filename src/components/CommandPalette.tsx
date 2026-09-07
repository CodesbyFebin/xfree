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
  initialQuery?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tools = TOOLS_REGISTRY,
  onSelectTool,
  initialQuery = "",
}) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (isOpen) setQuery(initialQuery);
  }, [isOpen, initialQuery]);

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

  // Escape closes; opening/toggling on Cmd+K is handled globally by the app
  // shell so the shortcut works from anywhere, not just while this is open.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-cyber-card border border-cyber-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="p-4 border-b border-cyber-border flex items-center gap-3 bg-cyber-bg/60">
          <Search className="w-5 h-5 text-cyber-glow" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools (e.g. sitemap, json, regex, meta, cron)..."
            className="w-full bg-transparent text-white text-sm font-mono focus:outline-none placeholder-cyber-muted"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-cyber-border bg-cyber-bg hover:bg-cyber-surface text-cyber-muted hover:text-white transition-colors cursor-pointer focus-ring"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1 divide-y divide-cyber-border/50">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-cyber-muted font-mono text-xs">
              No matching XFree tools found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  onSelectTool(tool.slug);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-cyber-bg/80 cursor-pointer transition-all border border-transparent hover:border-cyber-border"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg text-[10px] font-bold font-mono uppercase ${
                      tool.isFlagship
                        ? "badge-flagship"
                        : tool.isAi
                        ? "bg-cyber-magenta/10 text-cyber-magenta border border-cyber-magenta/30"
                        : "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30"
                    }`}
                  >
                    {tool.isFlagship ? "FLAGSHIP" : tool.isAi ? "AI" : tool.categoryLabel.split(" ")[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono">
                      {tool.title}
                    </h4>
                    <p className="text-xs text-cyber-muted line-clamp-1">{tool.shortDescription}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyber-muted group-hover:text-cyber-glow hidden sm:inline font-mono">
                    Open
                  </span>
                  <CornerDownLeft className="w-4 h-4 text-cyber-dim group-hover:text-cyber-glow group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts indicator */}
        <div className="px-4 py-2.5 bg-cyber-bg/80 border-t border-cyber-border text-cyber-muted text-[11px] font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-glow anim-pulse"></span>
            {tools.length} XFree tools
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-cyber-surface text-cyber-muted border border-cyber-border">ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};
