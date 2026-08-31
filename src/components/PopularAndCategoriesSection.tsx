import React from "react";
import {
  ArrowLeftRight, ArrowRight, BookOpen, CheckCircle2, Code2, FileText, Globe,
  Image as ImageIcon, Layers3, Lock, SearchCheck, ShieldCheck, Smartphone, Sparkles,
  Workflow, Zap,
} from "lucide-react";
import { PUBLIC_TOOLS } from "../data/publicTools";

interface PopularAndCategoriesProps {
  onSelectTool: (slug: string) => void;
  onSelectCategory: (catId: string) => void;
}

const categories = [
  { id: "seo-tools", title: "SEO Tools", description: "Sitemaps, metadata, schema, robots and crawl-preparation utilities.", icon: Globe, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  { id: "developer-tools", title: "Developer Tools", description: "Formatting, validation, encoding and debugging utilities for daily development.", icon: Code2, tone: "text-indigo-700 bg-indigo-50 border-indigo-100" },
  { id: "text-tools", title: "Text Tools", description: "Transform, normalize, inspect, compare and clean text directly in your browser.", icon: FileText, tone: "text-violet-700 bg-violet-50 border-violet-100" },
  { id: "converters", title: "Data Converters", description: "Convert common structured and text formats with visible local-processing behavior.", icon: ArrowLeftRight, tone: "text-blue-700 bg-blue-50 border-blue-100" },
  { id: "image-tools", title: "Image Tools", description: "Browser-side image and media helpers where the published implementation supports them.", icon: ImageIcon, tone: "text-rose-700 bg-rose-50 border-rose-100" },
  { id: "ai-tools", title: "AI Tools", description: "Clearly disclosed AI-assisted utilities separated from the Local Mode tool layer.", icon: Sparkles, tone: "text-purple-700 bg-purple-50 border-purple-100" },
] as const;

const features = [
  { title: "Local Mode by default", description: "Published local utilities process their working input in the browser instead of posting it to an XFree processing endpoint.", icon: ShieldCheck, tone: "text-emerald-700 bg-emerald-50" },
  { title: "Agent Studio workflows", description: "Use the Studio command surface to plan bounded workflows across approved local engines with visible execution steps.", icon: Workflow, tone: "text-indigo-700 bg-indigo-50" },
  { title: "Installable PWA", description: "Studio includes a progressive web app shell for cached same-origin assets and supported offline workflows after they have been loaded.", icon: Smartphone, tone: "text-cyan-700 bg-cyan-50" },
  { title: "Fast focused utilities", description: "Each published tool solves one concrete task instead of forcing users through a general-purpose dashboard first.", icon: Zap, tone: "text-amber-700 bg-amber-50" },
  { title: "Open-source review", description: "The public repository exposes implementation, publication gates and security changes for community inspection and contribution.", icon: Code2, tone: "text-violet-700 bg-violet-50" },
  { title: "Governed publishing", description: "Tool routes enter the sitemap only after implementation, content, canonical, AdSense and indexability validation pass.", icon: CheckCircle2, tone: "text-blue-700 bg-blue-50" },
] as const;

export const PopularAndCategoriesSection: React.FC<PopularAndCategoriesProps> = ({ onSelectCategory }) => {
  const visibleCategories = categories.filter((category) => PUBLIC_TOOLS.some((tool) => tool.category === category.id));

  return (
    <div className="space-y-20 py-8">
      <section className="space-y-8" aria-labelledby="tool-categories-heading">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Tool directory</p>
          <h2 id="tool-categories-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Find the right utility by workflow</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">Browse only categories that currently contain published tools; empty roadmap categories stay out of the public directory.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCategories.map((category) => {
            const Icon = category.icon;
            const count = PUBLIC_TOOLS.filter((tool) => tool.category === category.id).length;
            return (
              <a
                key={category.id}
                href={`/${category.id}`}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
                  event.preventDefault();
                  onSelectCategory(category.id);
                }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${category.tone}`}><Icon className="h-5 w-5" /></span>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{count} published</span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-slate-950 group-hover:text-indigo-600">{category.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-indigo-600">Browse category <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </a>
            );
          })}
        </div>
      </section>

      <section id="features" className="rounded-[2rem] border border-slate-200 bg-stone-50 p-6 sm:p-10" aria-labelledby="features-heading">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Why XFree</p>
          <h2 id="features-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">A browser utility platform built around verifiable behavior</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">The design is simple on the surface, but publication, privacy and workflow behavior remain explicit underneath.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-extrabold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="space-y-10" aria-labelledby="how-it-works-heading">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">How it works</p>
          <h2 id="how-it-works-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">From input to result in four visible steps</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">No account setup is required. Choose a published tool directly or use Studio to chain approved local engines.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["1", "Choose a tool", "Open a published route or select an approved local engine in Studio."],
            ["2", "Add working input", "Paste text or select a supported local file/folder with explicit browser permission."],
            ["3", "Run visibly", "Local tools process in-browser; optional cloud modes are labeled before network transmission."],
            ["4", "Review and export", "Copy, download or chain the result into the next approved step when the workflow supports it."],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white">{number}</span>
              <h3 className="mt-4 font-extrabold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="use-cases" className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-10" aria-labelledby="use-cases-heading">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Use cases</p>
          <h2 id="use-cases-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Built for practical developer and web workflows</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            { title: "Developers & API work", text: "Format JSON, transform text, inspect tokens, encode payloads and prepare structured data without changing tools or accounts.", icon: Code2 },
            { title: "Technical SEO", text: "Prepare metadata, sitemaps, robots directives, URLs and schema inputs with separate reviewed guides and crawl-aware pages.", icon: SearchCheck },
            { title: "Content & data cleanup", text: "Normalize lines, convert cases, count words, deduplicate lists and move between common text/data representations.", icon: Layers3 },
          ].map((useCase) => {
            const Icon = useCase.icon;
            return (
              <article key={useCase.title} className="rounded-2xl border border-white bg-white/90 p-6 shadow-sm">
                <Icon className="h-6 w-6 text-indigo-600" />
                <h3 className="mt-4 text-lg font-extrabold text-slate-950">{useCase.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{useCase.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-center text-white shadow-xl sm:p-12">
        <BookOpen className="mx-auto h-7 w-7 text-white/80" />
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Use a focused tool, or chain approved local engines in Studio</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">The public directory stays simple and crawlable; Studio adds command-driven workflows without changing the underlying execution disclosures.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => onSelectCategory("all")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg">Browse all tools <ArrowRight className="h-4 w-4" /></button>
          <a href="https://app.xfree.in/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur">Open Studio <Workflow className="h-4 w-4" /></a>
        </div>
      </section>
    </div>
  );
};
