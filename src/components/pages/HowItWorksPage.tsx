import React from "react";
import { Cpu, ShieldCheck, Zap, Globe, Lock, ArrowRight, Code2, CheckCircle2 } from "lucide-react";

interface PageProps {
  onGoHome: () => void;
  onSelectCategory: (catId: string) => void;
}

export const HowItWorksPage: React.FC<PageProps> = ({ onGoHome, onSelectCategory }) => {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Client-Side Privacy Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          How XFree.in Works
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Discover how XFree.in delivers blazing-fast developer and SEO micro-tools without ever compromising your data privacy or requiring registration.
        </p>
      </div>

      {/* 3 Step Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-lg flex items-center justify-center">
            1
          </div>
          <h3 className="text-xl font-bold text-white">Load into Memory</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            When you visit any tool page on XFree.in, the lightweight JavaScript execution engine loads directly into your browser's WebAssembly / JS sandbox.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black text-lg flex items-center justify-center">
            2
          </div>
          <h3 className="text-xl font-bold text-white">Local Transformation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            All parsing, formatting, regex matching, and XML sitemap parsing happen locally inside your browser memory. Your sensitive input data never leaves your computer.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-black text-lg flex items-center justify-center">
            3
          </div>
          <h3 className="text-xl font-bold text-white">Instant Output & Export</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Get instant transformed output with 1-click clipboard copying or direct file downloads (JSON, XML, CSV). Zero latency, zero wait queues.
          </p>
        </div>
      </div>

      {/* Technical Deep Dive */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
        <h2 className="text-2xl font-bold text-white">Why Local Browser Execution Matters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-slate-300">
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Complete Data Confidentiality
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Standard web utilities send your API keys, private JSON payloads, or SQL schemas to remote backend servers. XFree.in guarantees zero backend logging for all local tools.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Offline & Offline-First Capability
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Once loaded in your browser session, XFree.in tools continue functioning even if your internet connection drops or stutters.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <button
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
