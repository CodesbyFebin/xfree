export const STATIC_ROUTES = [
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
  "/clusters",
  "/thinking",
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

export function isStaticRoute(pathname: string): boolean {
  return (STATIC_ROUTES as readonly string[]).includes(pathname);
}

export function categorySlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/category\/([^/]+)\/?$/);
  if (!m) return null;
  return (CATEGORY_SLUGS as readonly string[]).includes(m[1]) ? m[1] : null;
}

export function toolSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/tools\/([^/]+)\/?$/);
  return m ? m[1] : null;
}
