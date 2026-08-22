import React from "react";
import { ArrowRight, BookOpen, CircleHelp, FileText, Layers3, Workflow } from "lucide-react";
import { GUIDES } from "../data/guides";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { RouterLink } from "./RouterLink";

interface ResourceHubSectionProps {
  onNavigate: (path: string) => void;
}

const resources = [
  {
    href: "/how-it-works",
    eyebrow: "Architecture",
    title: "How It Works",
    description: "Follow the complete path from selecting a verified tool to browser processing, result review, export, and optional Studio handoff.",
    detail: "Understand which operations run as browser JavaScript, which use Web Workers, and where current limits apply.",
    icon: Workflow,
    className: "md:col-span-2",
  },
  {
    href: "/use-cases",
    eyebrow: "Practical workflows",
    title: "Use Cases & Examples",
    description: "See real workflows for technical SEO, API payload debugging, scheduled jobs, metadata review, and safe text transformation.",
    detail: "Each workflow links only to published tools that users can open now.",
    icon: Layers3,
    className: "",
  },
  {
    href: "/docs",
    eyebrow: "Reference",
    title: "Documentation Hub",
    description: "Find input formats, output behavior, worked examples, constraints, privacy notes, and links to deeper technical guides.",
    detail: `${PUBLIC_TOOLS.length} published tool${PUBLIC_TOOLS.length === 1 ? "" : "s"} in the verified public directory.`,
    icon: BookOpen,
    className: "",
  },
  {
    href: "/blog",
    eyebrow: "Editorial",
    title: "Blog & Pillars",
    description: "Browse reviewed evergreen guides now and follow future pillar articles only after each receives a permanent URL and unique metadata.",
    detail: `${GUIDES.length} reviewed guide${GUIDES.length === 1 ? "" : "s"} currently published.`,
    icon: FileText,
    className: "",
  },
  {
    href: "/faq",
    eyebrow: "Help",
    title: "FAQ & Guidance",
    description: "Get clear answers about Local Mode, cloud features, browser limits, accounts, sensitive data, and choosing the right utility.",
    detail: "Claims are scoped to the actual processing mode of each feature.",
    icon: CircleHelp,
    className: "md:col-span-2",
  },
] as const;

export function ResourceHubSection({ onNavigate }: ResourceHubSectionProps) {
  return (
    <section aria-labelledby="resource-hub-title" className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">Learn before you run</p>
        <h2 id="resource-hub-title" className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Documentation built around real tool behavior
        </h2>
        <p className="text-sm leading-7 text-slate-300 sm:text-base">
          XFree combines focused utilities with practical reference material. Learn what a tool accepts, how it processes data,
          what its output means, and which limitations to check before using the result in production.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <article key={resource.href} className={`${resource.className} group rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition-colors hover:border-emerald-500/40`}>
              <div className="flex h-full flex-col justify-between gap-7">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{resource.eyebrow}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-emerald-400">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">{resource.title}</h3>
                    <p className="text-sm leading-6 text-slate-300">{resource.description}</p>
                    <p className="text-xs leading-5 text-slate-500">{resource.detail}</p>
                  </div>
                </div>
                <RouterLink
                  href={resource.href}
                  onNavigate={onNavigate}
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Explore {resource.title}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </RouterLink>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
