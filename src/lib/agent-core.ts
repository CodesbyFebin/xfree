import { LOCAL_ENGINES } from "./studio/engines";
import type { StudioResult } from "./studio/types";

export type AgentPlanSource = "rules" | "webllm";
export type AgentStepStatus = "queued" | "running" | "completed" | "failed";
export type AgentTransformId = "lines-to-json-array";

export interface AgentPlanStep {
  id: string;
  kind: "engine" | "transform";
  engineId?: string;
  transformId?: AgentTransformId;
  label: string;
  passthrough?: boolean;
  status: AgentStepStatus;
  error?: string;
}

export interface LocalAgentPlan {
  id: string;
  command: string;
  source: AgentPlanSource;
  steps: AgentPlanStep[];
  rationale?: string;
}

export interface AgentExecutionResult {
  plan: LocalAgentPlan;
  result: Omit<StudioResult, "id" | "createdAt" | "processing">;
}

const MAX_AGENT_STEPS = 6;
const engineIds = new Set(LOCAL_ENGINES.map((engine) => engine.id));

const ENGINE_RULES: Array<{
  engineId: string;
  label: string;
  patterns: RegExp[];
  passthrough?: boolean;
}> = [
  { engineId: "json-to-csv", label: "Convert JSON to CSV", patterns: [/json\s*(?:→|to|into)\s*csv/i] },
  { engineId: "csv-to-json", label: "Convert CSV to JSON", patterns: [/csv\s*(?:→|to|into)\s*json/i] },
  { engineId: "http-url-extract", label: "Extract HTTP URLs", patterns: [/(?:extract|find|collect|pull).{0,24}(?:url|urls|links?)/i] },
  { engineId: "email-extract", label: "Extract email candidates", patterns: [/(?:extract|find|collect|pull).{0,24}(?:email|emails|addresses)/i] },
  { engineId: "line-dedupe", label: "Remove duplicate lines", patterns: [/\b(?:dedupe|de-duplicate|remove duplicates?|unique lines?)\b/i] },
  { engineId: "line-sort", label: "Sort lines", patterns: [/\b(?:sort|alphabetize).{0,12}(?:lines?|results?|urls?|links?)?\b/i] },
  { engineId: "json-validate", label: "Validate JSON", patterns: [/\b(?:validate|check).{0,12}json\b/i], passthrough: true },
  { engineId: "json-format", label: "Format JSON", patterns: [/\b(?:format|pretty|beautify).{0,12}json\b/i] },
  { engineId: "json-minify", label: "Minify JSON", patterns: [/\b(?:minify|compact).{0,12}json\b/i] },
  { engineId: "json-sort-keys", label: "Sort JSON keys", patterns: [/\bsort.{0,12}json.{0,12}keys?\b/i] },
  { engineId: "base64-encode", label: "Base64 encode", patterns: [/\b(?:base64.{0,8}encode|encode.{0,8}base64)\b/i] },
  { engineId: "base64-decode", label: "Base64 decode", patterns: [/\b(?:base64.{0,8}decode|decode.{0,8}base64)\b/i] },
  { engineId: "sha256", label: "Generate SHA-256 digest", patterns: [/\b(?:sha-?256|hash|digest)\b/i] },
  { engineId: "slugify", label: "Create URL slug", patterns: [/\b(?:slug|slugify)\b/i] },
  { engineId: "word-count", label: "Count words", patterns: [/\b(?:word count|count words)\b/i] },
  { engineId: "url-parse", label: "Parse URL", patterns: [/\bparse.{0,8}(?:url|uri)\b/i] },
  { engineId: "url-normalize", label: "Normalize URL", patterns: [/\bnormalize.{0,8}(?:url|uri)\b/i] },
  { engineId: "jwt-decode", label: "Decode JWT without verification", patterns: [/\b(?:decode|inspect).{0,8}jwt\b/i] },
  { engineId: "uuid", label: "Generate UUID", patterns: [/\b(?:generate|create|make)?.{0,8}(?:uuid|guid)\b/i] },
  { engineId: "regex", label: "Run regex tester", patterns: [/\b(?:regex|regexp)\b/i] },
];

function stepId(index: number) {
  return `agent-step-${index + 1}`;
}

function makeEngineStep(index: number, engineId: string, label?: string, passthrough = false): AgentPlanStep {
  const engine = LOCAL_ENGINES.find((candidate) => candidate.id === engineId);
  if (!engine) throw new Error(`Unknown local engine: ${engineId}`);
  return {
    id: stepId(index),
    kind: "engine",
    engineId,
    label: label || engine.name,
    passthrough,
    status: "queued",
  };
}

function makeTransformStep(index: number, transformId: AgentTransformId, label: string): AgentPlanStep {
  return { id: stepId(index), kind: "transform", transformId, label, status: "queued" };
}

