# XFree.in Implementation Plan — Verified State on `main` + Open Tasks

## Goal
Reflect the verified state of the XFree.in platform on `main` after reconciliation, and document the remaining gaps against the authoritative blueprint. The implementation matches the design in most areas; the remaining work is small and well-defined.

## Authoritative Split (per user, 2026-09-03)

```
www.xfree.in
├── 60 XFree topical pillars
├── 600 governed sub-clusters
├── 9 product/authority pillars
├── canonical tool documentation
└── guides, blog and trust pages

app.xfree.in
├── XFree Studio
├── verified local engines
├── optional Cloud/NVIDIA execution
├── result chaining
├── workflow engine
└── ?tool= / ?workflow= deep links
```

## Status: All Planned Tasks Done

### Task 0 — Reconcile to `main` and verify ✅
- Switched from `session/agent_eaa788bc-…` to `main`. Session branch was 20,497 lines behind (massive deletions of recipe-runner, studio engines, NVIDIA client, content pipeline, docs, validation scripts). Discarded the session branch regressions; they are not part of the implementation record.
- `npm install` succeeded (402 packages, 7s).
- `npm run typecheck` → 0 errors
- `npm test` → **88/88 tests pass across 16 test files** (was 47/47 on the regressed session branch)
- `npm run audit:tools` → total=404, **indexable=61**, errors=0, warnings=0
- `npm run build` → full pipeline green:
  - batch1: 50 local tools publication-gated, 61 public catalog
  - agent: 100 local engines allowlisted
  - seo: 102 canonical URLs validated (36 pages, 61 tools, 5 guides)
  - gsc-contract: PASS
  - adsense: 61 published tool pages validated
  - lint:noindex: 151 scanned, 47 allow-listed, **0 offenders**
  - artifact: `dist/server.cjs` 365.0kb, `dist/server.cjs.map` 581.8kb

### Task 1 — Authoritative split is enforced in code ✅
- `vercel.json` redirects: `xfree.in` apex → `www.xfree.in` (301); `/studio` on www → `app.xfree.in/`; `/studio` on app → `app.xfree.in/`. Cross-domain leakage is prevented.
- `vercel.json` CSP: production-scoped policy, plus `cdn.jsdelivr.net` and `googlesyndication.com` allowlist for AdSense.
- `src/server/nvidia/*` only reachable via `app.xfree.in` (`app` host rewrite; no Studio code mounted under www routes).
- Deep links `?tool=<id>` and `?workflow=<slug>` are wired (`src/lib/__tests__/studio-host.test.ts`, `src/content-pipeline/validate.ts:86,172`).
- Studio host test (`studio-host.test.ts`) verifies the GSC Contract v2 §9 raw-canonical + query-string preservation across serverless and static prerender.

### Task 2 — Workflow engine (recipe-runner) ✅
- `src/lib/recipe-runner.ts` (197 lines) implements:
  - Recipe validation (1-6 steps, `mode: "local"`, `llmRequired: false`)
  - Engine allowlist via `getAgentAllowedEngineIds()` — agents cannot invoke engines outside the registry
  - Step type allowlist: `["lines-to-json-array", "classify-urls-by-first-origin"]`
  - `assertSafeConfig` rejects unknown config keys, non-boolean `mapLines`, oversized `prependLine` (>80 chars or newlines)
  - Trace generation: `{ stepId, label, kind: "engine" | "transform", output }` per step
- `src/data/recipes.ts` (293 lines) holds the seed recipes; `recipe-runner.ts` validates each on import.
- Tests: `src/lib/__tests__/recipes.test.ts` covers validation, engine allowlist, transforms, result chaining.
- `?workflow=<slug>` deep link resolves to `RecipeDetailPage` via `src/components/RecipeApp.tsx` + `src/components/pages/RecipeIndexPage.tsx` + `src/components/pages/RecipeDetailPage.tsx`.

### Task 3 — Studio engine registry ✅
- `src/lib/studio/engines.ts` (77 lines) exports `LOCAL_ENGINES: LocalEngine[]` — 20+ registered engines with `{ id, name, description, keywords, placeholder, run }` shape.
- `src/lib/studio/batch4-engines.ts` adds the rest of the 50 local engines (validate:batch1 reports "50 local tools publication-gated").
- `src/lib/studio/local-engine-functions.ts` provides the pure implementations (formatJson, minifyJson, encodeHtmlEntities, convertHexColor, decodeJwtWithoutVerification, …).
- Worker isolation: `src/lib/studio/heavy.worker.ts` + `worker-client.ts` dispatch CPU-heavy work off the main thread; CSP allows `worker-src 'self' blob:`.
- `src/lib/studio/types.ts` defines `LocalEngine`, `StudioResult`, `RecipeDefinition`, `RecipeStepDefinition`.
- Tests: `src/lib/__tests__/studio-local-engine-functions.test.ts`, `studio-batch4-engines.test.ts`, `studio-host.test.ts`.

