import { config } from "../env";
import { inferModelCapabilities, selectModelForTask } from "./router";
import type {
  NvidiaChatMessage,
  NvidiaModel,
  NvidiaModelResolution,
  NvidiaTaskType,
} from "./types";

const MODEL_CACHE_TTL_MS = 10 * 60_000;
let modelCache: { expiresAt: number; models: NvidiaModel[] } | null = null;

export class NvidiaNotConfiguredError extends Error {
  constructor() {
    super("NVIDIA NIM is not configured");
    this.name = "NvidiaNotConfiguredError";
  }
}

export class NvidiaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: "unavailable" | "unauthorized" | "upstream_error" | "timeout",
  ) {
    super(message);
    this.name = "NvidiaApiError";
  }
}

function getCredentials() {
  if (!config.NVIDIA_API_KEY) throw new NvidiaNotConfiguredError();
  return {
    apiKey: config.NVIDIA_API_KEY,
    baseUrl: config.NVIDIA_BASE_URL.replace(/\/$/, ""),
  };
}

async function nvidiaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { apiKey, baseUrl } = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.NVIDIA_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new NvidiaApiError("NVIDIA request timed out", 504, "timeout");
    }
    throw new NvidiaApiError("NVIDIA service could not be reached", 502, "upstream_error");
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeModel(raw: unknown): NvidiaModel | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id.trim()) return null;
  const id = record.id.trim();
  if (/embed|embedding|rerank|retrieval|nvclip|whisper|speech|tts/i.test(id)) return null;
  return {
    id,
    name: id.split("/").pop()?.replace(/[-_]+/g, " ") || id,
    ownedBy: typeof record.owned_by === "string" ? record.owned_by : undefined,
    capabilities: inferModelCapabilities(id),
  };
}

export async function listAvailableModels(options: { forceRefresh?: boolean } = {}): Promise<NvidiaModel[]> {
  if (!options.forceRefresh && modelCache && modelCache.expiresAt > Date.now()) return modelCache.models;

  const response = await nvidiaFetch("/models");
  if (response.status === 401 || response.status === 403) {
    throw new NvidiaApiError("NVIDIA credentials were rejected", 503, "unauthorized");
  }
  if (!response.ok) throw new NvidiaApiError("NVIDIA model discovery failed", 502, "upstream_error");

  const payload = await response.json() as { data?: unknown[] };
  const models = (Array.isArray(payload.data) ? payload.data : [])
    .map(normalizeModel)
    .filter((model): model is NvidiaModel => Boolean(model));
  modelCache = { expiresAt: Date.now() + MODEL_CACHE_TTL_MS, models };
  return models;
}

export async function resolveNvidiaModel(
  requestedModel: string | undefined,
  taskType: NvidiaTaskType,
): Promise<NvidiaModelResolution> {
  let models = await listAvailableModels();
  if (!models.length) throw new NvidiaApiError("No NVIDIA chat models are available to this account", 503, "unavailable");

  const requested = requestedModel?.trim() || "auto";
  if (requested !== "auto") {
    let exact = models.find((model) => model.id === requested);
    if (!exact) {
      models = await listAvailableModels({ forceRefresh: true });
      exact = models.find((model) => model.id === requested);
    }
    if (exact) return { requestedModel: requested, usedModel: exact.id, wasFallback: false };
  }

  const fallback = selectModelForTask(taskType, models);
  if (!fallback) throw new NvidiaApiError("No suitable NVIDIA model is available", 503, "unavailable");
  return {
    requestedModel: requested,
    usedModel: fallback.id,
    wasFallback: requested !== "auto",
    fallbackReason: requested === "auto" ? "auto_routing" : "selected_model_unavailable",
  };
}

export async function createChatCompletion(payload: {
  requestedModel?: string;
  taskType: NvidiaTaskType;
  messages: NvidiaChatMessage[];
  temperature?: number;
  maxTokens?: number;
}) {
  let resolution = await resolveNvidiaModel(payload.requestedModel, payload.taskType);
  const send = (model: string) => nvidiaFetch("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model,
        messages: payload.messages,
        temperature: payload.temperature ?? 0.4,
        max_tokens: payload.maxTokens ?? config.NVIDIA_MAX_OUTPUT_TOKENS,
        stream: false,
      }),
    });
  let response = await send(resolution.usedModel);

  if (
    (response.status === 400 || response.status === 404) &&
    resolution.requestedModel !== "auto" &&
    !resolution.wasFallback
  ) {
    const refreshed = await listAvailableModels({ forceRefresh: true });
    const fallback = selectModelForTask(
      payload.taskType,
      refreshed.filter((model) => model.id !== resolution.usedModel),
    );
    if (fallback) {
      resolution = {
        requestedModel: resolution.requestedModel,
        usedModel: fallback.id,
        wasFallback: true,
        fallbackReason: "selected_model_unavailable",
      };
      response = await send(fallback.id);
    }
  }

  if (response.status === 401 || response.status === 403) {
    throw new NvidiaApiError("NVIDIA credentials were rejected", 503, "unauthorized");
  }
  if (!response.ok) {
    throw new NvidiaApiError("NVIDIA could not complete the request", response.status >= 500 ? 502 : 400, "upstream_error");
  }
  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== "string") throw new NvidiaApiError("NVIDIA returned an invalid response", 502, "upstream_error");
  return { ...resolution, reply, usage: data.usage };
}
