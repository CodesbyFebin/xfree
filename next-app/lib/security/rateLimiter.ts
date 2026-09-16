import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Distributed rate limiting backed by Upstash Redis (REST-based, so it
// works from Vercel serverless/edge without connection pooling). An
// in-memory Map cannot do this job on Vercel - each serverless invocation
// can land on a different instance, so an in-memory counter is trivially
// bypassed by anyone making concurrent requests. See contact/route.ts for
// an existing in-memory limiter that is fine for its lower-stakes spam
// use case but must never be the model for paid-provider protection.
//
// Deliberately fails CLOSED, not open: when UPSTASH_REDIS_REST_URL /
// UPSTASH_REDIS_REST_TOKEN aren't set, `configured` is false and callers
// (see paidGuard.ts) must treat that as "paid execution disabled", not
// "skip the check". This is what keeps paid providers hard-disabled by
// default until an operator actually provisions Upstash and sets the
// env vars - no separate "kill switch" env var can be forgotten because
// there is no path to enabled without this being configured.
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;
export const rateLimiterConfigured = redis !== null;

const limiters = new Map<string, Ratelimit>();

/** One sliding-window limiter per (scope, limit, windowSeconds) triple,
 *  cached so repeated calls reuse the same Ratelimit instance rather than
 *  re-registering scripts with Redis on every request. */
function getLimiter(scope: string, limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${scope}:${limit}:${windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `xfree:ratelimit:${scope}`,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/** Returns { allowed: false } when Redis isn't configured - callers must
 *  not treat that as "allowed" for paid-provider guards. */
export async function checkRateLimit(scope: string, key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const limiter = getLimiter(scope, limit, windowSeconds);
  if (!limiter) {
    return { allowed: false, remaining: 0, resetAt: Date.now() };
  }
  const result = await limiter.limit(key);
  return { allowed: result.success, remaining: result.remaining, resetAt: result.reset };
}

/** Durable counter for daily/global caps (e.g. total paid-provider spend
 *  guard shared across every visitor and every serverless instance).
 *  Uses INCR + a TTL set only on first write so the window resets exactly
 *  `windowSeconds` after the first hit, not a fixed clock boundary. */
export async function incrementDurableCounter(key: string, windowSeconds: number): Promise<number> {
  if (!redis) return Number.POSITIVE_INFINITY;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count;
}

export async function getDurableCounter(key: string): Promise<number> {
  if (!redis) return Number.POSITIVE_INFINITY;
  const value = await redis.get<number>(key);
  return value ?? 0;
}

export async function decrementDurableCounter(key: string): Promise<void> {
  if (!redis) return;
  const value = await redis.decr(key);
  if (value < 0) await redis.set(key, 0);
}

/** Idempotency cache: stores a JSON-serializable result under a
 *  caller-supplied key for `ttlSeconds`, so a retried/duplicated request
 *  (double-click, client retry-on-timeout) replays the cached result
 *  instead of re-executing a paid provider call. */
export async function getIdempotentResult<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  return redis.get<T>(`xfree:idempotency:${key}`);
}

export async function setIdempotentResult<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  await redis.set(`xfree:idempotency:${key}`, value, { ex: ttlSeconds });
}
