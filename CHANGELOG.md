# Changelog

All notable changes to XFree.in are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to semantic versioning once it reaches `v1.0.0`.

## [Unreleased]

### Added
- 25,000-concept roadmap and 50-pillar planning taxonomy, explicitly separated
  from the published/indexable tool registry.
- `/contribute` authority page, tool-request issue template, and maintainer-run
  good-first-issue candidate workflow.
- Split sitemap index, `openapi.json`, `ai.txt`, entity/knowledge-graph
  metadata, build health metadata, and `/.well-known/security.txt`.
- Build-time SEO validator covering canonical parity, sitemap/prerender parity,
  duplicate metadata, H1 presence, intentional noindex, and 404 behavior.
- Archived SEO/community reference prompts under `docs/reference/` with an
  advisory-only authority policy.
- `AUDIT.md` — Phase 0 forensic audit (open-source + AI authority initiative).
- `examples/` — runnable usage examples for the intent and execution engines.
- `docs/README.md` — GitHub Pages-ready documentation index.
- `.github/` governance: CI, security, docs, release workflows; issue/PR
  templates; CODEOWNERS; dependabot; CODE_OF_CONDUCT; CONTRIBUTING; SECURITY;
  SUPPORT.
- `LICENSE` (MIT).
- `src/data/pillarRegistry.ts` — canonical production pillar registry.
  Defines all 60 topical pillars grouped into the six navigation groups, the
  nine platform / authority pillars, and the typed `PillarStatus` enum
  (`draft` | `pending_review` | `published` | `retired`). Exports:
  - `PILLARS_60` — the full set of pillar definitions.
  - `PUBLIC_PILLARS` — the strict derived public collection
    (`status === "published" && indexable === true && contentApproved === true`).
  - `PUBLIC_HEADER_GROUPS` — the six groups, filtered and reattached to their
    public pillars; groups with no published pillars are dropped.
  - `PUBLIC_AUTHORITY_PILLARS` — authority pillars with `indexable === true`.
  - `pillarResponseForStatus` — single source for HTTP status (200/404/410).
  - `getPillarBySlug` — slug lookup.
- `src/data/__tests__/pillarRegistry.test.ts` — 19 tests covering the pillar
  registry contract: 60 pillars, unique slugs and ids, every name starts with
  "XFree ", no `xfree-` URL prefix, six groups with ≤10 pillars each, public
  derivation filters, header-group derivation, 9 authority pillars, and HTTP
  status mapping.
- `engineVerified` field on `ToolDefinition` (`src/types.ts`) — third
  visibility gate. `PUBLIC_TOOLS` now requires
  `status === "published" && indexable === true && engineVerified === true`.
  Eleven hand-crafted and batch-1 tools carry `engineVerified: true`.

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
- Removed: the prototype `public/home.html` single-file React app and its
  `/home` route. The prototype violated the master contract: hardcoded 35-pillar
  registry instead of `PILLARS_60`, CDN React / Babel / Tailwind, simulated
  `localStorage` authentication, public "coming soon" links, claim of "60
  pillar hubs" in metadata without rendering or verifying them, and only six
  hardcoded tools. Replaced by the existing prerendered React SPA at `/`.

### Known gaps vs the authoritative split
- Pillar content: 50 of 60 pillars are still `draft` and therefore do not
  appear in navigation, sitemap, or prerender. They need substantive,
  unique, server-visible content (≥one H1, direct answer, verified tool
  Bento grid, processing-mode disclosure, FAQs, last-review date) before they
  can be flipped to `contentApproved: true`.
- Sub-clusters: the 50-pillar × 50-cluster × 10-modifier taxonomy produces
  25,000 roadmap concept entries; the 600 sub-clusters called for in the
  blueprint are not yet modeled as individually governable records.
- Authority pillars: 9 are now first-class in
  `src/data/pillarRegistry.ts` (`AUTHORITY_PILLARS`). `OpenHost` and
  `Downloads` are correctly `indexable: false` until the underlying service
  ships — their public links will not appear in navigation, sitemap, or
  prerender.

### Changed
- `src/lib/intent-engine.ts`: `PROBLEM_TO_TOOL_MAP` now maps only to tools that
  actually solve the intent. Unsupported intents (e.g. "compress pdf") return
  zero tools instead of a misleading match.
- `README.md`: accurate test/contributing/license sections, CI + License badges,
  links to new governance files.
- `src/data/publicTools.ts`: batch-1 tools are again prefixed with `local-` to
  avoid id collision with draft seed tools in `TOOLS_REGISTRY`.

### Removed
- Dead Next.js-style `app/` directory (never imported in the Vite project).
- Prototype `public/home.html` and its `/home` route handler (see Security).

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
