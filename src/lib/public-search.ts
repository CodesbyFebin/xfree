/**
 * Public search — server-side filter over PUBLIC_TOOLS and PUBLIC_PILLARS.
 * Per the master contract, this is the only allowed path for tool/pillar
 * discovery. No private registries, no draft content, no fabricated
 * records. Results are paginated and capped to keep responses small.
 */

import type { ToolDefinition } from "../types";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { PUBLIC_PILLARS, type PillarDefinition } from "../data/pillarRegistry";

export type SearchKind = "tool" | "pillar";

export interface SearchResult {
  kind: SearchKind;
  id: string;
  slug: string;
  title: string;
  description: string;
  href: string;
  score: number;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  kinds?: ReadonlyArray<SearchKind>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function score(haystack: string, needle: string): number {
  if (!needle) return 0;
  if (haystack === needle) return 100;
  if (haystack.startsWith(needle)) return 50;
  if (haystack.includes(needle)) return 10;
  return 0;
}

function toolHref(tool: ToolDefinition): string {
  return `/tools/${tool.slug || tool.id}`;
}

function pillarHref(pillar: PillarDefinition): string {
  return `/${pillar.slug}`;
}

function rankTool(tool: ToolDefinition, needle: string): SearchResult | null {
  if (!needle) {
    return {
      kind: "tool",
      id: tool.id,
      slug: tool.slug || tool.id,
      title: tool.title,
      description: tool.shortDescription,
      href: toolHref(tool),
      score: 0,
    };
  }
  const haystackTitle = normalize(tool.title);
  const haystackSlug = normalize(tool.slug || tool.id);
  const haystackDescription = normalize(tool.shortDescription);
  const titleScore = score(haystackTitle, needle);
  const slugScore = score(haystackSlug, needle) * 0.6;
  const descriptionScore = score(haystackDescription, needle) * 0.3;
  const total = titleScore + slugScore + descriptionScore;
  if (total === 0) return null;
  return {
    kind: "tool",
    id: tool.id,
    slug: tool.slug || tool.id,
    title: tool.title,
    description: tool.shortDescription,
    href: toolHref(tool),
    score: Math.round(total * 10) / 10,
  };
}

function rankPillar(pillar: PillarDefinition, needle: string): SearchResult | null {
  if (!needle) {
    return {
      kind: "pillar",
      id: pillar.id.toString(),
      slug: pillar.slug,
      title: pillar.name,
      description: pillar.description,
      href: pillarHref(pillar),
      score: 0,
    };
  }
  const haystackName = normalize(pillar.name);
  const haystackSlug = normalize(pillar.slug);
  const haystackDescription = normalize(pillar.description);
  const nameScore = score(haystackName, needle);
  const slugScore = score(haystackSlug, needle) * 0.6;
  const descriptionScore = score(haystackDescription, needle) * 0.3;
  const total = nameScore + slugScore + descriptionScore;
  if (total === 0) return null;
  return {
    kind: "pillar",
    id: pillar.id.toString(),
    slug: pillar.slug,
    title: pillar.name,
    description: pillar.description,
    href: pillarHref(pillar),
    score: Math.round(total * 10) / 10,
  };
}

export function publicSearch(options: SearchOptions): {
  query: string;
  total: number;
  results: SearchResult[];
} {
  const rawQuery = (options.query || "").trim();
  const needle = normalize(rawQuery);
  const limit = clamp(options.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);
  const kinds = options.kinds ?? ["tool", "pillar"];
  const allowTools = kinds.includes("tool");
  const allowPillars = kinds.includes("pillar");

  const results: SearchResult[] = [];

  if (allowTools) {
    for (const tool of PUBLIC_TOOLS) {
      const ranked = rankTool(tool, needle);
      if (ranked) results.push(ranked);
    }
  }

  if (allowPillars) {
    for (const pillar of PUBLIC_PILLARS) {
      const ranked = rankPillar(pillar, needle);
      if (ranked) results.push(ranked);
    }
  }

  results.sort((a, b) => b.score - a.score);
  const total = results.length;
  const trimmed = results.slice(0, limit);

  return {
    query: rawQuery,
    total,
    results: trimmed,
  };
}
