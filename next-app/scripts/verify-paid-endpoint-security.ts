#!/usr/bin/env npx tsx
// Proves the P0 contract for the paid-provider endpoints (Venice/DeepSeek
// via /api/nvidia/chat, and /api/video/generate's fal.ai integration):
// an anonymous caller cannot spend provider credits on THIS deployment as
// it stands today (no UPSTASH_*, no *_ENABLED kill switch set).
//
// This is a unit-level test against lib/security/paidGuard.ts and
// rateLimiter.ts's *fail-closed defaults* - it does not spin up a real
// Upstash Redis instance or a live dev server, so it cannot exercise the
// origin-check / sliding-window / daily-quota paths once an operator
// actually configures Upstash and flips a kill switch on. That would need
// either a real Upstash sandbox or a mocked Redis client - flagged here
// as NOT COVERED rather than faked. Re-run this after any change to
// paidGuard.ts's ordering of checks.
import { checkPaidGuard } from "../lib/security/paidGuard";
import { rateLimiterConfigured } from "../lib/security/rateLimiter";
import { NextRequest } from "next/server";

const failures: string[] = [];
function check(label: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
}

function fakeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("https://www.xfree.in/api/nvidia/chat", {
    method: "POST",
    headers: new Headers({ "content-type": "application/json", ...headers }),
  });
}

async function main() {
  console.log("\n=== Environment precondition ===");
  check(
    "UPSTASH_REDIS_REST_URL/TOKEN are NOT set in this run (this is the real unconfigured-by-default state)",
    !process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_TOKEN,
    "if these ARE set in your shell, this test run doesn't reflect a fresh deployment - unset them and re-run",
  );
  check("rateLimiterConfigured reports false with no Upstash env vars", !rateLimiterConfigured);

  console.log("\n=== Kill switch: default-off blocks before touching Redis ===");
  delete process.env.NVIDIA_PAID_TIER_ENABLED;
  const r1 = await checkPaidGuard({
    scope: "test-nvidia-paid",
    req: fakeRequest(),
    killSwitchEnv: "NVIDIA_PAID_TIER_ENABLED",
    perIpLimit: 5,
    perIpWindowSeconds: 60,
    perIpDailyLimit: 30,
    globalDailyLimit: 200,
  });
  check("nvidia paid tier: unset kill switch -> blocked", !r1.ok, JSON.stringify(r1));
  check("nvidia paid tier: blocked with PROVIDER_DISABLED specifically (not a Redis error)", !r1.ok && r1.code === "PROVIDER_DISABLED");
  check("nvidia paid tier: blocked with 503, not a silent pass-through", !r1.ok && r1.status === 503);

  delete process.env.VIDEO_GENERATION_ENABLED;
  const r2 = await checkPaidGuard({
    scope: "test-video-generate",
    req: fakeRequest(),
    killSwitchEnv: "VIDEO_GENERATION_ENABLED",
    perIpLimit: 2,
    perIpWindowSeconds: 300,
    perIpDailyLimit: 5,
    globalDailyLimit: 50,
  });
  check("video generation: unset kill switch -> blocked", !r2.ok, JSON.stringify(r2));
  check("video generation: blocked with PROVIDER_DISABLED specifically", !r2.ok && r2.code === "PROVIDER_DISABLED");

  console.log("\n=== Flipping the kill switch alone is still not enough ===");
  process.env.NVIDIA_PAID_TIER_ENABLED = "true";
  const r3 = await checkPaidGuard({
    scope: "test-nvidia-paid-2",
    req: fakeRequest(),
    killSwitchEnv: "NVIDIA_PAID_TIER_ENABLED",
    perIpLimit: 5,
    perIpWindowSeconds: 60,
    perIpDailyLimit: 30,
    globalDailyLimit: 200,
  });
  check(
    "kill switch = true but Upstash still unconfigured -> still blocked (RATE_LIMITER_NOT_CONFIGURED)",
    !r3.ok && r3.code === "RATE_LIMITER_NOT_CONFIGURED",
    JSON.stringify(r3),
  );
  delete process.env.NVIDIA_PAID_TIER_ENABLED;

  console.log("\n=== Truthy-but-wrong kill switch values don't enable anything ===");
  for (const value of ["1", "yes", "TRUE", "enabled", ""]) {
    process.env.NVIDIA_PAID_TIER_ENABLED = value;
    const r = await checkPaidGuard({
      scope: "test-nvidia-paid-3",
      req: fakeRequest(),
      killSwitchEnv: "NVIDIA_PAID_TIER_ENABLED",
      perIpLimit: 5,
      perIpWindowSeconds: 60,
      perIpDailyLimit: 30,
      globalDailyLimit: 200,
    });
    check(`kill switch value "${value}" (only the literal string "true" should pass) -> still blocked`, !r.ok && r.code === "PROVIDER_DISABLED", JSON.stringify(r));
  }
  delete process.env.NVIDIA_PAID_TIER_ENABLED;

  console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `${failures.length} CHECK(S) FAILED`}\n`);
  console.log("NOT COVERED by this script (needs a real/mocked Upstash Redis): origin allowlist rejection, per-IP sliding-window limiting, per-IP and global daily quota enforcement, idempotency replay, video concurrency-slot capping. These paths only activate once an operator configures UPSTASH_REDIS_REST_URL/TOKEN, at which point they should be exercised against a real deployment before enabling any *_ENABLED kill switch in production.\n");
  if (failures.length > 0) process.exit(1);
}

main();
