#!/usr/bin/env npx tsx
// Regression + reconciliation checks for app/sitemap.ts.
//
// Run via `npm run verify:sitemap`.
//
// The structural checks (count, uniqueness, tool math, no legacy/query
// substrings) run against the real sitemap() output with no network
// calls, so they're safe to run on every build. The live sample section
// fetches a small, representative set of the deployed URLs - not all
// ~1,510 - to spot-check status/redirects/canonical/noindex. A full crawl
// of every sitemap URL on every run would be slow and flaky for a
// routine gate; extend SAMPLE_SLUGS below if a specific route needs
// closer, repeated watching.
import sitemap from "../app/sitemap";
import { TOOLS } from "../lib/data/toolsWithSEO";
import { PILLARS } from "../lib/data/pillars";
import { routing } from "../i18n/routing";

const BASE_URL = "https://www.xfree.in";

const failures: string[] = [];
function check(label: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
}

async function main() {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);
  const uniqueUrls = new Set(urls);

  console.log("\n=== Structural checks (no network) ===");

  check("total URL count is 1,510", entries.length === 1510, `got ${entries.length}`);
  check("all URLs unique", uniqueUrls.size === urls.length, `${urls.length - uniqueUrls.size} duplicate(s)`);

  const indexableTools = TOOLS.filter((t) => t.indexable);
  const expectedToolUrls = indexableTools.length * routing.locales.length;
  const actualToolUrls = urls.filter((u) => u.includes("/tools/")).length;
  check(
    `58 tool records × ${routing.locales.length} locales = ${expectedToolUrls} tool URLs`,
    indexableTools.length === 58 && actualToolUrls === expectedToolUrls,
    `indexable tools=${indexableTools.length}, tool URLs=${actualToolUrls}, expected=${expectedToolUrls}`,
  );

  const localeHomepages = routing.locales.map((l) => (l === routing.defaultLocale ? `${BASE_URL}/` : `${BASE_URL}/${l}`));
  const badTrailingSlash = localeHomepages.filter((h) => h !== `${BASE_URL}/` && h.endsWith("/"));
  check("zero trailing-slash locale-homepage errors", badTrailingSlash.length === 0, badTrailingSlash.join(", "));
  check(
    "every locale homepage present with the exact expected URL",
    localeHomepages.every((h) => uniqueUrls.has(h)),
    localeHomepages.filter((h) => !uniqueUrls.has(h)).join(", "),
  );

  const legacyPatterns: Array<[string, RegExp]> = [
    ["vercel.app domain", /vercel\.app/],
    ["app.xfree.in host", /^https:\/\/app\.xfree\.in/],
    ["query string", /\?/],
    ["/draft/ path", /\/draft\//i],
    ["old singular /pillar/ path", /\/pillar\/(?!s)/],
  ];
  const legacyMatches = urls.filter((u) => legacyPatterns.some(([, pattern]) => pattern.test(u)));
  check("no Vercel, app, query, draft or legacy URLs", legacyMatches.length === 0, legacyMatches.slice(0, 5).join(", "));

  console.log("\n=== Registry reconciliation (documented, not enforced by sitemap.ts) ===");
  const publishedIndexable = TOOLS.filter((t) => t.status === "published" && t.indexable).length;
  const engineVerified = TOOLS.filter((t) => t.engineVerified).length;
  console.log(`  published/indexable tools: ${publishedIndexable}`);
  console.log(`  engine-verified tools:      ${engineVerified}`);
  console.log(
    `  verification reconciliation: HOLD — ${publishedIndexable - engineVerified} tool(s) are sitemapped without` +
      ` engineVerified. Do not add an engineVerified filter to app/sitemap.ts until each of those tools has been` +
      ` individually audited and either marked engineVerified or moved to draft/non-indexable.`,
  );
  // These two numbers are a snapshot, not a target - if either one moves,
  // that's real progress (or regression) on the audit, not a bug in this
  // script. Update the asserted values here when the registry changes,
  // as a deliberate acknowledgment of the new count rather than a
  // silently-passing check that stopped meaning anything.
  check("published/indexable tool count matches the recorded baseline (58)", publishedIndexable === 58, `got ${publishedIndexable}`);
  check("engine-verified tool count matches the recorded baseline (19)", engineVerified === 19, `got ${engineVerified}`);

  console.log("\n=== Live sample checks (network — representative sample, not a full crawl) ===");
  const sampleSlugTool = indexableTools[0]?.slug;
  const samplePillar = PILLARS[0]?.slug;
  const sampleUrls = [
    `${BASE_URL}/`,
    `${BASE_URL}/es`,
    `${BASE_URL}/hi`,
    sampleSlugTool ? `${BASE_URL}/tools/${sampleSlugTool}` : null,
    sampleSlugTool ? `${BASE_URL}/es/tools/${sampleSlugTool}` : null,
    samplePillar ? `${BASE_URL}/pillars/${samplePillar}` : null,
    `${BASE_URL}/guides`,
  ].filter((u): u is string => Boolean(u));

  for (const url of sampleUrls) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      const isRedirect = res.status >= 300 && res.status < 400;
      check(`${url} -> 200, no redirect`, res.status === 200 && !isRedirect, `status=${res.status}`);
      if (res.status === 200) {
        const html = await res.text();
        const canonicalMatches = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/gi) ?? [];
        check(`${url} -> exactly one canonical`, canonicalMatches.length === 1, `found ${canonicalMatches.length}`);
        const hasNoindex = /name=["']robots["'][^>]*noindex/i.test(html);
        check(`${url} -> not noindex`, !hasNoindex);
      }
    } catch (error) {
      check(`${url} reachable`, false, (error as Error).message);
    }
  }

  console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `${failures.length} CHECK(S) FAILED`}\n`);
  if (failures.length > 0) process.exit(1);
}

main();
