import type { AgentPlanStep, LocalAgentPlan } from "./agent-core";
import { getAgentAllowedEngineIds } from "./agent-core";
import { LOCAL_ENGINES } from "./studio/engines";
import type { StudioResult } from "./studio/types";
import type { RecipeDefinition, RecipeStepDefinition, RecipeTransformId } from "../data/recipes";

export interface RecipeTraceEntry {
  stepId: string;
  label: string;
  kind: "engine" | "transform";
  engineId?: string;
  transformId?: RecipeTransformId;
  output: string;
}

export interface RecipeExecutionResult {
  plan: LocalAgentPlan;
  result: Omit<StudioResult, "id" | "createdAt" | "processing">;
  trace: RecipeTraceEntry[];
}

const allowedEngineIds = new Set(getAgentAllowedEngineIds());
const allowedTransforms = new Set<RecipeTransformId>(["lines-to-json-array", "classify-urls-by-first-origin"]);

function assertSafeConfig(step: RecipeStepDefinition) {
  if (!step.config) return;
  const keys = Object.keys(step.config);
  if (keys.some((key) => !["mapLines", "prependLine"].includes(key))) {
    throw new Error(`Recipe step ${step.id} uses an unsupported configuration key.`);
  }
  if (step.config.mapLines !== undefined && typeof step.config.mapLines !== "boolean") {
    throw new Error(`Recipe step ${step.id} has an invalid mapLines flag.`);
  }
  if (step.config.prependLine !== undefined) {
    if (typeof step.config.prependLine !== "string" || step.config.prependLine.length > 80 || /[\r\n]/.test(step.config.prependLine)) {
      throw new Error(`Recipe step ${step.id} has an invalid prependLine value.`);
    }
  }
}

export function validateRecipeDefinition(recipe: RecipeDefinition): string[] {
  const errors: string[] = [];
  if (!recipe.id || !recipe.slug || !Number.isInteger(recipe.version) || recipe.version < 1) errors.push("recipe identity/version is invalid");
  if (recipe.mode !== "local" || recipe.llmRequired !== false) errors.push("initial shared recipes must remain deterministic local workflows");
  if (!recipe.steps.length || recipe.steps.length > 6) errors.push("recipe must contain 1-6 steps");

  const seen = new Set<string>();
  for (const item of recipe.steps) {
    if (!item.id || seen.has(item.id)) errors.push(`duplicate or missing step id: ${item.id || "(empty)"}`);
    seen.add(item.id);
    try { assertSafeConfig(item); } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
    if (item.kind === "engine") {
      if (!item.engineId || !allowedEngineIds.has(item.engineId)) errors.push(`unknown engine: ${item.engineId || "(missing)"}`);
      if (item.transformId) errors.push(`engine step ${item.id} also declares a transform`);
    } else if (item.kind === "transform") {
      if (!item.transformId || !allowedTransforms.has(item.transformId)) errors.push(`unknown transform: ${item.transformId || "(missing)"}`);
      if (item.engineId) errors.push(`transform step ${item.id} also declares an engine`);
      if (item.config) errors.push(`transform step ${item.id} cannot carry engine config`);
    } else {
      errors.push(`unsupported step kind on ${item.id}`);
    }
  }
  return errors;
}

export function recipeToAgentPlan(recipe: RecipeDefinition): LocalAgentPlan {
  const errors = validateRecipeDefinition(recipe);
  if (errors.length) throw new Error(`Unsafe or invalid recipe ${recipe.slug}: ${errors.join("; ")}`);

  const steps: AgentPlanStep[] = recipe.steps.map((item, index) => ({
    id: `recipe-${recipe.slug}-${index + 1}`,
    kind: item.kind,
    engineId: item.engineId,
    transformId: item.transformId === "lines-to-json-array" ? "lines-to-json-array" : undefined,
    label: item.label,
    passthrough: item.passthrough,
    status: "queued",
  }));

  return {
    id: `recipe-plan-${recipe.slug}-${recipe.version}-${Date.now()}`,
    command: `Run recipe: ${recipe.title}`,
    source: "rules",
    steps,
    rationale: `Shared recipe ${recipe.id} v${recipe.version}; all engine IDs and configuration are repository-owned and allowlist validated.`,
  };
}

