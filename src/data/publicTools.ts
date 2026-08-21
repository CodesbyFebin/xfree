import type { ToolDefinition } from "../types";
import { CATEGORIES, TOOLS_REGISTRY } from "./toolsRegistry";

/** The only tool catalog that public pages, routes, feeds, and APIs may expose. */
export const PUBLIC_TOOLS: ToolDefinition[] = TOOLS_REGISTRY.filter(
  (tool) => tool.status === "published" && tool.indexable === true,
);

export const PUBLIC_CATEGORIES = CATEGORIES.filter((category) =>
  PUBLIC_TOOLS.some((tool) => tool.category === category.id),
);

export const PUBLIC_TOOL_SLUGS = new Set(PUBLIC_TOOLS.map((tool) => tool.slug));

export function getPublicToolsByCategory(category: string): ToolDefinition[] {
  return PUBLIC_TOOLS.filter((tool) => tool.category === category);
}

export function getPublicToolBySlug(slug: string): ToolDefinition | undefined {
  return PUBLIC_TOOLS.find((tool) => tool.slug === slug || tool.id === slug);
}

export function getPopularTools(limit = 6): ToolDefinition[] {
  return PUBLIC_TOOLS.slice(0, Math.max(0, limit));
}
