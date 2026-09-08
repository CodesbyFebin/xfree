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
// models this account's free tier 404s on. OpenRouter's smaller free
// catalog is the second-tier fallback if NVIDIA has no key configured or
// every NVIDIA candidate fails.
//
// Venice AI and DeepSeek are a separate, explicit-pick-only tier - both
// are real paid APIs (verified against their own pricing docs: no free
// tier on either), and this endpoint is public/anonymous with no
// per-visitor auth or spend cap. They are ONLY reached when a caller
// requests their exact model id by name; the "auto" cascade above never
// falls through to them, so ordinary/anonymous traffic never spends
// money. See VENICE_MODELS / DEEPSEEK_MODELS below.
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

// OpenRouter's real, currently-free model ids - verified live against
// https://openrouter.ai/api/v1/models before writing this (a pasted
// doc's suggested list was more than half fabricated/outdated entries).
// Only used as a fallback tier below NVIDIA's much larger, dynamically
// discovered catalog.
const OPENROUTER_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-31b-it:free',
  'cohere/north-mini-code:free',
];

function routeOpenRouterModels(taskType: string, requestedModel?: string): string[] {
  // An explicit pick that's actually one of OpenRouter's models goes
  // first, ahead of task-based ordering - this is what makes Studio's
  // "preferred model" setting mean something for OpenRouter too, not
  // just NVIDIA (which already honors requestedModel in its own client).
  if (requestedModel && OPENROUTER_MODELS.includes(requestedModel)) {
    return [requestedModel, ...OPENROUTER_MODELS.filter((m) => m !== requestedModel)];
  }
  const isCodeTask = taskType === 'code' || taskType === 'sql' || taskType === 'json';
  if (!isCodeTask) return OPENROUTER_MODELS;
  const codeModel = 'cohere/north-mini-code:free';
  return [codeModel, ...OPENROUTER_MODELS.filter((m) => m !== codeModel)];
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

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VENICE_URL = 'https://api.venice.ai/api/v1/chat/completions';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// Explicit-pick-only paid providers (see comment above POST). Neither list
// participates in the "auto" cascade - they're only reached via the exact
// model-id match in POST below.
const VENICE_MODELS = ['venice-uncensored'];
const DEEPSEEK_MODELS = ['deepseek-v4-flash'];

export async function POST(req: NextRequest) {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const veniceKey = process.env.VENICE_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (!nvidiaKey && !openrouterKey && !veniceKey && !deepseekKey) {
    return NextResponse.json({ error: 'Cloud Mode is not configured on this server yet' }, { status: 503 });
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { model, taskType, messages, temperature, maxTokens } = parsed.data;

  // Explicit-pick-only paid tier: only reached when the caller names the
  // exact model id, and it takes priority over the free auto cascade below
  // so an explicit request never gets silently redirected to a free model.
  if (model && VENICE_MODELS.includes(model)) {
    if (!veniceKey) {
      return NextResponse.json({ error: 'Venice is not configured on this server' }, { status: 503 });
    }
    const reply = await tryOpenAICompatibleModel(VENICE_URL, veniceKey, model, messages, maxTokens ?? 512);
    if (reply) {
      return NextResponse.json({ success: true, provider: 'Venice', model, reply, wasFallback: false });
    }
    return NextResponse.json({ error: 'Venice request failed' }, { status: 502 });
  }

  if (model && DEEPSEEK_MODELS.includes(model)) {
    if (!deepseekKey) {
      return NextResponse.json({ error: 'DeepSeek is not configured on this server' }, { status: 503 });
    }
    const reply = await tryOpenAICompatibleModel(DEEPSEEK_URL, deepseekKey, model, messages, maxTokens ?? 512);
    if (reply) {
      return NextResponse.json({ success: true, provider: 'DeepSeek', model, reply, wasFallback: false });
    }
    return NextResponse.json({ error: 'DeepSeek request failed' }, { status: 502 });
  }

  if (nvidiaKey) {
    try {
      const result = await createChatCompletion({
        requestedModel: model,
        taskType,
        messages: messages as NvidiaChatMessage[],
        temperature,
        maxTokens,
      });
      return NextResponse.json({
        success: true,
        provider: 'NVIDIA NIM',
        model: result.usedModel,
        wasFallback: result.wasFallback,
        fallbackReason: result.fallbackReason,
        reply: result.reply,
        usage: result.usage,
      });
    } catch (err) {
      // Not configured or every NVIDIA candidate failed - fall through to
      // OpenRouter below rather than erroring out, as long as it's set up.
      if (!(err instanceof NvidiaNotConfiguredError) && !(err instanceof NvidiaApiError)) {
        throw err;
      }
    }
  }

  if (openrouterKey) {
    const routed = routeOpenRouterModels(taskType, model);
    for (let i = 0; i < routed.length; i++) {
      const reply = await tryOpenAICompatibleModel(OPENROUTER_URL, openrouterKey, routed[i], messages, maxTokens ?? 512);
      if (reply) {
        return NextResponse.json({ success: true, provider: 'OpenRouter', model: routed[i], reply, wasFallback: true });
      }
    }
  }

  return NextResponse.json({ error: 'All cloud providers failed' }, { status: 502 });
}
