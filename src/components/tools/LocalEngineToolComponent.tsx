import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Copy, Loader2, Play, RotateCcw, ShieldCheck } from "lucide-react";
import type { ToolDefinition } from "../../types";
import { LOCAL_ENGINES } from "../../lib/studio/engines";

interface LocalEngineToolProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

function engineIdFromTool(tool: ToolDefinition): string | null {
  const marker = tool.toolComponent || "";
  return marker.startsWith("local-engine:") ? marker.slice("local-engine:".length) : null;
}

export const LocalEngineToolComponent: React.FC<LocalEngineToolProps> = ({ tool, onSaveHistory }) => {
  const engineId = engineIdFromTool(tool);
  const engine = useMemo(() => LOCAL_ENGINES.find((candidate) => candidate.id === engineId) ?? null, [engineId]);
  const [input, setInput] = useState(tool.exampleInput || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [caseMode, setCaseMode] = useState<"title" | "upper" | "lower" | "count">("title");

  const command = engineId === "case-converter" ? `${caseMode} case` : tool.title;

  const run = async () => {
    if (!engine) {
      setError("This published tool is not mapped to an available local engine.");
      return;
    }
    if (!input.trim() && !["uuid"].includes(engine.id)) return;

    setRunning(true);
    setError(null);
    try {
      const result = await engine.run(input, command);
      setOutput(result.content);
      onSaveHistory(input.slice(0, 120), result.content.slice(0, 240));
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Error ? caught.message : "Local processing failed.");
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "c" && output) {
        event.preventDefault();
        void copy();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [output]);

  if (!engine) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200" role="alert">
        <div className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" /> Local engine unavailable</div>
        <p className="mt-2">The publication gate should prevent this state. Engine marker: {engineId || "missing"}.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20" aria-labelledby={`${tool.id}-input-heading`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id={`${tool.id}-input-heading`} className="text-sm font-bold text-white">Input</h2>
            <p className="mt-1 text-xs text-slate-400">{engine.description}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Local engine
          </span>
        </div>

        {engineId === "case-converter" && (
          <label className="mb-4 block text-xs font-semibold text-slate-300">
            Case mode
            <select
              value={caseMode}
              onChange={(event) => setCaseMode(event.target.value as typeof caseMode)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-sm text-white outline-none focus:border-cyan-500"
            >
              <option value="title">Title case</option>
              <option value="upper">UPPER CASE</option>
              <option value="lower">lower case</option>
              <option value="count">Count words and characters</option>
            </select>
          </label>
        )}

        <label className="block text-xs font-semibold text-slate-300" htmlFor={`${tool.id}-input`}>Source value</label>
        <textarea
          id={`${tool.id}-input`}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={engine.placeholder}
          className="mt-2 w-full resize-y rounded-2xl border border-slate-800 bg-black/40 p-4 font-mono text-xs leading-6 text-slate-200 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void run()}
            disabled={running || (!input.trim() && engine.id !== "uuid")}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Processing locally…" : "Run local tool"}
          </button>
          <button
            type="button"
            onClick={() => { setInput(tool.exampleInput || ""); setOutput(""); setError(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-200 hover:border-slate-600"
          >
            <RotateCcw className="h-4 w-4" /> Reset example
          </button>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-slate-500">Core processing stays in this browser session. The tool does not call an XFree processing API.</p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20" aria-labelledby={`${tool.id}-output-heading`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id={`${tool.id}-output-heading`} className="text-sm font-bold text-white">Result</h2>
            <p className="mt-1 text-xs text-slate-400">Review the transformed value before using it in a production workflow.</p>
          </div>
          <button
            type="button"
            onClick={() => void copy()}
            disabled={!output}
            title="Copy result (Ctrl+Shift+C or Cmd+Shift+C)"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs leading-5 text-red-200" role="alert">
            <div className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" /> Input could not be processed</div>
            <p className="mt-2 whitespace-pre-wrap">{error}</p>
          </div>
        ) : (
          <pre className="min-h-[22rem] max-h-[42rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-slate-800 bg-black/50 p-4 font-mono text-xs leading-6 text-emerald-200">{output || "Run the tool to see output here."}</pre>
        )}
        <p className="mt-3 text-[11px] text-slate-500">Keyboard: Ctrl+Shift+C (Windows/Linux) or Cmd+Shift+C (macOS) copies the current result.</p>
      </section>
    </div>
  );
};
