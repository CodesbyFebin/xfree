import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, GitPullRequest, ShieldCheck } from "lucide-react";
import { CLUSTERS_50, getGitHubIssueUrl, type PillarDefinition } from "../../data/masterBlueprint";
import { getPublishedToolsForPillar, isPillarIndexable } from "../../data/pillarPublishing";
import { DropboxConnection } from "../../components/DropboxConnection"; // Will create this component

import { getRelatedPillars, getCategoryPillars } from "../../data/masterBlueprint";

interface PillarDetailPageProps {
  pillar: PillarDefinition;
  onNavigate: (path: string) => void;
}

export const PillarDetailPage: React.FC<PillarDetailPageProps> = ({ pillar, onNavigate }) => {
  const tools = getPublishedToolsForPillar(pillar.slug);
  const indexable = isPillarIndexable(pillar.slug);

  return (
    <article className="space-y-10">
      <header className="rounded-3xl border border-indigo-500/20 bg-slate-900/70 p-6 sm:p-9">
        <a href="/pillars" onClick={(event) => { event.preventDefault(); onNavigate("/pillars"); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> All XFree pillars</a>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-3xl" aria-hidden="true">{pillar.icon}</span>
          {indexable ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Published-tool pillar</span> : <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">Roadmap pillar · noindex until tools ship</span>}
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">XFree {pillar.name} Tools</h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">{pillar.description} XFree uses this pillar to organize published utilities and future community contributions without creating indexable stub tool pages.</p>
      </header>

      <section aria-labelledby="published-pillar-tools" className="space-y-5">
        <div>
          <h2 id="published-pillar-tools" className="text-2xl font-bold text-white">Published XFree {pillar.name} tools</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Only production tools with a working implementation and public indexability flag appear here.</p>
        </div>
        {tools.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <a key={tool.slug} href={`/tools/${tool.slug}`} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); onNavigate(`/tools/${tool.slug}`); }} className="group rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5 transition hover:border-emerald-400/40">
                <h3 className="font-bold text-white group-hover:text-emerald-300">{tool.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{tool.shortDescription}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">Use published tool <ArrowRight className="h-4 w-4" /></span>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h3 className="font-bold text-amber-200">No tool in this pillar is being presented as published yet.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">This page remains useful as roadmap navigation but is marked noindex until a real tool is implemented and reviewed.</p>
          </div>
        )}
      </section>

      {/* ChatGPT Command Center */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-xl font-bold text-white mb-4">💬 Ask XFree Assistant</h2>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/40 rounded-xl p-5 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-300">🤖</div>
              <span className="text-cyan-300">ChatGPT</span>
            </div>
            <p className="text-sm text-cyan-200">Ask XFree about tools, features, or how to contribute. Your queries are processed locally with zero data leaving your device.</p>
          </div>
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/40 rounded-xl p-5 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-300">💡</div>
              <span className="text-amber-300">Quick Tips</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300">📚</span> Learn about our tool categories
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-300">⚡</span> Speed up your workflow
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300">🔒</span> Privacy-first design
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-300">🤝</span> Community-driven
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/40 rounded-xl p-5 border border-cyan-500/30">
            <h3 className="text-xl font-bold text-white mb-3">Try Me</h3>
            <p className="text-sm text-cyan-200">Type your question and get an instant answer from XFree’s AI assistant.</p>
            <button className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-colors focus-ring focus-ring-cyan-500">Ask XFree</button>
          </div>
        </div>
      </section>

      {/* Dropbox Integration */}
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-xl font-bold text-white mb-4">📂 Connect Dropbox</h2>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-500/40 rounded-xl p-5 border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-300">📁</div>
              <span className="text-cyan-300">Dropbox</span>
            </div>
            <p className="text-sm text-cyan-200">Sync your project files with XFree for seamless collaboration.</p>
          </div>
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-500/40 rounded-xl p-5 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-300">☁️</div>
              <span className="text-amber-300">Cloud Storage</span>
            </div>
            <p className="text-sm text-amber-200">Upload assets, share folders, and collaborate in real-time.</p>
          </div>
          <div className="bg-gradient-to-r from-rose-500/20 to-rose-500/40 rounded-xl p-5 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-300">📊</div>
              <span className="text-rose-300">Analytics</span>
            </div>
            <p className="text-sm text-rose-200">Track your productivity and engagement metrics.</p>
          </div>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm leading-6 text-slate-300">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        <p><strong className="text-white">Indexing Rule:</strong> XFree indexes pillar detail pages only after the pillar contains at least one published tool. Planned pillars can still be browsed and linked, but remain noindex until they cross that implementation threshold.</p>
      </section>
    </article>
  );
};
