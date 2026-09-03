# Changelog

All notable changes to XFree.in are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to semantic versioning once it reaches `v1.0.0`.

## [Unreleased]

### Added
- 25,000-concept roadmap and 50-pillar planning taxonomy, explicitly separated from the published/indexable tool registry.
- `/contribute` authority page, tool-request issue template, and maintainer-run good-first-issue candidate workflow.
- Split sitemap index, `openapi.json`, `ai.txt`, entity/knowledge-graph metadata, build health metadata, and `/.well-known/security.txt`.
- Build-time SEO validator covering canonical parity, sitemap/prerender parity, duplicate metadata, H1 presence, intentional noindex, and 404 behavior.
- Archived SEO/community reference prompts under `docs/reference/` with an advisory-only authority policy.
- `AUDIT.md` — Phase 0 forensic audit (open-source + AI authority initiative).
- `examples/` — runnable usage examples for the intent and execution engines.
- `docs/README.md` — GitHub Pages-ready documentation index.
- `.github/` governance: CI, security, docs, release workflows; issue/PR
  templates; CODEOWNERS; dependabot; CODE_OF_CONDUCT; CONTRIBUTING; SECURITY;
  SUPPORT.
- `LICENSE` (MIT).
- `public/home.html` — alternate single-file React homepage prototype served at
  `/home`. Includes a 35-pillar `ALL_PILLARS` registry with live / beta /
  coming-soon status badges, a `PillarExplorer` with filter chips mapped to
  the six navigation menus, a `SiteHeader` with prominent search bar and
  `⌘K` modal, an `AuthProvider` + `AuthModal` / `ProfileModal` with
  localStorage-backed simulated auth, favorites and recent-activity tracking,
  and six featured tools. Single-file deliverable: no build step, no
  dependencies to install, CDN React 18 + Babel standalone.
- `src/server/app.ts`: `GET /home` and `GET /home/` route handler that serves
  `public/home.html` with `text/html; charset=utf-8` and
  `Cache-Control: public, max-age=300, s-maxage=3600`. Falls through if the
  file is missing. The canonical homepage at `/` remains the React SPA.
- `src/server/__tests__/home-route.test.ts` — 4 tests covering 200 status,
  content-type, trailing-slash handling, cache-control header, and on-disk
  file presence.

### Security
- Reminder: rotate the `NVIDIA_API_KEY` previously exposed in conversation
  history. Revoke the old key at https://org.nvidia.com, generate a new one,
  and re-provision in all three Vercel environments. `src/server/env.ts` reads
  the key from `process.env` only; no value is logged, echoed, or hard-coded.
  Cloud Mode stays disabled by default until the new key is deployed; an
  unset key returns 503 via `NvidiaNotConfiguredError` rather than failing the
  whole function. The repository was searched for hard-coded values: no
  `nvapi-` strings are present in `src/`, `docs/`, `api/`, `content/`, or
  `.github/`, and `git log --all -S 'nvapi-'` returns no matches.

### Known gaps vs the authoritative split
- Pillar registry: `PILLARS_50` (50 topical pillars) on `main` vs 60 in the
  blueprint. Migration path: add 10 more pillar definitions to
  `src/data/masterBlueprint.ts`.
- Sub-clusters: the 50-pillar × 50-cluster × 10-modifier taxonomy produces
  25,000 roadmap concept entries; the 600 sub-clusters called for in the
  blueprint are not yet modeled as individually governable records.
- Product/authority pillars (Studio, OpenHost, Downloads, HowItWorks,
  UseCases, Docs, Guides, Blog, PillarDirectory) appear as plain header and
  footer links on `main` but are not yet a first-class `AUTHORITY_PILLARS_9`
  data structure with an associated route map.

### Changed
- `src/lib/intent-engine.ts`: `PROBLEM_TO_TOOL_MAP` now maps only to tools that
  actually solve the intent. Unsupported intents (e.g. "compress pdf") return
  zero tools instead of a misleading match.
- `README.md`: accurate test/contributing/license sections, CI + License badges,
  links to new governance files.

### Removed
- Dead Next.js-style `app/` directory (never imported in the Vite project).

## [0.1.0] - 2026-08-15

### Added
- 10 hand-authored, indexable tools with real React components, unique guides,
  and per-page JSON-LD (SoftwareApplication / FAQPage / HowTo as applicable).
- Express server with Zod-validated `/api/ai`, `/api/contact`, `/api/feedback`,
  `/api/lead` endpoints; per-IP + global rate limits; honeypot fields.
- Server-side Gemini proxy behind a fixed task allowlist.
- Prerender pipeline producing static HTML for every indexable route.
- SEO/GEO assets: `sitemap.xml`, `rss.xml`, `robots.txt` (split-brain for AI
  crawlers), `llms.txt`, `llms-full.txt`, `capabilities.json`, `tools.json`.
- Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy,
  Permissions-Policy, COOP, CORP) on every response.
- `~396` draft tool stubs in `tools-seed.json`, explicitly excluded from sitemap,
  prerender, and search.
- Vitest unit tests for the intent engine, execution engine, and agent modules.

> Note: versions before this entry are not tagged in Git. `v0.1.0` is the first
> recorded, documentation-aligned baseline. Future releases should be tagged and
> published through `.github/workflows/release.yml`.
