import React from "react";
import { ArrowRight, BookOpen, SearchCheck, ShieldCheck, Waypoints } from "lucide-react";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";
import { HomeLivePlayground } from "./HomeLivePlayground";

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

export const HomeAuthoritySection: React.FC<HomeAuthoritySectionProps> = ({ onNavigate }) => (
  <section className="space-y-6" aria-labelledby="xfree-direct-answer">
    <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-600">
          <SearchCheck className="h-4 w-4" /> Direct answer
        </div>
        <h2 id="xfree-direct-answer" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">What is XFree?</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          XFree is a free browser-tool platform for developer and technical SEO workflows. It publishes utilities only after they have a working implementation and an indexable production route; Local Mode tools run in the browser, while optional cloud features are labeled before submitted content leaves the device.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <RouterAnchor href="/how-it-works" onNavigate={onNavigate} className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700">How XFree works <ArrowRight className="h-4 w-4" /></RouterAnchor>
          <RouterAnchor href="/security" onNavigate={onNavigate} className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800">Security disclosures <ArrowRight className="h-4 w-4" /></RouterAnchor>
          <RouterAnchor href="/contribute" onNavigate={onNavigate} className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-700 hover:text-violet-800">Contribute a tool <ArrowRight className="h-4 w-4" /></RouterAnchor>
        </div>
      </article>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-label="Published XFree scope">
        <h2 className="text-xl font-black text-slate-950">Published first, roadmap second</h2>
        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <dt className="text-xs font-semibold text-emerald-700">Published tools</dt>
            <dd className="mt-1 text-3xl font-black text-emerald-700">{PUBLIC_TOOLS.length}</dd>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <dt className="text-xs font-semibold text-violet-700">Roadmap concepts</dt>
            <dd className="mt-1 text-3xl font-black text-violet-700">{ROADMAP_CONCEPT_COUNT.toLocaleString()}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-6 text-slate-500">Roadmap concepts remain planning entries until implementation, editorial, canonical, content and indexing gates pass.</p>
      </aside>
    </div>

    <HomeLivePlayground />

    <div className="grid gap-4 md:grid-cols-3">
      {[
        { href: "/category/seo-tools", title: "SEO & webmaster utilities", text: "Sitemaps, robots.txt, metadata, schema, URLs and crawl-preparation utilities.", icon: SearchCheck, tone: "text-indigo-600" },
        { href: "/pillars", title: "Developer-tool pillars", text: "Browse the 50-pillar taxonomy and see which areas already contain published tools.", icon: Waypoints, tone: "text-violet-600" },
        { href: "/guides", title: "Reviewed practical guides", text: "Read worked examples, limitations and explanations linked back to real tools.", icon: BookOpen, tone: "text-emerald-600" },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <RouterAnchor key={item.href} href={item.href} onNavigate={onNavigate} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
            <Icon className={`h-5 w-5 ${item.tone}`} />
            <h3 className="mt-3 text-lg font-extrabold text-slate-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-indigo-600">Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </RouterAnchor>
        );
      })}
    </div>

    <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p><strong>White-hat indexing policy:</strong> no doorway pages, fake review signals, fabricated usage counts, or mass-indexing of unbuilt concepts. XFree submits canonical pages intended to be useful on their own.</p>
    </div>
  </section>
);
