import React, { useMemo, useState } from "react";
import { Bot, Cloud, Code2, Send, ShieldCheck, Sparkles, User } from "lucide-react";
import { CloudModeBanner } from "../studio/CloudModeBanner";
import { ModelSelector } from "../studio/ModelSelector";

type StudioMode = "local" | "cloud";
type TaskType = "code" | "json" | "sql" | "summarization" | "reasoning" | "general";

interface StudioMessage {
  role: "user" | "assistant";
  content: string;
  provider?: "NVIDIA" | "Local";
  model?: string;
  fallbackNotice?: string;
}

function inferTaskType(input: string): TaskType {
  const text = input.toLowerCase();
  if (/\b(json|schema)\b/.test(text)) return "json";
  if (/\b(sql|query|database)\b/.test(text)) return "sql";
  if (/\b(code|typescript|javascript|python|debug|regex)\b/.test(text)) return "code";
  if (/\b(summarize|summary|condense)\b/.test(text)) return "summarization";
  if (/\b(reason|analyze|compare|plan)\b/.test(text)) return "reasoning";
  return "general";
}

export function StudioPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [mode, setMode] = useState<StudioMode>("local");
  const [model, setModel] = useState("auto");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const cloud = mode === "cloud";
  const taskType = useMemo(() => inferTaskType(input), [input]);

  const switchMode = (nextMode: StudioMode) => {
    setMode(nextMode);
    if (nextMode === "local") setModel("auto");
  };

  const submit = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput("");
    const userMessage: StudioMessage = {
      role: "user",
      content: prompt,
      provider: cloud ? "NVIDIA" : "Local",
    };
    setMessages((current) => [...current, userMessage]);

    if (!cloud) {
      setMessages((current) => [...current, {
        role: "assistant",
        provider: "Local",
        content: "Local Mode is active. Choose a published browser tool below; this command was not sent to NVIDIA.",
      }]);
      return;
    }

    setLoading(true);
    try {
      const history = [...messages.filter((message) => message.provider === "NVIDIA"), userMessage]
        .map((message) => ({ role: message.role, content: message.content }));
      const response = await fetch("/api/nvidia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, taskType: inferTaskType(prompt), messages: history }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || data.error || "NVIDIA request failed");
      setMessages((current) => [...current, {
        role: "assistant",
        provider: "NVIDIA",
        model: data.usedModel,
        fallbackNotice: data.wasFallback
          ? `Model ${data.requestedModel} was unavailable — used ${data.usedModel} instead.`
          : undefined,
        content: data.reply,
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        role: "assistant",
        provider: "NVIDIA",
        content: error instanceof Error ? error.message : "NVIDIA request failed",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-3 py-6 sm:px-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Universal command center</p>
          <h1 className="mt-1 text-3xl font-black text-white">XFree Studio</h1>
          <p className="mt-2 text-sm text-slate-400">Local browser tools by default, optional NVIDIA Cloud processing when you choose it.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1" aria-label="Processing mode">
          {(["local", "cloud"] as StudioMode[]).map((item) => (
            <button
              key={item}
              onClick={() => switchMode(item)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${mode === item ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
            >
              {item === "local" ? <ShieldCheck className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
              {item === "local" ? "Local" : "Cloud"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-[620px] grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-bold text-white">Local engines</h2>
          {["json-formatter", "regex-tester", "cron-expression-generator", "base64-encoder-decoder"].map((slug) => (
            <button key={slug} onClick={() => onNavigate(`/tools/${slug}`)} className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-left text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300">
              <Code2 className="h-4 w-4" /> {slug.replace(/-/g, " ")}
            </button>
          ))}
        </aside>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 p-4"><CloudModeBanner cloud={cloud} /></div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                <Sparkles className="h-10 w-10 text-cyan-400" />
                <h2 className="mt-4 text-xl font-bold text-white">What do you need to get done?</h2>
                <p className="mt-2 max-w-md text-sm text-slate-400">Use a local tool, or explicitly enable Cloud Mode to ask an NVIDIA model.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && <Bot className="mt-2 h-5 w-5 shrink-0 text-cyan-400" />}
                <div className={`max-w-[88%] rounded-2xl p-4 text-sm ${message.role === "user" ? "bg-cyan-600 text-white" : "border border-slate-700 bg-slate-800 text-slate-200"}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && message.provider && (
                    <p className="mt-3 border-t border-white/10 pt-2 text-[11px] text-slate-400">
                      {message.provider === "NVIDIA" ? `Processed via NVIDIA${message.model ? ` • Model: ${message.model}` : ""}` : "Processed locally"}
                    </p>
                  )}
                  {message.fallbackNotice && <p className="mt-2 text-xs text-amber-300">{message.fallbackNotice}</p>}
                </div>
                {message.role === "user" && <User className="mt-2 h-5 w-5 shrink-0 text-indigo-300" />}
              </div>
            ))}
            {loading && <p className="text-xs text-cyan-300">NVIDIA is processing this request…</p>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="border-t border-slate-800 p-4">
            <div className="flex gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-2 focus-within:border-cyan-500">
              <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={2} placeholder={cloud ? "Ask an NVIDIA model…" : "Describe a task or open a local engine…"} className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-slate-500" />
              <button type="submit" disabled={!input.trim() || loading} className="self-end rounded-xl bg-cyan-500 p-3 text-slate-950 disabled:opacity-40" aria-label="Send command"><Send className="h-4 w-4" /></button>
            </div>
          </form>
        </section>

        <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div>
            <h2 className="text-sm font-bold text-white">Cloud provider</h2>
            <div className={`mt-3 rounded-xl border p-3 text-sm ${cloud ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-slate-800 bg-slate-950 text-slate-500"}`}>
              NVIDIA NIM {cloud ? "enabled" : "disabled in Local Mode"}
            </div>
          </div>
          <ModelSelector active={cloud} value={model} onChange={setModel} />
          {cloud && <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">Auto routing detected task: <strong className="text-slate-200">{taskType}</strong></p>}
        </aside>
      </div>
    </div>
  );
}
