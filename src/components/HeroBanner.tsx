import React, { useEffect } from "react";
import { ArrowRight, CheckCircle2, Lock, Search, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { ToolCategory } from "../types";
import { ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: ToolCategory | "all";
  onCategoryChange: (cat: ToolCategory | "all") => void;
  totalTools: number;
  onExploreFreeTools?: () => void;
  onBrowseAiTools?: () => void;
  onOpenStudio?: () => void;
}

const POPULAR_TOOLS = [
  ["JSON Formatter", "/tools/json-formatter"],
  ["Regex Tester", "/tools/regex-tester"],
  ["XML Sitemap", "/tools/xml-sitemap-generator"],
  ["Meta Tags", "/tools/meta-tag-generator"],
  ["Base64", "/tools/base64-encoder-decoder"],
  ["Cron", "/tools/cron-expression-generator"],
] as const;

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  totalTools,
  onExploreFreeTools,
  onOpenStudio,
}) => {
  useEffect(() => {
    document.body.classList.add("xfree-home-dark");
    return () => document.body.classList.remove("xfree-home-dark");
  }, []);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-indigo-500/10 bg-[#07070e] shadow-2xl shadow-black/30" aria-labelledby="home-hero-heading">
      <div className="relative px-5 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 8%, rgba(99,102,241,.18), transparent 28%), radial-gradient(circle at 88% 28%, rgba(168,85,247,.12), transparent 30%), linear-gradient(rgba(99,102,241,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.025) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 60px 60px, 60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.75)]" aria-hidden="true" />
            {totalTools} published tools · Local Mode by default · No signup
          </div>

          <h1 id="home-hero-heading" className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
            Free Developer, SEO <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-violet-400 bg-clip-text text-transparent">&amp; AI Tools</span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-lg font-semibold text-slate-300 sm:text-xl">Get X done for free — fast, focused, and no account required.</p>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-8 text-slate-500 sm:text-lg">
            Run focused developer utilities, technical SEO helpers, validators, converters and workflow tools from one browser workspace. Published Local Mode tools process working input in-browser; optional cloud features are clearly labeled before transmission.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://app.xfree.in/"
              onClick={(event) => {
                if (!onOpenStudio) return;
                event.preventDefault();
                onOpenStudio();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 sm:w-auto"
            >
              Open XFree Studio
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={onExploreFreeTools}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-white/5 px-7 py-3.5 text-sm font-bold text-slate-200 backdrop-blur transition hover:border-indigo-400/40 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 sm:w-auto"
            >
              Browse published tools
              <Sparkles className="h-4 w-4 text-indigo-300" />
            </button>
          </div>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f17]/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Local-first execution
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Published tools disclose their execution mode and keep Local Mode processing in the browser.</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f17]/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Workflow className="h-4 w-4 text-indigo-300" />
                Tool chaining in Studio
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Studio can route requests across approved local engines with visible workflow steps.</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-[#0f0f17]/80 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Lock className="h-4 w-4 text-violet-300" />
                No account required
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Open published utilities directly without creating an XFree account or profile.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-slate-800/70 bg-[#0a0a12]/75 px-5 py-6 sm:px-10">
        <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-5 md:grid-cols-4">
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Published tools</dt>
            <dd className="mt-1 text-3xl font-black text-indigo-300">{totalTools}</dd>
          </div>
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Signup</dt>
            <dd className="mt-1 text-3xl font-black text-indigo-300">None</dd>
          </div>
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Roadmap concepts</dt>
            <dd className="mt-1 text-3xl font-black text-indigo-300">{ROADMAP_CONCEPT_COUNT.toLocaleString()}</dd>
          </div>
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Indexing policy</dt>
            <dd className="mt-1 flex items-center justify-center gap-1 text-lg font-black text-emerald-400"><CheckCircle2 className="h-5 w-5" /> Verified</dd>
          </div>
        </dl>
      </div>

      <div className="px-5 py-7 sm:px-10">
        <div className="relative mx-auto max-w-4xl rounded-2xl border border-slate-700/60 bg-[#0f0f17]/80 shadow-xl shadow-black/20 transition focus-within:border-indigo-400/50 focus-within:ring-4 focus-within:ring-indigo-500/10">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search published tools — JSON, Base64, regex, sitemap, text..."
            className="h-14 w-full rounded-2xl bg-transparent pl-12 pr-24 text-base text-slate-100 outline-none placeholder:text-slate-600"
            aria-label="Search published XFree tools"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-[#171722] px-2.5 py-1 text-xs font-semibold text-slate-500">
            {totalTools} tools
          </span>
        </div>
        <nav className="mx-auto mt-3 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs" aria-label="Popular published tools">
          <span className="font-semibold text-slate-600">Popular:</span>
          {POPULAR_TOOLS.map(([label, href]) => (
            <a key={href} href={href} className="font-semibold text-indigo-400/80 transition hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
};
