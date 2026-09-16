# Rollback Runbook

Session date: 2026-09-10.

## Fastest rollback: re-alias a previous deployment

Every Vercel deployment is immutable and keeps its own URL forever. Rolling
back does not require a revert commit or a new build:

```bash
npx vercel ls xfree-web           # find the last known-good deployment URL
npx vercel promote <deployment-url>   # aliases production domains to it
# or, from the dashboard: Deployments -> select one -> "Promote to Production"
```

Confirm the current production alias target and its age/status before
promoting anything:

```bash
npx vercel inspect https://www.xfree.in
```

Do the same per-project (`xfree-web`, `xfree-studio`) - they roll back
independently.

## If the bad state is a direct CLI deploy (not git-triggered)

Since a CLI deploy doesn't touch `main`, "reverting the commit" does nothing
to production - you must promote an earlier *deployment*, not revert git
history. Check `npx vercel ls <project>` for the deployment immediately
before the one you want to undo.

## If the bad state is in git and reachable via the normal deploy path

Standard revert:

```bash
git revert <bad-commit-sha>
git push origin <branch>
```

This only actually redeploys once the git-triggered verified-commits gate is
resolved (see `docs/DEPLOYMENT_RUNBOOK.md`) - until then, pair it with a
direct CLI deploy of the reverted state.

## Paid-provider kill switches double as an emergency stop

If a paid tier is misbehaving (runaway spend, abuse) after being enabled,
the fastest mitigation is not a rollback at all - flip the relevant env var
in the Vercel dashboard (`NVIDIA_PAID_TIER_ENABLED=false` or
`VIDEO_GENERATION_ENABLED=false`) and redeploy, or use `vercel env rm` /
`vercel env add` from the CLI. This takes effect on the next deploy; for an
immediate stop without waiting on a build, temporarily removing the
provider's own API key (`VENICE_API_KEY`, `DEEPSEEK_API_KEY`, `FAL_API_KEY`)
via `vercel env rm` also works, since every route already fails closed
(`503`) when its provider key is absent.

## Registry/content rollback

`next-app/lib/data/toolsWithSEO.ts`'s `engineVerified` correction and the
content-truth copy fixes are plain git changes with no external state (no
database migration, no Upstash keys touched) - a normal `git revert` (paired
with a redeploy per the rollback path above) fully undoes them.
