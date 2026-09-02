import React from "react";
import { Globe, Code2, FileText, ArrowRight, Layers } from "lucide-react";
import { PUBLIC_TOOL_SLUGS } from "../../data/publicTools";

interface PageProps {
  onGoHome: () => void;
  onSelectCategory: (catId: string) => void;
  onSelectTool: (slug: string) => void;
}

export const UseCasesPage: React.FC<PageProps> = ({ onGoHome, onSelectCategory: _onSelectCategory, onSelectTool }) => {
  const useCases = [
    {
      title: "Technical SEO Audits & Sitemaps",
      audience: "SEO Specialists & Agency Marketers",
      description: "Extract URLs from supplied text, review duplicates and domains, prepare sitemap output, inspect robots directives, and preview search metadata before publishing changes.",
      tools: [
        { name: "Bulk URL Extractor", slug: "bulk-url-extractor" },
        { name: "Robots.txt Generator", slug: "robots-txt-generator" },
        { name: "Meta Tag Preview", slug: "meta-tag-generator" }
      ],
      icon: Globe,
      color: "text-cyan-400"
    },
    {
      title: "API Payload Debugging & Inspection",
      audience: "Backend Developers & QA Engineers",
      description: "Format and validate JSON payloads, inspect Base64 or JWT sections without treating decoding as signature verification, and test JavaScript regular expressions against controlled samples.",
      tools: [
        { name: "JSON Formatter & Tree", slug: "json-formatter" },
        { name: "Base64 & JWT Decoder", slug: "base64-encoder-decoder" },
        { name: "Regex Tester", slug: "regex-tester" }
      ],
      icon: Code2,
      color: "text-indigo-400"
    },
    {
      title: "DevOps & Cron Automation",
      audience: "DevOps Engineers & System Admins",
      description: "Build clean 5-part cron syntax for backup jobs, view upcoming execution schedules, and test regular expressions for log filtering.",
      tools: [
        { name: "Cron Expression Generator", slug: "cron-expression-generator" },
        { name: "Regex Tester", slug: "regex-tester" }
      ],
      icon: Layers,
      color: "text-emerald-400"
    },
    {
      title: "Content Comparison & Search Previews",
      audience: "Editors, Developers & Content Teams",
      description: "Compare revisions, inspect changed lines, generate metadata, and preview how titles, descriptions, and social cards may appear before shipping a page.",
      tools: [
        { name: "Text Diff Checker", slug: "text-diff-checker" },
        { name: "Meta Tag Preview", slug: "meta-tag-generator" },
        { name: "Schema Markup Generator", slug: "schema-markup-generator" }
      ],
      icon: FileText,
      color: "text-purple-400"
    }
  ];

  const publishedUseCases = useCases
    .map((useCase) => ({ ...useCase, tools: useCase.tools.filter((tool) => PUBLIC_TOOL_SLUGS.has(tool.slug)) }))
    .filter((useCase) => useCase.tools.length > 0);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-12">
      {/* Title */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Real-World Use Cases
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
          How teams, developers, and SEO professionals use XFree.in to solve everyday workflow bottlenecks.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {publishedUseCases.map((uc) => {
          const Icon = uc.icon;
          return (
            <article key={uc.title} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${uc.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{uc.title}</h2>
                    <span className="text-xs font-mono text-emerald-400">{uc.audience}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {uc.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] text-slate-500 uppercase font-mono font-bold tracking-wider">Recommended Tools</span>
                <div className="flex flex-wrap gap-2">
                  {uc.tools.map((t) => (
                    <button
                      type="button"
                      key={t.slug}
                      onClick={() => onSelectTool(t.slug)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 hover:text-white hover:border-cyan-500/50 text-xs transition-colors cursor-pointer"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onGoHome}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <span>Explore All Tools</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
