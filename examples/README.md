# XFree.in Examples

Real, runnable examples of using XFree.in's open-source engine modules. These
demonstrate the **intent → capability → execution** core that powers the site,
and they run against the actual `src/lib` code (no mocks).

## Run an example

From the repo root (requires dependencies installed: `npm ci`):

```bash
npx tsx examples/intent-routing.ts
```

## What these show

- `intent-routing.ts` — classify a natural-language problem, route it to the
  tools that actually solve it, and resolve capability recommendations. It also
  demonstrates the *honest* behavior: an intent XFree cannot fulfill (e.g.
  "compress this PDF") returns **zero** tools rather than a misleading match.

## Adding an example

1. Create `examples/<name>.ts`.
2. Import from `../src/lib/...` (path alias `@/*` is also configured).
3. Keep it dependency-free beyond the repo itself.
4. Prefer printing real output over assertions — these double as smoke checks.

Examples must never fabricate results. If a capability does not exist in
`src/data/toolsRegistry.ts`, the example should show it is absent.
