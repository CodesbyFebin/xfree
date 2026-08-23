# XFree.in

[![CI](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml/badge.svg)](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](tsconfig.json)

**Free browser developer tools and inspectable local workflow recipes. No XFree signup required.**

Live: [www.xfree.in](https://www.xfree.in) · Studio: [app.xfree.in](https://app.xfree.in) · Recipes: [www.xfree.in/recipes](https://www.xfree.in/recipes)

## Try → Inspect → Contribute

### 1. Try it

XFree currently publishes **60 verified tool routes**. The latest governed expansion added **50 local browser utilities** across encoding, formatting, JSON, validation, and text workflows.

The Studio runtime exposes **100 allowlisted local engines**. Optional cloud/API features also exist, but they are explicitly selected and disclosed; XFree does **not** describe the entire platform as 100% client-side.

### 2. Inspect it

Start with a reproducible workflow recipe instead of a product tour:

- [URL Cleanup Pipeline](https://www.xfree.in/recipes/url-cleanup-pipeline) — extract → normalize → dedupe → sort → JSON
- [Log Sanitizer](https://www.xfree.in/recipes/log-sanitizer) — remove blanks → keep error lines → dedupe → JSON
- [JWT Inspection Workflow](https://www.xfree.in/recipes/jwt-inspection-workflow) — extract token → decode unverified claims → format JSON
- [SEO URL Audit](https://www.xfree.in/recipes/seo-url-audit) — extract → normalize → dedupe → classify internal/external
- [JSON API Cleanup](https://www.xfree.in/recipes/json-api-cleanup) — validate → format → sort keys
- [Text Cleanup Pipeline](https://www.xfree.in/recipes/text-cleanup-pipeline) — trim → remove blanks → dedupe → sort → metrics
- [CSV Preparation](https://www.xfree.in/recipes/csv-preparation) — parse CSV → structured JSON → normalized CSV
- [Developer Clipboard Cleanup](https://www.xfree.in/recipes/developer-clipboard-cleanup) — trim → dedupe → extract useful values → JSON

Every shared recipe uses a compact declarative representation:

```json
{
  "recipeId": "url-cleanup-pipeline",
  "version": "1.0.0",
  "processing": "local",
  "llmRequired": false,
  "steps": [
    { "kind": "engine", "engineId": "http-url-extract" },
    { "kind": "transform", "transformId": "map-lines-url-normalize" },
    { "kind": "engine", "engineId": "line-dedupe" },
    { "kind": "engine", "engineId": "line-sort" },
    { "kind": "transform", "transformId": "lines-to-json-array" }
  ],
  "safeConfiguration": { "networkAccess": false }
}
```

There is **no arbitrary JavaScript** in shared recipes. Agent Studio reconstructs every plan and rejects engine or transform IDs outside the local allowlist before execution.

### 3. Contribute it

Start at [`/contribute`](https://www.xfree.in/contribute) or the GitHub issue templates. New tools and workflow primitives must pass tests, registry checks, processing disclosures, accessibility review, SEO/canonical validation, AdSense content rules where applicable, and security scanning before publication.

## What XFree actually contains

- **60 published/indexable tools** today.
- **50 tools in the governed local-tool expansion batch**.
- **100 allowlisted local Studio engines**.
- **8 versioned local workflow recipes** with deterministic example executions in CI.
- **Deterministic Rules Agent** for natural-language-to-tool planning.
- **Optional WebGPU/WebLLM planner** using an allowlist-validated plan boundary.
- **Optional NVIDIA/Gemini server-backed features**, disclosed separately from Local Mode.
- **Installable PWA** caching same-origin application assets; API, ad, and model downloads remain outside the service-worker cache.
- **25,000-concept roadmap across 50 pillars**, explicitly separated from the live/indexable tool count.
- **Light/Dark public theme** with a persistent user preference; Studio retains its dark operational command-center canvas.

## Architecture

```text
Public pages / tools / recipes
            │
            ├── published-tool registry ──> 60 public routes
            │
            ├── recipe registry ─────────> 8 versioned workflows
            │                               │
            │                               └── recipeId + version + allowlisted step IDs
            │
            └── XFree Agent Studio
                    │
                    ├── Rules Agent (deterministic)
                    ├── optional WebGPU planner
                    └── shared execution boundary
                            │
                            ├── 100 allowlisted local engines
                            └── bounded named transforms

Optional cloud surfaces are separate and explicit:
Studio Cloud Mode / AI endpoints ──> server-held provider credentials
```

## What this deliberately is not

- **Not “25,000 working tools.”** That number is the public planning taxonomy.
- **Not a site-wide “100% client-side” claim.** Published local tools and starter recipes run in-browser; optional cloud/API surfaces also exist and are disclosed.
- **Not arbitrary workflow scripting.** Shared recipes are declarative and allowlist-validated.
- **Not fake social proof.** No manufactured stars, users, ratings, benchmark latency, or contributor counts.
- **Not a mass-generated SEO page system.** Planned concepts stay outside the sitemap until implementation and editorial gates pass.

## Stack

React 19 · TypeScript · Vite 6 · Express 4 · Tailwind 4 · Vitest · Zod · Web Workers · Web Crypto · optional WebGPU/WebLLM · Vercel.

## Repository layout

```text
api/index.ts                 Vercel function entry
server.ts                    Local dev entry
src/
  components/                React public, tool, Studio, and recipe UI
  data/                      tool registry, recipes, keyword architecture, guides, routes
  lib/                       Agent Core, recipe runtime, Studio engines, local workspace
  server/                    APIs, schemas, rate limits, provider integrations
  scripts/                   prerender, sitemap, validators, community tooling
  middleware/                security headers
  hooks/                     route metadata / structured data
  theme/                     persistent Light/Dark public theme
public/                      generated discovery artifacts, ads.txt, PWA assets
.github/                     CI, security, issue/PR templates, community automation
docs/                        design, deployment, indexing, launch, contribution docs
```

## Local development

```bash
git clone https://github.com/CodesbyFebin/xfree.git
cd xfree
npm ci
cp .env.example .env
npm run dev
```

Server-backed AI providers are optional. Local tools and recipes do not require provider credentials.

## Build and verification

```bash
npm run typecheck
npm run test
npm run audit:tools
npm run build:vercel
```

The production build gates include:

- governed published-tool compilation;
- canonical sitemap and AI/discovery generation;
- physical prerendered HTML;
- 50-tool batch validation;
- Agent Core invariants;
- **shared recipe validation + real example execution**;
- **Light/Dark + keyword-ownership design validation**;
- SEO/canonical validation;
- AdSense content/layout validation;
- intentional-noindex validation;
- production function bundle.

Key scripts:

| Script | Purpose |
|---|---|
| `npm run typecheck` | TypeScript semantic check |
| `npm run test` | Vitest suite |
| `npm run audit:tools` | Published-tool/runtime integrity |
| `npm run validate:agent` | Local Agent allowlist/WebGPU/CSP invariants |
| `npm run validate:recipes` | Validates all 8 recipes and executes every example locally |
| `npm run validate:design` | Verifies Light/Dark wiring and keyword ownership |
| `npm run validate:seo` | Canonical, title, description, sitemap, 404 checks |
| `npm run validate:adsense` | Publisher-content/FAQ/ad-layout guardrails |
| `npm run lint:noindex` | Rejects accidental noindex leakage |
| `npm run generate:sitemap` | Generates sitemaps, robots, LLM references, tools and recipes catalogs |
| `npm run community:candidates` | Creates deterministic maintainer-review issue candidates |

## Machine-readable discovery

- `/sitemap-index.xml`
- `/sitemap-pages.xml`
- `/sitemap-tools.xml`
- `/sitemap-guides.xml`
- `/llms.txt`
- `/llms-full.txt`
- `/tools.json`
- **`/recipes.json`**
- `/openapi.json`
- `/entities.json`
- `/knowledge-graph.json`
- `/health.json`
- `/.well-known/security.txt`

These are descriptive/discovery surfaces, not claimed ranking signals.

## Processing model

**Local Mode** means working input stays in browser execution for that tool or recipe. Local engines may use normal JavaScript, Web Workers, Web Crypto, or bounded transforms.

**WebGPU planning** is optional. The model may propose a plan, but every engine/transform ID still passes the same allowlist boundary before execution. Initial model/runtime downloads require network access and are deliberately not hidden behind an “offline” claim.

**Cloud Mode / server-backed AI** is separate, explicit, and uses server-held credentials. Do not send sensitive data unless the selected feature's disclosure and provider handling are acceptable for your use case.

## SEO / indexing

Canonical origin: `https://www.xfree.in`.

- Sitemaps contain only real indexable pages, published tools, reviewed guides, published pillars, and versioned recipe pages.
- `/roadmap` remains `noindex,follow`.
- Empty/planned pillar concepts do not receive thin indexable tool pages.
- One keyword intent owns each major surface: home = **free developer tools**, recipes = **local browser workflow recipes**, Studio = **local agent workflow studio**. Secondary modifiers are used only when they improve copy; XFree does not emit a `meta keywords` tag.

## Security

- CSP/HSTS/XFO/nosniff plus scoped COOP; no blanket COEP across the public site.
- Zod validation and rate limits on server APIs.
- Provider credentials remain server-side.
- Local recipe sharing rejects arbitrary code and unknown engine/transform IDs.
- Local folder access is explicit, permission-scoped, and read-only in the current Studio phase.
- CodeQL, secret scanning, and production dependency audit run in CI.

Security reports: see [`.github/SECURITY.md`](.github/SECURITY.md).

## Contributing

Read [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) and [`/contribute`](https://www.xfree.in/contribute).

A useful contribution should add developer value, tests, truthful limitations, keyboard/accessibility support, processing disclosure, and documentation. Publication/indexability is granted only after the current automated and human review gates pass.

## Launch material

Technical launch drafts and outreach checklists live under [`docs/launch/`](docs/launch/). They intentionally use verified release facts and avoid claiming that the entire platform is client-side.

## License

[MIT](LICENSE)
