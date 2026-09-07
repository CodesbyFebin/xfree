import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, GitPullRequest, ShieldCheck } from "lucide-react";
import { CLUSTERS_50, getGitHubIssueUrl, type PillarDefinition } from "../../data/masterBlueprint";
import { getPublishedToolsForPillar, isPillarIndexable } from "../../data/pillarPublishing";

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

      <section aria-labelledby="pillar-covers" className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 id="pillar-covers" className="text-xl font-bold text-white">What this XFree pillar covers</h2>
          <p className="mt-3 leading-7 text-slate-300">The roadmap divides {pillar.name.toLowerCase()} work into reusable utility patterns such as generators, validators, analyzers, formatters, debuggers, optimizers, parsers and test helpers. A concept does not become a search-facing tool merely because it exists in the taxonomy.</p>
          <div className="mt-4 flex flex-wrap gap-2">{CLUSTERS_50.slice(0, 16).map((cluster) => <span key={cluster} className="rounded-full border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-xs text-slate-400">{cluster}</span>)}</div>
        </div>
        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h2 className="text-xl font-bold text-white">How XFree publishes tools in this pillar</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li><strong className="text-white">1. Implement:</strong> create a working utility and tests.</li>
            <li><strong className="text-white">2. Verify:</strong> document processing mode, limitations and examples.</li>
            <li><strong className="text-white">3. Review:</strong> approve unique content and metadata.</li>
            <li><strong className="text-white">4. Publish:</strong> add the canonical route, internal links, prerender and sitemap entry.</li>
          </ol>
          <a href={getGitHubIssueUrl(`${pillar.name} utility`, pillar.name, pillar.description)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/15"><GitPullRequest className="h-4 w-4" /> Propose a tool</a>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm leading-6 text-slate-300">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        <p><strong className="text-white">Indexing rule:</strong> XFree indexes pillar detail pages only after the pillar contains at least one published tool. Planned pillars can still be browsed and linked, but remain noindex until they cross that implementation threshold.</p>
      </section>
    </article>
  );
};
