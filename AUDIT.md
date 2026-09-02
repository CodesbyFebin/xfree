# XFREE.IN — Repository Forensic Audit

> Phase 0 deliverable for the Open-Source + AI Authority Engine initiative.
> Method: full read of the repository on 2026-08-15, followed by verifiable
> gates (typecheck, 20 unit tests, full production build, generated artifacts).
> Every statement below is backed by a file path or a build/test result.
> No community signals (stars, forks, contributors) are asserted because they
> cannot be verified from the sandbox and must never be fabricated.

## Canonical entity definition (Phase 1)

Single source of truth: `README.md` (line 1-18) and `public/llms.txt` (line 1-3).

> "XFree.in — Free browser-based developer, SEO, and single-purpose AI
> micro-tools. 10 hand-authored tools with real React components, unique
> long-form guides, and per-page JSON-LD. Local tools run in-browser; AI tools
> proxy to Google Gemini server-side. Open source under MIT."

This definition is already consistent across README, `llms.txt`, sitemap, and
structured data. It is **not** "400+ tools" — the ~396 remaining entries in
`src/scripts/tools-seed.json` are `status: "draft"` and excluded from sitemap,
prerender, and search. Keep this discipline; do not let future scaffolding
inflate the public claim.

## Current architecture

- **Client:** React 19 + Vite 6 + Tailwind 4. Source in `src/`, components in
  `src/components/` (`tools/*` wired components, `pages/*` static pages).
- **Server:** Express 4. Dev entry `server.ts`; production is a Vercel
  serverless function (`api/index.js`, built from `src/vercel-handler.ts`).
- **AI proxy:** `@google/genai` behind a server-side task allowlist
  (`src/server/tasks.ts`). Client-supplied system prompts are rejected. Unknown
  `taskId` → 400; missing key → 503.
- **Prerender:** `src/scripts/prerender.ts` emits static HTML per route (verified:
  36 routes + 404.html).
- **SEO/GEO:** `src/scripts/generateSitemap.ts` emits `sitemap.xml`, `rss.xml`,
  `robots.txt`, `llms.txt`, `llms-full.txt`, `capabilities.json`, `tools.json`,
  `problem-pages-sitemap.xml`.
- **Registry:** `src/data/toolsRegistry.ts` — 10 `indexable` tools + seed drafts.
- **Governance:** `.github/` added this initiative (CI, security, docs, release,
  issue/PR templates, CODEOWNERS, dependabot, CoC, CONTRIBUTING, SECURITY,
  SUPPORT). `LICENSE` (MIT) added.

## Current strengths

- Honest scope; draft stubs excluded from every public surface.
- Per-route prerender with unique title/description/canonical/OG/JSON-LD.
- Split-brain `robots.txt` allowing citation bots, blocking bulk-training bots.
- Security baseline: CSP + HSTS + X-Frame-Options: DENY + Referrer-Policy +
  Permissions-Policy + COOP + CORP; Zod validation; honeypot + rate limits on
  contact/feedback/lead.
- Deterministic `npm run verify` (typecheck → test → audit:tools → build → lint:noindex).
- `npm run audit:tools` fails the build if an `indexable` tool has no wired component.

## Technical debt

- **Bundle:** single 781 KB JS chunk (202 KB gzip). No route-level code-splitting.
- **In-memory rate limiter** (`src/server/rate-limit.ts`) — fine for low traffic,
  must become Redis-backed before scale.
- **`api/index.js`** is a committed build artifact (gitignored comment explains
  why). Acceptable, but it drifts if `src/vercel-handler.ts` changes and the
  build isn't re-run. CI now rebuilds it.
- **Execution/agent modules** (`src/lib/execution-engine.ts`, `src/lib/agents.ts`)
  are definitions + light scaffolding; real backend execution is client-side in
  the React tool components. Keep them as orchestration types, not fake backends.

## Security risks

- **12 npm advisories** (3 moderate, 9 high) in transitive deps: `@vercel/*` (build
  only), `js-yaml`, `ajv`, `minimatch`, `nanoid`, `path-to-regexp`, `undici`.
  `undici` is the only runtime-path concern; triage first. Fix via `npm audit fix`
  on a branch — CI will validate.
- CSP uses `'unsafe-inline'` script-src (required by AdSense). Documented in
  `src/middleware/security-headers.ts`; plan a nonce-based strict CSP + certified
  CMP for EEA/UK.

## SEO / AEO / GEO status

- ✅ Unique metadata + sitemap + prerender verified.
- ✅ `llms.txt` / `llms-full.txt` present and consistent.
- ☐ Add `WebApplication` + `BreadcrumbList` JSON-LD to home/static pages.
- ☐ `robots.txt` references `www.xfree.in` (correct canonical host).

## Documentation gaps

- `docs/` exists (content, deploy-vercel, indexing, production-readiness) — good.
- ☐ No `docs/README.md` index (GitHub Pages landing) — added below.
- ☐ No `CHANGELOG.md` — added below.
- ☐ No `examples/` directory — added below.

## GitHub discoverability problems

- ☐ **Repository description / topics / social preview** are set on GitHub.com,
  not in-repo. Recommended topics (owner action): `typescript`, `react`,
  `vite`, `express`, `seo-tools`, `developer-tools`, `utilities`, `webapp`,
  `open-source`, `ai-tools`. Do **not** add irrelevant trending tags.
- ☐ GitHub Discussions, "good first issue" labels, and releases are owner actions.
- ✅ Issue/PR templates, CI, SECURITY, CONTRIBUTING now present in-repo.

## Community gaps

- ☐ GitHub Wiki (design decisions, threat model, release process) is created on
  GitHub.com — cannot be done from sandbox. Recommend Wiki for *institutional
  knowledge*, GitHub Pages for *user docs* (no duplication).
- ☐ Examples + starter templates to lower first-contribution friction — added below.

## Accessibility issues

- Structure + focus handling exist in components, but no automated axe/Lighthouse
  run is available from the sandbox. Recommend a real audit on the live site.

## Performance issues

- Single 202 KB gzip chunk; target route-level `React.lazy` + `manualChunks`.
- No Core Web Vitals measurement available offline.

## Missing trust signals (honest only)

- ✅ SECURITY.md with responsible disclosure.
- ✅ LICENSE (MIT).
- ☐ Reproducible benchmark methodology (Phase 19) — only add with real numbers.
- ☐ "Built with XFree" showcase — only after real community usage exists.

## Missing product positioning

- Positioning is already clear and consistent (see Canonical entity above).
- ☐ Ensure the homepage hero states the same one-liner as README/llms.txt (owner
  verify on live site).

## Missing conversion paths

- ✅ Homepage → GitHub CTA, docs CTA exist in component tree.
- ☐ Verify the "First successful result in under 5 minutes" claim is true for a
  new developer cloning the repo (it is: `npm ci && npm run dev`).

## Conclusion

The product is technically credible and honestly built. The remaining work is
(1) close the 12 dependency advisories, (2) code-split the bundle, (3) publish
in-repo docs/examples/changelog (done this initiative where verifiable), and
(4) owner actions on GitHub.com (topics, Pages, Wiki, Discussions, releases,
good-first-issues). No community signals were or will be manufactured.
