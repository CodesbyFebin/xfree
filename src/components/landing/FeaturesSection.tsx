import React from "react";
import { Workflow, Route, Cpu, ShieldCheck, Bot, Globe2 } from "lucide-react";
import { LOCAL_ENGINES } from "../../lib/studio/engines";
import { SPECIALIST_AGENTS } from "../../lib/agents";

export const FeaturesSection: React.FC = () => {
  const engineCount = LOCAL_ENGINES.length;
  const agentCount = SPECIALIST_AGENTS.length;

  const stats = [
    { value: String(engineCount), label: "Local Studio Engines" },
    { value: "MIT", label: "Open Source License" },
    { value: "Self-Host", label: "Your Infrastructure" },
    { value: "10", label: "Published Tools" },
  ];

  const features = [
    {
      icon: Workflow,
      color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
      title: "Agent Execution Engine",
      desc: "A typed execution plan for every request — single-tool calls or multi-step workflows — with per-step verification and fallback built in.",
      file: "src/lib/execution-engine.ts",
    },
    {
      icon: Route,
      color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30",
      title: "Intent Routing",
      desc: "Classifies a plain-English request into intent, entities, and constraints, then routes it to tools that actually solve it — unsupported intents return zero matches, never a misleading guess.",
      file: "src/lib/intent-engine.ts",
    },
    {
      icon: Cpu,
      color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
      title: `${engineCount} Local Studio Engines`,
      desc: "JSON, CSV, regex, hashing, date math, URL and text utilities that run entirely in your browser — some in a Web Worker — with zero network round-trip.",
      file: "src/lib/studio/engines.ts",
    },
    {
      icon: ShieldCheck,
      color: "text-amber-300 bg-amber-500/10 border-amber-500/30",
      title: "Governed Content Pipeline",
      desc: "Every generated tool page passes a review → similarity-check → approval gate before it's compiled into the site. Nothing publishes automatically or unreviewed.",
      file: "src/content-pipeline/",
    },
    {
      icon: Bot,
      color: "text-purple-300 bg-purple-500/10 border-purple-500/30",
      title: `Tool Mapping — ${agentCount} Agents`,
      desc: "Intent Classifier, Research, Tool Selection, Verification, Workflow Builder, and Security agents, each with declared capabilities and scoped permissions.",
      file: "src/lib/agents.ts",
    },
    {
      icon: Globe2,
      color: "text-blue-300 bg-blue-500/10 border-blue-500/30",
      title: "SEO / AEO / GEO Ready",
      desc: "Per-route JSON-LD and prerendered metadata, a split-brain robots.txt that allows citation bots while blocking bulk-training crawlers, plus llms.txt for AI discovery.",
      file: "src/scripts/generateSitemap.ts",
    },
  ];

  return (
    <div id="features" className="scroll-mt-24 space-y-8">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Capabilities</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Everything behind the tools, in the open
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Every micro-tool on this page is a leaf node in a larger system: intent routing, tool mapping, and a
          governed content pipeline that decide what runs, where it runs, and whether it ever gets published.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="p-5 rounded-2xl glass-panel-interactive space-y-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${feature.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">{feature.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
              <div className="pt-1 text-[10px] font-mono text-slate-500 truncate">{feature.file}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
