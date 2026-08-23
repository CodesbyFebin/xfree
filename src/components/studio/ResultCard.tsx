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

  return (
    <article className="rounded-2xl border border-[#2a2b38] bg-[#1a1b25] p-4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-[#3a3b4a]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{result.title}</h3>
          <p className={`text-[10px] ${result.processing === "Local" ? "text-emerald-400" : "text-blue-400"}`}>{result.processing === "Local" ? "Processed locally" : `NVIDIA • ${result.model}`}</p>
        </div>
        {result.sourceResultId ? <span className="rounded border border-[#2a2b38] bg-[#22232f] px-1.5 py-0.5 text-[9px] text-slate-500">Chained</span> : null}
      </div>

      <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-[#2a2b38] bg-[#0a0b0f] p-3 text-[11px] text-slate-400">{result.content.slice(0, 5000)}</pre>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button onClick={onDownload} className="flex items-center justify-center gap-1 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/20"><Download className="h-3.5 w-3.5" />Download</button>
        <button onClick={() => { void navigator.clipboard.writeText(result.content); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="flex items-center justify-center gap-1 rounded-xl border border-[#2a2b38] bg-[#22232f] p-2 text-xs font-medium text-slate-300 transition hover:border-[#3a3b4a]">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}Copy</button>
        <button onClick={onChain} className="flex items-center justify-center rounded-xl border border-[#2a2b38] bg-[#22232f] p-2 text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300" aria-label="Use result as next input"><Link2 className="h-4 w-4" /></button>
      </div>
    </article>
  );
}
