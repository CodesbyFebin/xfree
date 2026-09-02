import React from "react";
import { BookOpen, ArrowRight, ShieldCheck } from "lucide-react";
import { PUBLIC_TOOL_SLUGS } from "../../data/publicTools";
import { GUIDES } from "../../data/guides";

interface PageProps {
  onGoHome: () => void;
  onSelectTool: (slug: string) => void;
}

export const DocsHubPage: React.FC<PageProps> = ({ onGoHome: _onGoHome, onSelectTool }) => {
  const guides = [
    {
      title: "Generating Technical XML Sitemaps for Large Sites",
      category: "SEO Guide",
      description: "Learn how to parse raw web crawls, clean query strings, filter domains, and split sitemaps into index compliant chunks.",
      toolSlug: "bulk-url-extractor"
    },
    {
      title: "JSON Formatting, Validation, and Tree View Navigation",
      category: "Developer Guide",
      description: "Step-by-step tutorial on diagnosing syntax errors in JSON/XML payloads and converting raw text into interactive tree views.",
      toolSlug: "json-formatter"
    },
    {
      title: "Testing and Debugging Regular Expressions",
      category: "Regex Guide",
      description: "Master regular expression flags, capture group extractions, and instant replacement strings with real-time highlights.",
      toolSlug: "regex-tester"
    },
    {
      title: "Understanding Cron Schedules and Syntax Execution",
      category: "DevOps Guide",
      description: "Detailed breakdown of the 5 cron schedule fields (minute, hour, day, month, day-of-week) with human-readable translations.",
      toolSlug: "cron-expression-generator"
    },
    {
      title: "Configuring Robots.txt directives for AI Crawlers",
      category: "Robots Guide",
      description: "How to manage search engine bots and AI scrapers using user-agent rules and sitemap directives.",
      toolSlug: "robots-txt-generator"
    },
    {
      title: "Decoding Base64 and OAuth JWT Claims Safely",
      category: "Security Guide",
      description: "Inspect JWT header algorithms, expiration claims, and payload data without transmitting secrets over public networks.",
      toolSlug: "base64-encoder-decoder"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
          <BookOpen className="w-4 h-4" />
          <span>Documentation & Technical Reference</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          XFree.in Documentation Hub
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
          Start with verified tool references, then move into reviewed guides for deeper examples, limitations, and production checks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.filter((guide) => PUBLIC_TOOL_SLUGS.has(guide.toolSlug)).map((g) => (
          <button
            type="button"
            key={g.toolSlug}
            onClick={() => onSelectTool(g.toolSlug)}
            className="p-6 text-left rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {g.category}
              </span>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {g.title}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {g.description}
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform gap-1">
              <span>Read Guide & Launch Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>

      <section className="grid gap-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Documentation contract</h2>
          <p className="text-sm leading-6 text-slate-300">References describe the implementation that is currently published. Draft engines are excluded, privacy language is scoped per processing mode, and examples identify limitations rather than promising universal compliance.</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-center">
          <strong className="block text-2xl text-white">{GUIDES.length}</strong>
          <span className="text-xs text-slate-400">reviewed long-form guides</span>
        </div>
      </section>
    </div>
  );
};
