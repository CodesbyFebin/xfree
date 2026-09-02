import React from "react";
import { Check } from "lucide-react";

const POINTS = [
  {
    title: "Vercel-first, self-hostable",
    desc: "Express dev server locally; a Vercel serverless function in production. Nothing here requires Vercel specifically — Node runs it anywhere.",
  },
  {
    title: "Zero external calls for the core",
    desc: "100 local Studio engines run as browser JavaScript or in a Web Worker. Cloud AI (Gemini, NVIDIA NIM) is opt-in and off by default.",
  },
  {
    title: "Type-checked, Zod-validated",
    desc: "TypeScript end to end. Every AI, contact, feedback, and lead request body is validated with Zod before it's touched.",
  },
  {
    title: "Governed by default",
    desc: "The content pipeline enforces review, duplicate/similarity checks, and explicit approval before publish — not after.",
  },
];

export const ArchitectureSection: React.FC = () => {
  return (
    <div id="architecture" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Architecture</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Designed for production, not a pitch deck
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Intent detection, tool execution, and content governance are separate, composable layers —
            not one prompt doing everything.
          </p>
        </div>

        <div className="space-y-4">
          {POINTS.map((point) => (
            <div key={point.title} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center mt-0.5 shrink-0">
                <Check className="w-3 h-3 text-cyan-400 stroke-[3]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{point.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{point.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-white/[0.02]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[11px] text-slate-500 font-mono">real exported signatures</span>
        </div>
        <pre className="p-5 text-[11px] sm:text-xs leading-relaxed font-mono overflow-x-auto">
          <code>
            <span className="text-slate-500">{"// src/lib/intent-engine.ts"}</span>{"\n"}
            <span className="text-purple-400">export function</span>{" "}
            <span className="text-blue-300">classifyIntent</span>
            {"(query: string): IntentClassification"}{"\n\n"}
            <span className="text-slate-500">{"// src/lib/execution-engine.ts"}</span>{"\n"}
            <span className="text-purple-400">export function</span>{" "}
            <span className="text-blue-300">buildExecutionPlan</span>
            {"(\n  request: ToolExecutionRequest\n): ExecutionPlan"}{"\n\n"}
            <span className="text-slate-500">{"// src/content-pipeline/orchestrator.ts"}</span>{"\n"}
            <span className="text-purple-400">export interface</span>{" "}
            <span className="text-emerald-300">ContentGenerationProvider</span>
            {" {\n  "}
            <span className="text-blue-300">generate</span>
            {"(spec: ToolGenerationSpec, prompt: string): Promise<unknown>\n}"}
            {"\n\n"}
            <span className="text-slate-500">{"// → review → similarity-check → approval → publish"}</span>
          </code>
        </pre>
      </div>
    </div>
  );
};
