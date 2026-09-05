import { ToolDefinition } from "../types";
import { findToolBySlug, TOOLS_REGISTRY } from "../data/toolsRegistry";

export interface ComparisonResult {
  toolId: string;
  toolTitle: string;
  scores: Array<{ criterion: string; score: number; weight: number }>;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ComparisonCriteria {
  capabilityFit: number;
  reliability: number;
  speed: number;
  privacy: number;
  pricing: number;
}

export const DEFAULT_CRITERIA: ComparisonCriteria = {
  capabilityFit: 0.25,
  reliability: 0.2,
  speed: 0.15,
  privacy: 0.2,
  pricing: 0.2,
};

const CRITERION_ORDER = [
  "capabilityFit",
  "reliability",
  "speed",
  "privacy",
  "pricing",
] as const;

export function compareTools(
  toolIds: string[],
  criteria: string[] = [...CRITERION_ORDER],
): ComparisonResult[] {
  const tools = toolIds
    .map((id) => findToolBySlug(id))
    .filter((t): t is ToolDefinition => t !== undefined);

  const weights = { ...DEFAULT_CRITERIA };
  const totalWeight = criteria.reduce((sum, c) => sum + (weights[c as keyof ComparisonCriteria] ?? 0), 0) || 1;

  return tools.map((tool) => {
    const scores = criteria.map((c) => {
      const weight = weights[c as keyof ComparisonCriteria] ?? 0;
      const score = tool.xfreeScore?.breakdown?.[c] ?? tool.xfreeScore?.[c as keyof typeof tool.xfreeScore] ?? 0;
      return {
        criterion: c,
        score,
        weight: weight / totalWeight,
      };
    });

    const overallScore = tool.xfreeScore?.overall ?? 0;

    return {
      toolId: tool.id,
      toolTitle: tool.title,
      scores,
      overallScore,
      strengths: extractStrengths(tool, criteria),
      weaknesses: extractWeaknesses(tool, criteria),
    };
  });
}

export function extractStrengths(tool: ToolDefinition, criteria: string[]): string[] {
  const strengths: string[] = [];
  if (tool.xfreeScore) {
    for (const c of criteria) {
      const score = tool.xfreeScore.breakdown?.[c] ?? tool.xfreeScore[c as keyof typeof tool.xfreeScore];
      if (typeof score === "number" && score >= 0.8) {
        strengths.push(c);
      }
    }
  }
  if (tool.isFlagship) strengths.push("flagship");
  if (tool.verification?.status === "verified") strengths.push("verified");
  return strengths;
}

export function extractWeaknesses(tool: ToolDefinition, criteria: string[]): string[] {
  const weaknesses: string[] = [];
  if (tool.xfreeScore) {
    for (const c of criteria) {
      const score = tool.xfreeScore.breakdown?.[c] ?? tool.xfreeScore[c as keyof typeof tool.xfreeScore];
      if (typeof score === "number" && score <= 0.5) {
        weaknesses.push(c);
      }
    }
  }
  if (tool.verification?.status === "failed") weaknesses.push("verification_failed");
  if (tool.availability === "degraded") weaknesses.push("degraded");
  return weaknesses;
}

export function allRegisteredToolsForComparison(): ToolDefinition[] {
  return TOOLS_REGISTRY;
}
