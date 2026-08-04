import React from "react";
import { Search, Sparkles, Zap, Bookmark } from "lucide-react";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSaved: () => void;
  onOpenChat: () => void;
  onOpenThinking: () => void;
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
  favoritesCount: number;
  historyCount: number;
  onGoHome: () => void;
  onGoClusters: () => void;
  activeView: "tools" | "clusters" | "thinking" | "category-hub";
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSaved,
  onOpenChat,
  onOpenThinking,
  activeCategory,
  onSelectCategory,
  favoritesCount,
  historyCount,
  onGoHome,
  onGoClusters,
  activeView,
}) => {
  return (
    <nav className="h-16 glass-header sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4 md:gap-8">
        {/* Brand logo */}
        <div
          className="text-xl sm:text-2xl font-black tracking-tight flex items-center cursor-pointer select-none group"
          onClick={onGoHome}
        >
          <span className="bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 text-slate-950 px-2.5 py-0.5 rounded-lg font-black shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            X
          </span>
          <span className="ml-2 text-white font-black tracking-tight group-hover:text-cyan-300 transition-colors">
            Free<span className="text-cyan-400 font-mono text-sm">.in</span>
          </span>
        </div>

        {/* View & Category Navigation Links */}
        <div className="hidden xl:flex gap-2 text-xs font-semibold tracking-wide items-center">
          <button
            onClick={onGoHome}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              activeView === "tools"
                ? "glass-pill-active font-bold"
                : "glass-pill text-slate-300 hover:text-white"
            }`}
          >
            Tools Registry (400)
          </button>

          <button
            onClick={onGoClusters}
            className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
              activeView === "clusters"
                ? "glass-pill-active font-bold"
                : "glass-pill text-amber-300 hover:text-amber-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>100 Clusters</span>
          </button>

          <button
            onClick={onOpenThinking}
            className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all ${
              activeView === "thinking"
                ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/20 font-bold"
                : "glass-pill text-purple-300 hover:text-purple-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Thinking Mode</span>
          </button>

          <span className="h-4 w-[1px] bg-white/10 mx-1" />

          <button
            onClick={() => {
              onGoHome();
              onSelectCategory("all");
            }}
            className={`px-2.5 py-1 text-xs transition-colors cursor-pointer ${
              activeCategory === "all" && activeView === "tools"
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              onGoHome();
              onSelectCategory("seo-tools");
            }}
            className={`px-2.5 py-1 text-xs transition-colors cursor-pointer ${
              activeCategory === "seo-tools"
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            SEO
          </button>
          <button
            onClick={() => {
              onGoHome();
              onSelectCategory("developer-tools");
            }}
            className={`px-2.5 py-1 text-xs transition-colors cursor-pointer ${
              activeCategory === "developer-tools"
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dev
          </button>
          <button
            onClick={() => {
              onGoHome();
              onSelectCategory("ai-tools");
            }}
            className={`px-2.5 py-1 text-xs transition-colors cursor-pointer ${
              activeCategory === "ai-tools"
                ? "text-cyan-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            AI Suite
          </button>
        </div>
      </div>

      {/* Global Search & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gemini Chatbot Drawer Trigger */}
        <button
          onClick={onOpenChat}
          className="h-9 px-3.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
          title="Open Gemini AI Chatbot"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Gemini Chat</span>
        </button>

        {/* Search Bar Trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl glass-panel-interactive text-slate-300 text-xs font-medium cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search tools...</span>
          </div>
          <span className="mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
            ⌘K
          </span>
        </button>

        {/* Mobile Search Icon */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-xl glass-panel text-slate-200"
          title="Search Tools"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Saved Drawer Trigger Button */}
        <button
          onClick={onOpenSaved}
          className="h-9 px-3.5 rounded-xl glass-panel-interactive text-amber-300 hover:text-amber-200 font-medium text-xs flex items-center gap-2 cursor-pointer"
          title="Saved Items & History"
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          <span className="hidden sm:inline">Saved</span>
          {favoritesCount + historyCount > 0 && (
            <span className="mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
              {favoritesCount + historyCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