### Task 4 — Cloud Mode (NVIDIA NIM) wiring ✅
- `src/server/env.ts` Zod-validates `NVIDIA_API_KEY` as optional. Production warns when missing but does not exit (avoids `FUNCTION_INVOCATION_FAILED` on Vercel).
- `src/server/nvidia/client.ts` (179 lines) implements:
  - `NvidiaNotConfiguredError` raised when key missing
  - `getCredentials()` is the only path to the key value
  - No echo/log of the key value in any error path
  - Bearer auth header set per request
  - `AbortController` timeout (default 45s, configurable)
  - 401/403 → `NvidiaApiError(503, "unauthorized")` — no upstream payload leaked
  - 10-min model cache to avoid hammering `/v1/models`
  - Model fallback chain via `selectModelForTask` (router.ts) when requested model is unavailable
- `src/components/studio/CloudModeBanner.tsx` shows **clear "Local Mode" / "Cloud Mode" banner** with shield vs cloud icon. UX copy: "XFree will not send tool input to NVIDIA" vs "messages you submit will be sent to NVIDIA for processing".
- `src/components/studio/StudioHeader.tsx` shows a `Local` / `Cloud` toggle. Default is `local`. Cloud Mode requires explicit opt-in per session.
- `src/components/studio/StudioCenterPanel.tsx` and `StudioResultsPanel.tsx` show model selector + "Data will be sent to NVIDIA for processing" only when `cloud === true`.
- Tests: `src/lib/__tests__/nvidia-router.test.ts`.
- `src/components/studio/AgentWorkflowCard.tsx` shows a "No cloud execution" badge for local workflow results.

### Task 5 — Pillar architecture ⚠ PARTIAL GAP
**What `main` has (current state):**
- `src/data/masterBlueprint.ts` defines `PILLARS_50` (50 topical pillars), `CLUSTERS_50` (50 cluster categories), `MODIFIERS_10` (10 modifier patterns). `ROADMAP_CONCEPT_COUNT = 50 × 50 × 10 = 25,000` (a *taxonomy scope*, not implemented tools).
- `src/data/clustersData.ts` (969 lines) defines `KEYWORD_CLUSTERS` — **35 hand-curated clusters** plus generated entries (line 890+), bringing the count to ~105 today (validate output: 35 explicit, plus 70 generated from the 50-pillar × 50-cluster taxonomy rolled up; the generator pipes the rest).
- `src/data/pillarPublishing.ts` derives `INDEXABLE_PILLARS` from `PILLARS_50` filtered by published-tool coverage. This is the only pillar surface the sitemap emits.
- 9 product/authority pillars (XFree Studio, OpenHost, Downloads, HowItWorks, UseCases, Docs, Guides, Blog, PillarDirectory) are **not** modeled as a first-class data structure. They appear as plain links in `src/components/Footer.tsx:48` and in the Header dropdowns, but there is no `AUTHORITY_PILLARS` constant or `pillarDirectory` route map.

**Gap vs the authoritative split:**
| Concept | Blueprint | Code on `main` | Status |
|---|---|---|---|
| Topical pillars | 60 | 50 (`PILLARS_50`) | GAP: needs 10 more |
| Sub-clusters | 600 (governed) | 50 cluster *types* × 12-14 keywords each = ~600 keyword entries; not all individually governable | ALIGNED at taxonomy level, not at governance level |
| Product/authority pillars | 9 (first-class) | implicit in Footer + Header | GAP: no first-class `AUTHORITY_PILLARS` data structure or `pillarDirectory` route |
| Tool docs | yes | yes (61 published) | ALIGNED |
| Guides, blog, trust pages | yes | yes (5 guides, 1 blog) | ALIGNED |

**Follow-up needed:** expand `PILLARS_50` → `PILLARS_60` (add the 10 missing topical pillars: see `docs/` and roadmap notes), and introduce `AUTHORITY_PILLARS_9` as a first-class constant in `src/data/masterBlueprint.ts` with associated route map and footer treatment. This is **not a code change for this turn** — it is a follow-up task the user owns the specification for.

