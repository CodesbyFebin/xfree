import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const PUBLISHER_ID = "pub-3573741815038097";
const ADSENSE_CLIENT = "ca-pub-3573741815038097";
const MIN_TOOL_WORDS = 350;
const MIN_TOOL_FAQS = 3;

const errors: string[] = [];

function read(path: string): string {
  const absolute = join(ROOT, path);
  if (!existsSync(absolute)) {
    errors.push(`missing ${path}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function routeHtml(route: string): string {
  const relative = route === "/" ? "index.html" : `${route.replace(/^\//, "")}/index.html`;
  const absolute = join(DIST, relative);
  if (!existsSync(absolute)) {
    errors.push(`missing prerendered route dist/${relative}`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function textWordCount(html: string): number {
  const visible = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return visible ? visible.split(" ").filter(Boolean).length : 0;
}

function expect(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) errors.push(`${label}: missing ${needle}`);
}

function expectNot(haystack: string, needle: string, label: string) {
  if (haystack.includes(needle)) errors.push(`${label}: must not contain ${needle}`);
}

if (!existsSync(DIST)) {
  console.error("[adsense] FAIL — dist/ does not exist. Run after the production build/prerender step.");
  process.exit(1);
}

// 1) Trust/legal surfaces must be real prerendered pages and globally linked.
for (const route of ["/privacy", "/terms", "/contact"]) {
  const html = routeHtml(route);
  expect(html, 'content="index,follow"', route);
  expectNot(html, "adsbygoogle", `${route} ad isolation`);
}

const footer = read("src/components/Footer.tsx");
for (const route of ["/privacy", "/terms", "/contact"]) {
  expect(footer, `href="${route}"`, "global footer trust links");
}

const privacy = read("src/components/pages/PrivacyPage.tsx");
expect(privacy, "third-party vendors, including Google", "privacy disclosure");
expect(privacy, "prior visits", "privacy disclosure");
expect(privacy, "adssettings.google.com", "privacy opt-out link");
expect(privacy, "policies.google.com/technologies/partner-sites", "Google partner-sites disclosure");

const contact = read("src/components/pages/ContactPage.tsx");
expect(contact, "support@xfree.in", "contact fallback");
expect(contact, "github.com/CodesbyFebin/xfree/issues", "contact GitHub fallback");

// 2) Publisher authorization and site connection must use the assigned ID.
const adsTxt = read("public/ads.txt").trim();
const expectedAdsTxt = `google.com, ${PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`;
if (adsTxt !== expectedAdsTxt) {
  errors.push(`ads.txt must be exactly: ${expectedAdsTxt}`);
}

const indexHtml = read("index.html");
expect(indexHtml, `name="google-adsense-account" content="${ADSENSE_CLIENT}"`, "AdSense site connection meta");

// 3) CSP must allow the documented Google ad/consent endpoints without blanket COEP.
const securityHeaders = read("src/middleware/security-headers.ts");
for (const origin of [
  "https://pagead2.googlesyndication.com",
  "https://tpc.googlesyndication.com",
  "https://googleads.g.doubleclick.net",
  "https://fundingchoicesmessages.google.com",
]) {
  expect(securityHeaders, origin, "AdSense CSP");
}
expectNot(securityHeaders, "Cross-Origin-Embedder-Policy", "AdSense CSP/COEP compatibility");

// 4) All currently indexable tool URLs must meet XFree's internal content floor.
// This 350-word/3-FAQ threshold is an XFree publishing guardrail, not a Google-published numeric requirement.
const toolSitemap = read("dist/sitemap-tools.xml");
const toolUrls = [...toolSitemap.matchAll(/<loc>(https:\/\/www\.xfree\.in\/tools\/[^<]+)<\/loc>/g)].map((m) => m[1]);
if (toolUrls.length === 0) errors.push("sitemap-tools.xml contains no published tool URLs");

let shortestTool = { route: "", words: Number.POSITIVE_INFINITY, faqs: 0 };
for (const url of toolUrls) {
  const route = new URL(url).pathname;
  const html = routeHtml(route);
  const words = textWordCount(html);
  const faqs = (html.match(/"@type":"Question"/g) || []).length;

  if (words < MIN_TOOL_WORDS) {
    errors.push(`${route}: ${words} visible words; internal minimum is ${MIN_TOOL_WORDS}`);
  }
  if (faqs < MIN_TOOL_FAQS) {
    errors.push(`${route}: ${faqs} FAQ schema questions; internal minimum is ${MIN_TOOL_FAQS}`);
  }
  expect(html, 'content="index,follow"', `${route} robots`);
  expect(html, `<link rel="canonical" href="${url}"`, `${route} self-canonical`);

  if (words < shortestTool.words) shortestTool = { route, words, faqs };
}

// 5) Ad units must be explicit, labelled, never hidden, and separated from tool actions.
const adUnit = read("src/components/AdSenseUnit.tsx");
expect(adUnit, 'aria-label="Advertisement"', "AdSense unit labelling");
expect(adUnit, 'data-ad-safe-zone="true"', "AdSense safe-zone marker");
expect(adUnit, 'marginBlock: "10rem 4rem"', "AdSense project separation guardrail");
expectNot(adUnit, "display: none", "AdSense unit visibility");
expectNot(adUnit, "hidden", "AdSense unit visibility");
expect(adUnit, "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", "AdSense script loader");

if (errors.length) {
  console.error(`\n[adsense] FAIL — ${errors.length} readiness invariant(s) broken:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`[adsense] PASS — ${toolUrls.length} published tool page(s) validated`);
console.log(`[adsense] internal content floor: >=${MIN_TOOL_WORDS} visible words and >=${MIN_TOOL_FAQS} FAQ schema questions per tool`);
console.log(`[adsense] shortest tool: ${shortestTool.route} (${shortestTool.words} words, ${shortestTool.faqs} FAQ questions)`);
console.log(`[adsense] trust pages: /privacy, /terms, /contact`);
console.log(`[adsense] publisher authorization: ${PUBLISHER_ID}`);
