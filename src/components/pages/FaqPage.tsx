import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

interface PageProps {
  onGoHome: () => void;
}

export const FaqPage: React.FC<PageProps> = ({ onGoHome }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Which XFree tools are publicly available?",
      a: "Only tools marked published and indexable appear in public navigation, search, category pages, related-tool links, and the sitemap. Draft or planned utilities are not presented as working products."
    },
    {
      q: "Do I need an account to use published browser tools?",
      a: "No account is required for the currently published browser utilities. A tool may still depend on browser capabilities such as JavaScript, clipboard access, downloads, or local storage."
    },
    {
      q: "What does Local Mode by default mean?",
      a: "It means the selected local engine performs its working transformation in browser JavaScript, a Web Worker, or another declared browser runtime. Review the individual tool page because implementation and limits differ by tool."
    },
    {
      q: "Does every operation run in a Web Worker?",
      a: "No. Selected heavy operations use workers, while simpler utilities run on the main browser thread. Main-thread tools can become temporarily unresponsive with unusually large or pathological input."
    },
    {
      q: "What happens when I choose an optional cloud feature?",
      a: "Cloud processing is opt-in. The interface should identify the provider and warn that submitted content will leave the browser before the request is made. Third-party provider terms then apply."
    },
    {
      q: "Can XFree safely process any file size?",
      a: "No universal file-size guarantee is made. Practical limits depend on browser memory, device performance, implementation, input complexity, and any worker timeout documented for that engine."
    },
    {
      q: "Does a generated result prove standards or security compliance?",
      a: "No. Outputs are working aids. Validate security-sensitive, legal, financial, production, and standards-dependent results with the appropriate specification, target runtime, or qualified reviewer."
    },
    {
      q: "Can published tools work without an internet connection?",
      a: "Some local operations may continue after their code and assets have loaded, but XFree does not promise full offline availability. Reloading pages, cloud features, ads, fonts, or external resources may require a connection."
    },
    {
      q: "How should I handle secrets or sensitive production data?",
      a: "Prefer a verified Local Mode tool and inspect its processing disclosure first. Avoid optional cloud processing for secrets, and never assume that decoding a token verifies its signature or authenticity."
    },
    {
      q: "Where can I learn a tool's exact behavior?",
      a: "Start with its dedicated page for inputs, outputs, examples, and limitations. Use the Documentation Hub and reviewed Guides for deeper workflows, then open XFree Studio when the corresponding engine is available."
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
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                className="w-full p-5 text-left flex items-center justify-between text-white font-bold text-base cursor-pointer hover:text-emerald-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180 text-emerald-400" : "text-slate-500"}`} />
              </button>
              {isOpen && (
                <div id={`faq-answer-${i}`} className="p-5 pt-0 text-slate-300 text-sm leading-relaxed border-t border-slate-800/60 mt-1">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-3">
        <h2 className="text-xl font-bold text-white">Still deciding which path to use?</h2>
        <p className="text-sm leading-6 text-slate-300">
          Read How It Works for processing architecture, Use Cases for workflow examples, and the Documentation Hub for tool-specific references. If a published page does not answer a limitation clearly, contact XFree before using the output in a sensitive production workflow.
        </p>
        <button type="button" onClick={onGoHome} className="text-sm font-bold text-emerald-400 hover:text-emerald-300">
          Return to the verified tool directory
        </button>
      </section>
    </div>
  );
};
