import React, { useEffect } from "react";
import { BookOpen, Github, Workflow } from "lucide-react";
import { CANONICAL_ORIGIN } from "../data/siteConfig";
import { getRecipeBySlug, RECIPES } from "../data/recipes";
import { recipeSlugFromPath } from "../data/routes";
import { RecipeIndexPage } from "./pages/RecipeIndexPage";
import { RecipeDetailPage } from "./pages/RecipeDetailPage";

function setMeta(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(href: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

export function RecipeApp() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const slug = recipeSlugFromPath(pathname);
  const recipe = slug ? getRecipeBySlug(slug) : undefined;
  const isIndex = pathname === "/recipes";

  useEffect(() => {
    const title = recipe ? `${recipe.title} — XFree Workflow Recipe` : "XFree Workflow Recipes — Reproducible Local Browser Workflows";
    const description = recipe
      ? recipe.summary
      : `Run ${RECIPES.length} versioned XFree workflows locally in your browser. Inspect every allowlisted engine step, reproduce results, and open recipes directly in Agent Studio.`;
    const canonical = recipe ? `${CANONICAL_ORIGIN}/recipes/${recipe.slug}` : `${CANONICAL_ORIGIN}/recipes`;
    document.title = title;
    setMeta("description", description);
    setMeta("robots", recipe || isIndex ? "index,follow" : "noindex,follow");
    setCanonical(canonical);
  }, [isIndex, recipe]);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    window.location.assign(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0b0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-3" aria-label="XFree homepage">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-black text-white shadow-lg shadow-indigo-500/20">X</span>
            <span><strong className="block text-sm text-white">XFree Recipes</strong><small className="text-[10px] text-slate-500">Inspect · reproduce · share</small></span>
          </a>
          <nav className="flex items-center gap-2 text-xs font-semibold" aria-label="Recipe navigation">
            <a href="/recipes" className="hidden rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white sm:inline-flex"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Recipes</a>
            <a href="https://app.xfree.in/" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-500"><Workflow className="h-3.5 w-3.5" />Studio</a>
            <a href="https://github.com/CodesbyFebin/xfree" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-2 text-slate-300 hover:border-slate-700"><Github className="h-3.5 w-3.5" /><span className="hidden sm:inline">GitHub</span></a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {isIndex ? <RecipeIndexPage onSelectRecipe={(nextSlug) => navigate(`/recipes/${nextSlug}`)} /> : recipe ? <RecipeDetailPage recipe={recipe} onBack={() => navigate("/recipes")} /> : (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <h1 className="text-3xl font-black text-white">Recipe not found</h1>
            <p className="mt-3 text-slate-400">This URL does not map to a published XFree workflow recipe.</p>
            <a href="/recipes" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Browse recipes</a>
          </section>
        )}
      </main>
    </div>
  );
}
