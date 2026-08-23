import type { WorkflowRecipe } from "../data/recipes";
import {
  buildAllowlistedAgentPlan,
  getAgentAllowedEngineIds,
  getAgentAllowedTransformIds,
  type AllowlistedPlanStep,
  type LocalAgentPlan,
} from "./agent-core";

export function validateWorkflowRecipe(recipe: WorkflowRecipe): string[] {
  const errors: string[] = [];
  const engines = new Set(getAgentAllowedEngineIds());
  const transforms = new Set(getAgentAllowedTransformIds());

  if (!/^\d+\.\d+\.\d+$/.test(recipe.version)) errors.push(`${recipe.slug}: version must use semver.`);
  if (recipe.processing !== "local") errors.push(`${recipe.slug}: shared recipes must be local.`);
  if (recipe.llmRequired !== false) errors.push(`${recipe.slug}: launch recipes must not require an LLM.`);
  if (!recipe.steps.length || recipe.steps.length > 6) errors.push(`${recipe.slug}: recipes must contain 1–6 steps.`);

  for (const step of recipe.steps) {
    if (step.kind === "engine" && !engines.has(step.engineId)) errors.push(`${recipe.slug}: unknown engine ${step.engineId}.`);
    if (step.kind === "transform" && !transforms.has(step.transformId)) errors.push(`${recipe.slug}: unknown transform ${step.transformId}.`);
  }

  if (recipe.safeConfiguration.networkAccess !== false) errors.push(`${recipe.slug}: launch recipes must declare networkAccess=false.`);
  return errors;
}

export function buildRecipeAgentPlan(recipe: WorkflowRecipe): LocalAgentPlan {
  const errors = validateWorkflowRecipe(recipe);
  if (errors.length) throw new Error(errors.join(" "));
  const steps: AllowlistedPlanStep[] = recipe.steps.map((step) => step.kind === "engine"
    ? { engineId: step.engineId, label: step.label, passthrough: step.passthrough }
    : { transformId: step.transformId, label: step.label });

  return buildAllowlistedAgentPlan(
    `Run shared recipe: ${recipe.title} v${recipe.version}`,
    "recipe",
    steps,
    `Versioned XFree recipe ${recipe.id}@${recipe.version}; all steps passed the local engine/transform allowlist.`,
  );
}
