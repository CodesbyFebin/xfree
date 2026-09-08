import { inferModelCapabilities, selectModelForTask, rankModelsForTask } from './router';
import { inferModelKind, isChatCompatibleKind } from './catalog';
import type {
  NvidiaChatMessage,
  NvidiaModel,
  NvidiaModelResolution,
  NvidiaTaskType,
} from './types';

// Ported from src/server/nvidia/client.ts (the root app's already-working
// NVIDIA integration) so www.xfree.in / app.xfree.in's actual production
// backend gets the same dynamic model discovery + task-ranked cascading
// fallback, instead of a hardcoded 5-model list. Only the config access
// changed (direct process.env reads - Next.js route handlers don't have
// the root app's separate env.ts module) and the throttled console.warn
// noise; the routing/fallback logic itself is untouched.
const NVIDIA_BASE_URL = (process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
const NVIDIA_MAX_OUTPUT_TOKENS = Number(process.env.NVIDIA_MAX_OUTPUT_TOKENS) || 2048;
const NVIDIA_REQUEST_TIMEOUT_MS = Number(process.env.NVIDIA_REQUEST_TIMEOUT_MS) || 45000;

const MODEL_CACHE_TTL_MS = 10 * 60_000;
let modelCache: { expiresAt: number; models: NvidiaModel[] } | null = null;

export class NvidiaNotConfiguredError extends Error {
  constructor() {
    super('NVIDIA NIM is not configured');
    this.name = 'NvidiaNotConfiguredError';
  }
}

export class NvidiaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: 'unavailable' | 'unauthorized' | 'upstream_error' | 'timeout'
  ) {
    super(message);
    this.name = 'NvidiaApiError';
  }
}

function getCredentials() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new NvidiaNotConfiguredError();
  return { apiKey, baseUrl: NVIDIA_BASE_URL };
}

async function nvidiaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { apiKey, baseUrl } = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NVIDIA_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NvidiaApiError('NVIDIA request timed out', 504, 'timeout');
    }
    throw new NvidiaApiError('NVIDIA service could not be reached', 502, 'upstream_error');
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeModel(raw: unknown): NvidiaModel | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== 'string' || !record.id.trim()) return null;
  const id = record.id.trim();
  const kind = inferModelKind(id);
  return {
    id,
    name: id.split('/').pop()?.replace(/[-_]+/g, ' ') || id,
    ownedBy: typeof record.owned_by === 'string' ? record.owned_by : undefined,
    capabilities: inferModelCapabilities(id),
    kind,
    chatCompatible: isChatCompatibleKind(kind),
  };
}

export async function listAvailableModels(options: { forceRefresh?: boolean } = {}): Promise<NvidiaModel[]> {
  if (!options.forceRefresh && modelCache && modelCache.expiresAt > Date.now()) return modelCache.models;

  const response = await nvidiaFetch('/models');
  if (response.status === 401 || response.status === 403) {
    throw new NvidiaApiError('NVIDIA credentials were rejected', 503, 'unauthorized');
  }
  if (!response.ok) throw new NvidiaApiError('NVIDIA model discovery failed', 502, 'upstream_error');

  const payload = (await response.json()) as { data?: unknown[] };
  const models = (Array.isArray(payload.data) ? payload.data : [])
    .map(normalizeModel)
    .filter((model): model is NvidiaModel => Boolean(model));
  modelCache = { expiresAt: Date.now() + MODEL_CACHE_TTL_MS, models };
  return models;
}

export async function resolveNvidiaModel(
  requestedModel: string | undefined,
  taskType: NvidiaTaskType
): Promise<NvidiaModelResolution> {
  const models = (await listAvailableModels()).filter((model) => model.chatCompatible);
  if (!models.length) throw new NvidiaApiError('No NVIDIA chat models are available to this account', 503, 'unavailable');

  const requested = requestedModel?.trim() || 'auto';
  if (requested !== 'auto') {
    const exact = models.find((model) => model.id === requested);
    if (exact) return { requestedModel: requested, usedModel: exact.id, wasFallback: false };
  }

  const fallback = selectModelForTask(taskType, models);
  if (!fallback) throw new NvidiaApiError('No suitable NVIDIA model is available', 503, 'unavailable');
  return {
    requestedModel: requested,
    usedModel: fallback.id,
    wasFallback: requested !== 'auto',
    fallbackReason: requested === 'auto' ? 'auto_routing' : 'selected_model_unavailable',
  };
}

