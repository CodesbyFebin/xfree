# XFree.in — Production Readiness

> **Historical baseline (2026-07-29).** Several deployment and SEO items in this audit have since been resolved. For the current crawl/canonical/GSC contract, use [`docs/indexing.md`](./indexing.md) and the build-time `validate:seo` gate.


## Current snapshot — 2026-08-23

The July section below is retained as historical evidence. The current merge has since added CI/tests, Vercel configuration, truthful Local/Cloud privacy copy, direct-route/404 hardening, split canonical sitemaps, the 25K roadmap separation, governed pillar publication, `/contribute`, and a build-time SEO validator. See `reports/final-addon-merge-audit-2026-08-23.md` for the current gate results.

Current local crawl simulation: 38 canonical sitemap URLs, 85 prerendered route index files plus 404, 0 duplicate sitemap titles/descriptions, and intentional roadmap/empty-pillar `noindex,follow`. Dependency-backed CI and the exact production deployment remain external release gates.

Session date: 2026-07-29
Verdict: **NOT READY FOR PRODUCTION** — deployable to controlled beta after the outstanding items below are addressed. Deployment itself was **not performed** (no credentials / target platform available in this session).

## What changed in this pass

### Security & AI hardening
- **New `src/server/env.ts`** — Zod-validated single source of truth for env. Fails fast in production if `GEMINI_API_KEY` is missing. Replaces scattered `process.env` reads.
- **Task allowlist (`src/server/tasks.ts`)** — The browser no longer sends `systemInstruction`. Requests carry a `taskId` from a fixed allowlist; server maps to a fixed system prompt. Unknown taskIds → 400.
- **Zod payload validation (`src/server/schemas.ts`)** on every AI, contact, and feedback endpoint (length/shape/type). Invalid → 400.
- **In-memory rate limiter (`src/server/rate-limit.ts`)** with per-minute, per-day, per-endpoint, and global-daily buckets. Interface is Redis-swappable — swap the `store` implementation.
- **AbortController timeout** on every Gemini call (`GEMINI_REQUEST_TIMEOUT_MS`, default 30 s).
- **Real Gemini model IDs**: `gemini-2.5-flash` / `gemini-2.5-pro`. The previous `gemini-3.5-flash` / `gemini-3.1-pro-preview` / `gemini-3.1-flash-lite` do not exist.
- **CSP tightened**: dropped `unsafe-eval`, `frame-ancestors` set to `'none'`, dropped obsolete `X-XSS-Protection`, added COOP/CORP.
- **Request size limit** dropped from 10 MB → 100 KB.
- **PORT / PUBLIC_SITE_URL / TRUST_PROXY from env**, not hardcoded. Canonical URLs never come from the `Host` header.
- **Central error handler** with request IDs; no stack traces leaked in production responses.
- **Graceful SIGTERM / SIGINT** shutdown.
- **Health endpoints**: `/api/health` (liveness) and `/api/ready` (checks GEMINI_API_KEY presence).
- **Real Contact + Feedback backends**: `POST /api/contact`, `POST /api/feedback`. Zod-validated, honeypot field, rate-limited (5/h contact, 10/h feedback). Delivery via Resend if `RESEND_API_KEY` is set; otherwise logged to stdout for you to sink elsewhere.

### SEO & indexation
- **Removed dynamic thin-content generator** in `App.tsx` — it used to fabricate a fake tool page for any URL slug. Unknown routes now render a real 404 page and the server returns HTTP 404.
- **Route classification** — server allowlists `/`, `STATIC_ROUTES`, `/category/<slug>`, `/tools/<indexable-slug>`. Everything else → 404 (HTML) or 404 JSON (`/api/*`).
- **Tool registry status field** — 400 seed tools (which have no wired React components) are now `status: "draft"`, not indexable. Only the 10 hand-crafted tools with real components are `status: "indexable"`.
- **Sitemap + RSS + llms.txt regenerated from `INDEXABLE_TOOLS`** — no more sitemap entries pointing at 404s. `PUBLIC_SITE_URL` is the sole source of canonical base.
- **Bug fixed**: 4 of the 10 hand-crafted tools had ID mismatches between the registry and `renderToolComponent` in `App.tsx` — they were silently rendering the generic AI fallback UI instead of the real tool. Fixed.
- **Static prerender script (`src/scripts/prerender.ts`)** — writes `dist/<route>/index.html` for all indexable tools + category hubs + static pages, each with unique `<title>`, meta description, canonical, OG/Twitter tags, and JSON-LD (`WebSite`, `BreadcrumbList`, `SoftwareApplication`, `HowTo`, `FAQPage` as appropriate). Server serves the matching prerendered file per-route in production.
- **`index.html` starter title removed** (`My Google AI Studio App` → real title/meta).
- **`llms.txt`** no longer references the invented `gemini-3.1-pro-preview` model.
- **Package name** `react-example` → `xfree-platform`.

