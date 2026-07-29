import React from "react";
import { ShieldCheck, Zap, Globe, Heart, Code2 } from "lucide-react";

interface PageProps {
  onGoHome: () => void;
}

export const AboutPage: React.FC<PageProps> = ({ onGoHome }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          About XFree.in
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Building the world's fastest, privacy-first, zero-install web micro-tool platform for developers and SEO professionals.
        </p>
      </div>

      <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-900/80 p-8 rounded-3xl border border-slate-800">
        <h2 className="text-2xl font-bold text-white">Our Mission</h2>
        <p>
          We created XFree.in because existing online converter and formatting sites are slow, cluttered with invasive ads, and upload sensitive user code to unknown backend servers.
        </p>
        <p>
          XFree.in delivers 1,000+ single-purpose micro-tools that execute 100% locally in browser memory. No registration required, no hidden paywalls, and zero latency.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-bold text-emerald-400">100% Free</h4>
            <p className="text-xs text-slate-400">No trial limits or paywalls.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-bold text-cyan-400">Privacy First</h4>
            <p className="text-xs text-slate-400">Local browser JS sandbox.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h4 className="font-bold text-purple-400">Instant Speed</h4>
            <p className="text-xs text-slate-400">Zero network upload wait.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
