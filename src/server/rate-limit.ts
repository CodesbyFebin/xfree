import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.resetAt <= now) store.delete(k);
  }
}, 60_000).unref?.();

function keyOf(req: Request, scope: string): string {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";
  const hashed = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return `${scope}:${hashed}`;
}

function hit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  b.count += 1;
  return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count), resetAt: b.resetAt };
}

export interface RateLimitOptions {
  scope: string;
  limit: number;
  windowMs: number;
}

export function rateLimit(opts: RateLimitOptions) {
  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = keyOf(req, opts.scope);
    const r = hit(key, opts.limit, opts.windowMs);
    res.setHeader("X-RateLimit-Limit", String(opts.limit));
    res.setHeader("X-RateLimit-Remaining", String(r.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(r.resetAt / 1000)));
    if (!r.allowed) {
      const retryAfter = Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "rate_limited",
        message: `Rate limit exceeded for ${opts.scope}. Retry after ${retryAfter}s.`,
      });
    }
    next();
  };
}

let globalDailyCount = 0;
let globalDailyResetAt = Date.now() + 86_400_000;

export function globalDailyGuard(limit: number) {
  return function globalDailyMiddleware(_req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    if (now >= globalDailyResetAt) {
      globalDailyCount = 0;
      globalDailyResetAt = now + 86_400_000;
    }
    globalDailyCount += 1;
    if (globalDailyCount > limit) {
      return res.status(503).json({
        error: "service_daily_cap_reached",
        message: "Daily AI usage cap reached for this deployment. Please try again tomorrow.",
      });
    }
    next();
  };
}
