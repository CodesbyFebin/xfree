import type { ToolDefinition } from "../types";
import { CATEGORIES, TOOLS_REGISTRY } from "./toolsRegistry";
import { BATCH1_PUBLISHED_TOOLS } from "./publishedBatch1Tools";

/** The only tool catalog that public pages, routes, feeds, APIs, sitemaps, and prerendering may expose. */
const BASE_PUBLISHED_TOOLS = TOOLS_REGISTRY.filter(
  (tool) => tool.status === "published" && tool.indexable === true,
);

const BATCH1_PUBLIC_TOOLS: ToolDefinition[] = BATCH1_PUBLISHED_TOOLS.map((tool) => ({
  ...tool,
  id: `local-${tool.id}`,
}));

const toolMap = new Map<string, ToolDefinition>();
for (const tool of [...BASE_PUBLISHED_TOOLS, ...BATCH1_PUBLIC_TOOLS]) {
  const key = tool.slug || tool.id;
  if (!toolMap.has(key)) toolMap.set(key, tool);
}

export const PUBLIC_TOOLS: ToolDefinition[] = Array.from(toolMap.values());

const PUBLIC_CATEGORY_DESCRIPTION_OVERRIDES: Record<string, string> = {
  validators: "Validate JSON, XML, sitemaps, Schema.org markup, robots.txt rules, and structured data with focused browser-based checks.",
};

export const PUBLIC_CATEGORIES = CATEGORIES.filter((category) =>
  PUBLIC_TOOLS.some((tool) => tool.category === category.id),
).map((category) => ({
  ...category,
  description: PUBLIC_CATEGORY_DESCRIPTION_OVERRIDES[category.id] || category.description,
}));

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
