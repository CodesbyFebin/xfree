import React from "react";

const STEPS = [
  {
    n: 1,
    color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
    title: "Define Intent",
    desc: "classifyIntent() parses a plain-English request into intent, entities, and constraints.",
    file: "src/lib/intent-engine.ts",
  },
  {
    n: 2,
    color: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
    title: "Map Tools",
    desc: "routeIntentToCapabilities() matches the intent to real tools — or returns zero matches if none apply.",
    file: "src/lib/intent-engine.ts",
  },
  {
    n: 3,
    color: "bg-amber-500/20 border-amber-500/30 text-amber-400",
    title: "Govern Output",
    desc: "Generated content passes review → similarity-check → explicit approval before it can publish.",
    file: "src/content-pipeline/",
  },
  {
    n: 4,
    color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
    title: "Execute & Verify",
    desc: "buildExecutionPlan() runs the chosen tool or workflow with per-step verification and fallback.",
    file: "src/lib/execution-engine.ts",
  },
];

export const HowItWorksStrip: React.FC = () => {
  return (
    <div id="how-it-works" className="scroll-mt-24 space-y-8">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">How It Works</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          From query to execution in four steps
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          The same pipeline that runs XFree's own tools — inspect it in the public repository.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step) => (
          <div key={step.n} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold ${step.color}`}>
                {step.n}
              </div>
              {step.n < STEPS.length && (
                <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent hidden lg:block" />
              )}
            </div>
            <h3 className="text-sm font-bold text-white">{step.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            <div className="text-[10px] font-mono text-slate-500">{step.file}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
