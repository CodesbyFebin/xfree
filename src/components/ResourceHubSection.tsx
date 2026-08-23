import React from "react";
import { ArrowRight, BookOpen, CircleHelp, FileText, Layers3, Workflow } from "lucide-react";
import { GUIDES } from "../data/guides";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { RECIPES } from "../data/recipes";
import { RouterLink } from "./RouterLink";

interface ResourceHubSectionProps {
  onNavigate: (path: string) => void;
}

interface ResourceEntry {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  icon: typeof Workflow;
  fullReload?: boolean;
}

const resources: ResourceEntry[] = [
  { href: "/recipes", eyebrow: "Reproducible workflows", title: "Workflow Recipes", description: "Inspect versioned Local Mode workflows step by step, then open the exact recipe in Agent Studio.", detail: `${RECIPES.length} reviewed launch recipes; v1 recipes require no LLM.`, icon: Workflow, fullReload: true },
  { href: "/how-it-works", eyebrow: "Architecture", title: "How It Works", description: "Follow the path from choosing a verified tool to processing, reviewing and exporting the result.", detail: "See where browser JavaScript, Web Workers and current limits apply.", icon: Workflow },
  { href: "/use-cases", eyebrow: "Practical workflows", title: "Use Cases & Examples", description: "See developer, SEO and data-cleanup workflows built only from tools users can open now.", detail: "Examples link to published production routes.", icon: Layers3 },
  { href: "/docs", eyebrow: "Reference", title: "Documentation Hub", description: "Find inputs, outputs, worked examples, limitations, privacy notes and deeper references.", detail: `${PUBLIC_TOOLS.length} published tools in the verified public directory.`, icon: BookOpen },
  { href: "/guides", eyebrow: "Editorial", title: "Reviewed Guides", description: "Read evergreen explanations linked back to real tools and production behavior.", detail: `${GUIDES.length} reviewed guides currently published.`, icon: FileText },
  { href: "/faq", eyebrow: "Help", title: "FAQ & Guidance", description: "Get clear answers about Local Mode, optional cloud features, browser limits and choosing the right utility.", detail: "Claims are scoped to actual processing mode.", icon: CircleHelp },
];

export function ResourceHubSection({ onNavigate }: ResourceHubSectionProps) {
  return (
    <section aria-labelledby="resource-hub-title" className="space-y-8">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Learn before you run</p>
        <h2 id="resource-hub-title" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Documentation built around real tool behavior</h2>
        <p className="mt-3 text-base leading-7 text-slate-600">Understand what a tool or recipe accepts, how it processes input, what its output means and which limitations to check before using the result in production.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource, index) => {
          const Icon = resource.icon;
          const linkClass = "inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700";
          return (
            <article key={resource.href} className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg ${index === 0 ? "md:col-span-2 lg:col-span-1" : ""}`}>
              <div className="flex h-full flex-col justify-between gap-7">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600">{resource.eyebrow}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></span>
                  </div>
                  <h3 className="mt-4 text-xl font-extrabold text-slate-950">{resource.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{resource.detail}</p>
                </div>
                {resource.fullReload ? (
                  <a href={resource.href} className={linkClass}>
                    Explore {resource.title}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </a>
                ) : (
                  <RouterLink href={resource.href} onNavigate={onNavigate} className={linkClass}>
                    Explore {resource.title}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </RouterLink>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
