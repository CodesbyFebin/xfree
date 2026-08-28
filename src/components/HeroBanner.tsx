import React, { useEffect } from "react";
import { ArrowRight, CheckCircle2, Lock, Search, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { ToolCategory } from "../types";
import { GUIDES } from "../data/guides";
import { LOCAL_ENGINES } from "../lib/studio/engines";

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
    document.body.classList.add("xfree-home-light");
    return () => document.body.classList.remove("xfree-home-light");
  }, []);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm" aria-labelledby="home-hero-heading">
      <div className="relative px-5 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 72% 52% at 50% -12%, rgba(99,102,241,.17), transparent), linear-gradient(rgba(99,102,241,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.045) 1px, transparent 1px)",
            backgroundSize: "auto, 40px 40px, 40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {totalTools} published tools · Local Mode by default · No signup
          </div>

          <h1 id="home-hero-heading" className="text-4xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
            Free developer tools that <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 bg-clip-text text-transparent">run in your browser</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            XFree brings focused developer utilities, data converters, technical SEO helpers, validators and workflow tools into one fast workspace. Published Local Mode tools process working input in your browser; optional cloud features are labeled before transmission.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://app.xfree.in/"
              onClick={(event) => {
                if (!onOpenStudio) return;
                event.preventDefault();
                onOpenStudio();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 sm:w-auto"
            >
              Open XFree Studio
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#published-tools"
              onClick={(event) => {
                if (!onExploreFreeTools) return;
                event.preventDefault();
                onExploreFreeTools();
                document.getElementById("published-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:w-auto"
            >
              Browse published tools
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </a>
          </div>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Local-first execution
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Public tools disclose their execution mode and keep Local Mode processing in the browser.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Workflow className="h-4 w-4 text-indigo-600" />
                Tool chaining in Studio
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">The Studio command surface can route requests across approved local engines and visible workflow steps.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Lock className="h-4 w-4 text-violet-600" />
                No account required
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Open published utilities directly without creating an XFree account or profile.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-slate-200 bg-stone-50 px-5 py-6 sm:px-10">
        <dl className="mx-auto grid max-w-5xl grid-cols-2 gap-5 md:grid-cols-4">
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Published tools</dt>
            <dd className="mt-1 text-3xl font-black text-indigo-600">{totalTools}</dd>
          </div>
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Signup</dt>
            <dd className="mt-1 text-3xl font-black text-indigo-600">None</dd>
          </div>
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Studio engines</dt>
            <dd className="mt-1 text-3xl font-black text-indigo-600">{LOCAL_ENGINES.length}</dd>
          </div>
          <div className="text-center">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reviewed guides</dt>
            <dd className="mt-1 flex items-center justify-center gap-1 text-3xl font-black text-indigo-600"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> {GUIDES.length}</dd>
          </div>
        </dl>
      </div>

      <div className="px-5 py-6 sm:px-10">
        <div className="relative mx-auto max-w-4xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search published tools — JSON, Base64, regex, sitemap, text..."
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-24 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            aria-label="Search published XFree tools"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {totalTools} tools
          </span>
        </div>
        <nav className="mx-auto mt-3 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs" aria-label="Popular published tools">
          <span className="font-semibold text-slate-400">Popular:</span>
          {POPULAR_TOOLS.map(([label, href]) => (
            <a key={href} href={href} className="font-semibold text-indigo-600 transition hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
};
