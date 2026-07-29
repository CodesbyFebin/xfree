import React from "react";
import type { GuideContent } from "../data/toolGuides";

interface Props {
  guide: GuideContent;
  toolTitle: string;
  onSelectTool?: (slug: string) => void;
}

export const ToolGuide: React.FC<Props> = ({ guide, toolTitle, onSelectTool }) => {
  return (
    <section className="mt-10 space-y-10 text-slate-200">
      <div className="space-y-3">
        <h2 className="text-2xl font-black text-white">The {toolTitle} guide</h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{guide.overview}</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Worked examples</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {guide.workedExamples.map((ex, i) => (
            <article key={i} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-cyan-300">{ex.title}</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Input</div>
                  <pre className="whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 overflow-x-auto">{ex.input}</pre>
                </div>
                <div>
                  <div className="text-slate-400 uppercase tracking-wider font-bold text-[10px] mb-1">Output</div>
                  <pre className="whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded-lg p-3 text-emerald-200 overflow-x-auto">{ex.output}</pre>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{ex.explanation}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider">When to use</h3>
          <ul className="space-y-2 text-sm text-slate-200 list-disc pl-5">
            {guide.whenToUse.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">When not to use</h3>
          <ul className="space-y-2 text-sm text-slate-200 list-disc pl-5">
            {guide.whenNotToUse.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Troubleshooting</h3>
        <div className="space-y-3">
          {guide.troubleshooting.map((t, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="text-sm font-bold text-red-300">{t.symptom}</div>
              <div className="text-sm text-slate-300 mt-1">{t.fix}</div>
            </div>
          ))}
        </div>
      </div>

      {onSelectTool && guide.relatedSlugs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Related tools</h3>
          <ul className="flex flex-wrap gap-2">
            {guide.relatedSlugs.map((slug) => (
              <li key={slug}>
                <button
                  onClick={() => onSelectTool(slug)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-xs text-slate-200 cursor-pointer transition-colors"
                >
                  {slug.replace(/-/g, " ")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500 italic">
        Authored by the XFree.in team. Last reviewed {guide.lastReviewed}.
      </p>
    </section>
  );
};
