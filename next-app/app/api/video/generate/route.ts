import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getRateLimiter,
  verifyApiKey,
  getClientId,
  isProviderEnabled,
  logAuditEntry,
  acquireIdempotency,
  completeIdempotency,
  failIdempotency,
  hashBody,
} from '@/lib/server/security';

const RequestSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
});

const FAL_MODEL = 'fal-ai/kling-video/v1.6/standard/text-to-video';
const FAL_BASE = 'https://queue.fal.run';
const ALLOWED_FAL_ORIGINS = ['https://queue.fal.run', 'https://fal.run'];
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;
const VIDEO_RATE_LIMIT_PER_MINUTE = Number(process.env.VIDEO_RATE_LIMIT_PER_MINUTE) || 3;
const VIDEO_RATE_LIMIT_PER_DAY = Number(process.env.VIDEO_RATE_LIMIT_PER_DAY) || 10;
const VIDEO_TOTAL_TIMEOUT_MS = 75_000;

const limiter = getRateLimiter();

function isAllowedFalOrigin(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_FAL_ORIGINS.some((origin) => parsed.origin === origin);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const controller = new AbortController();
  const totalTimeout = setTimeout(() => controller.abort(), VIDEO_TOTAL_TIMEOUT_MS);

  let clientId = 'unknown';

  try {
    const rawBody = await req.text();
    if (rawBody.length > 1024 * 1024) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId: 'unknown',
        endpoint: '/api/video/generate',
        status: 'invalid_request',
        error: 'REQUEST_TOO_LARGE',
      });
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(rawBody);
    } catch {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId: 'unknown',
        endpoint: '/api/video/generate',
        status: 'invalid_request',
        error: 'INVALID_JSON',
      });
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(jsonBody);
    if (!parsed.success) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId: 'unknown',
        endpoint: '/api/video/generate',
        status: 'invalid_request',
        error: 'VALIDATION_FAILED',
      });
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { prompt } = parsed.data;

    clientId = getClientId(req);

    const auth = verifyApiKey(req);
    if (!auth.authenticated || auth.keyType !== 'studio') {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        status: 'unauthorized',
        error: 'AUTH_REQUIRED',
      });
      return NextResponse.json({ error: 'Authentication required for video generation', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    if (!isProviderEnabled('video')) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        status: 'forbidden',
        error: 'VIDEO_DISABLED',
      });
      return NextResponse.json(
        { error: 'Video generation is temporarily disabled', code: 'VIDEO_DISABLED' },
        { status: 403 }
      );
    }

    const perMinResult = await limiter.consume(`${clientId}:video:per_minute`, VIDEO_RATE_LIMIT_PER_MINUTE, 60_000);
    if (!perMinResult.allowed) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        status: 'rate_limited',
        error: 'RATE_LIMIT_EXCEEDED',
      });
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(perMinResult.retryAfter || 60) } }
      );
    }

    const perDayResult = await limiter.consume(`${clientId}:video:per_day`, VIDEO_RATE_LIMIT_PER_DAY, 24 * 60 * 60 * 1000);
    if (!perDayResult.allowed) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        status: 'rate_limited',
        error: 'DAILY_LIMIT_EXCEEDED',
      });
      return NextResponse.json(
        { error: 'Daily limit exceeded', code: 'DAILY_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': String(perDayResult.retryAfter || 3600) } }
      );
    }

    const falKey = process.env.FAL_API_KEY;
    if (!falKey) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        status: 'error',
        error: 'NOT_CONFIGURED',
      });
      return NextResponse.json({ error: 'Video generation is not configured on this server yet' }, { status: 503 });
    }

    const idempotencyKey = req.headers.get('x-idempotency-key');
    if (!idempotencyKey) {
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        status: 'invalid_request',
        error: 'IDEMPOTENCY_KEY_REQUIRED',
      });
      return NextResponse.json({ error: 'Idempotency key required for video generation', code: 'IDEMPOTENCY_KEY_REQUIRED' }, { status: 400 });
    }

    const idempotencyResult = await acquireIdempotency(idempotencyKey, { prompt, model: FAL_MODEL });
    if (!idempotencyResult.acquired) {
      const existing = idempotencyResult.existing;
      if (existing?.error === 'BODY_MISMATCH') {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          status: 'invalid_request',
          error: 'IDEMPOTENCY_BODY_MISMATCH',
        });
        return NextResponse.json({ error: 'Idempotency key reused with different request body', code: 'IDEMPOTENCY_BODY_MISMATCH' }, { status: 409 });
      }
      if (existing?.status === 'pending') {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
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
          endpoint: '/api/video/generate',
          status: 'success',
          error: 'IDEMPOTENCY_DUPLICATE',
        });
        const result = existing.result as { videoUrl?: string } | undefined;
        return NextResponse.json(
          { success: true, duplicate: true, videoUrl: result?.videoUrl, model: FAL_MODEL },
          { status: 200 }
        );
      }
      if (existing?.status === 'failed') {
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          status: 'error',
          error: 'IDEMPOTENCY_PREVIOUSLY_FAILED',
        });
        return NextResponse.json({ error: 'Previous request with this idempotency key failed', code: 'IDEMPOTENCY_PREVIOUSLY_FAILED' }, { status: 409 });
      }
    }

    await logAuditEntry({
      timestamp: Date.now(),
      clientId,
      endpoint: '/api/video/generate',
      provider: 'fal',
      model: FAL_MODEL,
      status: 'success',
    });

    try {
      const submit = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
        method: 'POST',
        headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!submit.ok) {
        await failIdempotency(idempotencyKey, new Error(`SUBMIT_FAILED_${submit.status}`));
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          provider: 'fal',
          model: FAL_MODEL,
          status: 'error',
          error: `SUBMIT_FAILED_${submit.status}`,
        });
        return NextResponse.json({ error: 'Video provider rejected the request' }, { status: 502 });
      }

      const { status_url, response_url } = (await submit.json()) as { status_url: string; response_url: string };
      if (!status_url || !response_url) {
        await failIdempotency(idempotencyKey, new Error('UNEXPECTED_RESPONSE'));
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          provider: 'fal',
          model: FAL_MODEL,
          status: 'error',
          error: 'UNEXPECTED_RESPONSE',
        });
        return NextResponse.json({ error: 'Video provider returned an unexpected response' }, { status: 502 });
      }

      if (!isAllowedFalOrigin(status_url) || !isAllowedFalOrigin(response_url)) {
        await failIdempotency(idempotencyKey, new Error('INVALID_FAL_ORIGIN'));
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          provider: 'fal',
          model: FAL_MODEL,
          status: 'error',
          error: 'INVALID_FAL_ORIGIN',
        });
        return NextResponse.json({ error: 'Video provider returned an invalid response URL' }, { status: 502 });
      }

      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

        const statusRes = await fetch(status_url, { headers: { Authorization: `Key ${falKey}` }, signal: controller.signal });
        if (!statusRes.ok) continue;

        const statusData = (await statusRes.json()) as { status: string };
        if (statusData.status === 'COMPLETED') {
          const resultRes = await fetch(response_url, { headers: { Authorization: `Key ${falKey}` }, signal: controller.signal });
          if (!resultRes.ok) {
            await failIdempotency(idempotencyKey, new Error('RESULT_FETCH_FAILED'));
            await logAuditEntry({
              timestamp: Date.now(),
              clientId,
              endpoint: '/api/video/generate',
              provider: 'fal',
              model: FAL_MODEL,
              status: 'error',
              error: 'RESULT_FETCH_FAILED',
            });
            return NextResponse.json({ error: 'Could not fetch the finished video' }, { status: 502 });
          }

          const result = (await resultRes.json()) as { video?: { url?: string } };
          if (!result.video?.url) {
            await failIdempotency(idempotencyKey, new Error('NO_VIDEO_URL'));
            await logAuditEntry({
              timestamp: Date.now(),
              clientId,
              endpoint: '/api/video/generate',
              provider: 'fal',
              model: FAL_MODEL,
              status: 'error',
              error: 'NO_VIDEO_URL',
            });
            return NextResponse.json({ error: 'Video provider returned no video' }, { status: 502 });
          }

          const videoUrl = result.video.url;
          if (!isAllowedFalOrigin(videoUrl)) {
            await failIdempotency(idempotencyKey, new Error('INVALID_VIDEO_URL_ORIGIN'));
            await logAuditEntry({
              timestamp: Date.now(),
              clientId,
              endpoint: '/api/video/generate',
              provider: 'fal',
              model: FAL_MODEL,
              status: 'error',
              error: 'INVALID_VIDEO_URL_ORIGIN',
            });
            return NextResponse.json({ error: 'Video provider returned an invalid video URL' }, { status: 502 });
          }

          await completeIdempotency(idempotencyKey, { videoUrl, model: FAL_MODEL });

          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/video/generate',
            provider: 'fal',
            model: FAL_MODEL,
            status: 'success',
          });

          return NextResponse.json({ success: true, videoUrl, model: FAL_MODEL });
        }

        if (statusData.status === 'FAILED') {
          await failIdempotency(idempotencyKey, new Error('UPSTREAM_FAILED'));
          await logAuditEntry({
            timestamp: Date.now(),
            clientId,
            endpoint: '/api/video/generate',
            provider: 'fal',
            model: FAL_MODEL,
            status: 'error',
            error: 'UPSTREAM_FAILED',
          });
          return NextResponse.json({ error: 'Video generation failed upstream' }, { status: 502 });
        }
      }

      await failIdempotency(idempotencyKey, new Error('TIMEOUT'));
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        provider: 'fal',
        model: FAL_MODEL,
        status: 'timeout',
        error: 'TIMEOUT',
      });

      return NextResponse.json({ error: 'Video generation timed out - try a shorter or simpler prompt' }, { status: 504 });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        await failIdempotency(idempotencyKey, err);
        await logAuditEntry({
          timestamp: Date.now(),
          clientId,
          endpoint: '/api/video/generate',
          provider: 'fal',
          model: FAL_MODEL,
          status: 'timeout',
          error: 'ROUTE_TIMEOUT',
        });
        return NextResponse.json({ error: 'Video generation timed out' }, { status: 504 });
      }
      await failIdempotency(idempotencyKey, err);
      await logAuditEntry({
        timestamp: Date.now(),
        clientId,
        endpoint: '/api/video/generate',
        provider: 'fal',
        model: FAL_MODEL,
        status: 'error',
        error: 'PROVIDER_UNREACHABLE',
      });
      return NextResponse.json({ error: 'Video provider could not be reached' }, { status: 502 });
    } finally {
      clearTimeout(totalTimeout);
    }
  } catch (err) {
    console.error('[Video Route] Unexpected error:', err);
    await logAuditEntry({
      timestamp: Date.now(),
      clientId,
      endpoint: '/api/video/generate',
      status: 'error',
      error: 'INTERNAL_ERROR',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}