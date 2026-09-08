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

function routeOpenRouterModels(taskType: string): string[] {
  const isCodeTask = taskType === 'code' || taskType === 'sql' || taskType === 'json';
  if (!isCodeTask) return OPENROUTER_MODELS;
  const codeModel = 'cohere/north-mini-code:free';
  return [codeModel, ...OPENROUTER_MODELS.filter((m) => m !== codeModel)];
}

async function tryOpenRouterModel(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string | null> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

export async function POST(req: NextRequest) {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!nvidiaKey && !openrouterKey) {
    return NextResponse.json({ error: 'Cloud Mode is not configured on this server yet' }, { status: 503 });
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { model, taskType, messages, temperature, maxTokens } = parsed.data;

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
    const routed = routeOpenRouterModels(taskType);
    for (let i = 0; i < routed.length; i++) {
      const reply = await tryOpenRouterModel(openrouterKey, routed[i], messages, maxTokens ?? 512);
      if (reply) {
        return NextResponse.json({ success: true, provider: 'OpenRouter', model: routed[i], reply, wasFallback: true });
      }
    }
  }

  return NextResponse.json({ error: 'All cloud providers failed' }, { status: 502 });
}
