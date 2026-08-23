import React from "react";
import { ArrowRight, Braces, CheckCircle2, Cpu, Workflow } from "lucide-react";
import { WORKFLOW_RECIPES } from "../../data/recipes";

export function RecipesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="space-y-10 text-slate-900 dark:text-slate-100">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-[#12131a]">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Workflow className="h-3.5 w-3.5" /> Versioned local workflows
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Local browser workflow recipes</h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            Run reproducible developer workflows in XFree Agent Studio without signup. Every recipe exposes its input, ordered execution plan, allowlisted engine or bounded transform IDs, processing mode, and version before you run it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Local execution</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-stone-50 px-3 py-1.5 text-slate-600 dark:border-slate-700 dark:bg-[#1a1b25] dark:text-slate-300"><Cpu className="h-3.5 w-3.5" /> LLM not required</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-stone-50 px-3 py-1.5 text-slate-600 dark:border-slate-700 dark:bg-[#1a1b25] dark:text-slate-300"><Braces className="h-3.5 w-3.5" /> Declarative JSON sharing</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="recipe-directory-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="recipe-directory-heading" className="text-2xl font-black">Eight reproducible starter recipes</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Inspect the exact plan before opening it in Studio.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{WORKFLOW_RECIPES.length} recipes</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {WORKFLOW_RECIPES.map((recipe) => (
            <article key={recipe.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-[#12131a] dark:hover:border-indigo-500/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">{recipe.id} · v{recipe.version}</div>
                  <h3 className="mt-2 text-lg font-black">{recipe.title}</h3>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">LOCAL</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{recipe.shortDescription}</p>
              <ol className="mt-5 flex flex-wrap gap-2" aria-label={`${recipe.title} execution steps`}>
                {recipe.steps.map((step, index) => (
                  <li key={`${recipe.id}-${index}`} className="rounded-lg border border-slate-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-[#1a1b25] dark:text-slate-300">
                    {index + 1}. {step.label}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => onNavigate(`/recipes/${recipe.slug}`)}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Inspect recipe <ArrowRight className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-stone-50 p-6 dark:border-slate-800 dark:bg-[#101118]">
        <h2 className="text-xl font-black">Why recipes are declarative</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Shared recipes contain versioned identifiers, engine IDs, named transforms, and bounded configuration only. They do not contain arbitrary JavaScript, remote scripts, shell commands, or hidden network calls. Studio reconstructs the plan and validates every step against its local allowlist before execution.
        </p>
      </section>
    </div>
  );
}
