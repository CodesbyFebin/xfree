# XFree.in Documentation

This directory is the source for XFree.in's developer documentation. It is
structured to publish directly to **GitHub Pages** (user docs) while deeper
engineering rationale lives in the **GitHub Wiki** (owner-published). The two
should not duplicate: Pages = how to use; Wiki = why it's built this way.

## Start here

- [Getting Started](./content.md) — what XFree.in is and how the tools work
- [Deployment (Vercel)](./deploy-vercel.md) — build, env vars, domain/canonical setup
- [Indexing & SEO](./indexing.md) — sitemap, robots, llms.txt, AI-crawler policy
- [Production Readiness](./production-readiness.md) — AdSense review readiness, CSP, limits

## Canonical entity (use everywhere)

> XFree.in — free, browser-based developer, SEO, and single-purpose AI
> micro-tools. Local tools run in your browser; AI tools proxy to Google Gemini
> server-side. Open source under MIT. 10 hand-authored tools; ~396 draft stubs
> are explicitly excluded from search.

This sentence is the single source of truth used in `README.md`,
`public/llms.txt`, and structured data. Keep them in sync.

## External references

- Live site: https://www.xfree.in
- Repository: https://github.com/CodesbyFebin/xfree
- API: `POST /api/ai` (task allowlist in `src/server/tasks.ts`)

## Contributing

See [CONTRIBUTING.md](https://github.com/CodesbyFebin/xfree/blob/main/.github/CONTRIBUTING.md).
Documentation PRs are welcome — follow [`content.md`](./content.md) rules (no
fabricated claims, no keyword stuffing).
