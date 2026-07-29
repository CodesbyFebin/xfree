import { INDEXABLE_TOOLS } from "../data/toolsRegistry";
import type { ToolDefinition } from "../types";

const STOPWORDS = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "by", "can", "do", "for", "from", "have", "help",
  "how", "i", "in", "is", "it", "me", "my", "need", "of", "on", "or", "some", "than", "that", "the",
  "this", "to", "want", "was", "we", "what", "when", "which", "with", "would", "you", "your", "please",
]);

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t && !STOPWORDS.has(t) && t.length > 1);
}

function score(tool: ToolDefinition, tokens: string[]): number {
  if (!tokens.length) return 0;
  const hay = [
    tool.title,
    tool.pillarKeyword || "",
    tool.shortDescription,
    (tool.tags || []).join(" "),
    tool.categoryLabel,
  ].join(" ").toLowerCase();
  let s = 0;
  for (const t of tokens) {
    if (hay.includes(t)) s += t.length >= 5 ? 3 : 2;
  }
  // small boost for flagship
  if (tool.isFlagship) s += 1;
  return s;
}

export interface Recommendation {
  tool: ToolDefinition | null;
  confidence: "high" | "medium" | "low" | "none";
}

export function recommendTool(taskDescription: string): Recommendation {
  const tokens = tokenize(taskDescription);
  if (!tokens.length) return { tool: null, confidence: "none" };

  const scored = INDEXABLE_TOOLS
    .map((tool) => ({ tool, s: score(tool, tokens) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);

  if (!scored.length) return { tool: null, confidence: "none" };
  const top = scored[0];
  const confidence = top.s >= 6 ? "high" : top.s >= 3 ? "medium" : "low";
  return { tool: top.tool, confidence };
}
