import { PUBLIC_TOOLS } from "./publicTools";
import { PILLARS_50, TOOL_PILLAR_MAP, type PillarDefinition } from "./masterBlueprint";

export function getPublishedToolsForPillar(pillarSlug: string) {
  return PUBLIC_TOOLS.filter((tool) => TOOL_PILLAR_MAP[tool.slug] === pillarSlug);
}

export const INDEXABLE_PILLARS: PillarDefinition[] = PILLARS_50.filter(
  (pillar) => getPublishedToolsForPillar(pillar.slug).length > 0,
);

export const INDEXABLE_PILLAR_SLUGS = new Set(INDEXABLE_PILLARS.map((pillar) => pillar.slug));

export function isPillarIndexable(pillarSlug: string): boolean {
  return INDEXABLE_PILLAR_SLUGS.has(pillarSlug);
}
