## Description

<!-- What does this PR change, and why? Link the issue it closes (e.g. "Closes #123"). -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New tool / page
- [ ] Improvement to existing tool / page
- [ ] Documentation
- [ ] CI / build / infra
- [ ] Refactor (no behavior change)

## Checklist

- [ ] `npm run typecheck` passes locally
- [ ] `npm run test` passes locally
- [ ] `npm run build` succeeds
- [ ] I did not add fake ratings, reviews, or fabricated claims (per docs/content.md)
- [ ] New indexable pages have a unique `<title>`, meta description, canonical, and H1
- [ ] No secrets or `.env` values are committed
- [ ] If a tool is added, it is wired in `src/App.tsx` AND set to `status: "indexable"` only after it works

## Evidence

<!-- Paste test output, screenshots, or build logs that prove the change works. -->
