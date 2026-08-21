import React, { useMemo, useRef, useState } from "react";
import { Bot, Check, Clipboard, Cloud, Code2, Download, FilePlus2, Link2, Loader2, Send, ShieldCheck, Sparkles, Trash2, User } from "lucide-react";
import { CloudModeBanner } from "../studio/CloudModeBanner";
import { ModelSelector } from "../studio/ModelSelector";
import { LOCAL_ENGINES, resolveLocalEngine } from "../../lib/studio/engines";
import type { ProcessingMode, StudioFile, StudioResult } from "../../lib/studio/types";

type TaskType = "code" | "json" | "sql" | "summarization" | "reasoning" | "general";
interface StudioMessage { id: string; role: "user" | "assistant"; content: string; provider: "NVIDIA" | "Local"; model?: string; fallbackNotice?: string }

function inferTaskType(input: string): TaskType {
  const text = input.toLowerCase();
  if (/\b(json|schema)\b/.test(text)) return "json";
  if (/\b(sql|query|database)\b/.test(text)) return "sql";
  if (/\b(code|typescript|javascript|python|debug|regex)\b/.test(text)) return "code";
  if (/\b(summarize|summary|condense)\b/.test(text)) return "summarization";
  if (/\b(reason|analyze|compare|plan)\b/.test(text)) return "reasoning";
  return "general";
}

function makeResult(result: Omit<StudioResult, "id" | "createdAt" | "processing">, sourceResultId?: string): StudioResult {
  return { ...result, id: crypto.randomUUID(), createdAt: Date.now(), processing: "Local", sourceResultId };
}

