export interface ComparisonResult {
  winner?: string;
  summary: string;
}

export interface ComparisonCriteria {
  id: string;
  label: string;
  weight: number;
}

export const DEFAULT_CRITERIA: ComparisonCriteria[] = [];

export function compareTools(): ComparisonResult {
  return { summary: "No comparison available" };
}

export function extractStrengths(): string[] {
  return [];
}

export function extractWeaknesses(): string[] {
  return [];
}
