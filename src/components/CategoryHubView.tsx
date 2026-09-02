import React from "react";
import { PUBLIC_CATEGORIES, getPublicToolsByCategory } from "../data/publicTools";
import { ToolCard } from "./ToolCard";
import { Globe, Code2, Sparkles, FileText, ArrowLeftRight, Wand2, CheckCircle2 } from "lucide-react";

interface CategoryHubViewProps {
  categorySlug: string;
  onSelectTool: (slug: string) => void;
  onNavigateToCategory: (categorySlug: string) => void;
  onToggleFavorite: (toolId: string) => void;
  favoriteIds: string[];
}

export function CategoryHubView({
  categorySlug,
  onSelectTool,
  onNavigateToCategory,
  onToggleFavorite,
  favoriteIds,
}: CategoryHubViewProps) {
  const currentCategory = PUBLIC_CATEGORIES.find((c) => c.id === categorySlug) || PUBLIC_CATEGORIES[0];
  const categoryTools = getPublicToolsByCategory(currentCategory.id);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Globe": return <Globe className="w-8 h-8 text-cyan-400" />;
      case "Code2": return <Code2 className="w-8 h-8 text-indigo-400" />;
      case "Sparkles": return <Sparkles className="w-8 h-8 text-purple-400" />;
      case "FileText": return <FileText className="w-8 h-8 text-emerald-400" />;
      case "ArrowLeftRight": return <ArrowLeftRight className="w-8 h-8 text-amber-400" />;
      case "Wand2": return <Wand2 className="w-8 h-8 text-pink-400" />;
      case "CheckCircle2": return <CheckCircle2 className="w-8 h-8 text-teal-400" />;
      default: return <Globe className="w-8 h-8 text-cyan-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Category Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-lg">
              {getCategoryIcon(currentCategory.icon)}
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                Category Hub Page
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white mt-2 tracking-tight">
                {currentCategory.label}
              </h1>
            </div>
          </div>

          <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed">
            {currentCategory.description}. Published local tools process their working data in your browser; any cloud-powered feature is labelled before data is transmitted.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{categoryTools.length} Published Micro-Tools</span>
            </div>
            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-300">
              ⚡ Local-first execution
            </div>
            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700 text-xs text-slate-300">
              📥 JSON, CSV & XML Export Ready
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {PUBLIC_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onNavigateToCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              cat.id === currentCategory.id
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20"
                : "bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:bg-slate-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Explore {currentCategory.label}</span>
            <span className="text-xs text-slate-400 font-mono">({categoryTools.length} tools)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite={favoriteIds.includes(tool.id)}
              onToggleFavorite={() => onToggleFavorite(tool.id)}
              onSelectTool={() => onSelectTool(tool.slug)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
