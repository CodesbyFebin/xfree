import React, { useEffect } from "react";
import { Cloud, LockKeyhole, Settings } from "lucide-react";
import type { ProcessingMode } from "../../lib/studio/types";

export function StudioHeader({ mode, onModeChange }: { mode: ProcessingMode; onModeChange: (mode: ProcessingMode) => void }) {
  useEffect(() => {
    document.body.classList.add("xfree-studio-dark");
    return () => document.body.classList.remove("xfree-studio-dark");
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#12131a]/90 px-4 text-slate-100 backdrop-blur-xl lg:px-5">
      <a href="https://www.xfree.in/" className="flex items-center gap-3" aria-label="XFree homepage">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-black text-white shadow-lg shadow-indigo-500/20">X</span>
        <span>
          <span className="block text-[15px] font-semibold leading-tight text-slate-100">XFree Agent Studio</span>
          <small className="hidden text-[10px] text-slate-500 sm:block">Local-first command center</small>
        </span>
      </a>

      <div className="flex items-center gap-3">
        <div className="flex rounded-full border border-[#2a2b38] bg-[#1a1b25] p-0.5" aria-label="Processing mode">
          {(["local", "cloud"] as ProcessingMode[]).map((item) => {
            const active = mode === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onModeChange(item)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${active ? item === "local" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}
              >
                {item === "local" ? <LockKeyhole className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
                {item === "local" ? "Local" : "Cloud"}
              </button>
            );
          })}
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#2a2b38] bg-[#1a1b25] text-slate-500 transition hover:border-[#3a3b4a] hover:bg-[#22232f] hover:text-slate-200" aria-label="Studio settings" title="Agent SOUL settings are available in the Local Agent panel">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
