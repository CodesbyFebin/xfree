import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Guide } from "../../data/guides";
import { getPublicToolBySlug } from "../../data/publicTools";

interface Props {
  guide: Guide;
  onGoIndex: () => void;
  onSelectTool: (slug: string) => void;
  onSelectGuide: (slug: string) => void;
}

export const GuidePage: React.FC<Props> = ({ guide, onGoIndex, onSelectTool, onSelectGuide }) => {
  return (
    <article className="max-w-3xl mx-auto py-10 px-4 space-y-8 text-slate-200">
      <nav className="text-xs text-slate-400">
        <button onClick={onGoIndex} className="inline-flex items-center gap-1 hover:text-cyan-300 cursor-pointer">
          <ArrowLeft className="w-3 h-3" /> All guides
        </button>
      </nav>

      <header className="space-y-4">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{guide.title}</h1>
        <p className="text-slate-300 text-base leading-relaxed">{guide.intro}</p>
      </header>

      {guide.sections.map((section, i) => (
        <section key={i} className="space-y-4">
          <h2 className="text-xl font-bold text-white">{section.heading}</h2>
          {section.paragraphs?.map((p, j) => (
            <p key={j} className="text-sm leading-relaxed">{p}</p>
          ))}
          {section.bullets && (
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {section.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          )}
          {section.code && (
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 overflow-x-auto whitespace-pre">{section.code.body}</pre>
          )}
        </section>
      ))}

      {(guide.relatedGuideSlugs?.length || guide.relatedToolSlugs?.length) ? (
        <section className="pt-6 border-t border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white">Related</h2>
          <div className="flex flex-wrap gap-2">
            {guide.relatedGuideSlugs?.map((slug) => (
              <button
                key={slug}
                onClick={() => onSelectGuide(slug)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-xs cursor-pointer inline-flex items-center gap-2 transition-colors"
              >
                {slug.replace(/-/g, " ")}
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
            {guide.relatedToolSlugs?.map((slug) => {
              const tool = getPublicToolBySlug(slug);
              if (!tool) return null;
              return (
                <button
                  key={slug}
                  onClick={() => onSelectTool(slug)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800 hover:border-cyan-400 text-cyan-200 text-xs cursor-pointer inline-flex items-center gap-2 transition-colors"
                >
                  {tool.title}
                  <ArrowRight className="w-3 h-3" />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <p className="text-xs text-slate-500 italic pt-6">
        Authored by the XFree.in team. Last reviewed {guide.lastReviewed}.
      </p>
    </article>
  );
};
