/**
 * Build-time crawl/index validation for XFree.in.
 *
 * This deliberately checks the generated dist/ artifacts (what crawlers see),
 * not just source constants. Any failure exits non-zero so deployment can be
 * blocked before Search Console receives contradictory signals.
 */
import fs from "fs";
import path from "path";
import { CANONICAL_ORIGIN } from "../data/siteConfig";
import { PILLARS_50 } from "../data/masterBlueprint";
import { isPillarIndexable } from "../data/pillarPublishing";

const DIST = path.join(process.cwd(), "dist");
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

function locs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1].trim());
}

function normalizePathname(url: string): string {
  const parsed = new URL(url);
  return parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/+$/, "");
}

function htmlPathForUrl(url: string): string {
  const pathname = normalizePathname(url);
  if (pathname === "/") return "index.html";
  return path.join(pathname.replace(/^\//, ""), "index.html");
}

function count(haystack: string, re: RegExp): number {
  return Array.from(haystack.matchAll(re)).length;
}

if (!fs.existsSync(DIST)) {
  console.error("[seo] dist/ not found. Run the build before validate:seo.");
  process.exit(1);
}

const fullSitemap = read("sitemap.xml");
const sitemapIndex = read("sitemap-index.xml");
const pageSitemap = read("sitemap-pages.xml");
const toolSitemap = read("sitemap-tools.xml");
const guideSitemap = read("sitemap-guides.xml");
const robots = read("robots.txt");
const notFound = read("404.html");

const fullUrls = locs(fullSitemap);
const splitUrls = [...locs(pageSitemap), ...locs(toolSitemap), ...locs(guideSitemap)];
const fullSet = new Set(fullUrls);
const splitSet = new Set(splitUrls);

if (!fullUrls.length) fail("sitemap.xml contains no URLs");
if (fullSet.size !== fullUrls.length) fail(`sitemap.xml contains ${fullUrls.length - fullSet.size} duplicate URL(s)`);
if (splitSet.size !== splitUrls.length) fail(`split sitemaps contain ${splitUrls.length - splitSet.size} duplicate URL(s)`);
if (fullSet.size !== splitSet.size || [...fullSet].some((url) => !splitSet.has(url))) {
  fail("sitemap.xml and split sitemap union do not contain the same canonical URL set");
}

const expectedIndexFiles = ["/sitemap-pages.xml", "/sitemap-tools.xml", "/sitemap-guides.xml"];
for (const sitemapPath of expectedIndexFiles) {
  if (!sitemapIndex.includes(`<loc>${CANONICAL_ORIGIN}${sitemapPath}</loc>`)) {
    fail(`sitemap-index.xml missing ${sitemapPath}`);
  }
}

if (!robots.includes(`Sitemap: ${CANONICAL_ORIGIN}/sitemap-index.xml`)) {
  fail("robots.txt does not advertise the canonical sitemap index");
}
if (/^Sitemap: .*rss\.xml/m.test(robots)) {
  fail("robots.txt incorrectly advertises RSS as a sitemap");
}

const seenTitles = new Map<string, string>();
const seenDescriptions = new Map<string, string>();

for (const url of fullUrls) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    fail(`invalid sitemap URL: ${url}`);
    continue;
  }

  if (parsed.origin !== CANONICAL_ORIGIN) fail(`non-canonical origin in sitemap: ${url}`);
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) fail(`trailing-slash URL in sitemap: ${url}`);
  if (parsed.search || parsed.hash) fail(`query/hash URL in sitemap: ${url}`);

  const relativeHtml = htmlPathForUrl(url);
  const html = read(relativeHtml);
  if (!html) continue;

  const canonicalMatches = Array.from(html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi));
  if (canonicalMatches.length !== 1) {
    fail(`${relativeHtml} has ${canonicalMatches.length} canonical tags (expected 1)`);
  } else if (canonicalMatches[0][1] !== url) {
    fail(`${relativeHtml} canonical mismatch: ${canonicalMatches[0][1]} != ${url}`);
  }

  const titleMatch = html.match(/<title>([^<]{3,})<\/title>/i);
  const descriptionMatch = html.match(/<meta\s+name=["']description["'][^>]+content=["']([^"']{20,})["']/i);
  if (!titleMatch) fail(`${relativeHtml} missing non-empty title`);
  if (!descriptionMatch) fail(`${relativeHtml} missing useful meta description`);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    const prior = seenTitles.get(title);
    if (prior) fail(`${relativeHtml} duplicates title from ${prior}: ${title}`);
    else seenTitles.set(title, relativeHtml);
    if (title.length > 70) fail(`${relativeHtml} title exceeds 70 characters (${title.length})`);
  }
  if (descriptionMatch) {
    const description = descriptionMatch[1].trim();
    const prior = seenDescriptions.get(description);
    if (prior) fail(`${relativeHtml} duplicates meta description from ${prior}`);
    else seenDescriptions.set(description, relativeHtml);
    if (description.length < 70 || description.length > 180) fail(`${relativeHtml} meta description length ${description.length} is outside 70-180 characters`);
  }
  if (!/<meta\s+name=["']robots["'][^>]+content=["']index,follow["']/i.test(html)) fail(`${relativeHtml} missing index,follow robots meta`);
  if (!html.includes('id="prerender-shell"')) fail(`${relativeHtml} missing visible prerender shell`);
  if (count(html, /<h1\b/gi) !== 1) fail(`${relativeHtml} should expose exactly one prerendered H1`);
  if (html.includes("https://xfree.in")) fail(`${relativeHtml} contains non-www absolute XFree URL`);

  if (/zero[- ]competition|guarantee(?:d|s)?\s+page\s*1|rank(?:ing)?\s+on\s+page\s*1\s+within\s+days/i.test(html)) {
    fail(`${relativeHtml} contains an unsupported ranking/competition claim`);
  }

  if (/hreflang=["'](?:es|fr|pt|de|ja)["']/i.test(html)) {
    fail(`${relativeHtml} advertises an unpublished localized hreflang route`);
  }
}

if (!/<meta\s+name=["']robots["'][^>]+content=["']noindex,follow["']/i.test(notFound)) {
  fail("404.html must contain noindex,follow");
}
if (/<link\s+rel=["']canonical["']/i.test(notFound)) {
  fail("404.html must not publish a canonical URL");
}
if (!notFound.includes('id="prerender-shell"')) fail("404.html missing prerender shell");

const roadmap = read(path.join("roadmap", "index.html"));
if (!/<meta\s+name=["']robots["'][^>]+content=["']noindex,follow["']/i.test(roadmap)) fail("roadmap must be noindex,follow");
if (fullSet.has(`${CANONICAL_ORIGIN}/roadmap`)) fail("roadmap must not appear in sitemap.xml");
for (const pillar of PILLARS_50) {
  const html = read(path.join("pillar", pillar.slug, "index.html"));
  const canonical = `${CANONICAL_ORIGIN}/pillar/${pillar.slug}`;
  if (isPillarIndexable(pillar.slug)) {
    if (!fullSet.has(canonical)) fail(`indexable pillar missing from sitemap: ${pillar.slug}`);
    if (!/<meta\s+name=["']robots["'][^>]+content=["']index,follow["']/i.test(html)) fail(`published pillar is not index,follow: ${pillar.slug}`);
  } else {
    if (fullSet.has(canonical)) fail(`roadmap-only pillar leaked into sitemap: ${pillar.slug}`);
    if (!/<meta\s+name=["']robots["'][^>]+content=["']noindex,follow["']/i.test(html)) fail(`roadmap-only pillar is not noindex,follow: ${pillar.slug}`);
  }
}

const contributeUrl = `${CANONICAL_ORIGIN}/contribute`;
if (!fullSet.has(contributeUrl)) fail("contribute authority page missing from sitemap.xml");
const contribute = read(path.join("contribute", "index.html"));
if (!/<meta\s+name=["']robots["'][^>]+content=["']index,follow["']/i.test(contribute)) fail("contribute page must be index,follow");
if (count(contribute, /<h1\b/gi) !== 1) fail("contribute page must expose exactly one prerendered H1");
if (!contribute.includes("How the XFree roadmap becomes production")) fail("contribute page missing substantive roadmap-to-production content");
if (!contribute.includes("github.com/CodesbyFebin/xfree/issues/new/choose")) fail("contribute page missing canonical GitHub contribution link");

const home = read("index.html");
const crawlableHomeLinks = count(home, /href=["']\/(?:tools|category)\//gi);
if (crawlableHomeLinks < 5) {
  fail(`homepage prerender shell exposes only ${crawlableHomeLinks} crawlable tool/category links`);
}

for (const artifact of [
  ["robots.txt", robots],
  ["sitemap.xml", fullSitemap],
  ["sitemap-index.xml", sitemapIndex],
  ["rss.xml", read("rss.xml")],
  ["llms.txt", read("llms.txt")],
  ["llms-full.txt", read("llms-full.txt")],
  ["tools.json", read("tools.json")],
  ["openapi.json", read("openapi.json")],
  ["capabilities.json", read("capabilities.json")],
  ["health.json", read("health.json")],
  ["entities.json", read("entities.json")],
  ["knowledge-graph.json", read("knowledge-graph.json")],
  ["ai.txt", read("ai.txt")],
  ["humans.txt", read("humans.txt")],
  [".well-known/security.txt", read(path.join(".well-known", "security.txt"))],
] as const) {
  if (artifact[1].includes("https://xfree.in")) fail(`${artifact[0]} contains non-www absolute XFree URL`);
}

if (errors.length) {
  console.error(`\n[seo] FAIL — ${errors.length} crawl/index invariant(s) broken:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`[seo] PASS — ${fullUrls.length} canonical URLs validated`);
console.log(`[seo] split: pages=${locs(pageSitemap).length}, tools=${locs(toolSitemap).length}, guides=${locs(guideSitemap).length}`);
console.log(`[seo] homepage crawlable tool/category links: ${crawlableHomeLinks}`);
console.log("[seo] 404: HTTP template is noindex and has no canonical");
console.log("[seo] canonical host: https://www.xfree.in");
