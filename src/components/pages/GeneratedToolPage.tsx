import React from "react";
import type { PublishedArtifact } from "../../content-pipeline/published-artifact-schema";
import { AdSenseUnit } from "../AdSenseUnit";

export function GeneratedToolPage({ page }: { page: PublishedArtifact }) {
  const modeLabel = page.processing.mode === "local"
    ? "Local Mode"
    : page.processing.mode === "cloud"
      ? "Cloud Mode"
      : "Hybrid processing";

  return (
    <article className="mx-auto max-w-5xl space-y-8 px-1 py-4 sm:px-4 sm:py-8">
      <header className="space-y-5 rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-300">{modeLabel}</span>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300">Reviewed documentation</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{page.metadata.h1}</h1>
        <a href={page.studioDeepLink} className="inline-flex rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-400">
          Open in XFree Studio
        </a>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-8">
          <section aria-labelledby="direct-answer" className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <h2 id="direct-answer" className="text-xl font-bold text-white">What is the {page.metadata.h1} and how does it work?</h2>
            <p className="mt-3 leading-7 text-slate-300">{page.content.directAnswer}</p>
          </section>

          <section aria-labelledby="technical-details" className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h2 id="technical-details" className="text-xl font-bold text-white">Technical architecture and local processing</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-300">{page.content.technicalDetails}</p>
          </section>

          <section aria-labelledby="instructions" className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h2 id="instructions" className="text-xl font-bold text-white">Step-by-step usage guide</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-300">{page.content.instructions}</p>
          </section>

          <section aria-labelledby="worked-examples" className="space-y-4">
            <h2 id="worked-examples" className="text-xl font-bold text-white">Worked examples</h2>
            {page.content.examples.map((example) => (
              <article key={example.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <h3 className="font-bold text-cyan-300">{example.title}</h3>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Input</p>
                <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200"><code>{example.input}</code></pre>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Output</p>
                <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-200"><code>{example.output}</code></pre>
                <p className="mt-3 leading-6 text-slate-300">{example.explanation}</p>
              </article>
            ))}
          </section>

          <AdSenseUnit slot={import.meta.env.VITE_ADSENSE_TOOL_SLOT} className="my-10" />

          <section aria-labelledby="troubleshooting" className="space-y-3">
            <h2 id="troubleshooting" className="text-xl font-bold text-white">Technical troubleshooting and edge cases</h2>
            {page.content.faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <summary className="cursor-pointer font-semibold text-white">{faq.question}</summary>
                <p className="mt-3 leading-6 text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </section>
        </div>

        <aside className="h-fit space-y-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5 lg:sticky lg:top-24" aria-label="Verified tool specifications">
          <h2 className="text-base font-bold text-white">Verified specifications</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-500">Processing</dt><dd className="text-slate-200">{modeLabel}</dd></div>
            <div><dt className="text-slate-500">Implementation</dt><dd className="text-slate-200">{page.processing.implementation}</dd></div>
            <div><dt className="text-slate-500">Working input sent to server</dt><dd className="text-slate-200">{page.processing.workingInputSentToServer ? "Yes" : "No"}</dd></div>
          </dl>
          <div>
            <h3 className="text-sm font-semibold text-white">Known limitations</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-300">
              {page.processing.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
            </ul>
          </div>
          <p className="break-all border-t border-white/10 pt-4 font-mono text-[10px] text-slate-500">Revision {page.contentFingerprint.slice(0, 16)}</p>
        </aside>
      </div>
    </article>
  );
}
