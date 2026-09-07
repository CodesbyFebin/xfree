import type { NvidiaModel, NvidiaTaskType } from "./types";
import { inferModelKind, isChatCompatibleKind } from "./catalog";

const TASK_HINTS: Record<NvidiaTaskType, string[]> = {
  code: ["coder", "code", "devstral", "starcoder", "qwen"],
  json: ["coder", "code", "instruct", "qwen", "llama"],
  sql: ["coder", "code", "qwen", "deepseek", "instruct"],
  summarization: ["long", "128k", "70b", "nemotron", "llama"],
  reasoning: ["reason", "thinking", "qwq", "deepseek", "nemotron", "120b", "70b"],
  general: ["instruct", "flash", "llama", "gemma", "nemotron"],
};

const QUALITY_HINTS = ["pro", "120b", "70b", "32b", "large", "super", "ultra"];
const EFFICIENCY_HINTS = ["flash", "mini", "small", "8b", "7b", "3b", "1b"];

function scoreModel(model: NvidiaModel, taskType: NvidiaTaskType): number {
  const id = model.id.toLowerCase();
  let score = 0;
  TASK_HINTS[taskType].forEach((hint, index) => {
    if (id.includes(hint)) score += 40 - index * 4;
  });
  QUALITY_HINTS.forEach((hint, index) => {
    if (id.includes(hint)) score += 18 - index;
  });
  if (taskType === "general" || taskType === "summarization") {
    EFFICIENCY_HINTS.forEach((hint, index) => {
      if (id.includes(hint)) score += 8 - Math.min(index, 6);
    });
  }
  return score;
}

// Returns chat-compatible models ranked best-first for a task. NVIDIA's
// model catalog (GET /v1/models) lists models beyond what's actually
// invocable on a given account/free tier — some 404 on a real chat
// completion call. Callers should walk this list and try the next
// candidate on failure, rather than trusting the top pick will work.
export function rankModelsForTask(taskType: NvidiaTaskType, availableModels: NvidiaModel[]): NvidiaModel[] {
  return availableModels
    .filter((model) => model.chatCompatible)
    .map((model) => ({ model, score: scoreModel(model, taskType) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.model);
}

export function selectModelForTask(taskType: NvidiaTaskType, availableModels: NvidiaModel[]): NvidiaModel | null {
  return rankModelsForTask(taskType, availableModels)[0] ?? null;
}

export function inferModelCapabilities(modelId: string): NvidiaModel["capabilities"] {
  const id = modelId.toLowerCase();
  if (!isChatCompatibleKind(inferModelKind(id))) return [];
  const capabilities: NvidiaModel["capabilities"] = ["chat"];
  if (/code|coder|devstral|starcoder|qwen/.test(id)) capabilities.push("code");
  if (/long|128k|70b|120b|large/.test(id)) capabilities.push("long-context");
  if (/reason|thinking|qwq|deepseek|nemotron/.test(id)) capabilities.push("reasoning");
  if (/flash|mini|small|8b|7b|3b|1b/.test(id)) capabilities.push("efficient");
  return capabilities;
}
