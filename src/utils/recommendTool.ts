import { INDEXABLE_TOOLS, TOOLS_REGISTRY, findToolById } from "../data/toolsRegistry";
import { INTENT_REGISTRY, findIntentsForQuery, getToolIdForIntent, IntentId } from "../data/intentRegistry";
import type { ToolDefinition, IntentDefinition, IntentMatch } from "../types";

const STOPWORDS = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "by", "can", "do", "for", "from", "have", "help",
  "how", "i", "in", "is", "it", "me", "my", "need", "of", "on", "or", "some", "than", "that", "the",
  "this", "to", "want", "was", "we", "what", "when", "which", "with", "would", "you", "your", "please",
]);

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t && !STOPWORDS.has(t) && t.length > 1);
}

function scoreToolByTokens(tool: ToolDefinition, tokens: string[]): number {
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
  if (tool.isFlagship) s += 1;
  return s;
}

export interface IntentRecommendation {
  tool: ToolDefinition | null;
  intent: IntentDefinition | null;
  confidence: "high" | "medium" | "low" | "none";
  matchedIntentId: IntentId | null;
}

export type Recommendation = {
  tool: ToolDefinition | null;
  confidence: "high" | "medium" | "low" | "none";
};

export function recommendTool(taskDescription: string): IntentRecommendation {
  const trimmedQuery = taskDescription.trim().toLowerCase();

  if (!trimmedQuery) {
    return { tool: null, intent: null, confidence: "none", matchedIntentId: null };
  }

  const intentMatches = findIntentsForQuery(trimmedQuery);

  if (intentMatches.length > 0) {
    const topMatch = intentMatches[0];
    const toolId = getToolIdForIntent(topMatch.intent.id as IntentId);

    if (toolId) {
      const tool = findToolById(toolId) || INDEXABLE_TOOLS.find((t) => t.id === toolId) || null;
      if (tool) {
        const confidence: "high" | "medium" | "low" | "none" = topMatch.confidence;
        return {
          tool,
          intent: topMatch.intent,
          confidence,
          matchedIntentId: topMatch.intent.id as IntentId
        };
      }
    }
  }

  const tokens = tokenize(taskDescription);
  if (!tokens.length) {
    return { tool: null, intent: null, confidence: "none", matchedIntentId: null };
  }

  const scored = TOOLS_REGISTRY
    .map((tool) => ({ tool, s: scoreToolByTokens(tool as ToolDefinition, tokens) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);

  if (!scored.length) {
    return { tool: null, intent: null, confidence: "none", matchedIntentId: null };
  }

  const top = scored[0];
  const confidence = top.s >= 6 ? "high" : top.s >= 3 ? "medium" : "low";
  return {
    tool: top.tool,
    intent: null,
    confidence,
    matchedIntentId: null
  };
}

export function getIntentMatches(query: string): IntentMatch[] {
  return findIntentsForQuery(query);
}

export function getAllIntents(): readonly IntentDefinition[] {
  return INTENT_REGISTRY;
}

export function getIntentsForTool(toolId: string): IntentId[] {
  return INTENT_REGISTRY
    .filter((intent) => intent.preferredToolId === toolId)
    .map((intent) => intent.id as IntentId);
}