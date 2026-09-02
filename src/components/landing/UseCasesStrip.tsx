import React from "react";

interface UseCasesStripProps {
  onExplore: () => void;
}

const CASES = [
  {
    emoji: "🔍",
    title: "AI-Powered Search & Discovery",
    desc: "The intent engine routes a plain-English request to the tool that solves it — and returns nothing rather than a misleading guess when no tool applies.",
    tags: ["Intent Classification", "Tool Routing"],
  },
  {
    emoji: "🧰",
    title: "Local-First Data Processing",
    desc: "100 Studio engines handle JSON, CSV, regex, hashing, and text transforms entirely in the browser — no upload, no server round-trip.",
    tags: ["Local Engines", "Web Workers"],
  },
  {
    emoji: "🤖",
    title: "Multi-Agent Task Orchestration",
    desc: "Six specialized agents — research, tool selection, verification, workflow, security — coordinate multi-step requests with scoped permissions.",
    tags: ["Agents", "Workflow Engine"],
  },
  {
    emoji: "🌐",
    title: "SEO & AI-Crawler Discoverability",
    desc: "Per-route JSON-LD, an XML sitemap, and a split-brain robots.txt that allows citation bots while blocking bulk-training crawlers.",
    tags: ["SEO", "AEO", "GEO"],
  },
];

export const UseCasesStrip: React.FC<UseCasesStripProps> = ({ onExplore }) => {
  return (
    <div id="use-cases" className="scroll-mt-24 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Use Cases</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Real workflows, not hypotheticals
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Every workflow below links to a tool you can open right now — not a waitlist.
          </p>
        </div>
        <button
          onClick={onExplore}
          className="shrink-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          Explore Use Cases &amp; Examples →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CASES.map((item) => (
          <div key={item.title} className="p-6 rounded-2xl glass-panel-interactive space-y-3">
            <div className="text-2xl">{item.emoji}</div>
            <h3 className="text-sm font-bold text-white">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-400 border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
