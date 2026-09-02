# Changelog

All notable changes to XFree.in are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to semantic versioning once it reaches `v1.0.0`.

## [Unreleased]

### Added
- `AUDIT.md` — Phase 0 forensic audit (open-source + AI authority initiative).
- `examples/` — runnable usage examples for the intent and execution engines.
- `docs/README.md` — GitHub Pages-ready documentation index.
- `.github/` governance: CI, security, docs, release workflows; issue/PR
  templates; CODEOWNERS; dependabot; CODE_OF_CONDUCT; CONTRIBUTING; SECURITY;
  SUPPORT.
- `LICENSE` (MIT).

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
