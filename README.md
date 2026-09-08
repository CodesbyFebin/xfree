# XFree.in

<!-- Machine-readable metadata for AI crawlers and search engines -->
<!-- ai:project=xfree • ai:license=MIT • ai:lang=en • ai:country=IN • ai:category=developer-tools,seo-tools,ai-tools -->
<!-- ai:url=https://www.xfree.in • ai:source=https://github.com/CodesbyFebin/xfree -->
<!-- ai:sitemap=https://www.xfree.in/sitemap.xml • ai:robots=https://www.xfree.in/robots.txt -->
<!-- ai:llms=https://www.xfree.in/llms.txt • ai:llms-full=https://www.xfree.in/llms-full.txt -->
<!-- ai:capabilities=https://www.xfree.in/capabilities.json • ai:tools=https://www.xfree.in/tools.json -->
<!-- ai:api-desc=https://www.xfree.in/api/execute -->
<!-- seo:title=XFree.in — Free Developer, SEO & AI Micro-Tools -->
<!-- seo:description=23 browser-based developer utilities, SEO tools, and AI assistants. No signup, no install. 100% free. -->
<!-- seo:keywords=developer tools, seo tools, ai tools, online tools, json formatter, regex tester, sitemap generator, schema markup -->
<!-- geo:region=IN • geo:target=global • geo:language=en -->

