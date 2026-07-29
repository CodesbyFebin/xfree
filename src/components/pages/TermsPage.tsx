import React from "react";

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-slate-400 text-xs font-mono">Last Updated: March 15, 2026</p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing and using XFree.in, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Acceptable Use</h2>
          <p>
            You agree to use XFree.in only for lawful purposes. You must not attempt to abuse, overload, or reverse-engineer our server proxy APIs or disrupt service availability for other users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Disclaimer of Warranties</h2>
          <p>
            All tools on XFree.in are provided "as is" without warranty of any kind. While we strive for 100% accuracy in our parsers and generators, you are responsible for verifying generated code, regex, or sitemaps before deployment into production systems.
          </p>
        </section>
      </div>
    </div>
  );
};
