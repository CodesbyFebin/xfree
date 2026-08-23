import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Clipboard, Code2, ExternalLink, FileJson2, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";
import type { RecipeDefinition } from "../../data/recipes";
import { recipeSharePayload } from "../../data/recipes";

export function RecipeDetailPage({ recipe, onBack }: { recipe: RecipeDefinition; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const payload = useMemo(() => JSON.stringify(recipeSharePayload(recipe), null, 2), [recipe]);
  const studioUrl = `https://app.xfree.in/?recipe=${encodeURIComponent(recipe.slug)}`;

  return (
    <article className="space-y-8">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" />All recipes</button>

      <header className="rounded-[2rem] border border-slate-800 bg-slate-950/85 p-6 shadow-2xl sm:p-10">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">Local Mode</span>
          <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-300">No LLM required</span>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-400">v{recipe.version}</span>
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">{recipe.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{recipe.description}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={studioUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500">
            <Workflow className="h-4 w-4" /> Open in Agent Studio <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(`${window.location.origin}/recipes/${recipe.slug}`);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-600"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}{copied ? "Link copied" : "Copy recipe link"}
          </button>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]" aria-labelledby="execution-plan-heading">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="flex items-center gap-2"><Workflow className="h-5 w-5 text-indigo-300" /><h2 id="execution-plan-heading" className="text-xl font-black text-white">Execution plan</h2></div>
          <p className="mt-2 text-sm leading-6 text-slate-400">Every step resolves to an allowlisted production engine or a closed built-in transform. Shared recipe JSON never contains executable code.</p>
          <ol className="mt-5 space-y-3">
            {recipe.steps.map((item, index) => (
              <li key={item.id} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-black text-indigo-300">{index + 1}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-100">{item.label}</p>
                  <code className="mt-1 block break-all text-[11px] text-slate-500">{item.kind === "engine" ? `engine:${item.engineId}` : `transform:${item.transformId}`}</code>
                  {item.config?.mapLines ? <p className="mt-1 text-[11px] text-slate-500">Safe config: run independently for each non-empty line.</p> : null}
                  {item.config?.prependLine ? <p className="mt-1 text-[11px] text-slate-500">Safe config: fixed repository query “{item.config.prependLine}”.</p> : null}
                  {item.passthrough ? <p className="mt-1 text-[11px] text-slate-500">Passthrough metric: result is recorded without replacing the pipeline payload.</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-2 text-emerald-300"><LockKeyhole className="h-5 w-5" /><h2 className="font-black">Processing contract</h2></div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              <li>• Mode: local browser execution.</li>
              <li>• LLM required: no.</li>
              <li>• Arbitrary JavaScript in recipe: rejected by design.</li>
              <li>• Maximum v1 steps: six.</li>
            </ul>
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="font-black text-white">Limits and review notes</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">{recipe.notes.map((note) => <li key={note}>• {note}</li>)}</ul>
          </section>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2" aria-labelledby="recipe-example-heading">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <h2 id="recipe-example-heading" className="text-xl font-black text-white">Sample input</h2>
          <p className="mt-2 text-sm text-slate-400"><strong className="text-slate-300">{recipe.inputLabel}.</strong> {recipe.inputHint}</p>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-300">{recipe.sampleInput}</pre>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
          <div className="flex items-center gap-2"><FileJson2 className="h-5 w-5 text-indigo-300" /><h2 className="text-xl font-black text-white">Versioned share payload</h2></div>
          <p className="mt-2 text-sm leading-6 text-slate-400">This is the compact auditable shape that can be copied, reviewed, diffed and eventually imported. It contains engine identifiers and closed configuration only.</p>
          <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-[11px] leading-5 text-slate-400">{payload}</pre>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-indigo-300"><ShieldCheck className="h-5 w-5" /><h2 className="text-xl font-black">Why recipes are data instead of scripts</h2></div>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">A public workflow ecosystem becomes dangerous if a shared link can execute arbitrary code. XFree recipes therefore point only to engines already compiled into the application and transforms implemented in the reviewed runner. The runner validates step count, engine IDs, transform IDs and configuration keys before execution. A recipe can orchestrate approved behavior; it cannot expand the application's execution authority.</p>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <div className="flex items-center gap-2 text-sm text-slate-400"><Code2 className="h-4 w-4" /><span>{recipe.id} · version {recipe.version}</span></div>
        <a href="https://github.com/CodesbyFebin/xfree" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">Inspect implementation on GitHub →</a>
      </footer>
    </article>
  );
}