**Quick Start** — [Clone](https://github.com/CodesbyFebin/xfree.git) · `npm ci` · `npm run dev` → `http://localhost:3000`
**Production** — [xfree.in](https://www.xfree.in) · [API Reference](docs/api.md) · [Guides](docs/content.md)

<!-- AI Crawler Summary: Key facts for LLM indexing -->
<!--
  Project: XFree.in (XFree)
  Tagline: Free browser-based developer, SEO, and AI micro-tools
  License: MIT
  Website: https://www.xfree.in
  Source: https://github.com/CodesbyFebin/xfree
  Description: 23 browser-based developer utilities, SEO tools, formatters, converters, and AI assistants. No signup, no install. 100% free.
  Tool count: 23 indexable tools (16 with interactive widgets + 7 informational/comparison pages)
  Categories: developer-tools, seo-tools, ai-tools, media-docs-tools, security-tools, business-tools
  Pillars: 60 developer and SEO topic pillars
  Guides: 4 published guides (regex, cron, JSON errors, canonical vs 301)
  API endpoints: POST /api/execute, POST /api/nvidia/chat, GET /api/nvidia/models
  AI backends: Google Gemini (server-side proxy), NVIDIA NIM (Cloud Mode gateway)
  Sitemap: https://www.xfree.in/sitemap.xml
  RSS: https://www.xfree.in/rss.xml
  robots.txt: https://www.xfree.in/robots.txt
  llms.txt: https://www.xfree.in/llms.txt
  llms-full.txt: https://www.xfree.in/llms-full.txt
  ai.txt: https://www.xfree.in/ai.txt
  capabilities.json: https://www.xfree.in/capabilities.json
  tools.json: https://www.xfree.in/tools.json
  Contact: contact@xfree.in
  Security: security@xfree.in
-->

<img width="2038" height="772" alt="head" src="https://github.com/user-attachments/assets/f515699c-f45a-4820-aaab-5280fea8a48b" />

[![CI](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml/badge.svg)](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](tsconfig.json)
<img width="1942" height="809" alt="her8u" src="https://github.com/user-attachments/assets/87693707-36d5-4db1-804f-1a3a3acf87f7" />

Free browser-based developer, SEO, and single-purpose AI micro-tools. Live at [https://www.xfree.in](https://www.xfree.in).

## What this actually is

<img width="941" height="1672" alt="finn" src="https://github.com/user-attachments/assets/c8a2be92-1130-4851-94e7-a6efd670ebea" />


a real, working interactive component** (JSON formatter, regex tester, cron generator, base64/JWT decoder, URL/UTM builder, meta-tag preview, schema-markup generator, robots.txt generator, XML sitemap generator, bulk URL extractor, password generator, JPG→PDF converter, AI text detector, mobile device preview, three browser games, photo editor). The other 7: 4 are intentionally informational/comparison pages (not meant to be interactive — e.g. a VPN or cloud-storage comparison guide), and **3 are known gaps** (`pdf-editor`, `video-downloader`, `coding-practice`) that `npm run audit:tools` fails on until they get real implementations — tracked honestly rather than hidden.
- **4 published guides** at `/guides/*` (regex cheat sheet, cron examples, common JSON errors, canonical vs 301).
- **A `/xfree-app/` PWA-install page** — the site is installable as a Progressive Web App via `site.webmanifest`.
- **A server-side proxy to Google Gemini** for the AI-flavored variants of the tools above, plus a separate **NVIDIA NIM Cloud Mode gateway** (`POST /api/nvidia/chat`, `GET /api/nvidia/models`) with task-based model routing and cascading fallback across NVIDIA's free-tier catalog — see [AI endpoints](#ai-endpoints). Both API keys stay server-side; AI/Cloud features are opt-in and clearly labelled.
- **A `/api/contact`, `/api/feedback`, `/api/lead` set** with Zod validation, honeypot fields, and per-IP rate limits. Delivery via Resend when `RESEND_API_KEY` is set, otherwise logged.
- **A ~400-entry seed registry of tool ideas** (`src/scripts/tools-seed.json`). These are `status: "draft"` — they have no working component and their routes return HTTP 404 until they're implemented. They are **not** in the sitemap and **not** claimed as live tools anywhere.

## What this deliberately isn't

- **Not "400+ working tools."** 16 with real widgets, 23 indexable total. The rest are stubs excluded from every public surface.
- **Not fully client-side.** Local tools process input in-browser; AI/Cloud tools proxy to Gemini or NVIDIA NIM; the site itself loads Google AdSense which sets advertising cookies. The Privacy page is honest about all of this.
- **The deployed site is not a Next.js app.** The root of this repo (what you're reading now) is Vite + React on the client, Express on the server, deployed as a Vercel serverless function plus prerendered static HTML — that's what serves `www.xfree.in`. `next-app/` is a separate, **not-yet-deployed** Next.js rewrite living alongside it in the same repo — see the layout note below before you go looking for the live site's code in there.

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
next-app/                 Separate, standalone Next.js project — its own package.json, tsconfig,
                          and node_modules. NOT part of the root npm workspace, NOT deployed, and
                          NOT typechecked by the root `npm run typecheck` (excluded in tsconfig.json).
                          An in-progress rewrite explored alongside the live app; treat it as its
                          own repo-in-a-repo — `cd next-app && npm install` before touching it.
```
<img width="1254" height="1254" alt="dre" src="https://github.com/user-attachments/assets/b0c4e104-5e87-48a6-a342-b06690861255" />

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
- `GEMINI_API_KEY` — optional. When unset, AI endpoints cleanly return `503 { error: "ai_not_configured" }` instead of crashing.
- `NVIDIA_API_KEY` — optional. Enables the `/api/nvidia/*` Cloud Mode gateway (see [AI endpoints](#ai-endpoints)); unset returns `503 { error: "nvidia_not_configured" }`. Get a free-tier key at [build.nvidia.com](https://build.nvidia.com).
- `RESEND_API_KEY` — optional. When unset, contact / feedback / lead submissions are logged to stdout for review.
- A present-but-blank var (e.g. `GEMINI_API_KEY=` with nothing after the `=`) is treated the same as unset — `loadConfig()` normalizes empty strings to `undefined` before validation. (This used to silently break the *entire* config on any one blank optional var; fixed.)
- `AI_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_DAY`, `AI_GLOBAL_DAILY_LIMIT`, `AI_THINKING_LIMIT_PER_DAY` — per-IP + global buckets on the in-memory limiter.
- `TRUST_PROXY` — Express proxy hops. `1` for Vercel.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server + Vite HMR |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest — `src/lib/__tests__/*` (intent engine, execution engine, agents) |
| `npm run audit:tools` | Fails if any `indexable` tool (besides the explicit informational-page exemption list) has no matching `case` in `App.tsx`'s `renderInteractiveTool` — i.e. it would render as a "tool" page with no actual widget. Currently 3 known, tracked failures — see "What this actually is" above |
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

### NVIDIA NIM Cloud Mode gateway
<img width="1254" height="1254" alt="stdi" src="https://github.com/user-attachments/assets/7cdd5948-05f3-466d-8892-66da7998d412" />

A second, independent AI backend at `POST /api/nvidia/chat` and `GET /api/nvidia/models` ([`src/server/nvidia/`](src/server/nvidia/)), built for XFree Studio's Local/Cloud mode toggle:

- `taskType` (`code` | `json` | `sql` | `summarization` | `reasoning` | `general`) picks a scoring heuristic in [`router.ts`](src/server/nvidia/router.ts) that ranks NVIDIA's free-tier model catalog for that kind of request; `model: "auto"` (the default) lets it choose, or pass an explicit model ID.
- **Cascading fallback, for real:** NVIDIA's `/v1/models` catalog lists models beyond what's actually invocable on a given free-tier account — confirmed empirically, not theoretical. [`client.ts`](src/server/nvidia/client.ts) walks the ranked candidate list (up to 12 attempts) rather than trusting the top pick, isolates a timeout or 404 on one candidate so it doesn't abort the rest of the chain, and caches confirmed-dead model IDs for 30 minutes so repeat requests skip straight to a working model.
- The API key never reaches the browser — this exists specifically because a client-side "paste your API key into localStorage" pattern is not safe, regardless of how convenient it looks in a prototype.

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

## Contributing<img width="1254" height="1254" alt="dre" src="https://github.com/user-attachments/assets/10a58a1a-f929-4074-9006-6183bed82e1d" />


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

<img width="2048" height="768" alt="ftr" src="https://github.com/user-attachments/assets/a43db23d-e93d-4772-8929-9ccc0ca90a90" />
