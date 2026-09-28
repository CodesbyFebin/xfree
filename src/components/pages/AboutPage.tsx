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
          Free browser-based tools for developer, data, and technical SEO tasks.
        </p>
      </div>

      <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed bg-slate-900/80 p-8 rounded-3xl border border-slate-800">
        <h2 className="text-2xl font-bold text-white">What XFree does</h2>
        <p>
          XFree.in brings focused utilities together so you can format data,
          inspect code, and work through technical SEO tasks without creating
          an account. This is the official home of the XFree developer tools
          project.
        </p>
        <p>
          Local tools process the input in your browser. AI and Cloud Mode
          features are different: when you choose one, your input is sent
          through XFree&apos;s server to the indicated model provider. Check
          each tool&apos;s privacy notice before entering sensitive data.
          Advertising services may also set cookies. See the{" "}
          <a href="/privacy" className="text-cyan-400 underline hover:text-cyan-300">
            Privacy Policy
          </a>{" "}
          for details.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h3 className="font-bold text-emerald-400">Free to access</h3>
            <p className="text-xs text-slate-400">No account or subscription required for the published tools.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h3 className="font-bold text-cyan-400">Clear data paths</h3>
            <p className="text-xs text-slate-400">Local and provider-backed features are identified separately.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <h3 className="font-bold text-purple-400">Open source</h3>
            <p className="text-xs text-slate-400">
              <a href="https://github.com/CodesbyFebin/xfree" className="underline hover:text-purple-300">
                Inspect the code on GitHub
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
