import { rewrite, next } from "@vercel/functions";

// app.xfree.in and www.xfree.in are served from one shared static build
// (Vercel does not fork static output by hostname), so the prerendered
// dist/index.html at "/" is identical for both — including its <link
// rel="canonical">, which points at the marketing origin. That's correct
// for www.xfree.in/ but wrong for app.xfree.in/, whose canonical must be
// https://app.xfree.in/ itself.
//
// This runs ahead of static-file serving (unlike a vercel.json "rewrites"
// entry, which loses to a matching static file — confirmed empirically on
// this project), so it can swap in a dedicated, noindexed shell
// (/_app-shell) carrying the correct canonical from byte one. The
// client-side app is host-aware independently (see resolveEffectivePath in
// src/App.tsx) and renders Studio regardless of which shell was served —
// this only fixes what a crawler sees before any JavaScript executes.
//
// Scoped to "/" only: every other route is untouched.
export const config = {
  matcher: "/",
};

export default function middleware(request: Request) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (host === "app.xfree.in") {
    return rewrite(new URL("/_app-shell", request.url));
  }
  return next();
}