function linesToJsonArray(input: string) {
  return JSON.stringify(input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), null, 2);
}

function classifyUrlsByFirstOrigin(input: string) {
  const raw = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!raw.length) return JSON.stringify({ baseOrigin: null, internal: [], external: [], invalid: [] }, null, 2);

  const invalid: string[] = [];
  const parsed = raw.map((value) => {
    try { return { value, url: new URL(value) }; }
    catch { invalid.push(value); return null; }
  }).filter((item): item is { value: string; url: URL } => Boolean(item));

  const baseOrigin = parsed[0]?.url.origin ?? null;
  const internal: string[] = [];
  const external: string[] = [];
  for (const item of parsed) {
    (baseOrigin && item.url.origin === baseOrigin ? internal : external).push(item.value);
  }
  return JSON.stringify({ baseOrigin, internal, external, invalid }, null, 2);
}

function runTransform(transformId: RecipeTransformId, input: string): string {
  if (transformId === "lines-to-json-array") return linesToJsonArray(input);
  if (transformId === "classify-urls-by-first-origin") return classifyUrlsByFirstOrigin(input);
  throw new Error(`Unsupported recipe transform: ${transformId}`);
}

async function runEngineStep(step: RecipeStepDefinition, input: string, command: string) {
  const engine = LOCAL_ENGINES.find((candidate) => candidate.id === step.engineId);
  if (!engine) throw new Error(`Recipe engine unavailable: ${step.engineId}`);

  let engineInput = input;
  if (step.config?.prependLine) engineInput = `${step.config.prependLine}\n${engineInput}`;

  if (step.config?.mapLines) {
    const values = engineInput.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const outputs: string[] = [];
    for (const value of values) {
      const result = await engine.run(value, command);
      outputs.push(result.content);
    }
    return outputs.join("\n");
  }

  const result = await engine.run(engineInput, command);
  return result.content;
}

export async function executeRecipe(
  recipe: RecipeDefinition,
  initialInput: string,
  onPlanUpdate?: (plan: LocalAgentPlan) => void,
): Promise<RecipeExecutionResult> {
  const plan = recipeToAgentPlan(recipe);
  const mutablePlan: LocalAgentPlan = { ...plan, steps: plan.steps.map((item) => ({ ...item })) };
  const trace: RecipeTraceEntry[] = [];
  let current = initialInput;

  const publish = () => onPlanUpdate?.({ ...mutablePlan, steps: mutablePlan.steps.map((item) => ({ ...item })) });

  for (let index = 0; index < recipe.steps.length; index += 1) {
    const definition = recipe.steps[index];
    mutablePlan.steps[index] = { ...mutablePlan.steps[index], status: "running", error: undefined };
    publish();

    try {
      let output: string;
      if (definition.kind === "engine") {
        output = await runEngineStep(definition, current, plan.command);
      } else {
        output = runTransform(definition.transformId!, current);
      }

      trace.push({
        stepId: definition.id,
        label: definition.label,
        kind: definition.kind,
        engineId: definition.engineId,
        transformId: definition.transformId,
        output,
      });
      if (!definition.passthrough) current = output;
      mutablePlan.steps[index] = { ...mutablePlan.steps[index], status: "completed" };
      publish();
    } catch (error) {
      mutablePlan.steps[index] = {
        ...mutablePlan.steps[index],
        status: "failed",
        error: error instanceof Error ? error.message : "Recipe step failed",
      };
      publish();
      throw error;
    }
  }

  return {
    plan: mutablePlan,
    trace,
    result: {
      engineId: `recipe:${recipe.slug}@${recipe.version}`,
      title: recipe.outputLabel,
      content: current,
      extension: recipe.outputExtension,
      mimeType: recipe.outputMimeType,
    },
  };
}
