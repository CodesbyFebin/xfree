# XFree Production Architecture

Session date: 2026-09-10. Supersedes `docs/production-readiness.md` (2026-07-29),
which documents the legacy root Vite/Express app and is no longer the
production architecture.

## Canonical ownership

| Surface | Vercel project | Root directory | Framework | Status |
|---|---|---|---|---|
| `www.xfree.in` (marketing, tools, guides, pillars, Signals) | `xfree-web` | `next-app` | Next.js 16 (App Router, Turbopack) | **Production, actively developed** |
| `app.xfree.in` (XFree Studio) | `xfree-studio` | `public/studio` | Static HTML/JS, no build step | **Production**, but see "Deployment provenance" below - the live deployment is stale relative to this branch |
| Apex `xfree.in` | (aliased, no project of its own) | — | — | 308 → `www.xfree.in` (root `vercel.json`, confirmed live) |
| Legacy root app (`src/`, `api/index.js`, Express) | `xfree` | `.` (repo root) | Vite + Express | **Deployed but not publicly reachable** - Vercel Deployment Protection (SSO) gates every route, `x-robots-tag: noindex` on every response, not aliased to any custom domain (own URL only: `xfree-projects555.vercel.app`) |

Confirmed by (not assumed): `.vercel/repo.json`'s linked project, `vercel project inspect` for all three real projects, `vercel project ls`/`domains ls`, and live `curl`/header checks against `www.xfree.in`, `app.xfree.in`, and the legacy app's own preview URL (302 to `vercel.com/sso-api`, `x-robots-tag: noindex`).

**Do not run the legacy Express app as a second production source.** It is inert today (auth-gated, unindexed, unaliased) - that is a safe, acceptable state, not something requiring urgent action.

## Build-command precedence (a real footgun, currently harmless)

`vercel project inspect xfree-web` reports dashboard-configured settings of
`Framework Preset: Other`, `Build Command: npm run build:vercel`, `Output
Directory: dist` - none of which exist for a Next.js app (no `build:vercel`
script, output is `.next` not `dist`). This looks broken but isn't: the
git-tracked `next-app/vercel.json` (`framework: "nextjs"`, `buildCommand: "next
build"`, `outputDirectory: ".next"`) overrides the dashboard defaults on every
deploy, confirmed by every real deployment actually running Turbopack/Next and
serving real Next.js output. The dashboard fields are stale/misleading, not
load-bearing - fix them in the Vercel UI to remove the trap, but this is a
documentation-quality issue, not a live defect.

## Deployment provenance (real gap - operator action needed)

- `xfree-web` (`www.xfree.in`): last production deploy was a direct `vercel
  --prod` CLI push from `next-app/`, matching this branch's ancestor commit
  `4890c5a` (confirmed live via `curl` checks: robots.txt crawler list,
  sitemap.xml count, Signals related-tool links). This bypassed Vercel's
  git-integration "require verified commits" gate, which is why it worked at
  all - none of the recent commits are GPG/SSH-signed, so a normal git-push
  deploy would have been auto-canceled. That gate is still enabled and will
  still block the next ordinary git-triggered deploy.
- `xfree-studio` (`app.xfree.in`): **stale**. The live page is missing the
  `<h1>` this branch already has (`public/studio/index.html`'s
  `assistant-intro` section), still loads Inter from `cdn.jsdelivr.net` (this
  branch replaced that with a self-hosted font), and has no
  Content-Security-Policy header at all (this branch adds one via
  `public/studio/vercel.json`). It has not been redeployed since before
  whichever commit removed the jsdelivr link. **Deploying this branch's
  `public/studio` to the `xfree-studio` project is a real, pending follow-up
  action - deliberately not done automatically here** (deployment is an
  operator decision per this audit's operating rules).
- `main` (git): does not contain this branch's commits, nor the 4 commits
  already merged into `origin/main`'s more recent history via PR
  [#48](https://github.com/CodesbyFebin/xfree/pull/48) (open, mergeable,
  `UNSTABLE` due to the same verified-commits gate). Resolve by either
  disabling "require verified commits" in the Vercel project's Git settings,
  or setting up commit signing - both are decisions only the repo owner
  should make.

## A separate, local-only git anomaly (not a production issue)

This working copy's local `main` branch ref does **not** match
`origin/main`. It points at a small, 5-commit, never-pushed "buildless
single-file prototype" exploration (its own `PROTOTYPE.md` says as much).
`origin/main` on GitHub is untouched and correct. This branch
(`feat/xfree-production-hardening-v3`) was deliberately created from
`seo-aeo-geo-production`'s tip (equivalently `origin/main` + 4 already-verified
commits), not from local `main`, to avoid silently discarding real work.
Recommend the repo owner delete or rename the local `main` branch to avoid
future confusion (`git checkout main` here does **not** give you the real
site).

## Node version consistency

All three Vercel projects (`xfree-web`, `xfree-studio`, `xfree`) report
Node.js 24.x. Confirmed via `vercel project inspect`. No local `.nvmrc` or
`engines` field pins a version for local development or CI - worth adding if
CI is set up to actually build `next-app` (see `docs/SECURITY_MODEL.md`'s CI
section; currently `.github/workflows/ci.yml` was not verified to cover
`next-app` at all in this pass).

## Registry duplication

`next-app/lib/data/toolsWithSEO.ts` (`TOOLS_WITH_SEO`, re-exported as `TOOLS`)
is the registry used by the tool detail pages, `sitemap.ts`, and Signals'
`matchTools.ts`. A second, separately hand-maintained registry,
`next-app/lib/data/tools.ts` (also exporting `TOOLS`), is imported by the
homepage, about/use-cases pages, `tools.json`, `capabilities.json`, the RSS
feeds, `llms-full.txt`, the `/api/v1/*` endpoints, and `Footer.tsx`. Both
currently agree on all 58 slugs, `status`, `indexable`, and `execution` values
(verified by diffing both files programmatically) - no live inaccuracy today,
but ~50 `shortDescription` strings and one `title` differ between them, and
nothing prevents future drift on a field that matters. See
`docs/PUBLICATION_CONTRACT.md` for the consolidation recommendation.

## What this document does not cover

Full per-route Playwright/CI coverage, Lighthouse-measured performance
numbers, and a live full-site crawl (only a representative sample was
crawled via `next-app/scripts/verify-sitemap.ts`) were not performed in this
pass - see `reports/FINAL_PRODUCTION_AUDIT.md` for the honest gate status on
each.
