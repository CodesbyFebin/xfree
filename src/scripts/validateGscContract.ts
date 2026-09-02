/**
 * Build-time enforcement of the GSC Contract v2 clauses that are checkable
 * from dist/ + source config alone (no live network access — see
 * verifyProductionContract.ts for the post-deploy redirect-matrix and
 * raw-canonical checks against the real domains).
 *
 * Scope, deliberately narrow per the contract's own PR instructions:
 *   §1 redirect matrix   — structural check against vercel.json
 *   §2 raw canonical      — Studio dual-canonical pattern in dist/
 *   §5 sitemap contract   — /studio and /_app-shell excluded from every sitemap
 *   §8 internal discovery — no stray /category/* legacy links in prerendered HTML
 *
 * Everything else in the contract (unique titles/descriptions, single H1,
 * self-canonical on indexable pages, noindex hygiene, etc.) is already
 * enforced by validate:seo — this script does not duplicate it.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const errors: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function read(relative: string): string {
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) {
    fail(`missing dist/${relative}`);
    return "";
  }
  return fs.readFileSync(file, "utf-8");
}

// ---------------------------------------------------------------------------
// §1 Redirect matrix — structural check against vercel.json. Confirms the
// five required rules exist with the right shape; verifyProductionContract.ts
// confirms they actually fire correctly against the live domains.
// ---------------------------------------------------------------------------
interface VercelRedirect {
  source: string;
  destination: string;
  permanent?: boolean;
  has?: Array<{ type: string; value: string }>;
}

const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8")) as {
  redirects?: VercelRedirect[];
};
const redirects = vercelConfig.redirects ?? [];

function hasHost(redirect: VercelRedirect, host: string): boolean {
  return (redirect.has ?? []).some((h) => h.type === "host" && h.value === host);
}

function findRedirect(source: string, host: string | null, destinationIncludes: string): VercelRedirect | undefined {
  return redirects.find(
    (r) =>
      r.source === source &&
      (host === null || hasHost(r, host)) &&
      r.destination.includes(destinationIncludes) &&
      r.permanent === true,
  );
}

if (!findRedirect("/(.*)", "xfree.in", "www.xfree.in")) {
  fail("vercel.json missing permanent apex xfree.in -> www.xfree.in redirect");
}
if (!findRedirect("/studio", "www.xfree.in", "app.xfree.in")) {
  fail("vercel.json missing permanent www.xfree.in/studio -> app.xfree.in redirect");
}
if (!findRedirect("/studio", "app.xfree.in", "app.xfree.in")) {
  fail("vercel.json missing permanent app.xfree.in/studio -> app.xfree.in redirect");
}

// app.xfree.in/ must NOT be a redirect target — it's a direct 200 (Routing
// Middleware handles content selection, not vercel.json).
if (redirects.some((r) => r.source === "/" && hasHost(r, "app.xfree.in"))) {
  fail("vercel.json still redirects app.xfree.in/ — should be a direct 200 via middleware.ts, not a redirect");
}

// ---------------------------------------------------------------------------
// Routing Middleware sanity check — must exist, must be scoped narrowly.
// A missing matcher (or one scoped too broadly) would run this on every
// route rather than just "/", adding latency/risk far beyond what's needed.
// ---------------------------------------------------------------------------
const middlewarePath = path.join(ROOT, "middleware.ts");
if (!fs.existsSync(middlewarePath)) {
  fail("middleware.ts not found at project root");
} else {
  const middlewareSource = fs.readFileSync(middlewarePath, "utf-8");
  if (!/matcher\s*:\s*["']\/["']/.test(middlewareSource)) {
    fail("middleware.ts matcher is not scoped to exactly \"/\" — verify it isn't running on every route");
  }
  if (!middlewareSource.includes("app.xfree.in")) {
    fail("middleware.ts no longer references app.xfree.in — Studio host check may have been removed");
  }
}

// ---------------------------------------------------------------------------
// §2 / §5 Studio dual-canonical pattern + sitemap exclusion
// ---------------------------------------------------------------------------
const STUDIO_CANONICAL = "https://app.xfree.in/";

function checkStudioRoute(routePath: string, expectRobotsIndex: boolean) {
  const html = read(path.join(routePath.replace(/^\//, ""), "index.html"));
  if (!html) return;

  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) {
    fail(`${routePath} missing canonical tag`);
  } else if (canonicalMatch[1] !== STUDIO_CANONICAL) {
    fail(`${routePath} canonical is "${canonicalMatch[1]}", expected exactly "${STUDIO_CANONICAL}"`);
  }

  const wantsRobots = expectRobotsIndex ? "index,follow" : "noindex,follow";
  if (!html.includes(`content="${wantsRobots}"`) && !html.includes(`content='${wantsRobots}'`)) {
    fail(`${routePath} robots meta is not "${wantsRobots}"`);
  }
}

// Both are public-facing pages (one on www as a redirect source that used to
// serve content, one served directly via middleware at app.xfree.in/) — both
// must be index,follow. Regression guard: an earlier build noindexed
// /_app-shell, which — because middleware serves those exact bytes at the
// public app.xfree.in/ URL — noindexed the real page too.
checkStudioRoute("/studio", true);
checkStudioRoute("/_app-shell", true);

for (const sitemapFile of ["sitemap.xml", "sitemap-pages.xml", "sitemap-index.xml"]) {
  const xml = read(sitemapFile);
  if (xml.includes("/studio<") || xml.includes("/studio\n")) fail(`${sitemapFile} must not list /studio`);
  if (xml.includes("_app-shell")) fail(`${sitemapFile} must not list /_app-shell`);
}

const robotsTxt = read("robots.txt");
if (!/Disallow:\s*\/_app-shell/.test(robotsTxt)) {
  fail("robots.txt missing Disallow: /_app-shell (defense-in-depth for the internal shell path)");
}

// ---------------------------------------------------------------------------
// §8 Internal discovery — no stray legacy /category/* links anywhere in the
// prerendered output. The IA migration replaced these with top-level
// /:categorySlug links; any survivor is dead weight routed through an extra
// redirect hop instead of a direct link.
// ---------------------------------------------------------------------------
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

if (fs.existsSync(DIST)) {
  const htmlFiles = walk(DIST);
  const discoveredPaths = new Set<string>();

  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf-8");
    if (/href=["']\/category\//i.test(html)) {
      fail(`${path.relative(DIST, file)} contains a legacy /category/ link — use /:categorySlug directly`);
    }

    for (const match of html.matchAll(/<a\b[^>]*\shref=["']([^"']+)["']/gi)) {
      try {
        const target = new URL(match[1], "https://www.xfree.in/");
        if (target.origin === "https://www.xfree.in") discoveredPaths.add(target.pathname.replace(/\/$/, "") || "/");
      } catch {
        fail(`${path.relative(DIST, file)} contains an invalid anchor href: ${match[1]}`);
      }
    }
  }

  // Every canonical sitemap URL except the homepage must be reachable through
  // at least one ordinary server-visible anchor. This catches orphan pages and
  // client-only navigation regressions before release.
  const sitemapUrls = Array.from(read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
  for (const url of sitemapUrls) {
    const targetPath = new URL(url).pathname.replace(/\/$/, "") || "/";
    if (targetPath !== "/" && !discoveredPaths.has(targetPath)) {
      fail(`orphan sitemap URL has no prerendered <a href> discovery path: ${url}`);
    }
  }
}

if (errors.length) {
  console.error(`\n[gsc-contract] FAIL — ${errors.length} invariant(s) broken:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("[gsc-contract] PASS — redirects, raw canonicals, sitemap isolation, and internal discovery verified");
