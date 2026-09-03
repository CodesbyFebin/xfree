import type { Request, Response, NextFunction } from "express";

const APEX_HOST = "xfree.in";
const WWW_HOST = "www.xfree.in";
const APP_HOST = "app.xfree.in";
const STUDIO_HOST = "studio.xfree.in";

const STUDIO_PATHS = new Set(["/studio", "/studio/"]);

/**
 * Canonical domain contract (Section 5 of the XFree blueprint).
 *
 *   https://xfree.in/path          -> 308 https://www.xfree.in/path
 *   https://www.xfree.in/studio    -> 308 https://app.xfree.in/
 *   https://app.xfree.in/studio    -> 308 https://app.xfree.in/
 *   https://studio.xfree.in        -> 308 https://app.xfree.in/
 *
 * Single-hop only. Direct requests to /_app-shell are noindex,nofollow and
 * never cached. The X-Robots-Tag is set on the response so SSR and static
 * assets are equally protected.
 */
export function canonicalDomainMiddleware(req: Request, res: Response, next: NextFunction): void {
  const hostHeader = (req.headers.host || "").toLowerCase().split(":")[0];
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ||
    (req.secure ? "https" : "http");
  const pathname = req.path;

  if (hostHeader === APEX_HOST) {
    const target = `https://${WWW_HOST}${req.originalUrl}`;
    res.redirect(308, target);
    return;
  }

  if ((hostHeader === WWW_HOST || hostHeader === APP_HOST) && STUDIO_PATHS.has(pathname)) {
    const target = `https://${APP_HOST}/`;
    res.redirect(308, target);
    return;
  }

  if (hostHeader === STUDIO_HOST) {
    const target = `https://${APP_HOST}/`;
    res.redirect(308, target);
    return;
  }

  // Internal shell: never index, never cache, never expose in sitemaps.
  if (pathname === "/_app-shell" || pathname.startsWith("/_app-shell/")) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Cache-Control", "no-store, max-age=0");
  }

  // Normalize force-https for all www/app/studio traffic behind the proxy.
  if (proto !== "https" && process.env.NODE_ENV === "production") {
    const target = `https://${hostHeader}${req.originalUrl}`;
    res.redirect(308, target);
    return;
  }

  next();
}