// NVIDIA's model catalog (GET /v1/models) lists more models than are
// actually invocable on a given account/free tier - some 404 on a real
// /chat/completions call. A single best-guess model is not reliable, so
// this walks a task-ranked candidate list and only gives up once several
// have failed - the cascading fallback the free tier needs to be usable.
const MAX_MODEL_ATTEMPTS = 12;

// Models confirmed dead (400/404) are skipped for a while rather than
// retried on every request - each retry is a real round-trip, and a model
// missing from this account's free tier doesn't come back mid-session.
const DEAD_MODEL_TTL_MS = 30 * 60_000;
const deadModels = new Map<string, number>();

function isKnownDead(modelId: string): boolean {
  const markedAt = deadModels.get(modelId);
  if (markedAt === undefined) return false;
  if (Date.now() - markedAt > DEAD_MODEL_TTL_MS) {
    deadModels.delete(modelId);
    return false;
  }
  return true;
}

export async function createChatCompletion(payload: {
  requestedModel?: string;
  taskType: NvidiaTaskType;
  messages: NvidiaChatMessage[];
  temperature?: number;
  maxTokens?: number;
}) {
  const requested = payload.requestedModel?.trim() || 'auto';
  const models = (await listAvailableModels()).filter((model) => model.chatCompatible);
  if (!models.length) throw new NvidiaApiError('No NVIDIA chat models are available to this account', 503, 'unavailable');

  const buildCandidates = (skipKnownDead: boolean): string[] => {
    const list: string[] = [];
    if (requested !== 'auto') {
      const exact = models.find((model) => model.id === requested);
      if (exact) list.push(exact.id);
    }
    for (const model of rankModelsForTask(payload.taskType, models)) {
      if (list.includes(model.id)) continue;
      if (skipKnownDead && isKnownDead(model.id)) continue;
      list.push(model.id);
    }
    return list;
  };

  const candidates = buildCandidates(true).length ? buildCandidates(true) : buildCandidates(false);
  if (!candidates.length) throw new NvidiaApiError('No suitable NVIDIA model is available', 503, 'unavailable');

  const send = (model: string) =>
    nvidiaFetch('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages: payload.messages,
        temperature: payload.temperature ?? 0.4,
        max_tokens: payload.maxTokens ?? NVIDIA_MAX_OUTPUT_TOKENS,
        stream: false,
      }),
    });

  let successResponse: Response | null = null;
  let usedModel: string | null = null;
  let attempts = 0;
  let lastError: NvidiaApiError | null = null;

  for (const modelId of candidates.slice(0, MAX_MODEL_ATTEMPTS)) {
    attempts++;
    let response: Response;
    try {
      response = await send(modelId);
    } catch (error) {
      lastError = error instanceof NvidiaApiError ? error : new NvidiaApiError('NVIDIA service could not be reached', 502, 'upstream_error');
      continue;
    }
    if (response.status === 401 || response.status === 403) {
      throw new NvidiaApiError('NVIDIA credentials were rejected', 503, 'unauthorized');
    }
    if (response.status === 400 || response.status === 404) {
      deadModels.set(modelId, Date.now());
      continue;
    }
    if (!response.ok) {
      throw new NvidiaApiError('NVIDIA could not complete the request', response.status >= 500 ? 502 : 400, 'upstream_error');
    }
    usedModel = modelId;
    successResponse = response;
    break;
  }

  if (!usedModel || !successResponse) {
    if (lastError) throw lastError;
    throw new NvidiaApiError(`NVIDIA could not complete the request after trying ${attempts} model(s)`, 502, 'upstream_error');
  }

  const data = (await successResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };
  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== 'string') throw new NvidiaApiError('NVIDIA returned an invalid response', 502, 'upstream_error');

  return {
    requestedModel: requested,
    usedModel,
    wasFallback: usedModel !== requested,
    fallbackReason: requested === 'auto' ? ('auto_routing' as const) : usedModel !== requested ? ('selected_model_unavailable' as const) : undefined,
    reply,
    usage: data.usage,
  };
}
