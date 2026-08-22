import React, { useState } from "react";
import { Check, Clipboard, Download, Link2 } from "lucide-react";
import type { StudioResult } from "../../lib/studio/types";

interface ResultCardProps {
  key?: React.Key;
  result: StudioResult;
  onDownload: () => void;
  onChain: () => void;
}

export function ResultCard({ result, onDownload, onChain }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  return <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-stone-800">{result.title}</h3><p className={`text-[10px] ${result.processing === "Local" ? "text-emerald-700" : "text-indigo-700"}`}>{result.processing === "Local" ? "Processed locally" : `NVIDIA • ${result.model}`}</p></div>{result.sourceResultId ? <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] text-stone-400">Chained</span> : null}</div>
    <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-stone-100 bg-stone-50 p-3 text-[11px] text-stone-600">{result.content.slice(0, 5000)}</pre>
    <div className="mt-3 grid grid-cols-3 gap-2"><button onClick={onDownload} className="flex items-center justify-center gap-1 rounded-xl bg-indigo-50 p-2 text-xs font-medium text-indigo-700"><Download className="h-3.5 w-3.5" />Download</button><button onClick={() => { void navigator.clipboard.writeText(result.content); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="flex items-center justify-center gap-1 rounded-xl bg-stone-50 p-2 text-xs font-medium text-stone-600">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}Copy</button><button onClick={onChain} className="flex items-center justify-center rounded-xl bg-stone-50 p-2 text-stone-500" aria-label="Use result as next input"><Link2 className="h-4 w-4" /></button></div>
  </article>;
}
