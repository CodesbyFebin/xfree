import React from "react";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export const SecurityPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Security Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Security & Sandbox Architecture
        </h1>
        <p className="text-slate-400 text-xs font-mono">XFree.in Hardened Security Standard</p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" /> Client-Side Sandbox Security
          </h2>
          <p>
            Standard web tools parse JSON or Base64 by sending your payloads to external REST endpoints. This exposes your confidential secrets, database tokens, or customer data to intercept risk.
          </p>
          <p>
            XFree.in executes code exclusively inside your browser's isolated JavaScript virtual machine. No external network requests are made during local tool execution.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Server Security & API Key Isolation
          </h2>
          <p>
            For server-side AI requests, API keys are securely managed via environment variables and never exposed to client-side bundles. All server endpoints enforce strict input validation and payload size restrictions.
          </p>
        </section>
      </div>
    </div>
  );
};
