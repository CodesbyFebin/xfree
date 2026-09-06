export interface RecipeDefinition {
  slug: string;
  title: string;
  description: string;
  version: string;
  summary?: string;
  tools: string[];
  steps: Array<{
    id: string;
    tool: string;
    label: string;
    kind: 'engine' | 'transform';
    engineId?: string;
    transformId?: string;
    config?: Record<string, unknown>;
    passthrough?: boolean;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
  }>;
  notes?: string[];
  inputLabel?: string;
  inputHint?: string;
  sampleInput?: string;
  id?: string;
}

export const RECIPES: RecipeDefinition[] = [];

export function recipeSharePayload(recipe: RecipeDefinition): Record<string, unknown> {
  return {
    slug: recipe.slug,
    title: recipe.title,
    tools: recipe.tools,
  };
}
