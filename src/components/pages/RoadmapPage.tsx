import React from "react";
import { ExternalLink, GitPullRequest, Search, Waypoints } from "lucide-react";
import { PILLARS_50, ROADMAP_CONCEPT_COUNT } from "../../data/masterBlueprint";
import { PUBLIC_TOOLS } from "../../data/publicTools";
import { searchRoadmap } from "../../utils/search25k";

interface RoadmapPageProps { onNavigate: (path: string) => void; }

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ onNavigate }) => {
  const [query, setQuery] = React.useState("");
  const [pillar, setPillar] = React.useState("all");
  const results = React.useMemo(() => searchRoadmap(query, pillar, 60), [query, pillar]);

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-amber-500/20 bg-slate-900/70 p-6 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-300"><Waypoints className="h-4 w-4" /> Public roadmap · noindex until concepts ship</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">XFree 25,000-Concept Tool Roadmap</h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">The roadmap models {ROADMAP_CONCEPT_COUNT.toLocaleString()} possible utility concepts across 50 pillars, 50 workflow clusters and 10 modifier patterns. It is a planning and contribution surface—not a claim that {ROADMAP_CONCEPT_COUNT.toLocaleString()} tools are live or indexed.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-2xl font-black text-white">{PUBLIC_TOOLS.length}</div><div className="text-xs text-slate-400">Published public tools</div></div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"><div className="text-2xl font-black text-white">50 × 50 × 10</div><div className="text-xs text-slate-400">Taxonomy formula</div></div>
          <a href="/pillars" onClick={(event) => { event.preventDefault(); onNavigate("/pillars"); }} className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4"><div className="text-sm font-bold text-indigo-300">Browse pillar directory</div><div className="mt-1 text-xs text-slate-400">See which pillars already contain published tools.</div></a>
          <a href="/contribute" onClick={(event) => { event.preventDefault(); onNavigate("/contribute"); }} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4"><div className="text-sm font-bold text-cyan-300">Contribute a tool</div><div className="mt-1 text-xs text-slate-400">See the current quality gates and contribution workflow.</div></a>
        </div>
      </header>

      <section aria-labelledby="roadmap-search" className="space-y-5">
        <div><h2 id="roadmap-search" className="text-2xl font-bold text-white">Search the roadmap without creating thin pages</h2><p className="mt-2 text-sm leading-6 text-slate-400">Search happens client-side on this one roadmap URL. Planned results link to a contribution issue instead of creating thousands of crawlable stub URLs.</p></div>
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <label className="relative block"><span className="sr-only">Search roadmap</span><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search JSON, SEO, Docker, accessibility…" className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-amber-500" /></label>
          <select value={pillar} onChange={(event) => setPillar(event.target.value)} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"><option value="all">All 50 pillars</option>{PILLARS_50.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => item.status === "published" ? (
            <a key={item.id} href={item.liveUrl} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); onNavigate(item.liveUrl!); }} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Published</div><h3 className="mt-2 font-bold text-white">{item.name}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p></a>
          ) : (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Planned · {item.pillar}</div><h3 className="mt-2 font-bold text-white">{item.name}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p><a href={item.githubIssueUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300"><GitPullRequest className="h-4 w-4" /> Request/build on GitHub <ExternalLink className="h-3.5 w-3.5" /></a></article>
          ))}
        </div>
      </section>
    </div>
  );
};
