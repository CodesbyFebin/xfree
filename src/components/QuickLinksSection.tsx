import React from "react";
import { ArrowUpRight, Binary, Code, Eye, FileCode, Globe, Sparkles, Zap } from "lucide-react";
import { PUBLIC_TOOLS } from "../data/publicTools";

interface QuickLinksSectionProps {
  onSelectTool: (slug: string) => void;
}

export const QUICK_LINK_ITEMS = [
  { title: "JSON Formatter & Validator", slug: "json-formatter", category: "Developer", badge: "Popular", desc: "Format, validate and inspect JSON data locally in your browser.", icon: Code, tone: "text-violet-600 bg-violet-50 border-violet-100" },
  { title: "Regex Tester & Explainer", slug: "regex-tester", category: "Developer", badge: "Popular", desc: "Test JavaScript regular expressions against sample text with immediate feedback.", icon: FileCode, tone: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  { title: "Bulk URL Extractor", slug: "bulk-url-extractor", category: "SEO & URL", badge: "Flagship", desc: "Extract URLs from pasted text or HTML before cleanup, validation or sitemap work.", icon: Globe, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  { title: "Meta Tag Generator", slug: "meta-tag-generator", category: "SEO & URL", badge: "Essential", desc: "Draft page metadata and preview social/search presentation from one utility.", icon: Eye, tone: "text-cyan-700 bg-cyan-50 border-cyan-100" },
  { title: "AI Regex Generator", slug: "ai-regex-generator-explainer", category: "AI", badge: "Cloud disclosed", desc: "Describe a pattern in plain language when you explicitly choose the AI-assisted workflow.", icon: Sparkles, tone: "text-purple-700 bg-purple-50 border-purple-100" },
  { title: "Base64 & JWT Decoder", slug: "base64-encoder-decoder", category: "Converters", badge: "Local", desc: "Encode Base64 strings and inspect JWT payload structure in the browser.", icon: Binary, tone: "text-blue-700 bg-blue-50 border-blue-100" },
] as const;

export const QuickLinksSection: React.FC<QuickLinksSectionProps> = ({ onSelectTool }) => {
  const items = QUICK_LINK_ITEMS.filter((item) => PUBLIC_TOOLS.some((tool) => tool.slug === item.slug));

  return (
    <section className="space-y-6" aria-labelledby="quick-links-heading">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Quick launch</p>
          <h2 id="quick-links-heading" className="mt-2 text-3xl font-black tracking-tight text-slate-950">Popular published tools</h2>
          <p className="mt-2 text-sm text-slate-500">Direct links to commonly used utilities in the verified public directory.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500"><Zap className="h-3.5 w-3.5 text-amber-500" /> Direct launch</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.slug}
              href={`/tools/${item.slug}`}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
                event.preventDefault();
                onSelectTool(item.slug);
              }}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              aria-label={`${item.title} — ${item.desc}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.tone}`}><Icon className="h-5 w-5" /></span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </div>
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-slate-950 group-hover:text-indigo-600">{item.title}</h3>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{item.badge}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-3 text-xs font-bold text-indigo-600">{item.category} · Open tool →</div>
            </a>
          );
        })}
      </div>
    </section>
  );
};
