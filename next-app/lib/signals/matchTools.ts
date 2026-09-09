import { TOOLS } from "@/lib/data/toolsWithSEO";
import { CATEGORY_RELATED_TOOLS } from "./relatedTools";
import type { SignalCategory } from "./sources";

export interface MatchedTool {
  slug: string;
  title: string;
}

const MAX_TOOLS = 3;

// Below this score we don't trust the match enough to show it as "this
// specific tool relates to this specific article" - see scoreTool's
// comment for what earns points. Chosen so a single generic tag hit
// (score 2) never clears the bar alone, but a title mention (5) or two
// tag hits (4) does.
const MIN_CONFIDENCE = 4;

// Words too short/generic to trust as a standalone signal (e.g. matching
// the tag "ai" against any article that happens to contain "ai" as a
// substring of an unrelated word, or the common word "api"/"css" showing
// up in totally unrelated prose). Real multi-word seoKeywords phrases
// don't need this guard - a whole phrase match is inherently specific.
const MIN_TAG_LENGTH = 4;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function wordBoundaryIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

// Scores one candidate tool against the normalized article text. The
// spec asks to match "keywords, aliases and use cases" - this codebase's
// real tool records don't carry fields with those exact names, so this
// maps onto what actually exists: `tags` (closest to keywords), and
// `seoKeywords` (closest to aliases/use-case phrasing - these are full
// search phrases like "json formatter online", not single words).
// - A title match is the strongest signal (the article is plausibly
//   *about* this exact tool) and is capped to count once.
// - Tag matches are capped at 3 so a tool with a long tag list doesn't
//   win purely on tag-list size rather than actual relevance.
// - seoKeywords matches require the *whole phrase* to appear, which is
//   inherently more specific than a single tag, so they're weighted
//   higher per hit.
function scoreTool(normalizedText: string, tool: (typeof TOOLS)[number]): number {
  let score = 0;

  if (wordBoundaryIncludes(normalizedText, normalize(tool.title))) {
    score += 5;
  }

  const tagHits = (tool.tags ?? [])
    .filter((tag) => tag.length >= MIN_TAG_LENGTH)
    .filter((tag) => wordBoundaryIncludes(normalizedText, normalize(tag)));
  score += Math.min(tagHits.length, 3) * 2;

  const keywordHits = (tool.seoKeywords ?? []).filter((phrase) => wordBoundaryIncludes(normalizedText, normalize(phrase)));
  score += Math.min(keywordHits.length, 2) * 3;

  return score;
}

// Only ever selects from the same live, public registry the sitemap and
// tool pages themselves use (published + indexable) - not the
// engineVerified subset, matching the sitemap's own "keep all 58 in,
// HOLD on filtering by engineVerified" decision (see
// scripts/verify-sitemap.ts's reconciliation output). A signal linking
// to a draft/retired/non-indexable tool would point at a page that
// either doesn't exist yet or was deliberately pulled from indexing.
// Exported separately (rather than inlined into the .filter() below) so
// the exclusion rule itself is directly unit-testable against synthetic
// draft/retired fixtures - the real registry may not always contain a
// non-published tool to exercise this against.
export function isEligibleTool(tool: Pick<(typeof TOOLS)[number], "status" | "indexable">): boolean {
  return tool.status === "published" && tool.indexable;
}

const CANDIDATE_TOOLS = TOOLS.filter(isEligibleTool);

function fallbackTools(categories: SignalCategory[]): MatchedTool[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const category of categories) {
    for (const slug of CATEGORY_RELATED_TOOLS[category] ?? []) {
      if (!seen.has(slug)) {
        seen.add(slug);
        slugs.push(slug);
      }
    }
  }
  return slugs
    .map((slug) => CANDIDATE_TOOLS.find((tool) => tool.slug === slug))
    .filter((tool): tool is (typeof TOOLS)[number] => Boolean(tool))
    .slice(0, MAX_TOOLS)
    .map((tool) => ({ slug: tool.slug, title: tool.title }));
}

/**
 * Deterministic (no AI, no randomness - same input always produces the
 * same output) per-item tool matching. Matches the signal's title +
 * feed summary against each candidate tool's title/tags/seoKeywords,
 * keeps the top-scoring matches above MIN_CONFIDENCE, and falls back to
 * the coarser category-level CATEGORY_RELATED_TOOLS when nothing clears
 * that bar - so a signal never links to a wrong-topic tool just to avoid
 * showing nothing.
 */
export function matchToolsForSignal(item: { title: string; summary?: string; categories: SignalCategory[] }): MatchedTool[] {
  const normalizedText = normalize(`${item.title} ${item.summary ?? ""}`);

  const scored = CANDIDATE_TOOLS.map((tool) => ({ tool, score: scoreTool(normalizedText, tool) }))
    .filter(({ score }) => score >= MIN_CONFIDENCE)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return fallbackTools(item.categories);
  }

  const seen = new Set<string>();
  const matched: MatchedTool[] = [];
  for (const { tool } of scored) {
    if (seen.has(tool.slug)) continue;
    seen.add(tool.slug);
    matched.push({ slug: tool.slug, title: tool.title });
    if (matched.length >= MAX_TOOLS) break;
  }
  return matched;
}
