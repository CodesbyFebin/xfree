import { RECIPES } from "./recipes";

const BASE_STATIC_ROUTES = [
  "/",
  "/how-it-works",
  "/use-cases",
  "/docs",
  "/blog",
  "/faq",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/security",
  "/xfree-app",
  "/studio",
  "/instaserver",
  "/guides",
  "/recipes",
  "/pillars",
  "/roadmap",
  "/contribute",
] as const;

export const STATIC_ROUTES = [
  ...BASE_STATIC_ROUTES,
  ...RECIPES.map((recipe) => `/recipes/${recipe.slug}`),
] as const;

export const SOLVE_ROUTES = [
  "/solve/:problem",
  "/solve/:problem/*",
] as const;

export const CATEGORY_SLUGS = [
  "seo-tools",
  "developer-tools",
  "ai-tools",
  "text-tools",
  "converters",
  "generators",
  "validators",
] as const;

export type StaticRoute = (typeof STATIC_ROUTES)[number];
export type SolveRoute = (typeof SOLVE_ROUTES)[number];

export function isStaticRoute(pathname: string): boolean {
  return (STATIC_ROUTES as readonly string[]).includes(pathname);
}

export function categorySlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/category\/([^/]+)\/?$/);
  if (!m) return null;
  return (CATEGORY_SLUGS as readonly string[]).includes(m[1]) ? m[1] : null;
}

export function solveProblemFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/solve\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function toolSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/tools\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

export function guideSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/guides\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

export function recipeSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/recipes\/([^/]+)\/?$/);
  return m ? m[1] : null;
}

export function pillarSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/pillar\/([^/]+)\/?$/);
  return m ? m[1] : null;
}
