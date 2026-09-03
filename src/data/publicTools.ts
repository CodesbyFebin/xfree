import { ToolDefinition } from "../types";
import { TOOLS_REGISTRY } from "./toolsRegistry";

export const PUBLIC_TOOLS: ToolDefinition[] = TOOLS_REGISTRY.filter(
  (tool) =>
    tool.status === "published" &&
    tool.indexable === true
);

export const PUBLIC_TOOL_SLUGS: Set<string> = new Set(
  PUBLIC_TOOLS.map((t) => t.slug)
);

export const PUBLIC_TOOL_IDS: Set<string> = new Set(
  PUBLIC_TOOLS.map((t) => t.id)
);

export function findPublicTool(slug: string): ToolDefinition | undefined {
  return PUBLIC_TOOLS.find((t) => t.slug === slug || t.id === slug);
}

export function isPublicToolSlug(slug: string): boolean {
  return PUBLIC_TOOL_SLUGS.has(slug);
}
