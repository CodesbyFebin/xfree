import React from "react";
import { ArrowRight, BookOpen, SearchCheck, ShieldCheck, Waypoints } from "lucide-react";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";

interface HomeAuthoritySectionProps {
  onNavigate: (path: string) => void;
}

const RouterAnchor: React.FC<React.PropsWithChildren<{ href: string; className?: string; onNavigate: (path: string) => void }>> = ({ href, className, onNavigate, children }) => (
  <a
    href={href}
    className={className}
    onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      onNavigate(href);
    }}
  >
    {children}
  </a>
);

export const HomeAuthoritySection: React.FC<HomeAuthoritySectionProps> = ({ onNavigate }) => {
  return (
    <section className="space-y-6" aria-labelledby="xfree-direct-answer">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
            <SearchCheck className="h-4 w-4" />
            Direct answer
          </div>
          <h2 id="xfree-direct-answer" className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            What is XFree?
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            XFree is a free browser-tool platform for developers and technical SEO workflows. It publishes only utilities that have a real implementation and an indexable production route; Local Mode tools run in the browser, while any cloud-powered feature is labeled before submitted content leaves the device.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <RouterAnchor href="/how-it-works" onNavigate={onNavigate} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              How XFree works <ArrowRight className="h-4 w-4" />
            </RouterAnchor>
            <RouterAnchor href="/security" onNavigate={onNavigate} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200">
              Security &amp; processing disclosures <ArrowRight className="h-4 w-4" />
            </RouterAnchor>
            <RouterAnchor href="/contribute" onNavigate={onNavigate} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200">
              Contribute a tool <ArrowRight className="h-4 w-4" />
            </RouterAnchor>
          </div>
        </article>

        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8" aria-label="Published XFree scope">
          <h2 className="text-xl font-bold text-white">Published first, roadmap second</h2>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <dt className="text-xs text-slate-400">Published tools</dt>
              <dd className="mt-1 text-3xl font-black text-emerald-300">{PUBLIC_TOOLS.length}</dd>
            </div>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
              <dt className="text-xs text-slate-400">Roadmap concepts</dt>
              <dd className="mt-1 text-3xl font-black text-indigo-300">{ROADMAP_CONCEPT_COUNT.toLocaleString()}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            The roadmap count is a planning taxonomy, not a claim that every concept is already a live tool. Draft concepts stay out of the public sitemap until they pass implementation, content, and indexing gates.
          </p>
        </aside>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RouterAnchor href="/category/seo-tools" onNavigate={onNavigate} className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-cyan-500/40">
          <SearchCheck className="h-5 w-5 text-cyan-300" />
          <h2 className="mt-3 text-lg font-bold text-white">Explore XFree SEO &amp; webmaster utilities</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use published sitemap, robots.txt, metadata, schema, URL and crawl-preparation utilities.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300">Browse SEO tools <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </RouterAnchor>

        <RouterAnchor href="/pillars" onNavigate={onNavigate} className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-indigo-500/40">
          <Waypoints className="h-5 w-5 text-indigo-300" />
          <h2 className="mt-3 text-lg font-bold text-white">Browse the XFree developer-tool pillars</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Explore the 50-pillar taxonomy and see which areas already contain published tools.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-300">Open pillar directory <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </RouterAnchor>

        <RouterAnchor href="/guides" onNavigate={onNavigate} className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-emerald-500/40">
          <BookOpen className="h-5 w-5 text-emerald-300" />
          <h2 className="mt-3 text-lg font-bold text-white">Learn with reviewed XFree guides</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Read practical explanations, worked examples, limitations and links back to real tools.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-300">Read guides <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </RouterAnchor>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm leading-6 text-slate-300">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        <p><strong className="text-white">White-hat indexing policy:</strong> no doorway pages, no fake review signals, no fabricated usage counts, and no mass-indexing of unbuilt concepts. XFree submits only canonical pages that are intended to be useful on their own.</p>
      </div>
    </section>
  );
};
