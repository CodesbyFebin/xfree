import React, { useState } from "react";
import { HelpCircle, ChevronDown, ShieldCheck, Zap, Lock } from "lucide-react";

interface PageProps {
  onGoHome: () => void;
}

export const FaqPage: React.FC<PageProps> = ({ onGoHome }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is XFree.in really 100% free with no hidden paywalls?",
      a: "Yes. All standard client-side micro-tools on XFree.in are completely free to use with zero registration, zero credit cards, and no usage quotas."
    },
    {
      q: "How does XFree.in guarantee my data privacy?",
      a: "All calculation, parsing, regex matching, and XML sitemap parsing happen locally in your browser session. Your input data is never sent to backend server logs."
    },
    {
      q: "Do I need to create an account or sign up?",
      a: "No signup required. You can bookmark any tool and use it instantly on desktop, tablet, or mobile."
    },
    {
      q: "Can I process large files or bulk datasets?",
      a: "Yes! Our tools use virtualized rendering and Web Workers to process large datasets without freezing your browser."
    },
    {
      q: "How do AI tools work on XFree.in?",
      a: "AI micro-tools route your request through our server-side Gemini API proxy (`/api/ai`), using strict system instructions to deliver clean, structured outputs without exposing API keys."
    },
    {
      q: "Can I use XFree.in tools offline?",
      a: "Yes. Once the web page is loaded in your browser tab, standard client-side tools can run without an active internet connection."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
          <HelpCircle className="w-4 h-4" />
          <span>Frequently Asked Questions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Got Questions? We Have Answers.
        </h1>
        <p className="text-slate-300 text-base max-w-xl mx-auto">
          Learn more about XFree.in platform capabilities, privacy architecture, and local tool execution.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between text-white font-bold text-base cursor-pointer hover:text-emerald-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180 text-emerald-400" : "text-slate-500"}`} />
              </button>
              {isOpen && (
                <div className="p-5 pt-0 text-slate-300 text-sm leading-relaxed border-t border-slate-800/60 mt-1">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
