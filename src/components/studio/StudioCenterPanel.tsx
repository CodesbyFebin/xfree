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
    <section className="flex min-w-0 flex-1 flex-col bg-[#F8F7F4]">
      <div className="border-b border-stone-200 px-4 py-2"><CloudModeBanner cloud={cloud} /></div>

      {!cloud ? (
        <div className="border-b border-stone-200 bg-white/70 px-4 py-2.5 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-4 w-4" /></span>
              <div>
                <p className="text-xs font-semibold text-stone-800">XFree Agent Core</p>
                <p className="text-[10px] text-stone-500">Plans are allowlist-checked before local execution.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button type="button" onClick={() => onAgentMode("rules")} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${agentMode === "rules" ? "bg-white text-indigo-700 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>Rules Agent</button>
              <button type="button" disabled={!agentCapabilities.webGpu} onClick={() => onAgentMode("webllm")} title={agentCapabilities.webGpu ? "Use an opt-in in-browser WebGPU model to plan local tool chains" : "WebGPU is not available in this browser"} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${agentMode === "webllm" ? "bg-indigo-600 text-white shadow-sm" : "text-stone-500 hover:text-stone-800"}`}><BrainCircuit className="h-3 w-3" /> WebGPU Brain</button>
            </div>
          </div>
          <div className="mx-auto mt-2 max-w-3xl">
            {agentMode === "webllm" ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-800">First use downloads the pinned WebLLM runtime and model assets from third-party model/CDN hosts. Inference prompts stay in this browser and are not sent to XFree or NVIDIA. The model only proposes a plan; XFree validates every engine ID before execution.</p>
            ) : (
              <p className="text-[10px] text-stone-400">Rules Agent needs no model download and uses deterministic intent matching over XFree's real local engines.</p>
            )}
            <details className="mt-2 rounded-xl border border-stone-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-stone-600"><Settings2 className="h-3.5 w-3.5" /> Local SOUL settings</summary>
              <div className="border-t border-stone-100 p-3">
                <textarea value={soul} onChange={(event) => onSoul(event.target.value)} rows={6} className="w-full resize-y rounded-xl border border-stone-200 bg-stone-50 p-3 font-mono text-[11px] leading-relaxed text-stone-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" aria-label="Local agent SOUL settings" />
                <p className="mt-2 text-[10px] text-stone-400">Stored only in this browser. These instructions steer the opt-in local WebGPU planner; deterministic execution policy remains authoritative.</p>
              </div>
            </details>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
        <AgentWorkflowCard plan={agentPlan} brainProgress={brainProgress} />
        {messages.length === 0 ? (
          <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
            <div className="relative mb-5"><span className="absolute inset-0 rotate-6 rounded-3xl bg-indigo-100" /><span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm"><Sparkles className="h-10 w-10 text-indigo-500" /></span></div>
            <h2 className="text-xl font-semibold text-stone-800">XFree Agent Studio</h2>
            <p className="mt-2 max-w-lg text-sm text-stone-500">Describe a local workflow. XFree plans a short chain, shows every step, and runs only allowlisted browser engines.</p>
            <div className="mt-7 flex max-w-2xl flex-wrap justify-center gap-2">{SUGGESTIONS.map((suggestion) => <button key={suggestion} onClick={() => onSuggestion(suggestion)} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600">{suggestion}</button>)}</div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">{messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "assistant" ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white"><Bot className="h-4 w-4 text-indigo-500" /></span> : null}<div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${message.role === "user" ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-stone-200 bg-white text-stone-700"}`}><p className="whitespace-pre-wrap">{message.content}</p><p className={`mt-2 text-[10px] ${message.role === "user" ? "text-indigo-200" : "text-stone-400"}`}>{message.provider === "NVIDIA" ? `NVIDIA${message.model ? ` • ${message.model}` : ""}` : "Local"}</p>{message.fallbackNotice ? <p className="mt-1 text-xs text-amber-600">{message.fallbackNotice}</p> : null}</div>{message.role === "user" ? <User className="mt-1 h-5 w-5 text-indigo-400" /> : null}</div>)}</div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-3 lg:px-8">
        {!cloud ? <textarea value={input} onChange={(event) => onInput(event.target.value)} rows={4} placeholder={engine.placeholder} className="mx-auto mb-2 block w-full max-w-3xl resize-y rounded-2xl border border-stone-200 bg-white p-3 font-mono text-xs text-stone-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /> : null}
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-lg focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
          <button type="button" onClick={onAttach} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-indigo-50 hover:text-indigo-600" aria-label="Attach file"><FilePlus2 className="h-4 w-4" /></button>
          <textarea id="studio-command" value={command} onChange={(event) => onCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSubmit(); } }} rows={1} placeholder={cloud ? "Ask an NVIDIA model…" : "Describe a local workflow…"} className="min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-stone-800 outline-none" />
          <span className={`mb-1 hidden rounded-full px-2 py-1 text-[10px] sm:block ${cloud ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}>{cloud ? "Cloud" : agentMode === "webllm" ? "Local WebGPU" : "Local Rules"}</span>
          <button disabled={loading} className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-40" aria-label="Run command">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
        </form>
        <p className="mt-2 text-center text-[10px] text-stone-400">Enter to run · Shift+Enter for a new line · Local agent plans never call cloud APIs</p>
      </div>
    </section>
  );
}
