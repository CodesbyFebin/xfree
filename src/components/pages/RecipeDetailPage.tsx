import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Clipboard, Cpu, ExternalLink, ShieldCheck, Workflow } from "lucide-react";
import { getShareableRecipe, type WorkflowRecipe } from "../../data/recipes";

export function RecipeDetailPage({ recipe, onNavigate }: { recipe: WorkflowRecipe; onNavigate: (path: string) => void }) {
  const [copied, setCopied] = useState(false);
  const shareJson = useMemo(() => JSON.stringify(getShareableRecipe(recipe), null, 2), [recipe]);

  const copyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(shareJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="space-y-8 text-slate-900 dark:text-slate-100">
      <button type="button" onClick={() => onNavigate("/recipes")} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
        <ArrowLeft className="h-4 w-4" /> All recipes
      </button>

      <header className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-[#12131a]">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">Local</span>
          <span className="rounded-full border border-slate-200 bg-stone-50 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-[#1a1b25] dark:text-slate-300">LLM not required</span>
          <span className="text-slate-400">{recipe.id} · v{recipe.version}</span>
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{recipe.title}</h1>
        <p className="mt-5 max-w-4xl text-base leading-8 text-slate-600 dark:text-slate-300">{recipe.directAnswer}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href={`https://app.xfree.in/?recipe=${encodeURIComponent(recipe.slug)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            Open in Agent Studio <ExternalLink className="h-4 w-4" />
          </a>
          <button type="button" onClick={() => void copyRecipe()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-700 dark:bg-[#1a1b25] dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Clipboard className="h-4 w-4" />}
            {copied ? "Recipe JSON copied" : "Copy recipe JSON"}
          </button>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#12131a]">
          <div className="mb-5 flex items-center gap-2">
            <Workflow className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-black">Execution plan</h2>
          </div>
          <ol className="space-y-3">
            {recipe.steps.map((step, index) => (
              <li key={`${recipe.id}-step-${index}`} className="flex gap-4 rounded-xl border border-slate-200 bg-stone-50 p-4 dark:border-slate-700 dark:bg-[#1a1b25]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">{index + 1}</span>
                <div className="min-w-0">
                  <div className="font-bold">{step.label}</div>
                  <div className="mt-1 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {step.kind === "engine" ? `engine:${step.engineId}` : `transform:${step.transformId}`}
                    {step.kind === "engine" && step.passthrough ? " · passthrough" : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#12131a]">
            <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Processing</div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">Mode</dt><dd className="font-bold">Local</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">LLM required</dt><dd className="font-bold">No</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">Network access</dt><dd className="font-bold">No</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500 dark:text-slate-400">Version</dt><dd className="font-mono text-xs">{recipe.version}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#12131a]">
            <div className="flex items-center gap-2 font-bold"><Cpu className="h-4 w-4 text-indigo-500" /> Safe configuration</div>
            <dl className="mt-4 space-y-2 text-xs">
              {Object.entries(recipe.safeConfiguration).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4"><dt className="font-mono text-slate-500 dark:text-slate-400">{key}</dt><dd className="font-mono">{String(value)}</dd></div>
              ))}
            </dl>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#12131a]">
          <h2 className="text-xl font-black">Example input</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-200 dark:border-slate-700"><code>{recipe.exampleInput}</code></pre>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#12131a]">
          <h2 className="text-xl font-black">Expected output shape</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{recipe.exampleOutputDescription}</p>
          <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-400">Exact output depends on your supplied input. The recipe does not fetch remote URLs or hide extra processing steps.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#12131a]">
        <h2 className="text-xl font-black">Versioned recipe JSON</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">This is the shareable representation. It contains identifiers and bounded configuration, not executable JavaScript.</p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-200 dark:border-slate-700"><code>{shareJson}</code></pre>
      </section>

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-500/20 dark:bg-indigo-500/10">
        <h2 className="text-xl font-black">Recipe FAQ</h2>
        <div className="mt-4 space-y-3">
          <details className="rounded-xl border border-indigo-100 bg-white p-4 dark:border-indigo-500/20 dark:bg-[#12131a]"><summary className="font-bold">Does this recipe upload my working input?</summary><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">No. This launch recipe is marked local and its safe configuration declares networkAccess=false. It uses XFree local engines and bounded transforms in the browser.</p></details>
          <details className="rounded-xl border border-indigo-100 bg-white p-4 dark:border-indigo-500/20 dark:bg-[#12131a]"><summary className="font-bold">Is a local LLM required?</summary><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">No. The shared starter recipes are deterministic. Optional WebGPU/WebLLM planning remains a separate Studio feature and is not required to execute this recipe.</p></details>
          <details className="rounded-xl border border-indigo-100 bg-white p-4 dark:border-indigo-500/20 dark:bg-[#12131a]"><summary className="font-bold">Can a shared recipe run arbitrary code?</summary><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">No. Studio reconstructs the versioned plan from engine and transform identifiers and rejects identifiers that are not present in the local allowlist.</p></details>
        </div>
      </section>
    </article>
  );
}