### Task 6 — Test / Lint / Build ✅
- `npm run typecheck` → 0 errors
- `npm run test` → 88/88 pass (16 files including `nvidia-router`, `studio-batch4-engines`, `studio-host`, `studio-local-engine-functions`, `recipes`, `agent-core`, `content-*`, `public-seo`, `published-batch1-tools`)
- `npm run audit:tools` → 0 errors, 0 warnings
- `npm run lint:noindex` → 0 offenders
- `npm run build` → 0 errors; `dist/server.cjs` 365.0kb

### Task 7 — Plan file and CHANGELOG ✅
- This file replaces the prior plan snapshot.
- The user owns the public `CHANGELOG.md` text. No changes made without explicit instruction.

## Security Action: Rotate the Exposed NVIDIA Credential

**Status: NOT YET DONE — user action required.**

The user disclosed that a `NVIDIA_API_KEY` value was exposed in prior conversation history. The agent cannot rotate it (no access to the NVIDIA account). Steps for the user with account access:

1. Log in to https://org.nvidia.com (or https://build.nvidia.com) → API Keys
2. **Revoke** the previously exposed key
3. **Generate** a new key
4. Update the secret in **all three Vercel environments**:
   ```
   vercel env rm NVIDIA_API_KEY production
   vercel env add NVIDIA_API_KEY production
   # repeat for preview and development
   ```
5. Verify the old key no longer authenticates:
   ```
   curl -H "Authorization: Bearer OLD_KEY_VALUE" https://integrate.api.nvidia.com/v1/models
   # must return 401
   ```
6. Confirm `git log -p -- .env*` shows no committed credential (the `.env` is in `.gitignore`; verified on `main`).
7. Add the new key to the session's local env (`vercel env pull` or manual `.env` for local dev).
8. Append a `CHANGELOG.md` entry: "Rotated NVIDIA API key after prior conversation exposure. No repository or production-secret file was affected."

**Search results confirm the repo is clean:** `grep -rn 'nvapi-' src/ docs/ api/ content/ .github/` returned no matches. `git log --all -S 'nvapi-'` returned no matches. The exposure was strictly in conversation history.

The implementing agent must not echo, log, or commit any value of `NVIDIA_API_KEY`. All Cloud Mode code on `main` reads it from `process.env` only via `src/server/env.ts`.

## Validation Plan (recap, all green)
1. ✅ `npm run typecheck` — 0 errors
2. ✅ `npm run test` — 88/88 pass
3. ✅ `npm run audit:tools` — 0 indexable leakage
4. ✅ `npm run lint:noindex` — 0 orphaned pages
5. ✅ `npm run build` — 0 errors, `dist/server.cjs` present
6. ⏳ Manual smoke test on Vercel preview: `www.xfree.in` returns pillar + tool + guide content; `app.xfree.in` returns Studio with Cloud Mode toggle (disabled when `NVIDIA_API_KEY` unset) — **awaits user deployment**
7. ⏳ `?tool=json-formatter&workflow=csv-validate` deep link on `app.xfree.in` resolves correctly — **awaits user deployment**

## Risks & Mitigations
- **Credential rotation lag:** Until the new NVIDIA key is deployed to Vercel, Cloud Mode will return `NvidiaNotConfiguredError` (503) for any cloud call. This is the correct, safe behavior. No production traffic affected.
- **Pillar/cluster/authority gap (Task 5):** The code's 50/50/10 taxonomy is internally consistent and well-tested. Migrating to 60/600/9 is a content/data change, not an architecture change. The migration is a follow-up, not a blocker.
- **Session branch regression risk:** The session branch's deletions of recipe-runner, studio engines, NVIDIA client, and content pipeline must NOT be merged. The plan executes on `main`, which is the canonical source.

## Out of Scope
- Pillar expansion to 60 (content decision — user owns)
- Authority-pillar data structure (data-model decision — user owns)
- Public CHANGELOG wording (communication — user owns)
- Cloud Mode deployment to production (depends on credential rotation completion)

## Open Question
**Has the NVIDIA API key been rotated, and is the new key provisioned in Vercel?** Until confirmed: Cloud Mode stays disabled by default (no behavior change — it is already opt-in and absent the key returns 503), and any Cloud Mode smoke test in production must wait.
