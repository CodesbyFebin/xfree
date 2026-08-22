import React from "react";
import { PUBLIC_TOOLS } from "../data/publicTools";

export const HomeFaqSection: React.FC = () => {
  const items = [
    ["What is XFree.in?", `XFree.in is a free browser-tool platform for developers and technical SEO workflows. It currently exposes ${PUBLIC_TOOLS.length} verified published tools plus a separate public roadmap for planned concepts.`],
    ["Is XFree free and no-signup?", "Yes. Published tools can be opened without creating an XFree account. Optional third-party or cloud features are disclosed separately when they are used."],
    ["What does Local Mode mean?", "Local Mode means the working input is processed in the browser rather than being submitted to an XFree processing service. Each published tool states its actual local, cloud, or hybrid behavior."],
    ["Are all 25,000 roadmap concepts live tools?", "No. The 25,000 figure is a planning taxonomy. Planned concepts stay off the public sitemap until implementation, testing, editorial review, canonical validation, and internal-link checks pass."],
    ["How can I contribute a new XFree tool?", "Choose a roadmap concept, open a tool request on GitHub, implement it against the current repository architecture, add tests and disclosures, then submit a pull request for automated and human review."],
  ];

  return (
    <section aria-labelledby="home-faq-heading" className="space-y-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Quick answers</div>
        <h2 id="home-faq-heading" className="mt-2 text-2xl font-black text-white sm:text-3xl">Frequently asked questions about XFree</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map(([question, answer]) => (
          <details key={question} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <summary className="cursor-pointer font-semibold text-white">{question}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-300">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};
