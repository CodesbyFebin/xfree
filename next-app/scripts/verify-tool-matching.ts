#!/usr/bin/env npx tsx
// Tests for lib/signals/matchTools.ts - deterministic per-item signal-to-
// tool matching. Run via `npm run verify:tool-matching`.
//
// These use synthetic fixture text, not live feed data - matching logic
// is pure and deterministic (no AI, no network), so it should be tested
// as such. Live-feed sanity is covered separately by verify-sitemap.ts's
// sample checks and by actually looking at the rendered /updates pages.
import { matchToolsForSignal, isEligibleTool } from "../lib/signals/matchTools";
import { TOOLS } from "../lib/data/toolsWithSEO";
import type { SignalCategory } from "../lib/signals/sources";

const failures: string[] = [];
function check(label: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
}

function main() {
  console.log("\n=== Relevance ===");

  // A real published/indexable tool - picked at test time rather than
  // hardcoded, so this doesn't silently stop testing anything real if
  // the registry changes slugs.
  const jsonFormatter = TOOLS.find((t) => t.slug === "json-formatter" && t.status === "published" && t.indexable);
  if (!jsonFormatter) {
    check("fixture tool 'json-formatter' exists and is published/indexable", false, "add a fallback fixture tool if this slug is ever removed");
  } else {
    const onTopic = matchToolsForSignal({
      title: "New JSON Formatter shortcuts ship in the browser devtools",
      summary: "Developers can now format and validate JSON directly in devtools, with syntax highlighting and a pretty-print option.",
      categories: ["web-development"],
    });
    check(
      "a title+summary clearly about a tool's own subject matches that tool",
      onTopic.some((t) => t.slug === jsonFormatter.slug),
      `got [${onTopic.map((t) => t.slug).join(", ")}]`,
    );

    const offTopic = matchToolsForSignal({
      title: "Cloudflare announces new data center in Jakarta",
      summary: "The expansion adds regional capacity for Workers and R2 customers in Southeast Asia.",
      categories: ["web-development"],
    });
    check(
      "unrelated title+summary does not match an unrelated tool",
      !offTopic.some((t) => t.slug === jsonFormatter.slug),
      `got [${offTopic.map((t) => t.slug).join(", ")}]`,
    );
  }

  console.log("\n=== Deduplication ===");
  const repeatedKeywordText = {
    title: "JSON Formatter JSON Formatter: format json, validate json, beautify json",
    summary: "json json json formatter formatter validate validate beautify beautify",
    categories: ["web-development"] as SignalCategory[],
  };
  const repeated = matchToolsForSignal(repeatedKeywordText);
  const uniqueSlugs = new Set(repeated.map((t) => t.slug));
  check("no duplicate tool slugs even with heavily repeated keywords", uniqueSlugs.size === repeated.length, `got [${repeated.map((t) => t.slug).join(", ")}]`);
  check(`result never exceeds 3 tools (got ${repeated.length})`, repeated.length <= 3);

  console.log("\n=== Unpublished-tool exclusion ===");

  // Direct unit tests against the exclusion rule itself, using synthetic
  // fixtures - doesn't depend on the live registry happening to contain
  // a draft/non-indexable tool right now (it currently doesn't - all 58
  // are published+indexable).
  check("isEligibleTool: published + indexable -> eligible", isEligibleTool({ status: "published", indexable: true }));
  check("isEligibleTool: draft + indexable -> excluded", !isEligibleTool({ status: "draft", indexable: true }));
  check("isEligibleTool: retired + indexable -> excluded", !isEligibleTool({ status: "retired", indexable: true }));
  check("isEligibleTool: published + non-indexable -> excluded", !isEligibleTool({ status: "published", indexable: false }));

  const draftOrNonIndexable = TOOLS.filter((t) => !isEligibleTool(t));
  if (draftOrNonIndexable.length === 0) {
    console.log("  INFO  no draft/non-indexable tools currently exist in the live registry - isEligibleTool unit tests above cover the rule directly");
  } else {
    const target = draftOrNonIndexable[0];
    // Build text from the tool's own title/tags/seoKeywords - the
    // strongest possible match signal - to prove exclusion isn't just
    // "this text happened not to match", but the real status/indexable
    // filter in matchToolsForSignal / CANDIDATE_TOOLS.
    const strongText = {
      title: target.title,
      summary: [...(target.tags ?? []), ...(target.seoKeywords ?? [])].join(" "),
      categories: ["web-development"] as SignalCategory[],
    };
    const result = matchToolsForSignal(strongText);
    check(
      `a draft/non-indexable tool ("${target.slug}") never appears even with an exact-match title`,
      !result.some((t) => t.slug === target.slug),
      `got [${result.map((t) => t.slug).join(", ")}]`,
    );
  }

  console.log("\n=== Fallback behavior ===");
  const nonsenseText = {
    title: "Zzyxq fnord quibble morpork blargh",
    summary: "wibble noun verb adjective placeholder nonsense text with no real keywords",
    categories: ["browser"] as SignalCategory[],
  };
  const fallback = matchToolsForSignal(nonsenseText);
  check(
    "text with no keyword matches falls back to CATEGORY_RELATED_TOOLS rather than returning nothing",
    fallback.length > 0,
    `got ${fallback.length} tools`,
  );
  const allPublished = fallback.every((t) => {
    const tool = TOOLS.find((x) => x.slug === t.slug);
    return tool && tool.status === "published" && tool.indexable;
  });
  check("fallback tools are also drawn only from published/indexable tools", allPublished);

  console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `${failures.length} CHECK(S) FAILED`}\n`);
  if (failures.length > 0) process.exit(1);
}

main();
