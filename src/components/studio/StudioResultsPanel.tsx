import React from "react";
import { FileText, Trash2 } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { ResultCard } from "./ResultCard";
import type { StudioResult } from "../../lib/studio/types";

interface Props { cloud: boolean; model: string; results: StudioResult[]; onModel: (model: string) => void; onClear: () => void; onDownload: (result: StudioResult) => void; onChain: (result: StudioResult) => void; compact?: boolean }
export function StudioResultsPanel({ cloud, model, results, onModel, onClear, onDownload, onChain, compact = false }: Props) {
  return <aside className={compact ? "space-y-3" : "hidden w-80 shrink-0 flex-col overflow-hidden border-l border-stone-200 bg-white lg:flex xl:w-96"}>
    {cloud ? <div className="border-b border-stone-100 p-4"><ModelSelector active value={model} onChange={onModel} /><p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">Data will be sent to NVIDIA for processing.</p></div> : null}
    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3"><h2 className="text-sm font-semibold text-stone-800">Results <span className="ml-1 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-400">{results.length}</span></h2>{results.length > 0 ? <button onClick={onClear} aria-label="Clear results"><Trash2 className="h-4 w-4 text-stone-300" /></button> : null}</div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{results.length === 0 ? <div className="flex h-full min-h-56 flex-col items-center justify-center text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100"><FileText className="h-7 w-7 text-stone-300" /></span><p className="mt-4 text-sm font-medium text-stone-500">No results yet</p><p className="mt-1 text-xs text-stone-400">Run a command to see outputs here</p></div> : results.map((result) => <ResultCard key={result.id} result={result} onDownload={() => onDownload(result)} onChain={() => onChain(result)} />)}</div>
  </aside>;
}
