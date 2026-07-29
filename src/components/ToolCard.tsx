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

  return (
    <div
      onClick={() => onSelectTool(tool.id)}
      className="glass-panel-interactive rounded-2xl p-5 flex flex-col justify-between cursor-pointer group select-none relative overflow-hidden"
    >
      {/* Top Tag & Favorite Star */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className={`px-2.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-full border ${getBadgeStyle()} flex items-center gap-1`}>
            {tool.isAi && <Sparkles className="w-3 h-3 text-purple-400" />}
            {tool.isFlagship && <Zap className="w-3 h-3 text-cyan-400" />}
            <span>{tool.isFlagship ? "Flagship Tool" : tool.isAi ? "AI Powered" : tool.categoryLabel || tool.category}</span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(tool.id);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title={isFavorite ? "Remove favorite" : "Save favorite"}
          >
            <Star className={`w-4 h-4 ${isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-500 hover:text-slate-300"}`} />
          </button>
        </div>

        {/* Tool Title */}
        <h4 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between gap-1 leading-snug">
          <span>{tool.title}</span>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </h4>

        {/* Short Description */}
        <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
          {tool.shortDescription}
        </p>
      </div>

      {/* Footer Tags & Action */}
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
          <span>→</span>
        </span>
      </div>
    </div>
  );
};
