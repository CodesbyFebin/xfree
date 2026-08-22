import React from "react";
import { ToolDefinition } from "../types";
import { Star, ArrowUpRight, Sparkles, Zap, Shield, Code2 } from "lucide-react";

interface ToolCardProps {
  tool: ToolDefinition;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onSelectTool: (toolId: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isFavorite,
  onToggleFavorite,
  onSelectTool,
}) => {
  const getBadgeStyle = () => {
    if (tool.isFlagship) {
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    }
    if (tool.isAi) {
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    }
    if (tool.category === "seo-tools" || tool.category === "seo-url") {
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }
    if (tool.category === "developer-tools" || tool.category === "developer") {
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
    }
    return "bg-slate-700/50 text-slate-300 border-slate-600/50";
  };

  const href = `/tools/${tool.slug}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Real <a href> gives Googlebot a crawlable link. In the browser we
    // hijack for SPA navigation, but middle-click and cmd-click still open
    // the URL naturally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    onSelectTool(tool.id);
  };

  return (
    <article className="glass-panel-interactive relative overflow-hidden rounded-2xl">
      <a
        href={href}
        onClick={handleClick}
        className="group flex h-full cursor-pointer select-none flex-col justify-between p-5 text-inherit no-underline"
        aria-label={`${tool.title} — ${tool.shortDescription}`}
      >
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className={`px-2.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-full border ${getBadgeStyle()} flex items-center gap-1`}>
            {tool.isAi && <Sparkles className="w-3 h-3 text-purple-400" />}
            {tool.isFlagship && <Zap className="w-3 h-3 text-cyan-400" />}
            <span>{tool.isFlagship ? "Flagship Tool" : tool.isAi ? "AI Powered" : tool.categoryLabel || tool.category}</span>
          </span>

          <span className="h-7 w-7" aria-hidden="true" />
        </div>

        <h4 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between gap-1 leading-snug">
          <span>{tool.title}</span>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </h4>

        <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
          {tool.shortDescription}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {tool.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="mono text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
              #{tag}
            </span>
          ))}
        </div>

        <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
          <span>Launch</span>
          <span aria-hidden="true">→</span>
        </span>
      </div>
      </a>
      <button
        type="button"
        onClick={() => onToggleFavorite(tool.id)}
        className="absolute right-5 top-5 z-10 rounded-lg p-1.5 transition-colors hover:bg-white/10"
        aria-label={isFavorite ? `Remove ${tool.title} from favorites` : `Save ${tool.title} to favorites`}
      >
        <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-500 hover:text-slate-300"}`} />
      </button>
    </article>
  );
};
