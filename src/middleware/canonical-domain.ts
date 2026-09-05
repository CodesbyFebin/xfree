import type { Request, Response, NextFunction } from "express";

const APEX_DOMAIN = "xfree.in";
const WWW_DOMAIN = "www.xfree.in";
const STUDIO_DOMAIN = "app.xfree.in";

export function canonicalDomainMiddleware(req: Request, res: Response, next: NextFunction) {
  const host = req.headers.host?.split(":")[0]?.toLowerCase();
  const path = req.path;

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return next();
  }

  // /studio (and anything under it) on www.xfree.in → app.xfree.in
  if (host === WWW_DOMAIN || host === APEX_DOMAIN) {
    if (path === "/studio" || path.startsWith("/studio/")) {
      const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      const newPath = path === "/studio" ? "" : path.slice("/studio".length);
      const destination = `https://${STUDIO_DOMAIN}/${newPath.replace(/^\//, "")}${queryString}`;
      return res.redirect(301, destination);
    }
  }

  // Apex -> www redirect (preserves path and query string)
  if (host === APEX_DOMAIN) {
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    const destination = `https://${WWW_DOMAIN}${path}${queryString}`;
    return res.redirect(301, destination);
  }

  next();
}
