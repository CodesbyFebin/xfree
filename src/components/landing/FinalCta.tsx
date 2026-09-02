import React from "react";
import { ArrowRight, Sparkles, BookOpen } from "lucide-react";

interface FinalCtaProps {
  onOpenStudio: () => void;
  onExploreFreeTools: () => void;
  onReadDocs: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onOpenStudio, onExploreFreeTools, onReadDocs }) => {
  return (
    <div
      id="get-started"
      className="scroll-mt-24 glass-panel rounded-3xl p-8 sm:p-12 text-center space-y-6 border border-white/10 relative overflow-hidden"
    >
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 space-y-4">
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Ready to build with XFree AI Studio?
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Open source, self-hostable, and free to run today — no signup, no waitlist.
        </p>
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onOpenStudio}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Open XFree Studio</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          onClick={onExploreFreeTools}
          className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800/90 text-white border border-slate-700/80 hover:border-slate-600 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Explore Free Tools</span>
        </button>
        <button
          onClick={onReadDocs}
          className="px-6 py-3.5 bg-transparent hover:bg-white/5 text-slate-300 border border-white/10 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>Read the Docs</span>
        </button>
      </div>
    </div>
  );
};
