import React from "react";
import { ShieldCheck } from "lucide-react";

interface SecuritySectionProps {
  onReadMore: () => void;
}

const POINTS = [
  "HSTS with a one-year max-age, plus a documented CSP allowlist (tightening path to nonce-based strict CSP is tracked, not hidden)",
  "X-Frame-Options: DENY and Referrer-Policy: strict-origin-when-cross-origin on every response",
  "Permissions-Policy locks down camera, microphone, geolocation, USB, and payment by default",
  "Zod validation, honeypot fields, and per-IP + global rate limits on every AI/contact/feedback/lead request",
  "Server-side task allowlist — the browser can never set its own AI system prompt",
];

export const SecuritySection: React.FC<SecuritySectionProps> = ({ onReadMore }) => {
  return (
    <div className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            No "military-grade" marketing — just the headers
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            If a claim appears here, the code backing it is in the public repository.
          </p>
        </div>

        <ul className="space-y-3">
          {POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs text-slate-300 leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onReadMore}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Read the full Security page →
        </button>
      </div>

      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-white/[0.02]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[11px] text-slate-500 font-mono">src/middleware/security-headers.ts</span>
        </div>
        <pre className="p-5 text-[10px] sm:text-xs leading-relaxed font-mono overflow-x-auto">
          <code>
            <span className="text-purple-400">{"res.setHeader"}</span>
            {'("Strict-Transport-Security",\n  "max-age=31536000; includeSubDomains; preload");\n'}
            <span className="text-purple-400">{"res.setHeader"}</span>
            {'("X-Content-Type-Options", "nosniff");\n'}
            <span className="text-purple-400">{"res.setHeader"}</span>
            {'("X-Frame-Options", "DENY");\n'}
            <span className="text-purple-400">{"res.setHeader"}</span>
            {'("Referrer-Policy",\n  "strict-origin-when-cross-origin");\n'}
            <span className="text-purple-400">{"res.setHeader"}</span>
            {'("Cross-Origin-Opener-Policy", "same-origin");\n'}
            <span className="text-purple-400">{"res.setHeader"}</span>
            {'("Cross-Origin-Resource-Policy", "same-origin");'}
          </code>
        </pre>
      </div>
    </div>
  );
};
