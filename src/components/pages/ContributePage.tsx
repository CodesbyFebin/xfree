import React from "react";
import { ArrowRight, CheckCircle2, ExternalLink, GitPullRequest, Github, ShieldCheck, Waypoints } from "lucide-react";
import { PUBLIC_TOOLS } from "../../data/publicTools";
import { ROADMAP_CONCEPT_COUNT } from "../../data/masterBlueprint";

interface ContributePageProps {
  onNavigate: (path: string) => void;
}

const repo = "https://github.com/CodesbyFebin/xfree";

export const ContributePage: React.FC<ContributePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
          <GitPullRequest className="h-4 w-4" /> Open-source contribution pipeline
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">
          Contribute to XFree — Build Free Developer &amp; SEO Tools
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">
          XFree turns a public {ROADMAP_CONCEPT_COUNT.toLocaleString()}-concept roadmap into a smaller, verified production catalog. Choose a useful concept, build a real implementation, pass the quality gates, and only then request publication and indexability.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`${repo}/issues/new/choose`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
            Request or claim a tool <ExternalLink className="h-4 w-4" />
          </a>
          <a href={repo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500">
            <Github className="h-4 w-4" /> Open repository
          </a>
        </div>
      </header>

      <section aria-labelledby="contribution-model" className="space-y-5">
        <div>
          <h2 id="contribution-model" className="text-2xl font-black text-white sm:text-3xl">How the roadmap becomes production</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">The three-layer model keeps community participation open without turning unbuilt ideas into thin search pages.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["01", "Roadmap", `${ROADMAP_CONCEPT_COUNT.toLocaleString()} planned concepts stay searchable on one noindex roadmap surface.`, "border-amber-500/20 bg-amber-500/5 text-amber-300"],
            ["02", "Contribution pipeline", "Contributors implement functionality, tests, processing disclosures, accessibility, documentation, and error handling.", "border-cyan-500/20 bg-cyan-500/5 text-cyan-300"],
            ["03", "Published production", `${PUBLIC_TOOLS.length} tools currently pass the public registry gate. Approved tools are prerendered, internally linked, and added to canonical sitemaps automatically.`, "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"],
          ].map(([step, title, body, tone]) => (
            <article key={step} className={`rounded-2xl border p-5 ${tone}`}>
              <div className="text-xs font-black uppercase tracking-[0.16em] opacity-80">Layer {step}</div>
              <h3 className="mt-3 text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="start-contributing" className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
          <h2 id="start-contributing" className="text-2xl font-black text-white">Start with a real problem, not an SEO page</h2>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            {[
              "Browse the roadmap and choose a concept that solves a clear developer, SEO, data, accessibility, or productivity problem.",
              "Open a tool request and define the intended inputs, outputs, processing mode, edge cases, and why the tool is useful.",
              "Implement against the current React/TypeScript architecture. Do not create a second legacy registry or a standalone SSG runtime.",
              "Add tests for valid, invalid, empty, and realistic large inputs where applicable, plus keyboard-accessible controls and clear errors.",
              "Run npm run verify, open a pull request, and complete the repository review checklist.",
            ].map((item, index) => (
              <li key={item} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-black text-cyan-300">{index + 1}</span><span>{item}</span></li>
            ))}
          </ol>
          <button onClick={() => onNavigate("/roadmap")} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            Browse the 25K concept roadmap <ArrowRight className="h-4 w-4" />
          </button>
        </article>

        <aside className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8" aria-label="Publication quality gates">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Publication gates</div>
          <h2 className="mt-3 text-2xl font-black text-white">What must pass before indexing</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
            {[
              "Working implementation and truthful limitations",
              "Local, cloud, or hybrid processing disclosure",
              "Security review and no hard-coded secrets",
              "Keyboard and screen-reader usable controls",
              "Unique H1, title, description, examples, and supporting copy",
              "Self-canonical https://www.xfree.in route and prerendered 200 HTML",
              "Internal links and correct category/pillar placement",
              "No sitemap entry until publication approval",
            ].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><span>{item}</span></li>)}
          </ul>
        </aside>
      </section>

      <section aria-labelledby="community-automation" className="rounded-3xl border border-indigo-500/20 bg-slate-900/60 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-300"><Waypoints className="h-4 w-4" /> Safe community automation</div>
        <h2 id="community-automation" className="mt-3 text-2xl font-black text-white">Good-first-issue candidates without issue spam</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">Maintainers can run the manual <strong className="text-white">Good First Issue Candidates</strong> workflow. Its default mode only generates a deterministic candidate artifact from the roadmap. Creating GitHub issues requires an explicit workflow input, is capped to a small batch, and checks existing issue titles first.</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">Contributor recognition is tied to accepted work in Git history and release notes. XFree does not manufacture contributors, stars, testimonials, usage figures, or artificial activity.</p>
      </section>

      <section aria-labelledby="contribution-faq" className="space-y-4">
        <h2 id="contribution-faq" className="text-2xl font-black text-white">Contribution FAQ</h2>
        {[
          ["Do planned roadmap concepts get their own Google-indexable pages?", "No. Planned concepts stay on the roadmap until a real implementation and publication review exist."],
          ["Must every tool be entirely client-side?", "No. Browser-local processing is preferred when appropriate, but a cloud or hybrid tool can be accepted if the provider and data handoff are clearly disclosed and the implementation passes review."],
          ["Can a contribution add a new category or pillar?", "Yes when the taxonomy change is justified, but it should be reviewed separately from the tool implementation so canonical URLs and internal linking remain stable."],
          ["What command should I run before opening a pull request?", "Use npm run verify when dependencies are available. CI repeats typecheck, tests, tool-registry audit, build, prerender, SEO validation, and noindex checks."],
        ].map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <summary className="cursor-pointer font-semibold text-white">{q}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-300">{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
};
