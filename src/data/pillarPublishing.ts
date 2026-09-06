/**
 * Pillar publishing status — determines which pillars and tools are
 * eligible for indexing, sitemap inclusion, and prerender generation.
 */
import { PILLARS_60, type PillarDefinition } from "./pillarRegistry";
import { INDEXABLE_TOOLS } from "./toolsRegistry";

export function isPillarIndexable(slug: string): boolean {
  const pillar = PILLARS_60.find((p) => p.slug === slug);
  return pillar ? pillar.indexable === true && pillar.contentApproved === true : false;
}

export function getPublishedPillars(): PillarDefinition[] {
  return PILLARS_60.filter((p) => p.indexable === true && p.contentApproved === true).sort(
    (a, b) => (a.headerGroup ?? a.category).localeCompare(b.headerGroup ?? b.category),
  );
}

export function getPublishedToolsForPillar(pillarSlug: string): typeof INDEXABLE_TOOLS {
  return INDEXABLE_TOOLS.filter((tool) => {
    const toolTags = tool.tags ?? [];
    return toolTags.includes(pillarSlug) || tool.category === pillarSlug;
  });
}

export const INDEXABLE_PILLARS = PILLARS_60.filter(
  (p) => p.indexable === true && p.contentApproved === true,
);
