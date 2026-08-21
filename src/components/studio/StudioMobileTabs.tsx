import React from "react";
import { Files, MessageSquare, PanelsTopLeft } from "lucide-react";
import type { StudioMobileTab } from "../../lib/studio/types";

export function StudioMobileTabs({ tab, fileCount, resultCount, onChange }: { tab: StudioMobileTab; fileCount: number; resultCount: number; onChange: (tab: StudioMobileTab) => void }) {
  const items: Array<{ id: StudioMobileTab; label: string; count?: number; icon: typeof Files }> = [{ id: "files", label: "Files", count: fileCount, icon: Files }, { id: "chat", label: "Chat", icon: MessageSquare }, { id: "results", label: "Results", count: resultCount, icon: PanelsTopLeft }];
  return <nav className="grid shrink-0 grid-cols-3 border-t border-stone-200 bg-white/95 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Studio panels">{items.map((item) => <button key={item.id} onClick={() => onChange(item.id)} className={`flex flex-col items-center gap-0.5 border-t-2 py-1 text-[10px] ${tab === item.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-stone-400"}`}><item.icon className="h-4 w-4" />{item.label}{item.count ? <span className="absolute ml-7 -mt-1 rounded-full bg-indigo-600 px-1 text-[8px] text-white">{item.count}</span> : null}</button>)}</nav>;
}
