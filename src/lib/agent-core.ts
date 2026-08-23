import { LOCAL_ENGINES } from "./studio/engines";
import type { StudioResult } from "./studio/types";

export type AgentPlanSource = "rules" | "webllm" | "recipe";
export type AgentStepStatus = "queued" | "running" | "completed" | "failed";
export type AgentTransformId =
  | "lines-to-json-array"
  | "map-lines-url-normalize"
  | "extract-error-lines"
  | "extract-first-jwt"
  | "classify-urls"
  | "text-summary"
  | "extract-clipboard-values";

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

export interface AllowlistedPlanStep {
  engineId?: string;
  transformId?: AgentTransformId;
  label?: string;
  passthrough?: boolean;
}

const MAX_AGENT_STEPS = 6;
const engineIds = new Set(LOCAL_ENGINES.map((engine) => engine.id));
const transformIds = new Set<AgentTransformId>([
  "lines-to-json-array",
  "map-lines-url-normalize",
  "extract-error-lines",
  "extract-first-jwt",
  "classify-urls",
  "text-summary",
  "extract-clipboard-values",
]);

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
  { engineId: "json-validate", label: "Validate JSON", patterns: [/\b(?:validate|check).{0,12}json\b/i, /\bjson.{0,12}(?:validate|validation|check)\b/i], passthrough: true },
  { engineId: "json-format", label: "Format JSON", patterns: [/\b(?:format|pretty|beautify).{0,12}json\b/i, /\bjson.{0,18}(?:format|pretty|beautify)\b/i] },
  { engineId: "json-minify", label: "Minify JSON", patterns: [/\b(?:minify|compact).{0,12}json\b/i, /\bjson.{0,12}(?:minify|compact)\b/i] },
  { engineId: "json-sort-keys", label: "Sort JSON keys", patterns: [/\bsort.{0,12}json.{0,12}keys?\b/i, /\bjson.{0,12}keys?.{0,12}sort\b/i] },
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

function makeTransformStep(index: number, transformId: AgentTransformId, label?: string): AgentPlanStep {
  if (!transformIds.has(transformId)) throw new Error(`Unknown local transform: ${transformId}`);
  return { id: stepId(index), kind: "transform", transformId, label: label || transformId, status: "queued" };
}