export function buildRulesAgentPlan(command: string, preferredEngineId?: string): LocalAgentPlan {
  const normalized = command.trim();
  const matches = ENGINE_RULES.flatMap((rule) => {
    const positions = rule.patterns
      .map((pattern) => pattern.exec(normalized)?.index)
      .filter((position): position is number => typeof position === "number");
    if (!positions.length) return [];
    return [{ ...rule, position: Math.min(...positions) }];
  })
    .sort((a, b) => a.position - b.position)
    .filter((rule, index, all) => all.findIndex((candidate) => candidate.engineId === rule.engineId) === index);

  let steps = matches.slice(0, MAX_AGENT_STEPS).map((rule, index) => makeEngineStep(index, rule.engineId, rule.label, Boolean(rule.passthrough)));

  if (!steps.length && preferredEngineId && engineIds.has(preferredEngineId)) {
    steps = [makeEngineStep(0, preferredEngineId)];
  }

  if (!steps.length) {
    const fallback = LOCAL_ENGINES
      .map((engine) => ({ engine, score: engine.keywords.filter((keyword) => normalized.toLowerCase().includes(keyword)).length }))
      .sort((a, b) => b.score - a.score)[0];
    if (fallback && fallback.score > 0) steps = [makeEngineStep(0, fallback.engine.id)];
  }

  const asksForJsonFile = /(?:save|export|return|output).{0,18}(?:as|to|in)?\s*json(?:\s*file)?/i.test(normalized);
  const hasListLikeStep = steps.some((step) => ["http-url-extract", "email-extract", "line-dedupe", "line-sort"].includes(step.engineId || ""));
  if (asksForJsonFile && hasListLikeStep && steps.length < MAX_AGENT_STEPS) {
    steps.push(makeTransformStep(steps.length, "lines-to-json-array", "Convert result lines to JSON array"));
  }

  if (!steps.length) {
    throw new Error("I could not map that request to a local engine yet. Try naming the operation, such as “extract URLs, dedupe them, and export as JSON”.");
  }

  return {
    id: `agent-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    command: normalized,
    source: "rules",
    steps,
    rationale: "Deterministic local planner matched the request to XFree Studio engines.",
  };
}

export function validateExternalAgentPlan(command: string, draft: unknown): LocalAgentPlan {
  if (!draft || typeof draft !== "object") throw new Error("Local brain returned an invalid plan object.");
  const value = draft as { steps?: unknown; rationale?: unknown };
  if (!Array.isArray(value.steps) || value.steps.length === 0 || value.steps.length > MAX_AGENT_STEPS) {
    throw new Error(`Local brain plan must contain 1–${MAX_AGENT_STEPS} steps.`);
  }

  const steps = value.steps.map((raw, index): AgentPlanStep => {
    if (!raw || typeof raw !== "object") throw new Error(`Local brain step ${index + 1} is invalid.`);
    const step = raw as { engineId?: unknown; transformId?: unknown; label?: unknown; passthrough?: unknown };

    if (typeof step.engineId === "string") {
      if (!engineIds.has(step.engineId)) throw new Error(`Local brain requested unknown engine: ${step.engineId}`);
      return makeEngineStep(index, step.engineId, typeof step.label === "string" ? step.label : undefined, step.passthrough === true);
    }

    if (step.transformId === "lines-to-json-array") {
      return makeTransformStep(index, "lines-to-json-array", typeof step.label === "string" ? step.label : "Convert lines to JSON array");
    }

    throw new Error(`Local brain step ${index + 1} did not specify an allowed engine or transform.`);
  });

  return {
    id: `agent-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    command,
    source: "webllm",
    steps,
    rationale: typeof value.rationale === "string" ? value.rationale.slice(0, 500) : "WebLLM proposed a plan that passed the local allowlist validator.",
  };
}

function transformLinesToJsonArray(input: string) {
  return JSON.stringify(input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), null, 2);
}

export async function executeLocalAgentPlan(
  plan: LocalAgentPlan,
  initialInput: string,
  command: string,
  onPlanUpdate?: (plan: LocalAgentPlan) => void,
): Promise<AgentExecutionResult> {
  let current = initialInput;
  let finalResult: Omit<StudioResult, "id" | "createdAt" | "processing"> | null = null;
  let mutablePlan: LocalAgentPlan = { ...plan, steps: plan.steps.map((step) => ({ ...step })) };

  const publish = () => onPlanUpdate?.({ ...mutablePlan, steps: mutablePlan.steps.map((step) => ({ ...step })) });

  for (let index = 0; index < mutablePlan.steps.length; index += 1) {
    mutablePlan.steps[index] = { ...mutablePlan.steps[index], status: "running", error: undefined };
    publish();

    try {
      const step = mutablePlan.steps[index];
      if (step.kind === "engine") {
        const engine = LOCAL_ENGINES.find((candidate) => candidate.id === step.engineId);
        if (!engine) throw new Error(`Engine unavailable: ${step.engineId}`);
        const result = await engine.run(current, command);
        finalResult = result;
        if (!step.passthrough) current = result.content;
      } else if (step.transformId === "lines-to-json-array") {
        current = transformLinesToJsonArray(current);
        finalResult = {
          engineId: "agent-lines-to-json-array",
          title: "Agent JSON result",
          content: current,
          extension: "json",
          mimeType: "application/json",
        };
      }

      mutablePlan.steps[index] = { ...mutablePlan.steps[index], status: "completed" };
      publish();
    } catch (error) {
      mutablePlan.steps[index] = {
        ...mutablePlan.steps[index],
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown local execution failure",
      };
      publish();
      throw error;
    }
  }

  if (!finalResult) throw new Error("Agent plan completed without producing a result.");
  return { plan: mutablePlan, result: finalResult };
}

export function getAgentAllowedEngineIds(): string[] {
  return [...engineIds].sort();
}
