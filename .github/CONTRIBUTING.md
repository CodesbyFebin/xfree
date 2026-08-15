# Contributing to XFree.in

Thanks for your interest in contributing. XFree.in is a small, opinionated
codebase: a Vite + React client, an Express server, and a Vercel serverless
function. We value **honest, evidence-backed** changes over volume.

## Ground rules

1. **No fabricated evidence.** Do not add fake ratings, reviews, download
   counts, "as seen in" logos, or capability claims the code cannot back up.
   See [`docs/content.md`](../docs/content.md).
2. **Evolve, don't replace.** Preserve the existing architecture. Don't rewrite
   the app into a different framework for aesthetics, and don't introduce a
   second frontend, database, or routing system.
3. **Local-first privacy.** New tools should run in the browser wherever
   possible. AI features must proxy through the server task allowlist
   ([`src/server/tasks.ts`](../src/server/tasks.ts)) — never accept a
   client-supplied system prompt.
4. **One capability per tool.** Don't bundle unrelated utilities into one page.

## Development setup

```bash
git clone https://github.com/CodesbyFebin/xfree.git
cd xfree
npm ci
cp .env.example .env
npm run dev
```

`npm run verify` runs typecheck + test + tool audit + build. CI runs the same.

## Adding a tool

1. `npm run generate:tool -- --slug=my-tool --title="My Tool" --category=developer-tools --description="..."`
   This creates a `status: "draft"` registry entry and a placeholder component.
2. Implement the component in `src/components/tools/`.
3. Wire it into `src/App.tsx` (the `audit:tools` script fails the build if an
   `indexable` tool has no matching `case`).
4. Only flip `status` to `"indexable"` once it actually works and has a unique
   title, meta description, canonical, and H1, plus per-page JSON-LD.
5. Add it to `src/data/toolGuides.ts` if it warrants a guide.

## Adding a guide

Hand-write it in [`src/data/guides.ts`](../src/data/guides.ts). Each guide needs
an `overview`, a sectioned body, and a `lastReviewed` date you're willing to
defend.

## Pull requests

- Keep PRs focused. One logical change per PR.
- Fill in the PR template. Include evidence (test output, build log, screenshot).
- Ensure `npm run verify` is green before requesting review.
- Reviews are required for `main`.

## Reporting security issues

See [`SECURITY.md`](SECURITY.md). **Do not** open a public issue for
vulnerabilities.

## Good first issues

Look for the `good first issue` and `help wanted` labels. Documentation gaps
(`docs/content.md` compliance, guide improvements) are a great place to start.
