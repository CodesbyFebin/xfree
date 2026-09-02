import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqStripProps {
  onSeeFullFaq: () => void;
}

const FAQS = [
  {
    q: "What is XFree?",
    a: "XFree is an open-source project combining 10 published, free browser tools with an intent-routing and execution engine, 100 local Studio engines, and optional cloud AI (Google Gemini, NVIDIA NIM). MIT licensed, self-hostable.",
  },
  {
    q: "Is XFree really free?",
    a: "Yes. The code is MIT licensed and the published local tools have no usage limits or signup requirement. Optional cloud AI features are rate-limited and depend on whichever provider keys the deployer configures.",
  },
  {
    q: "How does the intent engine decide what to run?",
    a: "classifyIntent() parses a request into intent, entities, and constraints, then matches it against known intents mapped to real tools. Unsupported intents return zero tool matches rather than a misleading guess.",
  },
  {
    q: "Can I use my own LLM provider?",
    a: "Cloud mode routes to Google Gemini and, optionally, NVIDIA NIM — which itself hosts many open-weight model families. XFree does not call OpenAI's or Anthropic's APIs directly. The 100 local engines need no provider at all.",
  },
  {
    q: "What does \"governed content pipeline\" mean?",
    a: "Every AI-generated tool page passes a review → duplicate/similarity check → explicit human approval gate before it's compiled into the live site. Nothing publishes automatically or unreviewed.",
  },
];

export const FaqStrip: React.FC<FaqStripProps> = ({ onSeeFullFaq }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div id="faq" className="scroll-mt-24 max-w-3xl mx-auto w-full space-y-8">
      <div className="text-center space-y-3">
        <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">FAQ</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Common questions</h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.q} className="rounded-xl glass-panel-interactive overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-white">{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5">
                  <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={onSeeFullFaq}
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          See the full FAQ →
        </button>
      </div>
    </div>
  );
};
