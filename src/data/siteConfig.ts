/**
 * Search-facing site identity.
 *
 * Keep this canonical origin fixed. Preview/development hosts must never leak
 * into canonical tags, sitemaps, structured data, feeds, or internal SEO URLs.
 */
export const CANONICAL_ORIGIN = "https://www.xfree.in";
export const APP_ORIGIN = "https://app.xfree.in";
export const SITE_NAME = "XFree.in";

/**
 * Update only when shared site-level content changes. Individual tools/guides
 * use their own reviewed/modified dates when available.
 */
export const SITE_CONTENT_LASTMOD = "2026-08-23";

export function canonicalUrl(pathname = "/"): string {
  const path = pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `${CANONICAL_ORIGIN}${path}`;
}
