import React from "react";
import { ArrowRight, CheckCircle2, Layers3, Search } from "lucide-react";
import { PILLARS_50 } from "../../data/masterBlueprint";
import { getPublishedToolsForPillar } from "../../data/pillarPublishing";

interface PillarHubsPageProps {
  onNavigate: (path: string) => void;
}

export const PillarHubsPage: React.FC<PillarHubsPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = React.useState("");
  const normalized = query.trim().toLowerCase();
  const pillars = PILLARS_50.filter((pillar) => !normalized || `${pillar.name} ${pillar.description}`.toLowerCase().includes(normalized));
  const publishedPillars = PILLARS_50.filter((pillar) => getPublishedToolsForPillar(pillar.slug).length > 0).length;

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-indigo-500/20 bg-slate-900/70 p-6 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-300"><Layers3 className="h-4 w-4" /> XFree taxonomy</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">XFree Developer &amp; SEO Pillar Directory</h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">Browse the 50-domain roadmap used to organize XFree developer, SEO, security, data and productivity utilities. Pillars with published tools link to verified production pages; other pillars remain roadmap-oriented until implementations are reviewed.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-2xl font-black text-white">50</div><div className="text-xs text-slate-400">Roadmap pillars</div></div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="text-2xl font-black text-emerald-300">{publishedPillars}</div><div className="text-xs text-slate-400">Pillars with published tools</div></div>
          <a href="/roadmap" onClick={(event) => { event.preventDefault(); onNavigate("/roadmap"); }} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 transition hover:border-cyan-400/50"><div className="text-sm font-bold text-cyan-300">View full roadmap</div><div className="mt-1 text-xs text-slate-400">Planned concepts are clearly separated from live tools.</div></a>
        </div>
      </header>

      <section aria-labelledby="pillar-search" className="space-y-5">
        <div>
          <h2 id="pillar-search" className="text-2xl font-bold text-white">Find an XFree tool pillar</h2>
          <p className="mt-2 text-sm text-slate-400">Search by domain, workflow, or technical topic.</p>
        </div>
        <label className="relative block max-w-3xl">
          <span className="sr-only">Search XFree pillars</span>
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search technical SEO, cryptography, JSON, DevOps…" className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-indigo-500" />
        </label>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pillars.map((pillar) => {
            const count = getPublishedToolsForPillar(pillar.slug).length;
            return (
              <a key={pillar.slug} href={`/pillar/${pillar.slug}`} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); onNavigate(`/pillar/${pillar.slug}`); }} className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/40">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-2xl" aria-hidden="true">{pillar.icon}</span>
                  {count > 0 ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"><CheckCircle2 className="h-3 w-3" /> {count} published</span> : <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-400">Roadmap</span>}
                </div>
                <h3 className="mt-4 text-lg font-bold text-white group-hover:text-indigo-300">{pillar.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{pillar.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-300">Explore pillar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
};
