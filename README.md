# XFree.in

> **⚠️ This checkout is a standalone local prototype, not production.** See
> [PROTOTYPE.md](PROTOTYPE.md) before assuming anything below reflects the real,
> currently-deployed [github.com/CodesbyFebin/xfree](https://github.com/CodesbyFebin/xfree). The
> badges below link to that real repo's CI for reference only — they do not reflect this checkout.

[![CI](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml/badge.svg)](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](tsconfig.json)

Free browser-based developer, SEO, and single-purpose AI micro-tools. Live at [https://www.xfree.in](https://www.xfree.in).

## What this actually is

- **10 hand-authored tools** (JSON formatter, regex tester, cron generator, base64/JWT decoder, URL/UTM builder, meta-tag preview, schema-markup generator, robots.txt generator, XML sitemap generator, bulk URL extractor). Each has a real React component, unique long-form guide, and per-page JSON-LD.
- **4 published guides** at `/guides/*` (regex cheat sheet, cron examples, common JSON errors, canonical vs 301).
- **A `/xfree-app/` PWA-install page** — the site is installable as a Progressive Web App via `site.webmanifest`.
- **Optional server-side Cloud AI** using Google Gemini and NVIDIA NIM. Provider keys never touch the browser; cloud processing is opt-in and clearly labelled.
- **XFree Studio at `/studio`** with Local Mode as the default and dynamic NVIDIA model discovery when Cloud Mode is enabled.
- **A `/api/contact`, `/api/feedback`, `/api/lead` set** with Zod validation, honeypot fields, and per-IP rate limits. Delivery via Resend when `RESEND_API_KEY` is set, otherwise logged.
- **A ~400-entry seed registry of tool ideas** (`src/scripts/tools-seed.json`). These are `status: "draft"` — they have no working component and their routes return HTTP 404 until they're implemented. They are **not** in the sitemap and **not** claimed as live tools anywhere.

## What this deliberately isn't

- **Not "400+ working tools."** Ten. The rest are stubs excluded from every public surface.
- **Not fully client-side.** Local tools process input in-browser; AI tools proxy to Gemini; the site itself loads Google AdSense which sets advertising cookies. The Privacy page is honest about all of this.
- **Not a Next.js app.** Vite + React on the client, Express on the server, deployed as a Vercel serverless function plus prerendered static HTML.

## Stack

React 19 · TypeScript · Vite 6 · Express 4 · Tailwind 4 · Zod · `@google/genai` · Vercel serverless.

## Repository layout

```
api/index.ts              Vercel serverless entry (wraps the Express app)
server.ts                 Local dev entry — Vite middleware + Express
src/
  server/                 env, tasks allowlist, Zod schemas, rate limiter, Gemini client, delivery
  data/                   toolsRegistry.ts, guides.ts, toolGuides.ts, routes.ts, clustersData.ts
  components/             React UI. `tools/*` are the wired tool components; `pages/*` are static pages
  scripts/                prerender, generateSitemap, auditTools, lintNoindex, pingIndexNow, generateTool, generateGuides
  middleware/             securityHeadersMiddleware (Express)
  utils/                  generateSitemap, recommendTool, exportUtils
  hooks/                  useMetaTags (legacy — most metadata is emitted by the prerender)
public/                   ads.txt, robots.txt (build-generated), sitemap.xml (build-generated),
                          site.webmanifest, favicon set, IndexNow key file
docs/                     production-readiness.md, deploy-vercel.md, indexing.md, content.md
vercel.json               Build command, cleanUrls, function config, static-file security headers
```

## Local dev

```bash
git clone https://github.com/CodesbyFebin/xfree.git
cd xfree
npm ci
cp .env.example .env
# open .env and set GEMINI_API_KEY if you want AI endpoints to work locally
npm run dev
```

Dev server listens on `PORT` (default 3000). Vite handles HMR through the Express middleware.

## Environment variables

Every var is defined and validated in [`src/server/env.ts`](src/server/env.ts). The full annotated list is in [`.env.example`](.env.example). Highlights:

- `PUBLIC_SITE_URL` — canonical base for prerender + sitemap + IndexNow. Production is `https://www.xfree.in`.
- `GEMINI_API_KEY` — optional. When unset, Gemini endpoints cleanly return `503 { error: "ai_not_configured" }` instead of crashing.
- `NVIDIA_API_KEY` — optional and server-only. When unset, NVIDIA endpoints return `503 { error: "nvidia_not_configured" }`.
- `NVIDIA_BASE_URL` — defaults to `https://integrate.api.nvidia.com/v1`; may point to a compatible self-hosted NIM endpoint.
- `RESEND_API_KEY` — optional. When unset, contact / feedback / lead submissions are logged to stdout for review.
- `AI_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_DAY`, `AI_GLOBAL_DAILY_LIMIT`, `AI_THINKING_LIMIT_PER_DAY` — per-IP + global buckets on the in-memory limiter.
- `TRUST_PROXY` — Express proxy hops. `1` for Vercel.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server + Vite HMR |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest — `src/lib/__tests__/*` (intent engine, execution engine, agents) |
| `npm run audit:tools` | Fails the build if any `indexable` tool has no matching `case` in `App.tsx` |
| `npm run lint:noindex` | Fails the build if any non-404 prerendered HTML carries `noindex` |
| `npm run generate:sitemap` | Emits `public/sitemap.xml`, `rss.xml`, `robots.txt`, `llms.txt` |
| `npm run prerender` | Emits `dist/<route>/index.html` for every static route + `dist/404.html` |
| `npm run generate:tool` | Scaffolds a new tool: draft-status registry entry + placeholder component + guide stub. Requires manual paste (deliberate — forces a human read) |
| `npm run generate:guides` | Scaffolds guide stubs for indexable tools without a `toolGuides` entry |
| `npm run indexnow` | POSTs the indexable URL set to `api.indexnow.org` (Bing/Yandex/DuckDuckGo/Seznam/Naver) |
| `npm run build` | Full build for standalone Node deploy (esbuild bundles `server.ts` to `dist/server.cjs`) |
| `npm run build:vercel` | Vercel build (skips the esbuild step — Vercel bundles the function itself) |
| `npm run verify` | typecheck + test + audit + build |

## Deploy

Live on Vercel. See [`docs/deploy-vercel.md`](docs/deploy-vercel.md) for the full flow. Short version:

```bash
vercel link           # link to the existing project
vercel env add GEMINI_API_KEY production
vercel env add PUBLIC_SITE_URL production    # https://www.xfree.in
vercel --prod
```

Custom domain: add `www.xfree.in` as the primary in Vercel → Settings → Domains. Redirect `xfree.in` → `www.xfree.in`. That's the direction the code and canonicals commit to.

`vercel.json` stamps CSP + HSTS + X-Frame-Options + Referrer-Policy + Permissions-Policy + COOP + CORP onto every response (including static files that never hit the Express middleware).

## AI endpoints

Server-side task allowlist in [`src/server/tasks.ts`](src/server/tasks.ts). The browser sends `{taskId, input}` — the server maps `taskId` to a fixed system prompt. Client-supplied `systemInstruction` is not accepted. Unknown `taskId` → 400.

Task IDs currently defined: `general`, `ai-regex`, `ai-json-repair`, `ai-meta-optimizer`, `ai-sql-generator`, `ai-search-intent`, `ai-code-explainer`, `ai-commit-generator`, `ai-schema-generator`.

All AI calls run through `generateWithTimeout` (30 s default via `GEMINI_REQUEST_TIMEOUT_MS`). Rate limits: per-minute + per-day per IP, plus a global daily cap.

## SEO / indexing

- **Prerender** ([`src/scripts/prerender.ts`](src/scripts/prerender.ts)) — every indexable route gets its own HTML file with unique title, meta description, canonical, OG/Twitter tags, and JSON-LD (`Organization`, `WebSite`, `BreadcrumbList`, per-page `SoftwareApplication`/`HowTo`/`FAQPage`/`TechArticle` as applicable).
- **Sitemap** filters strictly to `INDEXABLE_TOOLS`. Draft slugs never appear.
- **robots.txt** ships a split-brain policy: allow citation bots (`OAI-SearchBot`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`, `Applebot`, `Googlebot`, `Bingbot`, `DuckDuckBot`, `BraveBot`), block bulk training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Meta-ExternalAgent`, `Bytespider`).
- **IndexNow** — key file lives at `public/dfa1cd2746301dcafa9c926f5a9d7f16.txt`. `npm run indexnow` pushes new/changed URLs.
- **AdSense** — publisher `pub-3573741815038097`. `ads.txt`, meta tag, and script are wired. See [`docs/production-readiness.md`](docs/production-readiness.md) for the review-readiness checklist.

## Security

- Zod validation on every request body (AI, contact, feedback, lead).
- Task allowlist replaces client-controlled system prompts.
- Per-IP and global rate limits (in-memory; swap the `store` in [`src/server/rate-limit.ts`](src/server/rate-limit.ts) for Redis before real traffic).
- CSP allowlist tuned for Google AdSense + Funding Choices ([`src/middleware/security-headers.ts`](src/middleware/security-headers.ts) for Express, [`vercel.json`](vercel.json) for static). Ship in Report-Only first if you change it.
- Central error handler with request IDs. No stack traces in production responses.
- Graceful `SIGTERM` / `SIGINT` on the standalone-Node deploy path.
- `GeminiNotConfiguredError` maps to `503`, not `500`, when the API key is absent — so a missing key doesn't crash the whole function.

## Contributing

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md). Short version:

- New tools: `npm run generate:tool -- --slug=... --title=... --category=... --description=...`. Component starts as a placeholder and the registry entry starts as `status: "draft"` — the sitemap and server 404-guard both filter it out until you flip to `indexable` and implement the component for real.
- New guides: hand-write in `src/data/guides.ts`. Each guide requires an `overview`, sectioned body, and a `lastReviewed` date the author is willing to defend.
- Content rules: [`docs/content.md`](docs/content.md).
- Security issues: see [`.github/SECURITY.md`](.github/SECURITY.md) — private reporting only, never a public issue.

CI (`.github/workflows/ci.yml`) runs typecheck → test → `audit:tools` → build → `lint:noindex` on every PR. The `verify` script runs the same locally.

## License

[MIT](LICENSE).

## Status

Live. `www.xfree.in` serves prerendered HTML plus the function-backed API. Deployment health, SEO check-ins, and the readiness punch-list live in [`docs/`](docs/).
