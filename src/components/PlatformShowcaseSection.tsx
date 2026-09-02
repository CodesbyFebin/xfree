import React from "react";
import {
  Route,
  Workflow,
  Bot,
  Cpu,
  Cloud,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { LOCAL_ENGINES } from "../lib/studio/engines";
import { SPECIALIST_AGENTS } from "../lib/agents";

interface PlatformShowcaseSectionProps {
  onOpenStudio: () => void;
}

export const PlatformShowcaseSection: React.FC<PlatformShowcaseSectionProps> = ({ onOpenStudio }) => {
  const engineCount = LOCAL_ENGINES.length;
  const agentCount = SPECIALIST_AGENTS.length;

  const features = [
    {
      icon: Route,
      color: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
      title: "Intent Engine",
      desc: "Classifies a plain-English request into intent, entities, and constraints, then routes it to the tools that actually solve it — unsupported intents return zero matches instead of a misleading guess.",
      file: "src/lib/intent-engine.ts",
    },
    {
      icon: Workflow,
      color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30",
      title: "Execution Engine",
      desc: "Turns a classified intent into a typed execution plan — single-tool calls or multi-step workflows — with per-step verification and fallback built in.",
      file: "src/lib/execution-engine.ts",
    },
    {
      icon: Bot,
      color: "text-purple-300 bg-purple-500/10 border-purple-500/30",
      title: `${agentCount} Specialized Agents`,
      desc: "Intent Classifier, Research, Tool Selection, Verification, Workflow Builder, and Security agents — each with declared capabilities and scoped permissions, not a single do-everything prompt.",
      file: "src/lib/agents.ts",
    },
    {
      icon: Cpu,
      color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
      title: `${engineCount} Local Studio Engines`,
      desc: "JSON, CSV, regex, hashing, date math, URL and text utilities that run entirely in your browser (some in a Web Worker) — no network round-trip, no data leaves the tab.",
      file: "src/lib/studio/engines.ts",
    },
    {
      icon: Cloud,
      color: "text-blue-300 bg-blue-500/10 border-blue-500/30",
      title: "NVIDIA NIM Cloud Mode",
      desc: "Opt-in server-side routing to NVIDIA-hosted models (and Google Gemini) for tasks local engines can't do — off by default, clearly labelled, keys never touch the browser.",
      file: "src/server/nvidia/",
    },
    {
      icon: ShieldCheck,
      color: "text-amber-300 bg-amber-500/10 border-amber-500/30",
      title: "Governed Content Pipeline",
      desc: "Every generated tool page passes a review → similarity-check → approval gate before it's compiled into the site — nothing publishes automatically or unreviewed.",
      file: "src/content-pipeline/",
    },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 border border-white/10 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-300 tracking-wide">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            XFree AI Studio — open source, MIT licensed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            The agent execution engine behind the tools
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Every micro-tool above is a leaf node in a larger system: intent routing, tool mapping, and a governed
            content pipeline that decide what runs, where it runs, and whether it ever gets published.
          </p>
        </div>
        <button
          onClick={onOpenStudio}
          className="shrink-0 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Open XFree Studio</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="p-5 rounded-2xl glass-panel-interactive space-y-3"
            >
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

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        {[
          { label: "Local Studio Engines", value: String(engineCount) },
          { label: "Specialized Agents", value: String(agentCount) },
          { label: "Published Tools", value: "10" },
          { label: "License", value: "MIT" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center">
            <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-1">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Cloud AI is opt-in, off by default
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Provider keys never reach the browser
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Self-hostable, no vendor lock-in
        </span>
      </div>
    </div>
  );
};
