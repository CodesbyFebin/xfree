import React from "react";
import { Search, Sparkles, ArrowRight, ShieldCheck, Zap, Globe, Lock, Cpu, Check, Code, ExternalLink, RefreshCw } from "lucide-react";
import { ToolCategory } from "../types";

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: ToolCategory | "all";
  onCategoryChange: (cat: ToolCategory | "all") => void;
  totalTools: number;
  onExploreFreeTools?: () => void;
  onBrowseAiTools?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  totalTools,
  onExploreFreeTools,
  onBrowseAiTools,
}) => {
  return (
    <div className="mb-12 space-y-10">
      {/* Main Hero Section with Graphic Mockup */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl">
        {/* Ambient Radial Background Glows */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Column: Headline, Copy, CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Get <span className="text-white">X Done</span> <br className="hidden sm:inline" />
              for <span className="text-emerald-400 font-black">Free</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              A free suite of AI, SEO, and developer micro-tools to help you solve problems faster—right in your browser.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  if (onExploreFreeTools) onExploreFreeTools();
                  else onCategoryChange("all");
                }}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore Free Tools</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={() => {
                  if (onBrowseAiTools) onBrowseAiTools();
                  else onCategoryChange("ai-tools");
                }}
                className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800/90 text-white border border-slate-700/80 hover:border-slate-600 font-semibold text-sm sm:text-base rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Browse All Tools</span>
              </button>
            </div>
          </div>

          {/* Right Column: High-Fidelity UI Mockup Visual */}
          <div className="lg:col-span-6 relative">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
              {/* Mockup Header Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-white text-sm">XFree<span className="text-emerald-400">.in</span></span>
                </div>

                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Local-First Tools
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Check className="w-3 h-3 text-slate-400" />
                    No Signup
                  </span>
                </div>
              </div>

              {/* Mockup Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  readOnly
                  value="What do you need to get done?"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-400 font-mono"
                />
                <ArrowRight className="absolute right-3 top-2.5 w-3.5 h-3.5 text-emerald-400" />
              </div>

              {/* Mockup Interactive Content Box */}
              <div className="grid grid-cols-12 gap-3 font-mono text-[11px]">
                {/* Micro Tools Sidebar Pills */}
                <div className="col-span-4 space-y-2">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    <span>JSON Formatter</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                    <span className="text-cyan-400 font-bold text-xs">(*.+)</span>
                    <span>Regex Tester</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sitemap Gen</span>
                  </div>
                </div>

                {/* Main Tool Content Container */}
                <div className="col-span-8 bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2 relative">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="font-bold text-white text-xs">Bulk URL Extractor</span>
                    <span className="text-[10px] text-slate-500">Extract all URLs from text</span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded text-[10px] text-slate-400 space-y-1 leading-tight border border-slate-800/50">
                    <p><span className="text-slate-600">1</span> Check out our website: https://xfree.in</p>
                    <p><span className="text-slate-600">2</span> Visit docs at https://docs.xfree.in/getting-started</p>
                    <p><span className="text-slate-600">3</span> Follow our GitHub: github.com/CodesbyFebin/xfree</p>
                  </div>

                  {/* Extract Button */}
                  <div className="flex justify-end">
                    <div className="px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded flex items-center gap-1 shadow">
                      <Zap className="w-3 h-3 fill-slate-950" />
                      <span>Extract URLs</span>
                    </div>
                  </div>

                  {/* Extracted Results List */}
                  <div className="space-y-1 pt-1 text-[10px]">
                    <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Extracted URLs</span>
                    <div className="flex items-center justify-between text-cyan-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                      <span className="truncate">1. https://xfree.in</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between text-cyan-400 bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                      <span className="truncate">2. https://docs.xfree.in/getting-started</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Shield Lock Graphic Overlay */}
              <div className="absolute bottom-2 right-2 p-3 bg-slate-900/95 border border-emerald-500/50 rounded-xl shadow-2xl backdrop-blur flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Trust Badges Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-center space-x-3 text-slate-300 text-xs sm:text-sm font-semibold">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Free Tools</span>
        </div>
        <div className="flex items-center justify-center space-x-3 text-slate-300 text-xs sm:text-sm font-semibold">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Browser-Based</span>
        </div>
        <div className="flex items-center justify-center space-x-3 text-slate-300 text-xs sm:text-sm font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Privacy-First</span>
        </div>
        <div className="flex items-center justify-center space-x-3 text-slate-300 text-xs sm:text-sm font-semibold">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>No Signup</span>
        </div>
      </div>

      {/* Search Input Filter Container */}
      <div className="relative max-w-4xl mx-auto pt-2">
        <div className="relative flex items-center">
          <Search className="absolute left-5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tools... (e.g. Bulk URL, JSON, Regex, Sitemap, Cron)"
            className="w-full h-14 pl-14 pr-32 bg-slate-900/80 border border-slate-800 text-white placeholder-slate-400 text-base rounded-2xl focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
          />
          <span className="absolute right-4 text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            {totalTools} tools
          </span>
        </div>
      </div>
    </div>
  );
};
