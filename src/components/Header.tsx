import React from "react";
import { Bookmark, Search, Sparkles } from "lucide-react";

interface HeaderProps {
  totalTools: number;
  onOpenSearch: () => void;
  onOpenSaved: () => void;
  onOpenChat: () => void;
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
  favoritesCount: number;
  historyCount: number;
  onGoHome: () => void;
  activeView: "tools" | "category-hub" | "page";
}

export const Header: React.FC<HeaderProps> = ({
  totalTools,
  onOpenSearch,
  onOpenSaved,
  onOpenChat,
  activeCategory,
  onSelectCategory,
  favoritesCount,
  historyCount,
  onGoHome,
  activeView,
}) => {
  const savedCount = favoritesCount + historyCount;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 text-slate-900 shadow-sm backdrop-blur-xl" role="banner">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8" aria-label="Primary navigation">
        <div className="flex min-w-0 items-center gap-5 lg:gap-8">
          <a
            href="/"
            aria-label="XFree home"
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
              event.preventDefault();
              onGoHome();
            }}
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-500/20">X</span>
            <span className="text-lg font-black tracking-tight text-slate-950">XFree</span>
            <span className="hidden rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 sm:inline">{totalTools} tools</span>
          </a>

          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            <a
              href="/"
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                event.preventDefault();
                onGoHome();
              }}
              className={activeView === "tools" ? "text-indigo-600" : "transition hover:text-indigo-600"}
            >
              Tools
            </a>
            {/* Recipes mount a dedicated route shell in main.tsx, so this must remain a full-page anchor rather than an in-app router transition. */}
            <a href="/recipes" className="transition hover:text-indigo-600">Recipes</a>
            <a href="/how-it-works" className="transition hover:text-indigo-600">How It Works</a>
            <a href="/use-cases" className="transition hover:text-indigo-600">Use Cases</a>
            <a href="/docs" className="transition hover:text-indigo-600">Docs</a>
            <a href="/faq" className="transition hover:text-indigo-600">FAQ</a>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a href="/recipes" className="hidden h-9 items-center rounded-xl border border-indigo-100 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 md:flex lg:hidden">
            Recipes
          </a>

          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 md:flex"
            aria-label="Search XFree tools"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="rounded border border-slate-200 bg-stone-50 px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={onOpenChat}
            className="hidden h-9 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 transition hover:bg-violet-100 sm:flex"
            title="Open optional AI assistant"
          >
            <Sparkles className="h-4 w-4" />
            AI
          </button>

          <button
            type="button"
            onClick={onOpenSaved}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
            aria-label="Open saved items and history"
          >
            <Bookmark className="h-4 w-4" />
            {savedCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-indigo-600 px-1 text-center text-[9px] font-bold leading-4 text-white">{savedCount}</span>
            )}
          </button>

          <a
            href="https://app.xfree.in/"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 sm:px-4"
          >
            <span className="hidden sm:inline">Open Studio</span>
            <span className="sm:hidden">Studio</span>
          </a>
        </div>
      </nav>

      {activeView === "category-hub" && (
        <div className="border-t border-slate-100 bg-stone-50/90 px-4 py-2 lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto text-xs font-semibold">
            {[
              ["all", "All"],
              ["developer-tools", "Developer"],
              ["seo-tools", "SEO"],
              ["text-tools", "Text"],
              ["converters", "Converters"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onSelectCategory(id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 ${activeCategory === id ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
