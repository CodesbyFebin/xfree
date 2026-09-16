import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatCompletion, NvidiaNotConfiguredError, NvidiaApiError } from '@/lib/nvidia/client';
import { NVIDIA_TASK_TYPES } from '@/lib/nvidia/types';
import type { NvidiaChatMessage } from '@/lib/nvidia/types';
import {
  getRateLimiter,
  verifyApiKey,
  getClientId,
  isProviderEnabled,
  isModelAllowed,
  logAuditEntry,
  acquireIdempotency,
  completeIdempotency,
  failIdempotency,
  consumeRateLimits,
  hashBody,
} from '@/lib/server/security';

const RequestSchema = z.object({
  model: z.string().trim().min(1).max(300).optional(),
  taskType: z.enum(NVIDIA_TASK_TYPES).default('general'),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() }))
    .min(1)
    .max(20),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
});

interface GatewayProvider {
  id: string;
  name: string;
  baseUrl: string;
  tier: 'free' | 'paid';
  autoEligible: boolean;
  models: string[];
}

const GATEWAY_PROVIDERS: GatewayProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    tier: 'free',
    autoEligible: true,
    models: [
      'nvidia/nemotron-3-super-120b-a12b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'google/gemma-4-31b-it:free',
      'cohere/north-mini-code:free',
    ],
  },
  {
    id: 'venice',
    name: 'Venice',
    baseUrl: 'https://api.venice.ai/api/v1/chat/completions',
    tier: 'paid',
    autoEligible: false,
    models: ['venice-uncensored'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/chat/completions',
    tier: 'paid',
    autoEligible: false,
    models: ['deepseek-v4-flash'],
  },
];

const getProvider = (id: string) => GATEWAY_PROVIDERS.find((p) => p.id === id)!;

function routeOpenRouterModels(taskType: string, requestedModel?: string): string[] {
  const models = getProvider('openrouter').models;
  if (requestedModel && models.includes(requestedModel)) {
    return [requestedModel, ...models.filter((m) => m !== requestedModel)];
  }
  const isCodeTask = taskType === 'code' || taskType === 'sql' || taskType === 'json';
  if (!isCodeTask) return models;
  const codeModel = 'cohere/north-mini-code:free';
  return [codeModel, ...models.filter((m) => m !== codeModel)];
}

async function tryOpenAICompatibleModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  signal: AbortSignal
): Promise<string | null> {
  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content : null;
  } catch {
    return null;
  }
}

interface RouteAttempt {
  provider: string;
  model: string;
  outcome: 'success' | 'failed' | 'skipped';
  reason?: string;
}

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

const RATE_LIMIT_PER_MINUTE = Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 10;
const RATE_LIMIT_PER_DAY = Number(process.env.AI_RATE_LIMIT_PER_DAY) || 100;
const GLOBAL_DAILY_LIMIT = Number(process.env.AI_GLOBAL_DAILY_LIMIT) || 5000;
const MAX_REQUEST_BYTES = 64 * 1024;
const ROUTE_TIMEOUT_MS = 90_000;

const limiter = getRateLimiter();

