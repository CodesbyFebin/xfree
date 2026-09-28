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
          <span>Local-Tool Privacy Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          How XFree.in Works
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          See which XFree.in tools process data locally in your browser and when optional AI features send input to a model provider.
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
            Open a published tool in your browser. Local utilities use browser JavaScript; optional AI features make a disclosed request through XFree.in's server.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-black text-lg flex items-center justify-center">
            2
          </div>
          <h3 className="text-xl font-bold text-white">Local Transformation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            For local formatters, testers, and generators, the transformation runs in your browser. Check each tool's processing notice before entering sensitive input.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 relative">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 font-black text-lg flex items-center justify-center">
            3
          </div>
          <h3 className="text-xl font-bold text-white">Instant Output & Export</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Copy or download the result when the tool offers that action. AI features may take longer and have provider or usage limits.
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
              Standard web utilities send your API keys, private JSON payloads, or SQL schemas to remote backend servers. Local tools do not submit their working input to XFree.in for processing. Optional AI and Cloud Mode features send selected input to the named provider; read the privacy notice before using them.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Offline & Offline-First Capability
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Some local operations may continue after the page loads. Cloud-backed features need a connection, and offline availability depends on what the browser has cached.
            </p>
          </div>
        </div>
      </div>

      <section aria-labelledby="featured-tools" className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 space-y-4">
        <h2 id="featured-tools" className="text-2xl font-bold text-white">Try a local tool</h2>
        <p className="text-slate-300 text-sm">These published tools provide a direct way to try the browser-based workflows described above.</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: "/tools/json-formatter", label: "JSON formatter and validator" },
            { href: "/tools/regex-tester", label: "JavaScript regex tester" },
            { href: "/tools/xml-sitemap-generator", label: "XML sitemap generator" },
            { href: "/tools/meta-tag-generator", label: "Meta tag and social preview" },
            { href: "/tools/base64-encoder-decoder", label: "Base64 decoder and JWT inspector" },
          ].map((tool) => (
            <li key={tool.href}>
              <a href={tool.href} className="block rounded-xl border border-slate-700 p-4 text-cyan-300 hover:border-cyan-500 hover:text-cyan-200">
                {tool.label} <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

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
