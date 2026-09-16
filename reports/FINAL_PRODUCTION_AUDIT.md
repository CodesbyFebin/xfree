# XFree Production Hardening — Audit Report

Branch: `feat/xfree-production-hardening-v3`
Base: `seo-aeo-geo-production` @ `4890c5a` (= `origin/main` + 4 already-live commits)
HEAD at time of writing: `f816489`
6 commits, 26 files changed, +789/-87 lines. Full history: `git log seo-aeo-geo-production..feat/xfree-production-hardening-v3`

This is a checkpoint against the full 19-section hardening scope, not a claim
that every section is complete. Gates are reported as PASS / HOLD / FAIL /
NOT TESTED per the release-gate contract; NOT TESTED is never silently
upgraded to PASS.

## What changed, by commit

1. **`4c0b4f0` fix(security): protect paid provider endpoints** - Upstash-backed
   distributed rate limiting, per-IP/global daily quotas, origin check,
   idempotency, video concurrency cap, kill switches defaulting off, for
   `/api/nvidia/chat`'s Venice/DeepSeek tier and `/api/video/generate`.
2. **`44ff005` refactor(registry): establish governed public tool source** -
   reconciled `engineVerified` from 19/58 to 58/58 with evidence
   (`reports/tool-verification-reconciliation.csv`).
3. **`5efb982` fix(deploy): restore broken /studio canonical redirect** -
   `www.xfree.in/studio` and `app.xfree.in/studio` both 404'd in production;
   fixed the redirect in the Vercel project that's actually live, plus
   self-hosted Inter for Studio (cherry-picked/adapted from an orphaned
   branch, `ed29e76`).
4. **`1b619d2` fix(headers): enforce unified CSP and security policy** -
   removed a second, conflicting CSP `<meta>` tag on `www.xfree.in`; added a
   real CSP to `app.xfree.in` (had none); dropped `unsafe-eval`, disabled
   `X-Powered-By`, removed a wildcard `next/image` host allowlist.
5. **`cf7e8b9` fix(content): remove placeholder AdSense units and dead
   preconnects** - three `ca-pub-XXXXXXXXXXXXXXXX` ad slots, never functional
   (no AdSense loader script exists), removed.
6. **`f816489` fix(content): align local-vs-server execution claims with
   reality** - "100% client-side"/"never leaves your device" claims were
   false for 3 of 58 tools (DNS/IP/WHOIS lookup) and Studio's Cloud Mode;
   qualified across FAQ, security, about, homepage, the affected pillar, and
   `llms.txt`/`llms-full.txt`.

Plus 4 docs: `PRODUCTION_ARCHITECTURE.md`, `SECURITY_MODEL.md`,
`PUBLICATION_CONTRACT.md`, `DEPLOYMENT_RUNBOOK.md`, `ROLLBACK_RUNBOOK.md`.

## Verification performed

- `next-app`: `npm run typecheck` ✓, `npm run lint` ✓, `npm run build` ✓
  (2098 static pages, unchanged count) - re-run after every commit above, not
  just once at the end.
- `npm run verify:sitemap` - PASS (1510 URLs, uniqueness, locale/hreflang
  checks, registry-reconciliation assertion updated 19→58 and passing,
  representative live-sample crawl of 6 URLs against production).
- `npm run verify:tool-matching` - PASS (unchanged by this branch).
- `npm run verify:paid-security` (new) - 13/13 PASS, proves the fail-closed
  default; explicitly does not cover the enabled-state behavior (needs real
  Upstash - see script output).
- Manual: clean `rm -rf .next && npm run build && npm run start` to confirm
  the duplicate CSP meta tag is actually gone from rendered output (not just
  source), the header CSP is correctly served, and no eval() error occurs in
  a real production server (only in `next dev`, which is expected/documented
  React dev-mode behavior).
- Live production `curl` checks against `www.xfree.in` and `app.xfree.in` for
  redirects, canonical tags, security headers, and H1 presence.

## Release gate

```text
P0 security findings:              0 known, 1 fixed this pass (anonymous paid endpoints)
P1 security findings:              Fixed: duplicate/missing CSP, placeholder ads.
                                    Accepted: legacy app's in-memory rate limiter
                                    (SSO-gated, not publicly reachable).
Paid endpoints protected:          PASS (fail-closed default verified; enabled-state
                                    behavior NOT TESTED - needs real Upstash)
Canonical routing:                 PASS (redirect fix verified in code + rebuild;
                                    apex/www redirect was already correct)
Studio routing:                    PASS in code; HOLD on production (not yet deployed -
                                    see PRODUCTION_ARCHITECTURE.md)
Registry reconciliation:           PASS (58/58 engineVerified, evidence in CSV).
                                    Second registry (lib/data/tools.ts) documented as a
                                    known gap, not blocking - HOLD on consolidation
Sitemap contract:                  PASS (verify:sitemap, sampled live crawl)
Raw metadata:                      PASS on the sample verified; NOT TESTED as a full
                                    1510-URL crawl
Content truth:                     PASS on claims found and fixed this pass; NOT TESTED
                                    as a full per-tool-page manual audit of all 58 tools
Next-app CI:                       NOT TESTED (no "test" script exists in next-app;
                                    .github/workflows/ci.yml coverage of next-app not
                                    verified in this pass)
Accessibility:                     NOT TESTED (no automated a11y scan run this pass)
Mobile verification:               NOT TESTED (no responsive/viewport check run this pass)
Production crawl:                  HOLD (sampled, not exhaustive - see verify:sitemap's
                                    own documented scope)
Deployment provenance:             xfree-web: matches this branch's ancestor commit, via
                                    direct CLI deploy (bypassed git). xfree-studio: STALE,
                                    pending a deploy of this branch. Documented, not
                                    silently accepted - see PRODUCTION_ARCHITECTURE.md
Rollback readiness:                PASS (runbook written, rollback path is a plain Vercel
                                    deployment promotion - no new stateful/migration risk
                                    introduced by this branch)
```

**Overall: AMBER / HOLD.** No known P0 remains, but required verification
(CI, accessibility, mobile, full crawl) is genuinely incomplete, and one
surface (`app.xfree.in`) needs a deploy before its fixes take effect in
production. Not GREEN, and not RED - do not deploy `xfree-studio` or flip any
paid-tier kill switch without addressing this report's open items first.

## What operator action this branch does NOT take on your behalf

- Does not merge or deploy anything - branch only, per the operating rules.
- Does not touch the Vercel "require verified commits" Git setting.
- Does not provision Upstash Redis or set any production env var.
- Does not deploy `public/studio` to `xfree-studio` (its fixes are code-only
  until you choose to).
- Does not consolidate `lib/data/tools.ts` into `toolsWithSEO.ts` (documented
  recommendation only).

## Explicit release recommendation

1. Review this branch's 6 commits.
2. Deploy `xfree-studio` (`public/studio`) once reviewed - its fixes
   (redirect, CSP, font, H1) are code-complete but not live.
3. Decide on the Vercel verified-commits setting so `main` and production
   stop diverging on every future change.
4. Before enabling any paid-tier kill switch: provision Upstash, set its env
   vars, and re-run a real exercise of the rate-limit/quota/origin paths
   against it (not just `verify:paid-security`'s disabled-state proof).
5. Treat CI/accessibility/mobile/full-crawl as separate, still-open follow-up
   work - this report does not claim they're done.
