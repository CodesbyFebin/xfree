import React from "react";
import { ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, Cloud, MonitorCog } from "lucide-react";

interface PageProps {
  onGoHome: () => void;
  onSelectCategory: (catId: string) => void;
}

export const HowItWorksPage: React.FC<PageProps> = ({ onGoHome, onSelectCategory: _onSelectCategory }) => {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Local-Tool Privacy Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          How XFree.in Works
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          See how a request moves from a published tool page to browser processing, result review, and export—and how optional cloud features differ.
        </p>
      </div>

      {/* 3 Step Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-lg flex items-center justify-center">
            1
          </div>
          <h2 className="text-xl font-bold text-white">Choose a published tool</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Public navigation exposes only tools marked published and indexable. Each page explains accepted input, output, examples, and known constraints before you run it.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black text-lg flex items-center justify-center">
            2
          </div>
          <h2 className="text-xl font-bold text-white">Process in the declared mode</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Local tools execute with browser JavaScript or a Web Worker. Optional cloud features are separate, require an explicit choice, and disclose the provider before data leaves the browser.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-black text-lg flex items-center justify-center">
            3
          </div>
          <h2 className="text-xl font-bold text-white">Verify and export the result</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Review the generated value, diagnostics, preview, or file before copying or downloading it. Documentation identifies cases that still require specialist validation.
          </p>
        </div>
      </div>

      {/* Technical Deep Dive */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
        <h2 className="text-2xl font-bold text-white">Local Mode, workers, and cloud requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-300">
          <div className="space-y-2">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2">
              <MonitorCog className="w-4 h-4" /> Browser JavaScript
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Lightweight formatters and generators can run directly in the page. They avoid a tool-processing upload, but unusually large or pathological input may still affect responsiveness.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Web Worker execution
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Selected heavy operations use a worker to move computation away from the interface thread. A worker improves responsiveness; it does not remove memory or timeout limits.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2"><Cloud className="w-4 h-4" /> Optional Cloud Mode</h3>
            <p className="text-slate-400 leading-relaxed">Cloud AI is opt-in. The interface must identify the provider and warn that submitted content will leave the browser before a request is sent.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-amber-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Verify production use</h3>
            <p className="text-slate-400 leading-relaxed">Generated output is a working aid, not proof of security, standards compliance, or suitability for every runtime. Check the documented edge cases.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onGoHome}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <span>Explore All Free Tools</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
