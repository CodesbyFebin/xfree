import { NextRequest } from "next/server";
import crypto from "crypto";
import { checkRateLimit, decrementDurableCounter, incrementDurableCounter, rateLimiterConfigured } from "./rateLimiter";

const DAY_SECONDS = 86_400;

export interface PaidGuardOptions {
  /** Unique namespace for this protected operation, e.g. "nvidia-paid", "video-generate". */
  scope: string;
  req: NextRequest;
  /** Env var name that must literally be "true" for this provider tier to run at all. */
  killSwitchEnv: string;
  perIpLimit: number;
  perIpWindowSeconds: number;
  perIpDailyLimit: number;
  globalDailyLimit: number;
}

export type PaidGuardResult =
  | { ok: true; hashedKey: string }
  | { ok: false; status: number; code: string; error: string; retryAfterSeconds?: number };

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

// Real per-user authentication (accounts/login) is a separate product
// decision this guard does not make unilaterally - see docs/SECURITY_MODEL.md.
// This is a narrower, honest control: reject requests that don't carry an
// Origin/Referer naming an XFree host, which blocks casual/scripted
// cross-site abuse (a bot hitting the API directly with curl, or another
// site embedding a form that posts here) without pretending to be real
// authentication - a determined attacker can still forge these headers.
const ALLOWED_HOSTS = new Set(["www.xfree.in", "xfree.in", "app.xfree.in", "localhost", "127.0.0.1"]);

function originAllowed(req: NextRequest): boolean {
  for (const header of ["origin", "referer"]) {
    const value = req.headers.get(header);
    if (!value) continue;
    try {
      const host = new URL(value).hostname;
      if (ALLOWED_HOSTS.has(host)) return true;
    } catch {
      // malformed header - ignore, fall through to the next candidate
    }
  }
  return false;
}

/**
 * Composite guard for anonymous-but-paid endpoints. Order matters: kill
 * switch and configuration checks happen before touching Redis at all, so
 * an unconfigured/disabled deployment never makes network calls just to
 * reject a request.
 *
 * Fails CLOSED at every step - any ambiguous state (limiter not
 * configured, origin unverifiable) is treated as "block", matching the
 * "keep provider credentials disabled until this gate passes" contract.
 */
export async function checkPaidGuard(opts: PaidGuardOptions): Promise<PaidGuardResult> {
  if (process.env[opts.killSwitchEnv] !== "true") {
    return { ok: false, status: 503, code: "PROVIDER_DISABLED", error: "This paid provider tier is disabled on this deployment." };
  }

  if (!rateLimiterConfigured) {
    return {
      ok: false,
      status: 503,
      code: "RATE_LIMITER_NOT_CONFIGURED",
      error: "Paid provider execution requires a configured distributed rate limiter (UPSTASH_REDIS_REST_URL/TOKEN) and is disabled without one.",
    };
  }

  if (!originAllowed(opts.req)) {
    return { ok: false, status: 403, code: "ORIGIN_NOT_ALLOWED", error: "Request origin could not be verified." };
  }

  const hashedKey = hashIp(clientIp(opts.req));

  const perIp = await checkRateLimit(opts.scope, hashedKey, opts.perIpLimit, opts.perIpWindowSeconds);
  if (!perIp.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((perIp.resetAt - Date.now()) / 1000));
    return { ok: false, status: 429, code: "RATE_LIMITED", error: "Too many requests. Please slow down.", retryAfterSeconds };
  }

  const dailyCount = await incrementDurableCounter(`xfree:daily:${opts.scope}:ip:${hashedKey}`, DAY_SECONDS);
  if (dailyCount > opts.perIpDailyLimit) {
    return { ok: false, status: 429, code: "DAILY_QUOTA_EXCEEDED", error: "Daily request quota exceeded for this client." };
  }

  const globalCount = await incrementDurableCounter(`xfree:daily:${opts.scope}:global`, DAY_SECONDS);
  if (globalCount > opts.globalDailyLimit) {
    return { ok: false, status: 503, code: "GLOBAL_DAILY_CAP_REACHED", error: "Daily usage cap reached for this deployment. Please try again tomorrow." };
  }

  return { ok: true, hashedKey };
}

const CONCURRENCY_SAFETY_TTL_SECONDS = 300;

/** In-flight job counter for operations that hold a connection open for a
 *  long time (video generation's polling loop). Always release in a
 *  `finally` block; the TTL is a self-heal in case a process crashes
 *  before releasing. */
export async function acquireConcurrencySlot(scope: string, maxConcurrent: number): Promise<boolean> {
  const key = `xfree:concurrency:${scope}`;
  const count = await incrementDurableCounter(key, CONCURRENCY_SAFETY_TTL_SECONDS);
  if (count > maxConcurrent) {
    await decrementDurableCounter(key);
    return false;
  }
  return true;
}

export async function releaseConcurrencySlot(scope: string): Promise<void> {
  await decrementDurableCounter(`xfree:concurrency:${scope}`);
}
