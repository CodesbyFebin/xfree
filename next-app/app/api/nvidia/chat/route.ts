import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Backs Studio's (app.xfree.in) Cloud Mode. Studio's own vercel.json
// rewrites every /api/* request there to www.xfree.in/api/*, so this
// route - despite living in the marketing-site codebase - is Studio's
// real backend for this path. The frontend (public/studio/index.html,
// tryNIMFallback()) already expects exactly this contract: POST with
// {taskType, messages, maxTokens}, a 503 when no provider is
// configured, and {model, reply, wasFallback} on success. That
// contract existed before this route did - the frontend was
// previously calling a same-origin path with no backend behind it at
// all (confirmed via a repo-wide search: no /api/nvidia/chat route
// existed anywhere before this file).
const RequestSchema = z.object({
  taskType: z.string().optional(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() }))
    .min(1),
  maxTokens: z.number().int().positive().max(2048).optional().default(512),
});

// NVIDIA NIM's real free-tier catalog (build.nvidia.com), matching the
// exact 5 model ids Studio's frontend already displays in its status
// panel - S.nimModels in index.html.
const NVIDIA_MODELS = [
  'meta/llama-3.1-8b-instruct',
  'google/gemma-2-9b-it',
  'mistralai/mistral-7b-instruct-v0.3',
  'microsoft/phi-3-mini-128k-instruct',
  'nvidia/llama3-chatqa-1.5-8b',
];

// OpenRouter's real, currently-free model ids - verified live against
// https://openrouter.ai/api/v1/models before writing this (a pasted
// doc's suggested list was more than half fabricated/outdated
// entries, e.g. "meta-llama/llama-3.3-70b-instruct:free" is not on
// OpenRouter's free tier right now). Only the confirmed-real ones are
// used here.
const OPENROUTER_MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-31b-it:free',
  'cohere/north-mini-code:free',
];

async function tryModel(
  url: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<string | null> {
  try {
    const res = await fetch(url, {
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
  const { messages, maxTokens } = parsed.data;

  // Cascading fallback: every configured NVIDIA model, in order, then
  // every configured OpenRouter model, in order. First success wins.
  if (nvidiaKey) {
    for (let i = 0; i < NVIDIA_MODELS.length; i++) {
      const model = NVIDIA_MODELS[i];
      const reply = await tryModel(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        nvidiaKey,
        model,
        messages,
        maxTokens
      );
      if (reply) return NextResponse.json({ model, reply, wasFallback: i > 0 });
    }
  }

  if (openrouterKey) {
    for (let i = 0; i < OPENROUTER_MODELS.length; i++) {
      const model = OPENROUTER_MODELS[i];
      const reply = await tryModel(
        'https://openrouter.ai/api/v1/chat/completions',
        openrouterKey,
        model,
        messages,
        maxTokens
      );
      if (reply) return NextResponse.json({ model, reply, wasFallback: true });
    }
  }

  return NextResponse.json({ error: 'All cloud providers failed' }, { status: 502 });
}
