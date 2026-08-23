import React, { useMemo, useState } from "react";
import { CheckCircle2, Clipboard, Code2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { PILLARS_50, ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";

const DEFAULT_INPUT = '{"name":"xfree","type":"micro-tool","local":true}';

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

  const metrics = [
    { value: PUBLIC_TOOLS.length.toLocaleString(), label: "Published tools" },
    { value: PILLARS_50.length.toLocaleString(), label: "Planning pillars" },
    { value: ROADMAP_CONCEPT_COUNT.toLocaleString(), label: "Roadmap concepts" },
    { value: "0", label: "Required signups" },
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-[#07070e] text-slate-200 shadow-2xl shadow-indigo-950/10" aria-labelledby="home-playground-heading">
      <div className="border-b border-slate-800/80 bg-[#0a0a12] px-5 py-4 sm:px-8">
        <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center md:text-left">
              <dd className="text-2xl font-black text-indigo-400">{metric.value}</dd>
              <dt className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{metric.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative p-5 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            Live browser demo
          </span>
          <h2 id="home-playground-heading" className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Try XFree before opening a tool
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
            Edit the JSON below and XFree formats it in this page using the browser runtime. This demo makes no API request and does not claim a synthetic execution time or imply that every XFree feature shares the same processing mode.
          </p>
        </div>

        <div className="relative mt-8 grid gap-4 lg:grid-cols-2">
          <article className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f0f17]/90 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Code2 className="h-4 w-4 text-indigo-400" />
                Input JSON
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 sm:inline">LOCAL DEMO</span>
                <button
                  type="button"
                  onClick={() => setInput(DEFAULT_INPUT)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:border-indigo-500/50 hover:text-indigo-300"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </div>
            <label htmlFor="home-json-demo" className="sr-only">JSON input</label>
            <textarea
              id="home-json-demo"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
              className="min-h-56 w-full resize-y bg-[#07070e] p-4 font-mono text-xs leading-6 text-slate-200 outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/40"
            />
            <p className={`border-t border-slate-800 px-4 py-3 text-xs ${result.valid ? "text-emerald-400" : "text-rose-400"}`} role="status" aria-live="polite">{result.message}</p>
          </article>

          <article className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f0f17]/90 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className={`flex items-center gap-2 text-xs font-semibold ${result.valid ? "text-emerald-400" : "text-rose-400"}`}>
                {result.valid ? <CheckCircle2 className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                {result.valid ? "Formatted output" : "Fix the input"}
              </div>
              <button
                type="button"
                onClick={() => void copyOutput()}
                disabled={!result.valid}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-indigo-500/50 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Clipboard className="h-3 w-3" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {result.valid ? (
              <pre className="min-h-56 overflow-auto whitespace-pre-wrap break-words bg-[#07070e] p-4 font-mono text-xs leading-6 text-emerald-300">{result.output}</pre>
            ) : (
              <div className="min-h-56 bg-[#07070e] p-4">
                <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 font-mono text-xs leading-5 text-rose-300">{result.message}</p>
              </div>
            )}
          </article>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Browser parser · no upload for this demo</span>
          <a href="/tools/json-formatter" className="font-semibold text-indigo-300 hover:text-indigo-200">Open the full JSON Formatter →</a>
        </div>
      </div>
    </section>
  );
}