export function StudioPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const deepLinkedEngine = useMemo(() => new URLSearchParams(window.location.search).get("tool") ?? undefined, []);
  const initialEngine = resolveLocalEngine("", deepLinkedEngine);
  const [mode, setMode] = useState<ProcessingMode>("local");
  const [model, setModel] = useState("auto");
  const [engineId, setEngineId] = useState(initialEngine.id);
  const [command, setCommand] = useState(deepLinkedEngine ? `Run ${initialEngine.name}` : "");
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<StudioFile[]>([]);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cloud = mode === "cloud";
  const activeEngine = LOCAL_ENGINES.find((engine) => engine.id === engineId) ?? LOCAL_ENGINES[0];

  const addFiles = async (selected: FileList | File[]) => {
    const accepted = await Promise.all([...selected].slice(0, 10).map(async (file) => ({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type || "text/plain", content: await file.text() })));
    setFiles((current) => [...current, ...accepted]);
    if (accepted[0]) setInput(accepted[0].content);
  };

  const runLocal = async (sourceResultId?: string) => {
    const payload = sourceResultId ? results.find((item) => item.id === sourceResultId)?.content ?? input : input;
    if (!payload.trim() && activeEngine.id !== "uuid") throw new Error("Add input text or choose a text file first.");
    const selected = resolveLocalEngine(command, engineId);
    const produced = makeResult(await selected.run(payload, command), sourceResultId);
    setResults((current) => [produced, ...current]);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", provider: "Local", content: `${selected.name} completed locally${["json-to-csv", "csv-to-json", "sha256"].includes(selected.id) ? " in a Web Worker" : ""}.` }]);
  };

  const submit = async () => {
    const prompt = command.trim();
    if (loading || (!prompt && !input.trim())) return;
    const userMessage: StudioMessage = { id: crypto.randomUUID(), role: "user", content: prompt || `Run ${activeEngine.name}`, provider: cloud ? "NVIDIA" : "Local" };
    setMessages((current) => [...current, userMessage]); setLoading(true);
    try {
      if (!cloud) await runLocal();
      else {
        const history = [...messages.filter((message) => message.provider === "NVIDIA"), userMessage].map(({ role, content }) => ({ role, content }));
        const response = await fetch("/api/nvidia/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, taskType: inferTaskType(prompt), messages: history }) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || data.error || "NVIDIA request failed");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", provider: "NVIDIA", model: data.usedModel, fallbackNotice: data.wasFallback ? `Requested model unavailable — used ${data.usedModel} instead.` : undefined, content: data.reply }]);
        setResults((current) => [{ id: crypto.randomUUID(), title: "NVIDIA response", content: data.reply, mimeType: "text/plain", extension: "txt", engineId: "nvidia-chat", createdAt: Date.now(), processing: "NVIDIA", model: data.usedModel }, ...current]);
      }
    } catch (error) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", provider: cloud ? "NVIDIA" : "Local", content: error instanceof Error ? error.message : "Processing failed" }]);
    } finally { setLoading(false); }
  };

  const download = (result: StudioResult) => {
    const url = URL.createObjectURL(new Blob([result.content], { type: result.mimeType }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `xfree-${result.engineId}.${result.extension}`; anchor.click(); URL.revokeObjectURL(url);
  };
  const chain = (result: StudioResult) => { setInput(result.content); setCommand("Transform the previous result"); setMode("local"); document.getElementById("studio-command")?.focus(); };

  return <div className="mx-auto w-full max-w-[1500px] space-y-4 px-1 py-3 sm:px-3">
    <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Universal command center</p><h1 className="mt-1 text-3xl font-black text-white">XFree Studio</h1><p className="mt-1 text-sm text-slate-400">Drop a file, choose an engine, and keep every local workflow on your device.</p></div>
      <div className="inline-flex self-start rounded-xl border border-slate-700 bg-slate-950 p-1" aria-label="Processing mode">{(["local", "cloud"] as ProcessingMode[]).map((item) => <button key={item} onClick={() => { setMode(item); if (item === "local") setModel("auto"); }} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${mode === item ? "bg-cyan-400 text-slate-950" : "text-slate-400"}`}>{item === "local" ? <ShieldCheck className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}{item === "local" ? "Local" : "Cloud"}</button>)}</div>
    </header>
    <div className="grid min-h-[680px] grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(360px,1fr)_360px]">
      <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <button onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(event.dataTransfer.files); }} className="flex w-full flex-col items-center rounded-2xl border border-dashed border-cyan-500/40 bg-cyan-500/5 p-5 text-center text-sm text-cyan-200"><FilePlus2 className="mb-2 h-6 w-6" />Drop text files or browse<input ref={fileInput} type="file" multiple className="hidden" onChange={(event) => event.target.files && void addFiles(event.target.files)} /></button>
        <div className="mt-5 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Files</h2>{files.length > 0 && <button onClick={() => setFiles([])} aria-label="Clear files"><Trash2 className="h-4 w-4 text-slate-500" /></button>}</div>
        <div className="mt-2 space-y-2">{files.map((file) => <button key={file.id} onClick={() => setInput(file.content)} className="w-full truncate rounded-lg bg-slate-950 px-3 py-2 text-left text-xs text-slate-300">{file.name} · {Math.ceil(file.size / 1024)} KB</button>)}</div>
        <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">Local engines</h2>
        <div className="space-y-2">{LOCAL_ENGINES.map((engine) => <button key={engine.id} onClick={() => { setEngineId(engine.id); setCommand(`Run ${engine.name}`); }} className={`w-full rounded-xl border p-3 text-left ${engineId === engine.id ? "border-cyan-400/60 bg-cyan-400/10" : "border-slate-800 bg-slate-950"}`}><span className="flex items-center gap-2 text-sm font-semibold text-white"><Code2 className="h-4 w-4 text-cyan-400" />{engine.name}</span><span className="mt-1 block text-xs text-slate-500">{engine.description}</span></button>)}</div>
      </aside>
      <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        <div className="border-b border-slate-800 p-4"><CloudModeBanner cloud={cloud} /></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">{messages.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><Sparkles className="h-10 w-10 text-cyan-400" /><h2 className="mt-4 text-xl font-bold text-white">What do you need to get done?</h2><p className="mt-2 max-w-md text-sm text-slate-400">Choose a local engine, paste input or drop a file. Cloud processing is always explicit.</p></div> : messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "assistant" && <Bot className="mt-2 h-5 w-5 text-cyan-400" />}<div className={`max-w-[88%] rounded-2xl p-4 text-sm ${message.role === "user" ? "bg-cyan-600 text-white" : "border border-slate-700 bg-slate-800 text-slate-200"}`}><p className="whitespace-pre-wrap">{message.content}</p><p className="mt-3 border-t border-white/10 pt-2 text-[11px] text-slate-400">{message.provider === "NVIDIA" ? `Processed via NVIDIA${message.model ? ` • ${message.model}` : ""}` : "Processed locally"}</p>{message.fallbackNotice && <p className="mt-2 text-xs text-amber-300">{message.fallbackNotice}</p>}</div>{message.role === "user" && <User className="mt-2 h-5 w-5 text-indigo-300" />}</div>)}</div>
        <div className="border-t border-slate-800 p-4">{!cloud && <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={6} placeholder={activeEngine.placeholder} className="mb-3 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-white outline-none focus:border-cyan-500" />}<form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="flex gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-2 focus-within:border-cyan-500"><input id="studio-command" value={command} onChange={(event) => setCommand(event.target.value)} placeholder={cloud ? "Ask NVIDIA…" : "Tell XFree what to do…"} className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none" /><button disabled={loading} className="rounded-xl bg-cyan-400 p-3 text-slate-950 disabled:opacity-40" aria-label="Run command">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></form></div>
      </section>
      <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        {cloud ? <><h2 className="text-sm font-bold text-white">Cloud provider</h2><ModelSelector active value={model} onChange={setModel} /><p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">Data will be sent to NVIDIA for processing.</p></> : <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><Check className="h-4 w-4" />Local processing active</div>}
        <div className="mb-3 mt-6 flex items-center justify-between"><h2 className="text-sm font-bold text-white">Results</h2>{results.length > 0 && <button onClick={() => setResults([])} className="text-xs text-slate-500">Clear</button>}</div>
        {results.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 p-7 text-center"><Sparkles className="mx-auto h-7 w-7 text-slate-600" /><p className="mt-3 text-sm text-slate-400">Results become reusable cards here.</p></div> : <div className="space-y-3">{results.map((result) => <article key={result.id} className="rounded-2xl border border-slate-700 bg-slate-950 p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-white">{result.title}</h3><p className="text-[11px] text-emerald-300">{result.processing === "Local" ? "Processed locally" : `NVIDIA • ${result.model}`}</p></div>{result.sourceResultId && <Link2 className="h-4 w-4 text-indigo-300" />}</div><pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-3 text-[11px] text-slate-300">{result.content.slice(0, 5000)}</pre><div className="mt-3 grid grid-cols-3 gap-2"><button onClick={() => download(result)} className="rounded-lg bg-cyan-400 p-2 text-slate-950" aria-label="Download"><Download className="mx-auto h-4 w-4" /></button><button onClick={() => { void navigator.clipboard.writeText(result.content); setCopiedId(result.id); setTimeout(() => setCopiedId(null), 1500); }} className="rounded-lg border border-slate-700 p-2 text-slate-300" aria-label="Copy">{copiedId === result.id ? <Check className="mx-auto h-4 w-4" /> : <Clipboard className="mx-auto h-4 w-4" />}</button><button onClick={() => chain(result)} className="rounded-lg border border-slate-700 p-2 text-slate-300" aria-label="Chain result"><Link2 className="mx-auto h-4 w-4" /></button></div></article>)}</div>}
        <button onClick={() => onNavigate("/")} className="mt-5 w-full text-xs text-slate-500 hover:text-cyan-300">Browse dedicated tools</button>
      </aside>
    </div>
  </div>;
}
