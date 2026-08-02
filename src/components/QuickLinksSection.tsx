import React from "react";
import { Zap, ArrowUpRight, Code, Globe, Eye, Sparkles, Binary, FileCode } from "lucide-react";

interface QuickLinksSectionProps {
  onSelectTool: (slug: string) => void;
}

export const QUICK_LINK_ITEMS = [
  {
    title: "JSON Formatter & Validator",
    slug: "json-formatter",
    category: "Developer",
    badge: "Top Used",
    desc: "Format, validate, repair, and minify JSON data with instant tree inspect.",
    icon: Code,
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    title: "Regex Tester & Explainer",
    slug: "regex-tester",
    category: "Developer",
    badge: "Popular",
    desc: "Test JS regex patterns live with match group tables and string replacements.",
    icon: FileCode,
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  {
    title: "Sitemap Generator & URL Extractor",
    slug: "bulk-url-extractor",
    category: "SEO & URL",
    badge: "Flagship",
    desc: "Extract links from raw HTML/logs and generate Google XML sitemaps.",
    icon: Globe,
    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    title: "Meta Tag & Open Graph Generator",
    slug: "meta-tag-generator",
    category: "SEO & URL",
    badge: "Essential",
    desc: "Generate meta titles, descriptions, and preview social cards for Google & X.",
    icon: Eye,
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    title: "AI Regex Generator & Explainer",
    slug: "ai-regex-generator-explainer",
    category: "AI Micro-Tool",
    badge: "Batch Mode",
    desc: "Describe pattern in plain English; AI generates regex with batch processing.",
    icon: Sparkles,
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    title: "Base64 & JWT Decoder",
    slug: "base64-encoder-decoder",
    category: "Converters",
    badge: "Fast & Local",
    desc: "Decode OAuth JWT tokens and convert Base64 strings safely in browser.",
    icon: Binary,
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
];

export const QuickLinksSection: React.FC<QuickLinksSectionProps> = ({ onSelectTool }) => {
  return (
    <div className="p-6 glass-panel rounded-3xl space-y-4 border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
            Quick Links — Most Used Micro-Tools
          </h2>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Direct Launch
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_LINK_ITEMS.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.slug}
              onClick={() => onSelectTool(item.slug)}
              className="p-4 rounded-2xl glass-panel-interactive cursor-pointer space-y-2.5 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${item.color}`}>
                    {item.badge}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                  <IconComp className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="line-clamp-1">{item.title}</span>
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 text-xs font-semibold text-cyan-400 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Category: {item.category}</span>
                <span className="group-hover:translate-x-1 transition-transform">Open Tool →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
