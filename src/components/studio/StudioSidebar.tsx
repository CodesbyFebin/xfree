import React, { useRef } from "react";
import { FilePlus2, FolderOpen, ShieldCheck, Trash2 } from "lucide-react";
import { LOCAL_ENGINES } from "../../lib/studio/engines";
import type { StudioFile } from "../../lib/studio/types";

interface Props {
  files: StudioFile[];
  engineId: string;
  onFiles: (files: FileList) => void;
  onClear: () => void;
  onSelectFile: (file: StudioFile) => void;
  onSelectEngine: (id: string, name: string) => void;
  onOpenFolder?: () => void;
  folderSupported?: boolean;
  workspaceLabel?: string | null;
  compact?: boolean;
}

export function StudioSidebar({ files, engineId, onFiles, onClear, onSelectFile, onSelectEngine, onOpenFolder, folderSupported = false, workspaceLabel = null, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <aside className={compact ? "space-y-4" : "hidden w-72 shrink-0 flex-col overflow-hidden border-r border-stone-200 bg-white lg:flex"}>
    <div className="space-y-2 p-4">
      <button onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFiles(event.dataTransfer.files); }} className="w-full rounded-2xl border-2 border-dashed border-stone-200 p-5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30"><FilePlus2 className="mx-auto mb-2 h-7 w-7 text-stone-300" /><span className="block text-sm font-medium text-stone-600">Drop files here</span><span className="text-[11px] text-stone-400">JSON, CSV, Text and Code</span></button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && onFiles(event.target.files)} />
      <button type="button" disabled={!folderSupported || !onOpenFolder} onClick={onOpenFolder} className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600 hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"><FolderOpen className="h-4 w-4" /> Open local folder</button>
      <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-stone-400"><ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />{workspaceLabel ? `Read-only workspace: ${workspaceLabel}` : folderSupported ? "Folder access is read-only and only starts after your explicit picker action." : "This browser does not expose the directory picker. Drag-and-drop files still works."}</p>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Files <span className="ml-1 rounded-full bg-stone-100 px-1.5 py-0.5">{files.length}</span></h2>{files.length > 0 ? <button onClick={onClear} aria-label="Clear files"><Trash2 className="h-4 w-4 text-stone-300" /></button> : null}</div>{files.length === 0 ? <p className="py-6 text-center text-xs text-stone-400">No files yet</p> : <div className="space-y-1">{files.map((file) => <button key={file.id} onClick={() => onSelectFile(file)} className="w-full rounded-xl border border-stone-100 p-3 text-left hover:border-indigo-200 hover:bg-indigo-50/30"><span className="block truncate text-xs font-medium text-stone-700">{file.name}</span><span className="text-[10px] text-stone-400">{Math.ceil(file.size / 1024)} KB</span></button>)}</div>}</div>
    <div className="border-t border-stone-100 p-4"><h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Quick engines</h2><div className="flex flex-wrap gap-1.5">{LOCAL_ENGINES.map((engine) => <button key={engine.id} onClick={() => onSelectEngine(engine.id, engine.name)} className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium ${engine.id === engineId ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-stone-200 bg-stone-50 text-stone-600"}`}>{engine.name}</button>)}</div></div>
  </aside>;
}
