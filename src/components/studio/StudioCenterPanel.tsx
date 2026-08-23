import React from "react";
import { Bot, BrainCircuit, FilePlus2, Loader2, Send, Settings2, ShieldCheck, Sparkles, User } from "lucide-react";
import { CloudModeBanner } from "./CloudModeBanner";
import { AgentWorkflowCard } from "./AgentWorkflowCard";
import type { LocalAgentPlan } from "../../lib/agent-core";
import type { LocalAgentCapabilities, LocalBrainProgress } from "../../lib/local-brain";
import type { LocalEngine, StudioMessage } from "../../lib/studio/types";

const SUGGESTIONS = [
  "Extract URLs, remove duplicates, sort them, and export as JSON",
  "Validate JSON, then pretty-format it",
  "Decode this JWT",
  "Hash this text with SHA-256",
  "Convert JSON to CSV",
];

type AgentMode = "rules" | "webllm";

interface Props {
  cloud: boolean;
  engine: LocalEngine;
  input: string;
  command: string;
  messages: StudioMessage[];
  loading: boolean;
  agentMode: AgentMode;
  agentCapabilities: LocalAgentCapabilities;
  agentPlan: LocalAgentPlan | null;
  brainProgress: LocalBrainProgress | null;
  soul: string;
  onInput: (value: string) => void;
  onCommand: (value: string) => void;
  onSubmit: () => void;
  onAttach: () => void;
  onSuggestion: (value: string) => void;
  onAgentMode: (mode: AgentMode) => void;
  onSoul: (value: string) => void;
}

export function StudioCenterPanel({
  cloud,
  engine,
  input,
  command,
  messages,
  loading,
  agentMode,
  agentCapabilities,
  agentPlan,
  brainProgress,
  soul,
  onInput,
  onCommand,
  onSubmit,
  onAttach,
  onSuggestion,
  onAgentMode,
  onSoul,
}: Props) {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#0a0b0f] text-slate-200">
      <div className="border-b border-[#2a2b38] px-4 py-2"><CloudModeBanner cloud={cloud} /></div>

      {!cloud ? (
        <div className="border-b border-[#2a2b38] bg-[#12131a] px-4 py-2.5 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><ShieldCheck className="h-4 w-4" /></span>
              <div>
                <p className="text-xs font-semibold text-slate-100">XFree Agent Core</p>
                <p className="text-[10px] text-slate-500">Plans are allowlist-checked before local execution.</p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-[#2a2b38] bg-[#1a1b25] p-1">
              <button type="button" onClick={() => onAgentMode("rules")} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${agentMode === "rules" ? "bg-[#22232f] text-indigo-300 shadow-sm" : "text-slate-500 hover:text-slate-200"}`}>Rules Agent</button>
              <button type="button" disabled={!agentCapabilities.webGpu} onClick={() => onAgentMode("webllm")} title={agentCapabilities.webGpu ? "Use an opt-in in-browser WebGPU model to plan local tool chains" : "WebGPU is not available in this browser"} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${agentMode === "webllm" ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-200"}`}><BrainCircuit className="h-3 w-3" /> WebGPU Brain</button>
            </div>
          </div>

          <div className="mx-auto mt-2 max-w-3xl">
            {agentMode === "webllm" ? (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] leading-relaxed text-amber-200">First use downloads the pinned WebLLM runtime and model assets from approved third-party hosts. Inference prompts stay in this browser and the proposed plan is still engine-allowlist checked before execution.</p>
            ) : (
              <p className="text-[10px] text-slate-500">Rules Agent needs no model download and uses deterministic intent matching over XFree's real local engines.</p>
            )}
            <details className="mt-2 rounded-xl border border-[#2a2b38] bg-[#1a1b25]">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400"><Settings2 className="h-3.5 w-3.5" /> Local SOUL settings</summary>
              <div className="border-t border-[#2a2b38] p-3">
                <textarea value={soul} onChange={(event) => onSoul(event.target.value)} rows={6} className="w-full resize-y rounded-xl border border-[#2a2b38] bg-[#0a0b0f] p-3 font-mono text-[11px] leading-relaxed text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" aria-label="Local agent SOUL settings" />
                <p className="mt-2 text-[10px] text-slate-500">Stored only in this browser. Deterministic execution policy remains authoritative.</p>
              </div>
            </details>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
        <AgentWorkflowCard plan={agentPlan} brainProgress={brainProgress} />
        {messages.length === 0 ? (
          <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
            <div className="relative mb-5">
              <span className="absolute inset-0 rotate-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[#2a2b38] bg-gradient-to-br from-[#1a1b25] to-[#22232f] shadow-2xl"><Sparkles className="h-10 w-10 text-indigo-400" /></span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100">XFree Agent Studio</h2>
            <p className="mt-2 max-w-lg text-sm text-slate-400">Describe a local workflow. XFree plans a short chain, shows every step, and runs only allowlisted browser engines.</p>
            <div className="mt-7 flex max-w-2xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} onClick={() => onSuggestion(suggestion)} className="rounded-full border border-[#2a2b38] bg-[#1a1b25] px-4 py-2 text-sm font-medium text-slate-400 transition hover:-translate-y-0.5 hover:border-indigo-500 hover:bg-indigo-500/5 hover:text-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10">{suggestion}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#2a2b38] bg-[#1a1b25]"><Bot className="h-4 w-4 text-indigo-400" /></span> : null}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-lg ${message.role === "user" ? "rounded-br-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/10" : "rounded-bl-md border border-[#2a2b38] bg-[#1a1b25] text-slate-300"}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`mt-2 text-[10px] ${message.role === "user" ? "text-indigo-100" : "text-slate-500"}`}>{message.provider === "NVIDIA" ? `NVIDIA${message.model ? ` • ${message.model}` : ""}` : "Local"}</p>
                  {message.fallbackNotice ? <p className="mt-1 text-xs text-amber-300">{message.fallbackNotice}</p> : null}
                </div>
                {message.role === "user" ? <User className="mt-1 h-5 w-5 text-indigo-400" /> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-3 lg:px-8">
        {!cloud ? (
          <textarea value={input} onChange={(event) => onInput(event.target.value)} rows={4} placeholder={engine.placeholder} className="mx-auto mb-2 block w-full max-w-3xl resize-y rounded-2xl border border-[#2a2b38] bg-[#12131a] p-3 font-mono text-xs text-slate-300 outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        ) : null}

        <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#2a2b38] bg-[#1a1b25] p-2 shadow-2xl shadow-black/30 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
          <button type="button" onClick={onAttach} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-indigo-500/10 hover:text-indigo-300" aria-label="Attach file"><FilePlus2 className="h-4 w-4" /></button>
          <textarea id="studio-command" value={command} onChange={(event) => onCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSubmit(); } }} rows={1} placeholder={cloud ? "Ask an NVIDIA model…" : "Describe a local workflow…"} className="min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600" />
          <span className={`mb-1 hidden rounded-lg px-2 py-1 text-[10px] font-semibold sm:block ${cloud ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"}`}>{cloud ? "Cloud" : agentMode === "webllm" ? "Local WebGPU" : "Local Rules"}</span>
          <button disabled={loading} className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:opacity-40" aria-label="Run command">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-600">Enter to run · Shift+Enter for a new line · Local agent plans never call cloud APIs</p>
      </div>
    </section>
  );
}
