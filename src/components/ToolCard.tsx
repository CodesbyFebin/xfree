import React from "react";
import { ArrowUpRight, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { ToolDefinition } from "../types";

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
  const badgeClass = tool.isFlagship
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : tool.isAi
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : tool.execution === "local"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-stone-50 text-slate-600";

  const href = `/tools/${tool.slug}`;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10">
      <a
        href={href}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
          event.preventDefault();
          onSelectTool(tool.id);
        }}
        className="flex h-full min-h-[250px] flex-col justify-between p-5 text-inherit no-underline"
        aria-label={`${tool.title} — ${tool.shortDescription}`}
      >
        <div>
          <div className="mb-4 flex items-start justify-between gap-3 pr-8">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
              {tool.isFlagship ? <Zap className="h-3 w-3" /> : tool.isAi ? <Sparkles className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
              {tool.isFlagship ? "Flagship" : tool.isAi ? "AI" : tool.execution === "local" ? "Local" : tool.categoryLabel || tool.category}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-extrabold leading-snug text-slate-950 transition group-hover:text-indigo-600">{tool.title}</h3>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </div>

          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{tool.shortDescription}</p>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {tool.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{tag}</span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400">{tool.categoryLabel || tool.category}</span>
            <span className="text-indigo-600">Open tool →</span>
          </div>
        </div>
      </a>

      <button
        type="button"
        onClick={() => onToggleFavorite(tool.id)}
        className="absolute right-4 top-4 z-10 rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
        aria-label={isFavorite ? `Remove ${tool.title} from favorites` : `Save ${tool.title} to favorites`}
      >
        <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
      </button>
    </article>
  );
};
