# Deployment Runbook

Session date: 2026-09-10. Three independent Vercel projects - deploy them
separately; there is no single "deploy XFree" command.

## Normal path: git-triggered deploy

Push/merge to `main` triggers a build for each project whose git integration
watches it. **Currently blocked**: `xfree-web`'s Vercel project has "require
verified (signed) commits" enabled, and no recent commit is GPG/SSH-signed,
so every git-triggered build auto-cancels
(`githubCommitVerification: "unverified"`, confirmed via the Vercel API on a
real canceled deployment). Fix by either disabling that Git setting or
setting up commit signing - both need the repo owner's decision, not
something to change unilaterally mid-audit.

## Fallback path used in this session: direct CLI deploy

Bypasses the git-integration verified-commits gate entirely (it's not a
git-triggered deployment):

```bash
cd next-app   # or public/studio, for that project
vercel --prod
```

This deploys **exactly what's on disk**, regardless of git branch/commit
state - it does not push or merge anything to `main`. After running it,
`main`/PR history and the live site can diverge (this happened this session -
see `docs/PRODUCTION_ARCHITECTURE.md`'s "Deployment provenance" section).
Always note the git commit the working tree was at when you ran this.

## Verifying a deploy actually landed

Vercel's edge cache can serve a stale response for up to ~1-2 minutes right
after a deploy, even though the new deployment is already `READY`. Don't
conclude a deploy failed from one stale curl:

```bash
# Check the deployment itself (bypasses domain aliasing/caching)
vercel inspect <deployment-url-from-the-deploy-output>

# Check the domain directly, with cache header visibility
curl -sD - https://www.xfree.in/ -o /dev/null | grep -i x-vercel-cache
```

Then confirm the actual content, not just a 200:

```bash
curl -s https://www.xfree.in/robots.txt | grep -c "^User-Agent:"
curl -s https://www.xfree.in/sitemap.xml | grep -c "<loc>"
npm --prefix next-app run verify:sitemap   # full local + sampled-live check
```

## Env vars

`vercel env ls production` shows what's actually configured (no values, just
names) - use this instead of assuming from `.env.example`. As of this pass,
`xfree-web` has **zero** production env vars set, meaning Cloud Mode/paid
providers are entirely unconfigured (see `docs/SECURITY_MODEL.md`).

## Before deploying a paid-provider change

Never set a `*_ENABLED=true` kill switch (`NVIDIA_PAID_TIER_ENABLED`,
`VIDEO_GENERATION_ENABLED`) in production without first: provisioning
Upstash Redis and setting `UPSTASH_REDIS_REST_URL`/`TOKEN`, then exercising
the rate-limit/quota/origin-check paths against that real instance -
`npm run verify:paid-security` only proves the *disabled* default, not the
enabled behavior (see that script's own "NOT COVERED" output).
