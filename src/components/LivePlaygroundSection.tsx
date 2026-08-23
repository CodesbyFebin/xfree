import React, { useMemo, useState } from "react";
import { Check, Clipboard, Code2, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { PILLARS_50, ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";

interface LivePlaygroundSectionProps {
  totalTools: number;
  onOpenJsonTool: () => void;
}

const DEFAULT_INPUT = '{"name":"xfree","type":"browser-tool","local":true}';

export function LivePlaygroundSection({ totalTools, onOpenJsonTool }: LivePlaygroundSectionProps) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      const value = JSON.parse(input);
      return { valid: true, output: JSON.stringify(value, null, 2), message: "Valid JSON" };
    } catch (error) {
      return {
        valid: false,
        output: "",
        message: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  }, [input]);

  const copyOutput = async () => {
    if (!result.valid || !result.output) return;
    await navigator.clipboard.writeText(result.output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const metrics = [
    { value: totalTools.toLocaleString(), label: "Published tools" },
    { value: PILLARS_50.length.toLocaleString(), label: "Planning pillars" },
    { value: ROADMAP_CONCEPT_COUNT.toLocaleString(), label: "Roadmap concepts" },
    { value: "0", label: "Required signups" },
  ];

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-[#07070e] text-slate-200 shadow-2xl shadow-indigo-950/10" aria-labelledby="live-playground-heading">
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

        <div className="relative mb-7 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> Live browser demo
          </span>
          <h2 id="live-playground-heading" className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Try XFree before opening a tool</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">Edit the JSON below. This demo parses and formats the value in this page using the browser runtime; no timing claim or server-processing claim is inferred beyond this specific formatter.</p>
        </div>

        <div className="relative grid gap-4 lg:grid-cols-2">
          <article className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f0f17]/90">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Code2 className="h-4 w-4 text-indigo-400" /> JSON input
              </div>
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">LOCAL DEMO</span>
            </div>
            <div className="p-4">
              <label htmlFor="home-json-demo" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Raw JSON</label>
              <textarea
                id="home-json-demo"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full resize-y rounded-xl border border-slate-800 bg-[#07070e] p-3 font-mono text-xs leading-6 text-slate-300 outline-none transition focus:border-indigo-500/60 focus:ring-4 focus:ring-indigo-500/10"
              />
              <p className={`mt-3 flex items-start gap-2 text-xs ${result.valid ? "text-emerald-400" : "text-rose-400"}`} role="status" aria-live="polite">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${result.valid ? "bg-emerald-400" : "bg-rose-400"}`} />
                {result.message}
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f0f17]/90">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="text-xs font-semibold text-slate-300">Formatted output</span>
              <button
                type="button"
                onClick={() => { void copyOutput(); }}
                disabled={!result.valid}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-indigo-300 transition hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-4">
              <pre className={`min-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-[#07070e] p-3 font-mono text-xs leading-6 ${result.valid ? "text-emerald-300" : "text-slate-500"}`}>{result.valid ? result.output : "Fix the JSON input to generate formatted output."}</pre>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Browser parser · no upload for this demo</span>
                <a
                  href="/tools/json-formatter"
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
                    event.preventDefault();
                    onOpenJsonTool();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-indigo-200"
                >
                  Open full JSON tool <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