const PAID_PROVIDER_MODELS = new Set(['venice-uncensored', 'deepseek-v4-flash']);

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const routeTimeout = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

  let clientId = 'unknown';
  let parsedBody: z.infer<typeof RequestSchema> | null = null;
  let auth: ReturnType<typeof verifyApiKey> = { authenticated: false };

  try {
    const rawBody = await req.text();
    if (rawBody.length > MAX_REQUEST_BYTES) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId: 'unknown',
        endpoint: '/api/nvidia/chat',
        status: 'invalid_request',
        error: 'REQUEST_TOO_LARGE',
      });
      return errorResponse('Request body too large', 'REQUEST_TOO_LARGE', 413);
    }

    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(rawBody);
    } catch {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId: 'unknown',
        endpoint: '/api/nvidia/chat',
        status: 'invalid_request',
        error: 'INVALID_JSON',
      });
      return errorResponse('Invalid JSON body', 'INVALID_REQUEST', 400);
    }

    const parsed = RequestSchema.safeParse(jsonBody);
    if (!parsed.success) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId: 'unknown',
        endpoint: '/api/nvidia/chat',
        status: 'invalid_request',
        error: 'VALIDATION_FAILED',
      });
      return errorResponse('Invalid request body', 'INVALID_REQUEST', 400);
    }
    parsedBody = parsed.data;
    const { model, taskType, messages } = parsedBody;

    clientId = getClientId(req);

    const isPaidModelRequest = model && PAID_PROVIDER_MODELS.has(model);
    const isExplicitNvidiaModel = model && !model.startsWith('auto');

    let idempotencyKey: string | null = null;

    if (isPaidModelRequest) {
      const providerId = model === 'venice-uncensored' ? 'venice' : 'deepseek';

      if (!isProviderEnabled(providerId)) {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: providerId,
          model,
          status: 'forbidden',
          error: 'PROVIDER_DISABLED',
        });
        return errorResponse('This provider is temporarily disabled', 'PROVIDER_DISABLED', 403);
      }

      if (!isModelAllowed(providerId, model)) {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: providerId,
          model,
          status: 'forbidden',
          error: 'MODEL_NOT_ALLOWED',
        });
        return errorResponse('Requested model is not allowed', 'MODEL_NOT_ALLOWED', 403);
      }

      auth = verifyApiKey(req);
      if (!auth.authenticated || auth.keyType !== 'studio') {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: providerId,
          model,
          status: 'unauthorized',
          error: 'AUTH_REQUIRED',
        });
        return errorResponse('Authentication required for paid provider', 'AUTH_REQUIRED', 401);
      }

      idempotencyKey = req.headers.get('x-idempotency-key');
      if (!idempotencyKey) {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: providerId,
          model,
          status: 'invalid_request',
          error: 'IDEMPOTENCY_KEY_REQUIRED',
        });
        return errorResponse('Idempotency key required for paid provider', 'IDEMPOTENCY_KEY_REQUIRED', 400);
      }

      const idempotencyResult = await acquireIdempotency(idempotencyKey, { model, taskType, messages, temperature: parsedBody.temperature, maxTokens: parsedBody.maxTokens });
      if (!idempotencyResult.acquired) {
        const existing = idempotencyResult.existing;
        if (existing?.error === 'BODY_MISMATCH') {
          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/nvidia/chat',
            provider: providerId,
            model,
            status: 'invalid_request',
            error: 'IDEMPOTENCY_BODY_MISMATCH',
          });
          return errorResponse('Idempotency key reused with different request body', 'IDEMPOTENCY_BODY_MISMATCH', 409);
        }
        if (existing?.status === 'pending') {
          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/nvidia/chat',
            provider: providerId,
            model,
            status: 'error',
            error: 'IDEMPOTENCY_IN_PROGRESS',
          });
          return NextResponse.json(
            { error: 'Request with this idempotency key is already in progress', code: 'IDEMPOTENCY_IN_PROGRESS' },
            { status: 409 }
          );
        }
        if (existing?.status === 'completed') {
          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/nvidia/chat',
            provider: providerId,
            model,
            status: 'success',
            error: 'IDEMPOTENCY_DUPLICATE',
          });
          return NextResponse.json(
            { success: true, duplicate: true, reply: existing.result, model, provider: providerId === 'venice' ? 'Venice' : 'DeepSeek' },
            { status: 200 }
          );
        }
        if (existing?.status === 'failed') {
          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/nvidia/chat',
            provider: providerId,
            model,
            status: 'error',
            error: 'IDEMPOTENCY_PREVIOUSLY_FAILED',
          });
          return errorResponse('Previous request with this idempotency key failed', 'IDEMPOTENCY_PREVIOUSLY_FAILED', 409);
        }
      }
    } else if (isExplicitNvidiaModel && model) {
      if (!isModelAllowed('nvidia', model)) {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: 'nvidia',
          model,
          status: 'forbidden',
          error: 'MODEL_NOT_ALLOWED',
        });
        return errorResponse('Requested NVIDIA model is not allowed', 'MODEL_NOT_ALLOWED', 403);
      }
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const veniceKey = process.env.VENICE_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;

    if (!nvidiaKey && !openrouterKey && !veniceKey && !deepseekKey) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/nvidia/chat',
        status: 'error',
        error: 'NOT_CONFIGURED',
      });
      return errorResponse('Cloud Mode is not configured on this server yet', 'NOT_CONFIGURED', 503);
    }

    const rateLimitConfigs = [
      { key: 'global:daily', limit: GLOBAL_DAILY_LIMIT, windowMs: 24 * 60 * 60 * 1000 },
      { key: `${clientId}:per_minute`, limit: RATE_LIMIT_PER_MINUTE, windowMs: 60_000 },
      { key: `${clientId}:per_day`, limit: RATE_LIMIT_PER_DAY, windowMs: 24 * 60 * 60 * 1000 },
    ];

    const rateLimitResult = await consumeRateLimits(limiter, rateLimitConfigs);
    if (!rateLimitResult.success) {
      const failure = rateLimitResult.firstFailure!;
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/nvidia/chat',
        status: 'rate_limited',
        error: 'RATE_LIMIT_EXCEEDED',
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(failure.retryAfter || 60) } }
      );
    }

    const attempted: RouteAttempt[] = [];

    if (isPaidModelRequest) {
      const providerId = model === 'venice-uncensored' ? 'venice' : 'deepseek';
      const provider = getProvider(providerId);
      const key = providerId === 'venice' ? veniceKey : deepseekKey;

      if (!key) {
        await failIdempotency(idempotencyKey!, new Error('PROVIDER_NOT_CONFIGURED'));
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: providerId,
          model,
          status: 'error',
          error: 'PROVIDER_NOT_CONFIGURED',
        });
        return errorResponse(`${provider.name} is not configured on this server`, 'PROVIDER_NOT_CONFIGURED', 503);
      }

      const reply = await tryOpenAICompatibleModel(provider.baseUrl, key, model, messages, parsedBody.maxTokens ?? 512, controller.signal);
      if (reply) {
        await completeIdempotency(idempotencyKey!, { reply, model, provider: provider.name });
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: providerId,
          model,
          tokens: Math.ceil(reply.length / 4),
          status: 'success',
        });
        const route = { attempted: [{ provider: provider.id, model, outcome: 'success' as const }], tier: provider.tier, autoEligible: provider.autoEligible };
        return NextResponse.json({ success: true, provider: provider.name, model, reply, wasFallback: false, route });
      }

      await failIdempotency(idempotencyKey!, new Error('PROVIDER_REQUEST_FAILED'));
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/nvidia/chat',
        provider: providerId,
        model,
        status: 'error',
        error: 'PROVIDER_REQUEST_FAILED',
      });
      return errorResponse(`${provider.name} request failed`, 'PROVIDER_REQUEST_FAILED', 502);
    }

    if (nvidiaKey) {
      try {
        const result = await createChatCompletion({
          requestedModel: model,
          taskType,
          messages: messages as NvidiaChatMessage[],
          temperature: parsedBody.temperature,
          maxTokens: parsedBody.maxTokens,
        });
        attempted.push({ provider: 'nvidia', model: result.usedModel, outcome: 'success' });
        const route = { attempted, tier: 'free' as const, autoEligible: true };

        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/nvidia/chat',
          provider: 'nvidia',
          model: result.usedModel,
          tokens: result.usage?.total_tokens,
          status: 'success',
        });

        return NextResponse.json({
          success: true,
          provider: 'NVIDIA NIM',
          model: result.usedModel,
          wasFallback: result.wasFallback,
          fallbackReason: result.fallbackReason,
          reply: result.reply,
          usage: result.usage,
          route,
        });
      } catch (err) {
        if (!(err instanceof NvidiaNotConfiguredError) && !(err instanceof NvidiaApiError)) {
          throw err;
        }
        attempted.push({
          provider: 'nvidia',
          model: model ?? 'auto',
          outcome: 'failed',
          reason: err instanceof NvidiaNotConfiguredError ? 'not_configured' : 'all_candidates_failed',
        });
      }
    } else {
      attempted.push({ provider: 'nvidia', model: model ?? 'auto', outcome: 'skipped', reason: 'not_configured' });
    }

    if (openrouterKey) {
      const routed = routeOpenRouterModels(taskType, model);
      for (let i = 0; i < routed.length; i++) {
        const reply = await tryOpenAICompatibleModel(getProvider('openrouter').baseUrl, openrouterKey, routed[i], messages, parsedBody.maxTokens ?? 512, controller.signal);
        if (reply) {
          attempted.push({ provider: 'openrouter', model: routed[i], outcome: 'success' });
          const route = { attempted, tier: 'free' as const, autoEligible: true };

          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/nvidia/chat',
            provider: 'openrouter',
            model: routed[i],
            tokens: Math.ceil(reply.length / 4),
            status: 'success',
          });

          return NextResponse.json({ success: true, provider: 'OpenRouter', model: routed[i], reply, wasFallback: true, route });
        }
        attempted.push({ provider: 'openrouter', model: routed[i], outcome: 'failed' });
      }
    } else {
      attempted.push({ provider: 'openrouter', model: 'auto', outcome: 'skipped', reason: 'not_configured' });
    }

    await logAuditEntry({
      timestamp: Date.now(),
      clientId,
      endpoint: '/api/nvidia/chat',
      status: 'error',
      error: 'ALL_PROVIDERS_FAILED',
    });

    return NextResponse.json({ error: 'All cloud providers failed', code: 'ALL_PROVIDERS_FAILED', route: { attempted } }, { status: 502 });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/nvidia/chat',
        status: 'timeout',
        error: 'ROUTE_TIMEOUT',
      });
      return NextResponse.json({ error: 'Request timed out', code: 'ROUTE_TIMEOUT' }, { status: 504 });
    }
    console.error('[Chat Route] Unexpected error:', err);
    await logAuditEntry({
      timestamp: Date.now(),
      clientId,
      endpoint: '/api/nvidia/chat',
      status: 'error',
      error: 'INTERNAL_ERROR',
    });
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  } finally {
    clearTimeout(routeTimeout);
  }
}