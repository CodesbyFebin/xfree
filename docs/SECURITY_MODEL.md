# XFree Security Model

Session date: 2026-09-10. Covers `next-app` (production, `www.xfree.in` +
Studio's backend) and `public/studio` (`app.xfree.in`). Does not re-document
the legacy root Express app's security model (`docs/production-readiness.md`
covers that codepath, which is deployed but not publicly reachable - see
`docs/PRODUCTION_ARCHITECTURE.md`).

## Paid-provider endpoints

`POST /api/nvidia/chat`'s Venice/DeepSeek tier and `POST /api/video/generate`
(fal.ai) are anonymous, public endpoints that can spend real provider credit.
As of this pass, **no provider API key or Upstash Redis credential is
configured in `xfree-web`'s production environment at all** (confirmed via
`vercel env ls production` - zero variables set), so neither tier is
reachable today regardless of the controls below. The controls exist so that
adding a key later doesn't silently reopen the exposure.

Implemented in `next-app/lib/security/{rateLimiter,paidGuard,audit}.ts`:

- **Kill switch per tier** (`NVIDIA_PAID_TIER_ENABLED`, `VIDEO_GENERATION_ENABLED`)
  - must be the literal string `"true"`; unset, `"1"`, `"yes"`, `"TRUE"` etc.
  all keep it disabled. Verified by `npm run verify:paid-security`.
- **Fails closed on missing infrastructure**: if `UPSTASH_REDIS_REST_URL`/
  `UPSTASH_REDIS_REST_TOKEN` aren't set, both tiers return `503
  RATE_LIMITER_NOT_CONFIGURED` even with the kill switch on and a provider key
  present. There is no code path that reaches a paid provider without a
  configured distributed limiter.
- **Origin/Referer allowlist** (`www.xfree.in`, `app.xfree.in`, `xfree.in`,
  `localhost`) - blocks direct script/curl abuse missing both headers. This is
  **not real authentication** - a determined attacker can forge these
  headers. Real per-user auth (accounts, a login flow) is a separate product
  decision not made unilaterally here; if wanted, it needs the operator to
  choose a mechanism (email magic link, OAuth, manually issued API keys).
- **Per-IP sliding-window rate limit + per-IP and global daily quota
  counters**, Upstash Redis-backed (`@upstash/ratelimit` + `@upstash/redis`,
  REST-based - works across Vercel's independent serverless instances, unlike
  an in-memory `Map`, which cannot enforce anything across concurrent
  invocations).
- **Idempotency**: an optional `Idempotency-Key` request header replays a
  cached result instead of re-executing a paid call, for retried/duplicated
  submits.
- **Video-specific concurrency cap** (`VIDEO_MAX_CONCURRENT_JOBS`, default 3):
  bounds simultaneous fal.ai jobs *and* simultaneous held-open serverless
  functions (the polling loop holds a function for up to ~60s per request).
- **Tighter output cap on the paid tier** (1024 tokens vs. the free/auto
  cascade's 4096 zod ceiling).
- **Structured audit log** (`lib/security/audit.ts`): scope, hashed IP
  (SHA-256, truncated), provider, model, outcome, duration - never prompt
  bodies or replies. Lands in Vercel's function logs.
- **Correct status codes**: `503` (disabled/unconfigured/global cap), `429`
  (rate limited/quota/concurrency), `403` (origin), `400` (schema, pre-existing
  via zod), `502` (upstream failure, pre-existing).

**Not covered by automated tests in this pass**: the sliding-window limiter,
daily quotas, origin rejection, idempotency replay, and concurrency capping
all require a real or mocked Upstash Redis to exercise - `verify:paid-security`
proves the fail-closed *default* state only, and says so in its own output.
Before ever setting a `*_ENABLED=true` in production, exercise these against
a real (or staging) Upstash instance first.

## Contact endpoint

`POST /api/contact` now prefers the same Upstash-backed limiter when
configured, falling back to the pre-existing in-memory bucket otherwise.
Unlike the paid endpoints, this **degrades rather than fails closed** -
contact-form spam is a nuisance, not a financial exposure, so keeping the
form working without Upstash configured is the right tradeoff.

## Headers

One authoritative CSP per surface, set via real HTTP headers, not `<meta>`:

- `www.xfree.in`: `next-app/next.config.js`'s `headers()`. No `unsafe-eval`
  (React only needs it in dev mode; verified via a clean `next build && next
  start` with no console eval errors). `unsafe-inline` remains on
  `script-src`/`style-src` - see "Deferred: nonce-based CSP" below. A second,
  conflicting `<meta httpEquiv="Content-Security-Policy">` in
  `app/[locale]/layout.tsx` (allowlisting unused hosts:
  `pagead2.googlesyndication.com`, `api.github.com`, `cdn.tailwindcss.com`,
  `cdn.jsdelivr.net`) was found and removed, along with a COEP meta tag
  (browsers don't support COEP via meta at all) and a `frame-ancestors` meta
  directive (explicitly ignored by browsers when set via meta - Chrome logs
  this).
- `app.xfree.in`: had **no CSP at all** - a code comment claimed one was
  enforced by `src/middleware/security-headers.ts`, but that's Express
  middleware from the legacy app and never runs for this project (static
  deployment, no Node runtime). Added a real CSP via `public/studio/vercel.json`,
  scoped to what the page actually uses (self + inline scripts/styles,
  self-hosted fonts under `/studio/fonts/`, a loopback `connect-src`
  exception for the optional client-side Ollama fallback). Not yet deployed -
  see `docs/PRODUCTION_ARCHITECTURE.md`'s deployment-provenance section.
- `X-Powered-By` disabled (`poweredByHeader: false`).
- `images.remotePatterns` no longer wildcards every host (`hostname: '**'`) -
  no page uses a remote `next/image` source today, so it's an empty
  allowlist; add real entries only when a remote image source is actually
  wired up.

## Deferred: nonce-based CSP

Both surfaces keep `'unsafe-inline'` on `script-src`. Removing it properly
needs per-request nonces:

- **`app.xfree.in`** is a static HTML file with no per-request server
  runtime - there's nowhere to mint a nonce without introducing an edge
  function, which would be real architecture churn for this pass.
- **`next-app`** does have a request-time hook (`proxy.ts` - Next 16 renamed
  `middleware.ts`; see `next-app/AGENTS.md`), which already runs next-intl's
  locale-routing middleware for every non-static request across all 10
  locales. Threading a nonce through it (forwarding a request header,
  merging with next-intl's own `NextResponse`) and updating every
  `dangerouslySetInnerHTML` call site (JSON-LD in `layout.tsx`, the tools and
  pillars pages, `Breadcrumbs.tsx`) is a real, scoped follow-up - not
  something to bolt onto an unrelated headers-hardening pass against the one
  file that makes locale routing work for the whole site.

## Legacy app's own security posture (unchanged, not re-audited here)

`src/middleware/security-headers.ts` and `src/server/rate-limit.ts` back the
legacy Express app (project `xfree`, SSO-gated, `noindex`, no custom domain).
Its rate limiter is also in-memory-only, which would be the same "doesn't
work across instances" problem if this app were ever made public again - not
urgent while it stays behind Vercel's own SSO wall.
