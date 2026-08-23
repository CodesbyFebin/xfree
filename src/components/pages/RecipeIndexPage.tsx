import React from "react";
import { ArrowRight, Braces, CheckCircle2, GitBranch, LockKeyhole, Workflow } from "lucide-react";
import { RECIPES } from "../../data/recipes";

export function RecipeIndexPage({ onSelectRecipe }: { onSelectRecipe: (slug: string) => void }) {
  return (
    <div className="space-y-10">
      <header className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 shadow-2xl sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
          <LockKeyhole className="h-3.5 w-3.5" /> Reproducible local workflows
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">XFree Workflow Recipes</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Run inspectable workflows composed only from repository-owned, allowlisted local engines and a closed set of safe transforms. Recipes are versioned data, not executable JavaScript, so sharing a recipe does not grant code execution.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-2xl font-black text-white">{RECIPES.length}</p><p className="mt-1 text-xs text-slate-400">launch recipes</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-2xl font-black text-emerald-400">Local</p><p className="mt-1 text-xs text-slate-400">processing mode for every v1 recipe</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-2xl font-black text-indigo-300">0</p><p className="mt-1 text-xs text-slate-400">LLM calls required</p></div>
        </div>
      </header>

      <section aria-labelledby="recipe-list-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-300">Try it → inspect it → reproduce it</p>
            <h2 id="recipe-list-heading" className="mt-2 text-2xl font-black text-white sm:text-3xl">Eight practical starter workflows</h2>
          </div>
          <a href="https://github.com/CodesbyFebin/xfree" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200">Inspect source <GitBranch className="h-4 w-4" /></a>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {RECIPES.map((recipe) => (
            <a
              key={recipe.slug}
              href={`/recipes/${recipe.slug}`}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
                event.preventDefault();
                onSelectRecipe(recipe.slug);
              }}
              className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300"><Workflow className="h-5 w-5" /></span>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">Local</span>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-slate-400">v{recipe.version}</span>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-white group-hover:text-indigo-300">{recipe.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{recipe.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {recipe.steps.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-400">
                    {item.kind === "engine" ? <Braces className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {item.engineId || item.transformId}
                  </span>
                ))}
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-indigo-300">Open recipe <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
