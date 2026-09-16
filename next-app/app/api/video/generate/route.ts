import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { acquireConcurrencySlot, checkPaidGuard, releaseConcurrencySlot } from '@/lib/security/paidGuard';
import { getIdempotentResult, setIdempotentResult } from '@/lib/security/rateLimiter';
import { auditPaidRequest } from '@/lib/security/audit';

// Video generation - unlike image generation (Pollinations.ai, genuinely
// free and keyless), no free/keyless text-to-video API exists as of this
// writing (verified before building this: Pollinations' own video
// endpoint requires a key, and every other real option - Replicate,
// Stability, Runway, Luma, fal.ai - needs a paid API key). This route is
// real infrastructure using fal.ai's documented queue-based REST API
// (https://queue.fal.run/{model}, Authorization: Key <FAL_API_KEY>), but
// it needs the site owner to add a real FAL_API_KEY before it does
// anything - same honest "not configured" contract as /api/nvidia/chat
// when no key is set, not a fake success path.
const RequestSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
});

const FAL_MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video';
const FAL_BASE = 'https://queue.fal.run';
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // ~60s ceiling - real video generation takes a while

const SCOPE = 'video-generate';
// Video is the single most expensive per-request operation on this site
// (a real fal.ai billed job, plus a serverless function held open for up
// to ~60s polling it) - the concurrency cap bounds both at once, distinct
// from the per-IP/global daily request caps in checkPaidGuard.
const MAX_CONCURRENT_JOBS = Number(process.env.VIDEO_MAX_CONCURRENT_JOBS) || 3;

export async function POST(req: NextRequest) {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    return NextResponse.json({ error: 'Video generation is not configured on this server yet' }, { status: 503 });
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { prompt } = parsed.data;

  const idempotencyKey = req.headers.get('idempotency-key')?.trim();
  if (idempotencyKey) {
    const cached = await getIdempotentResult<Record<string, unknown>>(`${SCOPE}:${idempotencyKey}`);
    if (cached) return NextResponse.json(cached);
  }

  const guard = await checkPaidGuard({
    scope: SCOPE,
    req,
    killSwitchEnv: 'VIDEO_GENERATION_ENABLED',
    perIpLimit: 2,
    perIpWindowSeconds: 300,
    perIpDailyLimit: 5,
    globalDailyLimit: Number(process.env.VIDEO_GLOBAL_DAILY_LIMIT) || 50,
  });
  if (!guard.ok) {
    auditPaidRequest({ scope: SCOPE, hashedKey: 'n/a', provider: 'fal', model: FAL_MODEL, outcome: 'blocked', reason: guard.code });
    return NextResponse.json(
      { error: guard.error, code: guard.code },
      { status: guard.status, headers: guard.retryAfterSeconds ? { 'Retry-After': String(guard.retryAfterSeconds) } : undefined }
    );
  }

  const gotSlot = await acquireConcurrencySlot(SCOPE, MAX_CONCURRENT_JOBS);
  if (!gotSlot) {
    auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'blocked', reason: 'CONCURRENCY_LIMIT' });
    return NextResponse.json({ error: 'Too many video jobs are running right now. Try again shortly.', code: 'CONCURRENCY_LIMIT' }, { status: 429 });
  }

  const start = Date.now();
  try {
    const submit = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
      method: 'POST',
      headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(15000),
    });
    if (!submit.ok) {
      auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'failed', reason: 'submit_rejected', durationMs: Date.now() - start });
      return NextResponse.json({ error: 'Video provider rejected the request' }, { status: 502 });
    }
    const { status_url, response_url } = (await submit.json()) as { status_url: string; response_url: string };
    if (!status_url || !response_url) {
      auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'failed', reason: 'malformed_submit_response', durationMs: Date.now() - start });
      return NextResponse.json({ error: 'Video provider returned an unexpected response' }, { status: 502 });
    }

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const statusRes = await fetch(status_url, { headers: { Authorization: `Key ${falKey}` }, signal: AbortSignal.timeout(10000) });
      if (!statusRes.ok) continue;
      const statusData = (await statusRes.json()) as { status: string };
      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(response_url, { headers: { Authorization: `Key ${falKey}` }, signal: AbortSignal.timeout(10000) });
        if (!resultRes.ok) {
          auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'failed', reason: 'result_fetch_failed', durationMs: Date.now() - start });
          return NextResponse.json({ error: 'Could not fetch the finished video' }, { status: 502 });
        }
        const result = (await resultRes.json()) as { video?: { url?: string } };
        if (!result.video?.url) {
          auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'failed', reason: 'no_video_url', durationMs: Date.now() - start });
          return NextResponse.json({ error: 'Video provider returned no video' }, { status: 502 });
        }
        auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'success', durationMs: Date.now() - start });
        const responseBody = { success: true, videoUrl: result.video.url, model: FAL_MODEL };
        if (idempotencyKey) await setIdempotentResult(`${SCOPE}:${idempotencyKey}`, responseBody, 900);
        return NextResponse.json(responseBody);
      }
      if (statusData.status === 'FAILED') {
        auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'failed', reason: 'upstream_failed', durationMs: Date.now() - start });
        return NextResponse.json({ error: 'Video generation failed upstream' }, { status: 502 });
      }
    }
    auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'failed', reason: 'timeout', durationMs: Date.now() - start });
    return NextResponse.json({ error: 'Video generation timed out - try a shorter or simpler prompt' }, { status: 504 });
  } catch {
    auditPaidRequest({ scope: SCOPE, hashedKey: guard.hashedKey, provider: 'fal', model: FAL_MODEL, outcome: 'failed', reason: 'provider_unreachable', durationMs: Date.now() - start });
    return NextResponse.json({ error: 'Video provider could not be reached' }, { status: 502 });
  } finally {
    await releaseConcurrencySlot(SCOPE);
  }
}
