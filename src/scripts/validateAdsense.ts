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

function wordCount(text: string): number {
  const normalized = text
    .replace(/&[a-zA-Z0-9#]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.split(" ").filter(Boolean).length : 0;
}

function prerenderVisibleWordCount(html: string): number {
  const visible = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return wordCount(visible);
}

function faqSchema(html: string): { count: number; words: number } {
  let count = 0;
  let words = 0;
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    const value = node as Record<string, unknown>;
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.includes("FAQPage") && Array.isArray(value.mainEntity)) {
      for (const item of value.mainEntity) {
        if (!item || typeof item !== "object") continue;
        const question = item as Record<string, unknown>;
        const answer = question.acceptedAnswer;
        if (!answer || typeof answer !== "object") continue;
        const answerText = (answer as Record<string, unknown>).text;
        const questionText = question.name;
        count += 1;
        if (typeof questionText === "string") words += wordCount(questionText);
        if (typeof answerText === "string") words += wordCount(answerText);
      }
    }

    for (const child of Object.values(value)) visit(child);
  };

  for (const match of scripts) {
    try {
      visit(JSON.parse(match[1]));
    } catch {
      // SEO validation separately catches malformed structured data contracts.
    }
  }

  return { count, words };
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
const privacyLower = privacy.toLowerCase();
expect(privacyLower, "third-party vendors, including google", "privacy disclosure");
expect(privacyLower, "prior visits", "privacy disclosure");
expect(privacy, "adssettings.google.com", "privacy opt-out link");
expect(privacy, "policies.google.com/technologies/partner-sites", "Google partner-sites disclosure");

const contact = read("src/components/pages/ContactPage.tsx");
expect(contact, "support@xfree.in", "contact fallback");
expect(contact, "github.com/CodesbyFebin/xfree/issues", "contact GitHub fallback");

const adsTxt = read("public/ads.txt").trim();
const expectedAdsTxt = `google.com, ${PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`;
if (adsTxt !== expectedAdsTxt) errors.push(`ads.txt must be exactly: ${expectedAdsTxt}`);

const indexHtml = read("index.html");
expect(indexHtml, `name="google-adsense-account" content="${ADSENSE_CLIENT}"`, "AdSense site connection meta");

const securityHeaders = read("src/middleware/security-headers.ts");
for (const origin of [
  "https://pagead2.googlesyndication.com",
  "https://tpc.googlesyndication.com",
  "https://googleads.g.doubleclick.net",
  "https://fundingchoicesmessages.google.com",
]) expect(securityHeaders, origin, "AdSense CSP");
expectNot(securityHeaders, "Cross-Origin-Embedder-Policy", "AdSense CSP/COEP compatibility");

const toolSitemap = read("dist/sitemap-tools.xml");
const toolUrls = [...toolSitemap.matchAll(/<loc>(https:\/\/www\.xfree\.in\/tools\/[^<]+)<\/loc>/g)].map((m) => m[1]);
if (toolUrls.length === 0) errors.push("sitemap-tools.xml contains no published tool URLs");

let shortestTool = { route: "", publisherWords: Number.POSITIVE_INFINITY, prerenderWords: 0, faqWords: 0, faqs: 0 };
for (const url of toolUrls) {
  const route = new URL(url).pathname;
  const html = routeHtml(route);
  const prerenderWords = prerenderVisibleWordCount(html);
  const faq = faqSchema(html);
  const publisherWords = prerenderWords + faq.words;

  if (publisherWords < MIN_TOOL_WORDS) {
    errors.push(`${route}: ${publisherWords} publisher-content words (${prerenderWords} prerender + ${faq.words} hydrated FAQ); internal minimum is ${MIN_TOOL_WORDS}`);
  }
  if (faq.count < MIN_TOOL_FAQS) errors.push(`${route}: ${faq.count} FAQ schema questions; internal minimum is ${MIN_TOOL_FAQS}`);
  expect(html, 'content="index,follow"', `${route} robots`);
  expect(html, `<link rel="canonical" href="${url}"`, `${route} self-canonical`);

  if (publisherWords < shortestTool.publisherWords) shortestTool = { route, publisherWords, prerenderWords, faqWords: faq.words, faqs: faq.count };
}

const adUnit = read("src/components/AdSenseUnit.tsx");
expect(adUnit, 'aria-label="Advertisement"', "AdSense unit labelling");
expect(adUnit, 'data-ad-safe-zone="true"', "AdSense safe-zone marker");
expect(adUnit, 'marginBlock: "10rem"', "AdSense bidirectional 160px separation guardrail");
expectNot(adUnit, "display: none", "AdSense unit visibility");
expectNot(adUnit, "hidden", "AdSense unit visibility");
expect(adUnit, "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", "AdSense script loader");

if (errors.length) {
  console.error(`\n[adsense] FAIL — ${errors.length} readiness invariant(s) broken:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`[adsense] PASS — ${toolUrls.length} published tool page(s) validated`);
console.log(`[adsense] internal content floor: >=${MIN_TOOL_WORDS} publisher-content words and >=${MIN_TOOL_FAQS} visible FAQ questions per tool`);
console.log(`[adsense] shortest tool: ${shortestTool.route} (${shortestTool.publisherWords} words = ${shortestTool.prerenderWords} prerender + ${shortestTool.faqWords} hydrated FAQ; ${shortestTool.faqs} FAQs)`);
console.log(`[adsense] ad safe zone: 160px above and below manual units`);
console.log(`[adsense] trust pages: /privacy, /terms, /contact`);
console.log(`[adsense] publisher authorization: ${PUBLISHER_ID}`);
