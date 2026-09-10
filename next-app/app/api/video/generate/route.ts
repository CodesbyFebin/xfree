import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRateLimiter, getClientId, isProviderEnabled, logAuditEntry } from '@/lib/server/security';

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

// Rate limiting configuration for video generation
const VIDEO_RATE_LIMIT_PER_MINUTE = 3;
const VIDEO_RATE_LIMIT_PER_DAY = 10;

const limiter = getRateLimiter();

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  // Kill switch for video generation
  if (!isProviderEnabled('video')) {
    return NextResponse.json(
      { error: 'Video generation is temporarily disabled', code: 'VIDEO_DISABLED' },
      { status: 403 }
    );
  }

  // Per-client rate limiting
  const perMinResult = await limiter.consume(`${clientId}:video:per_minute`, VIDEO_RATE_LIMIT_PER_MINUTE, 60_000);
  if (!perMinResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(perMinResult.retryAfter || 60) } }
    );
  }

  const perDayResult = await limiter.consume(`${clientId}:video:per_day`, VIDEO_RATE_LIMIT_PER_DAY, 24 * 60 * 60 * 1000);
  if (!perDayResult.allowed) {
    return NextResponse.json(
      { error: 'Daily limit exceeded', code: 'DAILY_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(perDayResult.retryAfter || 3600) } }
    );
  }

  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    return NextResponse.json({ error: 'Video generation is not configured on this server yet' }, { status: 503 });
  }

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { prompt } = parsed.data;

  // Request size limit validation
  if (prompt.length > 500) {
    return NextResponse.json({ error: 'Prompt too long' }, { status: 400 });
  }

  // Idempotency key support
  const idempotencyKey = req.headers.get('x-idempotency-key');
  if (idempotencyKey) {
    console.log(`[idempotency] Video generation key: ${idempotencyKey.slice(0, 16)}...`);
  }

  const controller = new AbortController();
  const totalTimeout = setTimeout(() => controller.abort(), 75_000); // 75s total (submission + polling)

  try {
    const submit = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
      method: 'POST',
      headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    if (!submit.ok) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        provider: 'fal',
        status: 'error',
        error: `SUBMIT_FAILED_${submit.status}`,
      });
      return NextResponse.json({ error: 'Video provider rejected the request' }, { status: 502 });
    }
    const { status_url, response_url } = (await submit.json()) as { status_url: string; response_url: string };
    if (!status_url || !response_url) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        provider: 'fal',
        status: 'error',
        error: 'UNEXPECTED_RESPONSE',
      });
      return NextResponse.json({ error: 'Video provider returned an unexpected response' }, { status: 502 });
    }

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const statusRes = await fetch(status_url, { headers: { Authorization: `Key ${falKey}` }, signal: controller.signal });
      if (!statusRes.ok) continue;
      const statusData = (await statusRes.json()) as { status: string };
      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(response_url, { headers: { Authorization: `Key ${falKey}` }, signal: controller.signal });
        if (!resultRes.ok) {
          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/video/generate',
            provider: 'fal',
            status: 'error',
            error: 'RESULT_FETCH_FAILED',
          });
          return NextResponse.json({ error: 'Could not fetch the finished video' }, { status: 502 });
        }
        const result = (await resultRes.json()) as { video?: { url?: string } };
        if (!result.video?.url) {
          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/video/generate',
            provider: 'fal',
            status: 'error',
            error: 'NO_VIDEO_URL',
          });
          return NextResponse.json({ error: 'Video provider returned no video' }, { status: 502 });
        }
        
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          provider: 'fal',
          status: 'success',
        });
        
        return NextResponse.json({ success: true, videoUrl: result.video.url, model: FAL_MODEL });
      }
      if (statusData.status === 'FAILED') {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          provider: 'fal',
          status: 'error',
          error: 'UPSTREAM_FAILED',
        });
        return NextResponse.json({ error: 'Video generation failed upstream' }, { status: 502 });
      }
    }
    
    await logAuditEntry({
      timestamp: Date.now(),
      clientId,
      endpoint: '/api/video/generate',
      provider: 'fal',
      status: 'error',
      error: 'TIMEOUT',
    });
    
    return NextResponse.json({ error: 'Video generation timed out - try a shorter or simpler prompt' }, { status: 504 });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Video generation timed out' }, { status: 504 });
    }
    await logAuditEntry({
      timestamp: Date.now(),
      clientId,
      endpoint: '/api/video/generate',
      provider: 'fal',
      status: 'error',
      error: 'PROVIDER_UNREACHABLE',
    });
    return NextResponse.json({ error: 'Video provider could not be reached' }, { status: 502 });
  } finally {
    clearTimeout(totalTimeout);
  }
}
