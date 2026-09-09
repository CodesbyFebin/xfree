import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createChatCompletion, NvidiaNotConfiguredError, NvidiaApiError } from '@/lib/nvidia/client';
import { NVIDIA_TASK_TYPES } from '@/lib/nvidia/types';
import type { NvidiaChatMessage } from '@/lib/nvidia/types';

// Backs Studio's (app.xfree.in) Cloud Mode. Studio's own vercel.json
// rewrites every /api/* request there to www.xfree.in/api/*, so this
// route - despite living in the marketing-site codebase - is Studio's
// real backend for this path.
//
// Provider order: NVIDIA NIM first, via the same dynamic model-discovery
// + task-ranked cascading-fallback client already proven out in the root
// app's Express server (src/server/nvidia/*, ported here verbatim except
// for env access) - real /v1/models discovery, 6 task types scored
// against each model id, and a 12-candidate fallback walk that skips
// models this account's free tier 404s on. The GATEWAY_PROVIDERS registry
// below is the second-tier free fallback (OpenRouter) plus the paid,
// explicit-pick-only tier (Venice, DeepSeek) - see autoEligible on each
// entry. Venice AI and DeepSeek are real paid APIs (verified against
// their own pricing docs: no free tier on either), and this endpoint is
// public/anonymous with no per-visitor auth or spend cap - they are ONLY
// reached when a caller requests their exact model id by name; the
// "auto" cascade never falls through to them, so ordinary/anonymous
// traffic never spends money. A failed Venice/DeepSeek request returns
// an honest error rather than silently falling back to a free model.
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
  /** Whether this provider participates in the "auto" cascade every
   *  anonymous visitor hits by default. false = explicit-pick-only. */
  autoEligible: boolean;
  models: string[];
}

// The single source of truth for every OpenAI-compatible provider this
// gateway can reach (NVIDIA is not listed here - it has its own much
// richer dynamic-discovery client in lib/nvidia/client.ts and is called
// separately below).
const GATEWAY_PROVIDERS: GatewayProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    tier: 'free',
    autoEligible: true,
    // OpenRouter's real, currently-free model ids - verified live against
    // https://openrouter.ai/api/v1/models before writing this (a pasted
    // doc's suggested list was more than half fabricated/outdated entries).
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
    models: ['venice-uncensored'], // the model in the user's own dashboard example
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/chat/completions',
    tier: 'paid',
    autoEligible: false,
    models: ['deepseek-v4-flash'], // current model id - NOT the retired deepseek-chat alias
  },
];

const getProvider = (id: string) => GATEWAY_PROVIDERS.find((p) => p.id === id)!;

function routeOpenRouterModels(taskType: string, requestedModel?: string): string[] {
  const models = getProvider('openrouter').models;
  // An explicit pick that's actually one of OpenRouter's models goes
  // first, ahead of task-based ordering - this is what makes Studio's
  // "preferred model" setting mean something for OpenRouter too, not
  // just NVIDIA (which already honors requestedModel in its own client).
  if (requestedModel && models.includes(requestedModel)) {
    return [requestedModel, ...models.filter((m) => m !== requestedModel)];
  }
  const isCodeTask = taskType === 'code' || taskType === 'sql' || taskType === 'json';
  if (!isCodeTask) return models;
  const codeModel = 'cohere/north-mini-code:free';
  return [codeModel, ...models.filter((m) => m !== codeModel)];
}

// Shared by every OpenAI-compatible provider (OpenRouter, Venice, DeepSeek
// all expose the identical /chat/completions request/response shape).
async function tryOpenAICompatibleModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string | null> {
  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(15000),
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

export async function POST(req: NextRequest) {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const veniceKey = process.env.VENICE_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (!nvidiaKey && !openrouterKey && !veniceKey && !deepseekKey) {
    return errorResponse('Cloud Mode is not configured on this server yet', 'NOT_CONFIGURED', 503);
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse('Invalid request body', 'INVALID_REQUEST', 400);
  }
  const { model, taskType, messages, temperature, maxTokens } = parsed.data;

  // Explicit-pick-only paid tier: only reached when the caller names the
  // exact model id, and it takes priority over the free auto cascade below
  // so an explicit request never gets silently redirected to a free model.
  for (const providerId of ['venice', 'deepseek'] as const) {
    const provider = getProvider(providerId);
    if (!model || !provider.models.includes(model)) continue;

    const key = providerId === 'venice' ? veniceKey : deepseekKey;
    if (!key) {
      return errorResponse(`${provider.name} is not configured on this server`, 'PROVIDER_NOT_CONFIGURED', 503);
    }
    const reply = await tryOpenAICompatibleModel(provider.baseUrl, key, model, messages, maxTokens ?? 512);
    if (reply) {
      const route = { attempted: [{ provider: provider.id, model, outcome: 'success' as const }], tier: provider.tier, autoEligible: provider.autoEligible };
      return NextResponse.json({ success: true, provider: provider.name, model, reply, wasFallback: false, route });
    }
    return errorResponse(`${provider.name} request failed`, 'PROVIDER_REQUEST_FAILED', 502);
  }

  const attempted: RouteAttempt[] = [];

  if (nvidiaKey) {
    try {
      const result = await createChatCompletion({
        requestedModel: model,
        taskType,
        messages: messages as NvidiaChatMessage[],
        temperature,
        maxTokens,
      });
      attempted.push({ provider: 'nvidia', model: result.usedModel, outcome: 'success' });
      const route = { attempted, tier: 'free' as const, autoEligible: true };
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
      // Not configured or every NVIDIA candidate failed - fall through to
      // OpenRouter below rather than erroring out, as long as it's set up.
      if (!(err instanceof NvidiaNotConfiguredError) && !(err instanceof NvidiaApiError)) {
        throw err;
      }
      attempted.push({ provider: 'nvidia', model: model ?? 'auto', outcome: 'failed', reason: err instanceof NvidiaNotConfiguredError ? 'not_configured' : 'all_candidates_failed' });
    }
  } else {
    attempted.push({ provider: 'nvidia', model: model ?? 'auto', outcome: 'skipped', reason: 'not_configured' });
  }

  if (openrouterKey) {
    const routed = routeOpenRouterModels(taskType, model);
    for (let i = 0; i < routed.length; i++) {
      const reply = await tryOpenAICompatibleModel(getProvider('openrouter').baseUrl, openrouterKey, routed[i], messages, maxTokens ?? 512);
      if (reply) {
        attempted.push({ provider: 'openrouter', model: routed[i], outcome: 'success' });
        const route = { attempted, tier: 'free' as const, autoEligible: true };
        return NextResponse.json({ success: true, provider: 'OpenRouter', model: routed[i], reply, wasFallback: true, route });
      }
      attempted.push({ provider: 'openrouter', model: routed[i], outcome: 'failed' });
    }
  } else {
    attempted.push({ provider: 'openrouter', model: 'auto', outcome: 'skipped', reason: 'not_configured' });
  }

  return NextResponse.json({ error: 'All cloud providers failed', code: 'ALL_PROVIDERS_FAILED', route: { attempted } }, { status: 502 });
}