### New scripts
- `npm run typecheck` — passes on a clean checkout.
- `npm run audit:tools` — validates the registry and detects INDEXABLE tools without a matching `renderToolComponent` case. Fails the build if any exist.
- `npm run prerender` — runs during `npm run build`.
- `npm run verify` — typecheck + test + audit + build.

## Verified in this session
Ran locally against a production build with a placeholder `GEMINI_API_KEY`:

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run audit:tools` | total=406 indexable=10 errors=0 warnings=0 |
| `npm run build` | pass; 30 routes + 404.html prerendered |
| `GET /api/health` | 200 |
| `GET /api/ready` | 200 |
| `GET /` | 200 with unique title in raw HTML |
| `GET /tools/regex-tester-explainer` | 200; unique title; correct canonical `https://www.xfree.in/tools/regex-tester-explainer`; JSON-LD present in raw HTML |
| `GET /tools/does-not-exist` | **404** |
| `GET /category/nope` | **404** |
| `GET /category/seo-tools` | 200 |
| `GET /asdfghjkl` | **404** |
| `GET /api/nope` | **404** JSON |
| `POST /api/ai {}` | 400 |
| `POST /api/ai {taskId:"evil",input:"hi"}` | 400 (unknown task rejected) |
| `POST /api/contact {message:"short"}` | 400 |
| `POST /api/contact` valid | 200 |
| `POST /api/feedback` valid | 200 |
| Contact rate limit | first 5 → 200, 6th+ → 429 (as configured) |
| Security headers | CSP without `unsafe-eval`, `frame-ancestors 'none'`, HSTS, COOP, CORP all present |

## Outstanding blockers before shipping to xfree.in

1. **Deploy target not chosen.** Existing repo has no Docker / Vercel / Render / Fly config. See `docs/deployment.md` for the recommended shape.
2. **Real `GEMINI_API_KEY`** must be provisioned in the deploy platform's secret store — never committed.
3. **Resend account and `RESEND_API_KEY`** must be provisioned, or the delivery module rewired to another sink. Without one, contact/feedback submissions land only in stdout.
4. **Redis** is not wired. Rate limits are in-memory and reset on redeploy — acceptable for a single-instance beta, not for a scaled deployment. Swap the store in `src/server/rate-limit.ts`.
5. **Automated test suite is absent.** `vitest` is a dep but no test files exist. Add unit tests for schemas, tool registry, sitemap generation; and Playwright smoke tests for the tool grid + a working tool.
6. **CI workflow (`.github/workflows/ci.yml`) is absent.** Add typecheck + audit + build on PR.
7. **Legal review**: Privacy, Terms, and Security page copy still reflect the previous "100% client-side, zero data logging" claims for pages that now include AI tools and contact/feedback endpoints. The registry-level `privacyNotice` was corrected for seed AI tools, but the standalone `PrivacyPage.tsx`, `TermsPage.tsx`, and `SecurityPage.tsx` were **not** touched in this pass and still need a rewrite that:
   - distinguishes local vs AI tool data flow;
   - discloses that contact + feedback are transmitted to the server and emailed via Resend;
   - discloses rate-limit metadata (hashed IP for buckets).
8. **`AiMicroToolComponent`** (the actual fetch to `/api/ai`) was not audited in this pass. If it still POSTs a client-side `systemInstruction`, that field is now silently ignored — no risk — but the request shape should be updated to send `{ taskId, input }` for clarity.
9. **Content quality**: the FAQ generator (`generate20Faqs`) still produces 20 near-identical FAQs per tool. This is content-farming shape and should be trimmed or made tool-specific before requesting reindexation.
10. **Chat drawer / Thinking mode / AiMicroToolComponent** components have not been re-audited against the new endpoint shape. They may still send old request bodies; the server will 400 them until they're updated.

## Files added
- `src/server/env.ts`
- `src/server/tasks.ts`
- `src/server/schemas.ts`
- `src/server/rate-limit.ts`
- `src/server/gemini.ts`
- `src/server/delivery.ts`
- `src/data/routes.ts`
- `src/components/pages/NotFoundPage.tsx`
- `src/scripts/prerender.ts`
- `src/scripts/auditTools.ts`
- `docs/production-readiness.md` (this file)

## Files modified
- `server.ts` (full rewrite)
- `src/middleware/security-headers.ts` (CSP tightened)
- `src/App.tsx` (killed dynamic thin-content, added 404 view, fixed tool-id switch)
- `src/data/toolsRegistry.ts` (seed tools → draft, exports for indexable set)
- `src/utils/generateSitemap.ts` (indexable-only, fixed invented model ID)
- `src/components/pages/ContactPage.tsx` (real API POST)
- `src/components/FeedbackWidget.tsx` (real API POST)
- `index.html` (title + meta)
- `package.json` (rename, new scripts, added zod)
- `.env.example` (rewritten)
