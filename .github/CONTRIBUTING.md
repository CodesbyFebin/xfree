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
5. **No combinatorial roadmap entries.** Tool proposals must describe a real
   user problem and a distinct implementation. Do not create names by combining
   category, cluster, and modifier keywords.
6. **Implementation and publication are separate reviews.** A working engine
   may merge without receiving a public SEO page. Publication requires its own
   evidence-backed registry and content review.

## Development setup

```bash
git clone https://github.com/CodesbyFebin/xfree.git
cd xfree
npm ci
cp .env.example .env
npm run dev
```

`npm run verify` runs typecheck + test + tool audit + build. CI runs the same.

## Adding a dedicated website tool

1. `npm run generate:tool -- --slug=my-tool --title="My Tool" --category=developer-tools --description="..."`
   This creates a `status: "draft"` registry entry and a placeholder component.
2. Implement the component in `src/components/tools/`.
3. Wire it into `src/App.tsx` (the `audit:tools` script fails the build if an
   `indexable` tool has no matching `case`).
4. Keep the registry entry at `status: "draft"` and `indexable: false` while
   implementing and testing it.
5. A maintainer may promote it to `status: "published"` and `indexable: true`
   only after the behavior, metadata, canonical, single H1, privacy wording,
   JSON-LD, and rendered route have been reviewed.
6. Add it to `src/data/toolGuides.ts` if it warrants a guide.

## Adding a Studio engine

Studio engines are small local functions registered in
[`src/lib/studio/engines.ts`](../src/lib/studio/engines.ts). Prefer a pure,
testable implementation in `src/lib/studio/` and keep UI concerns out of the
engine.

Every new engine must include:

- a globally unique engine ID;
- a precise input/output contract and honest limitations;
- unit tests covering valid input, malformed input, and important edge cases;
- no `innerHTML`, `eval`, remote script, hidden upload, or client-side secret;
- an explicit warning for inspection-only security utilities (for example,
  JWT decoding does not verify a signature);
- Web Worker execution when parsing or processing can block the main thread.

Registering an engine does **not** automatically create or publish an SEO page.
The generated-content pipeline remains fingerprint-bound and human-reviewed.

## Tool proposal lifecycle

1. Open a Tool proposal issue with a concrete problem, inputs, outputs, edge
   cases, and proposed execution model.
2. A maintainer verifies that the capability is distinct and technically
   feasible before adding labels such as `good first issue`.
3. Implement the engine/component and tests in a focused PR.
4. Pass `npm run verify` and attach behavior evidence.
5. Merge the functional capability independently of publication.
6. Create and review any dedicated page through the existing publication gate.

The project does not publish placeholder pages, public Cartesian-product
roadmaps, or generated issue floods.

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