export function buildAllowlistedAgentPlan(
  command: string,
  source: AgentPlanSource,
  rawSteps: readonly AllowlistedPlanStep[],
  rationale?: string,
): LocalAgentPlan {
  if (!rawSteps.length || rawSteps.length > MAX_AGENT_STEPS) throw new Error(`Agent plan must contain 1–${MAX_AGENT_STEPS} steps.`);
  const steps = rawSteps.map((step, index): AgentPlanStep => {
    if (typeof step.engineId === "string") {
      if (!engineIds.has(step.engineId)) throw new Error(`Agent plan requested unknown engine: ${step.engineId}`);
      return makeEngineStep(index, step.engineId, step.label, step.passthrough === true);
    }
    if (step.transformId && transformIds.has(step.transformId)) return makeTransformStep(index, step.transformId, step.label);
    throw new Error(`Agent plan step ${index + 1} did not specify an allowed engine or transform.`);
  });
  return {
    id: `agent-plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    command: command.trim(),
    source,
    steps,
    rationale,
  };
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
    const lower = normalized.toLowerCase();
    const fallback = LOCAL_ENGINES
      .map((engine) => ({ engine, score: engine.keywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length }))
      .sort((a, b) => b.score - a.score)[0];
    if (fallback && fallback.score > 0) steps = [makeEngineStep(0, fallback.engine.id)];
  }

  const asksForJsonFile = /(?:save|export|return|output).{0,24}(?:as|to|in)?\s*json(?:\s*file)?/i.test(normalized)
    || /\bjson(?:\s*file)?.{0,24}(?:save|export|return|output)\b/i.test(normalized);
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
  const rawSteps = value.steps.map((raw, index): AllowlistedPlanStep => {
    if (!raw || typeof raw !== "object") throw new Error(`Local brain step ${index + 1} is invalid.`);
    const step = raw as { engineId?: unknown; transformId?: unknown; label?: unknown; passthrough?: unknown };
    if (typeof step.engineId === "string") return {
      engineId: step.engineId,
      label: typeof step.label === "string" ? step.label : undefined,
      passthrough: step.passthrough === true,
    };
    if (typeof step.transformId === "string" && transformIds.has(step.transformId as AgentTransformId)) return {
      transformId: step.transformId as AgentTransformId,
      label: typeof step.label === "string" ? step.label : undefined,
    };
    throw new Error(`Local brain step ${index + 1} did not specify an allowed engine or transform.`);
  });
  return buildAllowlistedAgentPlan(
    command,
    "webllm",
    rawSteps,
    typeof value.rationale === "string" ? value.rationale.slice(0, 500) : "WebLLM proposed a plan that passed the local allowlist validator.",
  );
}

function nonEmptyLines(input: string): string[] {
  return input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function transformLinesToJsonArray(input: string) {
  return JSON.stringify(nonEmptyLines(input), null, 2);
}

function transformNormalizeUrlLines(input: string) {
  return nonEmptyLines(input).map((line) => {
    const url = new URL(line);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) url.port = "";
    return url.toString();
  }).join("\n");
}

function transformErrorLines(input: string) {
  return nonEmptyLines(input).filter((line) => /\b(error|fatal|exception|failed|failure)\b|\b5\d\d\b/i.test(line)).join("\n");
}

function transformFirstJwt(input: string) {
  // JWT signatures can be empty for unsecured/alg:none-shaped tokens. Do not
  // require a trailing word boundary after the third segment; stop at common
  // token delimiters instead. This extracts only — signature verification is
  // intentionally handled nowhere in this inspection workflow.
  const match = input.match(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*(?=$|[\s,;])/);
  if (!match) throw new Error("No three-part JWT-shaped value was found in the supplied text.");
  return match[0];
}

function transformClassifyUrls(input: string) {
  const urls = nonEmptyLines(input).map((line) => new URL(line));
  if (!urls.length) return JSON.stringify({ baseOrigin: null, internal: [], external: [], counts: { internal: 0, external: 0 } }, null, 2);
  const baseOrigin = urls[0].origin;
  const internal = urls.filter((url) => url.origin === baseOrigin).map((url) => url.toString());
  const external = urls.filter((url) => url.origin !== baseOrigin).map((url) => url.toString());
  return JSON.stringify({ baseOrigin, internal, external, counts: { internal: internal.length, external: external.length } }, null, 2);
}

function transformTextSummary(input: string) {
  const cleanedText = nonEmptyLines(input).join("\n");
  const words = cleanedText.trim() ? cleanedText.trim().split(/\s+/).length : 0;
  return JSON.stringify({ cleanedText, lineCount: nonEmptyLines(cleanedText).length, wordCount: words, characterCount: cleanedText.length }, null, 2);
}

function transformClipboardValues(input: string) {
  const patterns = [
    /https?:\/\/[^\s<>'"`]+/gi,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    /\b[a-f0-9]{32,128}\b/gi,
    /\b[A-Za-z_][A-Za-z0-9_.-]*\s*[:=]\s*[^\s]+/g,
  ];
  const values = new Set<string>();
  for (const pattern of patterns) for (const match of input.match(pattern) ?? []) values.add(match.trim());
  return values.size ? [...values].join("\n") : nonEmptyLines(input).join("\n");
}

function runTransform(transformId: AgentTransformId, input: string): Omit<StudioResult, "id" | "createdAt" | "processing"> {
  switch (transformId) {
    case "lines-to-json-array": return { engineId: "agent-lines-to-json-array", title: "Agent JSON result", content: transformLinesToJsonArray(input), extension: "json", mimeType: "application/json" };
    case "map-lines-url-normalize": return { engineId: "agent-map-lines-url-normalize", title: "Normalized URLs", content: transformNormalizeUrlLines(input), extension: "txt", mimeType: "text/plain" };
    case "extract-error-lines": return { engineId: "agent-extract-error-lines", title: "Error-oriented log lines", content: transformErrorLines(input), extension: "txt", mimeType: "text/plain" };
    case "extract-first-jwt": return { engineId: "agent-extract-first-jwt", title: "JWT candidate", content: transformFirstJwt(input), extension: "txt", mimeType: "text/plain" };
    case "classify-urls": return { engineId: "agent-classify-urls", title: "URL classification", content: transformClassifyUrls(input), extension: "json", mimeType: "application/json" };
    case "text-summary": return { engineId: "agent-text-summary", title: "Cleaned text summary", content: transformTextSummary(input), extension: "json", mimeType: "application/json" };
    case "extract-clipboard-values": return { engineId: "agent-extract-clipboard-values", title: "Clipboard values", content: transformClipboardValues(input), extension: "txt", mimeType: "text/plain" };
  }
}

export async function executeLocalAgentPlan(
  plan: LocalAgentPlan,
  initialInput: string,
  command: string,
  onPlanUpdate?: (plan: LocalAgentPlan) => void,
): Promise<AgentExecutionResult> {
  let current = initialInput;
  let finalResult: Omit<StudioResult, "id" | "createdAt" | "processing"> | null = null;
  const mutablePlan: LocalAgentPlan = { ...plan, steps: plan.steps.map((step) => ({ ...step })) };

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
      } else if (step.transformId) {
        const result = runTransform(step.transformId, current);
        finalResult = result;
        current = result.content;
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

export function getAgentAllowedTransformIds(): AgentTransformId[] {
  return [...transformIds].sort();
}
