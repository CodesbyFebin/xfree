import React from "react";
import { ChevronDown } from "lucide-react";
import { PUBLIC_TOOLS } from "../data/publicTools";

export const HomeFaqSection: React.FC = () => {
  const items = [
    ["What is XFree.in?", `XFree.in is a free browser-tool platform for developers and technical SEO workflows. It currently exposes ${PUBLIC_TOOLS.length} verified published tools plus a separate public roadmap for planned concepts.`],
    ["Is XFree free and no-signup?", "Yes. Published tools can be opened without creating an XFree account. Optional third-party or cloud features are disclosed separately when they are used."],
    ["What does Local Mode mean?", "Local Mode means the working input is processed in the browser rather than being submitted to an XFree processing service. Each published tool states its actual local, cloud, or hybrid behavior."],
    ["Are all 25,000 roadmap concepts live tools?", "No. The 25,000 figure is a planning taxonomy. Planned concepts stay off the public sitemap until implementation, testing, editorial review, canonical validation and internal-link checks pass."],
    ["Does XFree work offline?", "Studio includes an installable PWA shell. Same-origin assets and supported workflows can work from cache after they have been loaded, while cloud AI and uncached remote resources still require a network connection."],
    ["How can I contribute a new XFree tool?", "Choose a roadmap concept, open a tool request on GitHub, implement it against the current repository architecture, add tests and disclosures, then submit a pull request for automated and human review."],
  ];

  return (
    <section id="faq" aria-labelledby="home-faq-heading" className="rounded-[2rem] border border-slate-200 bg-stone-50 p-6 sm:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Frequently asked questions</p>
        <h2 id="home-faq-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Clear answers about XFree</h2>
        <p className="mt-3 text-base leading-7 text-slate-600">Privacy, accounts, roadmap scope, offline behavior and contribution—without marketing shortcuts.</p>
      </div>

      <div className="mx-auto mt-9 max-w-4xl space-y-3">
        {items.map(([question, answer]) => (
          <details key={question} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-slate-950 transition hover:bg-stone-50">
              <span>{question}</span>
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-slate-100 px-5 pb-5 pt-4">
              <p className="text-sm leading-7 text-slate-600">{answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};
