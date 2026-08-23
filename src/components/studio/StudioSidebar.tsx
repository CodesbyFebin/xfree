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

  return (
    <aside className={compact ? "space-y-4 text-slate-200" : "hidden w-72 shrink-0 flex-col overflow-hidden border-r border-[#2a2b38] bg-[#12131a] text-slate-200 lg:flex"}>
      <div className="space-y-2 p-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); onFiles(event.dataTransfer.files); }}
          className="w-full rounded-2xl border-2 border-dashed border-[#2a2b38] bg-[#0a0b0f]/40 p-5 text-center transition hover:border-indigo-500 hover:bg-indigo-500/5"
        >
          <FilePlus2 className="mx-auto mb-2 h-7 w-7 text-slate-600" />
          <span className="block text-sm font-medium text-slate-300">Drop files here</span>
          <span className="text-[11px] text-slate-500">JSON, CSV, text and code</span>
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && onFiles(event.target.files)} />

        <button
          type="button"
          disabled={!folderSupported || !onOpenFolder}
          onClick={onOpenFolder}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2a2b38] bg-[#1a1b25] px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FolderOpen className="h-4 w-4" /> Open local folder
        </button>
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500"><ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />{workspaceLabel ? `Read-only workspace: ${workspaceLabel}` : folderSupported ? "Folder access is read-only and starts only after your explicit picker action." : "Directory picking is unavailable here; drag-and-drop files still works."}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Files <span className="ml-1 rounded-full border border-[#2a2b38] bg-[#22232f] px-1.5 py-0.5">{files.length}</span></h2>
          {files.length > 0 ? <button onClick={onClear} aria-label="Clear files" className="rounded-md p-1 hover:bg-red-500/10"><Trash2 className="h-4 w-4 text-slate-600 hover:text-red-400" /></button> : null}
        </div>
        {files.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-600">No files yet</p>
        ) : (
          <div className="space-y-1">{files.map((file) => (
            <button key={file.id} onClick={() => onSelectFile(file)} className="w-full rounded-xl border border-transparent p-3 text-left transition hover:border-[#2a2b38] hover:bg-[#1a1b25]">
              <span className="block truncate text-xs font-medium text-slate-200">{file.name}</span>
              <span className="text-[10px] text-slate-500">{Math.ceil(file.size / 1024)} KB</span>
            </button>
          ))}</div>
        )}
      </div>

      <div className="border-t border-[#2a2b38] p-4">
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Quick engines</h2>
        <div className="flex flex-wrap gap-1.5">{LOCAL_ENGINES.map((engine) => (
          <button
            key={engine.id}
            onClick={() => onSelectEngine(engine.id, engine.name)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${engine.id === engineId ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" : "border-[#2a2b38] bg-[#1a1b25] text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300"}`}
          >
            {engine.name}
          </button>
        ))}</div>
      </div>
    </aside>
  );
}
