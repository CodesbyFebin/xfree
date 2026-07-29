import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-400 text-xs font-mono">Last Updated: March 15, 2026</p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Client-Side Data Execution</h2>
          <p>
            XFree.in operates on a privacy-first, client-side architecture. When you enter raw text, JSON payloads, URLs, code snippets, or regex patterns into standard tools on XFree.in, all parsing and transformation occur strictly within your web browser's JavaScript sandbox. Your input data is never transmitted to or saved on our backend servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. AI Micro-Tools Processing</h2>
          <p>
            For tools clearly designated as AI-powered (e.g., AI Regex, AI SQL Generator), input prompts are passed securely via server proxy to Google's Gemini API for inference. No personal identity data is stored or logged.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Local Storage</h2>
          <p>
            We use browser \`localStorage\` solely to persist non-sensitive user preferences, such as your saved favorite tools or recent execution history. This data remains on your device.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Cookies & Analytics</h2>
          <p>
            XFree.in uses privacy-preserving anonymous performance metrics to optimize page load times and ensure platform availability. We do not use invasive cross-site tracking cookies.
          </p>
        </section>
      </div>
    </div>
  );
};
