# XFree.in

[![CI](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml/badge.svg)](https://github.com/CodesbyFebin/xfree/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](tsconfig.json)

**Local browser tools and inspectable workflow recipes for developer, data, and technical SEO tasks.**

XFree is live at [www.xfree.in](https://www.xfree.in). The strongest way to evaluate it is not the homepage: open a recipe, inspect its steps, and run the exact workflow in Agent Studio without creating an account.

## Try it → Inspect it → Contribute it

### 1. Try it

Start with the [workflow recipe directory](https://www.xfree.in/recipes).

The first eight versioned recipes are:

- **URL Cleanup Pipeline** — extract URLs → normalize → dedupe → sort → JSON array.
- **Log Sanitizer** — trim lines → keep `ERROR` lines → dedupe → sort → JSON.
- **JWT Inspection Workflow** — decode without signature verification → format JSON → sort keys.
- **SEO URL Audit** — extract → normalize → dedupe → classify against the first URL origin.
- **JSON API Cleanup** — validate → format → recursively sort object keys.
- **Text Cleanup Pipeline** — trim → remove blanks → dedupe → sort → word-count trace.
- **CSV Preparation** — CSV parse → structured JSON → normalized CSV serialization.
- **Developer Clipboard Cleanup** — extract HTTP(S) values from noisy terminal output → dedupe → sort → JSON.

Every recipe page shows **input → execution plan → engine/transform IDs → output contract**, whether an LLM is required, and an **Open in Agent Studio** action.

### 2. Inspect it

Recipe sharing is deliberately data-only. A shared workflow can reference allowlisted engine IDs and a closed set of reviewed transform/config flags; it cannot carry arbitrary JavaScript.

Key files:

- [`src/data/recipes.ts`](src/data/recipes.ts) — versioned recipe definitions and compact share payloads.
- [`src/lib/recipe-runner.ts`](src/lib/recipe-runner.ts) — validation + deterministic recipe execution.
- [`src/lib/agent-core.ts`](src/lib/agent-core.ts) — local agent plan validation and deterministic tool chaining.
- [`src/lib/studio/engines.ts`](src/lib/studio/engines.ts) — production local-engine registry.
- [`src/scripts/prerenderRecipes.ts`](src/scripts/prerenderRecipes.ts) — crawlable canonical recipe HTML.
- [`src/scripts/generateRecipeDiscovery.ts`](src/scripts/generateRecipeDiscovery.ts) — recipe sitemaps, `llms.txt`, and machine-readable catalogs.

Machine-readable discovery is generated at build time:

- `/recipes.json`
- `/recipes/<slug>.json`
- `/sitemap-pages.xml`
- `/sitemap.xml`
- `/llms.txt`
- `/llms-full.txt`

### 3. Contribute it

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) and [`/contribute`](https://www.xfree.in/contribute).

Good contributions add or improve a real local engine, tests, truthful processing disclosures, accessibility, error handling, documentation, and deterministic examples. Roadmap concepts do not become public/indexable merely because a title exists.

## Verified release facts

The current governed release contains:

- **60 published/indexable tools** in the public registry.
- **50 tools in the new governed local-tool batch**.
- **100 allowlisted local engines** available to the Agent Core.
- **Deterministic local tool chaining** with plan validation before execution.
- **8 versioned workflow recipes** that require no LLM and reject arbitrary executable recipe code.
- **Optional WebGPU/WebLLM planning** using the pinned SmolLM2 local planner when the browser supports it.
- **Optional cloud/API functionality** that is explicitly separated from Local Mode.

XFree is **not described as an entirely client-side platform**. Published Local Mode tools and the initial recipes run in-browser, while optional cloud features can send explicitly submitted data to configured providers. The PWA caches same-origin application assets; model downloads, ads, and API requests are deliberately excluded from service-worker caching.

## Why recipes are the product demo

A developer should be able to answer four questions before trusting an automation:

1. **What will run?** The recipe lists each engine or built-in transform.
2. **Where will it run?** Initial shared recipes are Local Mode only.
3. **Does it need an LLM?** Each recipe declares this explicitly; v1 recipes do not.
4. **Can the shared recipe expand execution authority?** No. The runner validates a closed schema against the production allowlist.

That makes recipes reproducible and reviewable instead of opaque prompt macros.

## Architecture

```text
www.xfree.in
  ├─ published tool pages
  ├─ /recipes + /recipes/:slug
  ├─ guides / docs / contribution surfaces
  └─ canonical sitemap + AI discovery files

app.xfree.in
  └─ XFree Agent Studio
       ├─ deterministic Rules Agent
       ├─ optional WebGPU/WebLLM planner
       ├─ allowlisted local engines
       ├─ versioned recipe runner
       ├─ read-only explicit folder picker
       └─ optional disclosed NVIDIA Cloud Mode
```

Core stack: React 19 · TypeScript · Vite 6 · Express 4 · Tailwind 4 · Zod · Vitest · Vercel.

## Local development

```bash
git clone https://github.com/CodesbyFebin/xfree.git
cd xfree
npm ci
cp .env.example .env
npm run dev
```

Optional provider keys are documented in [`.env.example`](.env.example). Local recipes do not require a cloud key.

## Quality gates

```bash
npm run typecheck
npm run test
npm run audit:tools
npm run build
```

The production build additionally verifies:

- published-tool registry integrity;
- 50-tool batch publication rules;
- 100-engine Agent Core invariants;
- canonical/prerender/sitemap consistency;
- AdSense content and spacing requirements;
- noindex leakage;
- recipe discovery and recipe prerender output.

## Security model

- Shared recipe definitions are repository-owned structured data, not scripts.
- Recipe engine IDs must exist in the production local-engine allowlist.
- Recipe transforms and configuration keys come from a closed enum/set.
- Local Agent plans are validated before execution.
- JWT inspection explicitly does **not** claim signature verification.
- Read-only folder access starts only after an explicit browser picker action.
- Cloud modes are separate and disclosed before network processing.
- Server APIs use Zod validation, allowlisted AI tasks, rate limiting, and server-only provider keys.

See [`.github/SECURITY.md`](.github/SECURITY.md) for private vulnerability reporting.

## Adoption / launch material

Technical launch drafts live under [`docs/launch/`](docs/launch/):

- Show HN draft and launch checklist.
- r/LocalLLaMA technical post draft and participation constraints.
- awesome-list / developer-resource outreach notes.

These drafts lead with reproducible recipes and implementation details rather than generic AI-toolbox marketing.

## License

[MIT](LICENSE)
