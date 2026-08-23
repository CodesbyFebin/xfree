import React from "react";
import { AlertCircle, CheckCircle2, Circle, Cpu, Loader2, ShieldCheck, Workflow } from "lucide-react";
import type { LocalAgentPlan } from "../../lib/agent-core";
import type { LocalBrainProgress } from "../../lib/local-brain";

interface Props {
  plan: LocalAgentPlan | null;
  brainProgress: LocalBrainProgress | null;
}

export function AgentWorkflowCard({ plan, brainProgress }: Props) {
  if (!plan && !brainProgress) return null;

  return (
    <section className="mx-auto mb-5 w-full max-w-3xl rounded-2xl border border-[#2a2b38] bg-[#12131a] p-4 shadow-2xl shadow-black/20" aria-label="Local agent workflow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"><Workflow className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Active local workflow</h3>
            <p className="text-[11px] text-slate-500">{plan?.source === "webllm" ? "Planned by WebGPU Brain · allowlist verified" : "Planned deterministically · local engines only"}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400"><ShieldCheck className="h-3 w-3" /> No cloud execution</span>
      </div>

      {brainProgress && brainProgress.progress < 1 ? (
        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
          <div className="flex items-center justify-between gap-3 text-xs text-indigo-300"><span className="inline-flex items-center gap-2"><Cpu className="h-3.5 w-3.5" />{brainProgress.text}</span><span>{Math.round(brainProgress.progress * 100)}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-950"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.max(2, Math.round(brainProgress.progress * 100))}%` }} /></div>
        </div>
      ) : null}

      {plan?.rationale ? <p className="mt-3 text-xs leading-relaxed text-slate-500">{plan.rationale}</p> : null}

      {plan ? (
        <ol className="mt-4 space-y-2">
          {plan.steps.map((step, index) => {
            const Icon = step.status === "completed" ? CheckCircle2 : step.status === "running" ? Loader2 : step.status === "failed" ? AlertCircle : Circle;
            const tone = step.status === "completed" ? "text-emerald-400" : step.status === "running" ? "text-indigo-400" : step.status === "failed" ? "text-rose-400" : "text-slate-600";
            return (
              <li key={step.id} className="flex items-start gap-3 rounded-xl border border-[#2a2b38] bg-[#1a1b25] px-3 py-2.5">
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone} ${step.status === "running" ? "animate-spin" : ""}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-slate-300">{index + 1}. {step.label}</span><code className="rounded border border-[#2a2b38] bg-[#0a0b0f] px-1.5 py-0.5 text-[10px] text-slate-500">{step.engineId || step.transformId}</code></div>
                  {step.error ? <p className="mt-1 text-[11px] text-rose-400">{step.error}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
