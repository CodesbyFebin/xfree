import React from "react";
import { Cloud, LockKeyhole, Settings } from "lucide-react";
import type { ProcessingMode } from "../../lib/studio/types";

export function StudioHeader({ mode, onModeChange }: { mode: ProcessingMode; onModeChange: (mode: ProcessingMode) => void }) {
  return <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur-md lg:px-6">
    <a href="https://www.xfree.in/" className="flex items-center gap-3" aria-label="XFree homepage">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">X</span>
      <span><h1 className="text-[15px] font-semibold leading-tight text-stone-900">XFree Studio</h1><small className="hidden text-[10px] text-stone-400 sm:block">Universal Command Center</small></span>
    </a>
    <div className="flex items-center gap-3">
      <div className="flex rounded-full bg-stone-100 p-0.5" aria-label="Processing mode">{(["local", "cloud"] as ProcessingMode[]).map((item) => <button key={item} onClick={() => onModeChange(item)} aria-pressed={mode === item} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${mode === item ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}>{item === "local" ? <LockKeyhole className="h-3.5 w-3.5 text-emerald-600" /> : <Cloud className="h-3.5 w-3.5 text-indigo-600" />}{item === "local" ? "Local" : "Cloud"}</button>)}</div>
      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100" aria-label="Studio settings"><Settings className="h-4 w-4" /></button>
    </div>
  </header>;
}
