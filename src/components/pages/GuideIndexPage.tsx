import React from "react";
import { ArrowRight } from "lucide-react";
import { GUIDES } from "../../data/guides";

interface Props {
  onSelectGuide: (slug: string) => void;
}

export const GuideIndexPage: React.FC<Props> = ({ onSelectGuide }) => (
  <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 text-slate-200">
    <header className="space-y-3">
      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Guides</h1>
      <p className="text-slate-300 text-sm">
        Short, practical guides for developers and SEOs. Each one is a standalone reference — no fluff,
        no marketing filler, and every example is runnable.
      </p>
    </header>

    <ul className="space-y-4">
      {GUIDES.map((g) => (
        <li key={g.slug}>
          <button
            onClick={() => onSelectGuide(g.slug)}
            className="w-full text-left p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h2 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">{g.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{g.description}</p>
                <p className="text-xs text-slate-500">Last reviewed {g.lastReviewed}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 shrink-0 mt-1 transition-colors" />
            </div>
          </button>
        </li>
      ))}
    </ul>
  </div>
);
