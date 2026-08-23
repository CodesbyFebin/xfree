import React, { useMemo, useState } from "react";
import { CheckCircle2, Clipboard, Code2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

const DEFAULT_INPUT = '{"name":"xfree","type":"micro-tool","fast":true}';

export function HomeLivePlayground() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      return {
        valid: true as const,
        output: JSON.stringify(parsed, null, 2),
        message: "Valid JSON · formatted locally",
      };
    } catch (error) {
      return {
        valid: false as const,
        output: "",
        message: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  }, [input]);

  const copyOutput = async () => {
    if (!result.valid || !result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10" aria-labelledby="home-playground-heading">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          Live local demo
        </span>
        <h2 id="home-playground-heading" className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Try XFree before opening a tool
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Edit the JSON below and XFree formats it in this browser. This demo makes no API request and exists to show the same local-processing model used by published Local Mode tools.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Code2 className="h-4 w-4 text-indigo-400" />
              Input JSON
            </div>
            <button
              type="button"
              onClick={() => setInput(DEFAULT_INPUT)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:border-indigo-500/50 hover:text-indigo-300"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
          <label htmlFor="home-json-demo" className="sr-only">JSON input</label>
          <textarea
            id="home-json-demo"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            className="min-h-56 w-full resize-y bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/40"
          />
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-stone-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className={`flex items-center gap-2 text-xs font-semibold ${result.valid ? "text-emerald-700" : "text-rose-700"}`}>
              {result.valid ? <CheckCircle2 className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
              {result.valid ? "Formatted output" : "Fix the input"}
            </div>
            <button
              type="button"
              onClick={() => void copyOutput()}
              disabled={!result.valid}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Clipboard className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {result.valid ? (
            <pre className="min-h-56 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-slate-700">{result.output}</pre>
          ) : (
            <div className="min-h-56 p-4">
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 font-mono text-xs leading-5 text-rose-700">{result.message}</p>
            </div>
          )}
        </article>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Browser-local execution</span>
        <a href="/tools/json-formatter" className="font-semibold text-indigo-700 hover:text-indigo-800">Open the full JSON Formatter →</a>
      </div>
    </section>
  );
}
