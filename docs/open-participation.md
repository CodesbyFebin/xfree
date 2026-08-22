# XFree Open Participation & Tool Contribution

XFree keeps a public 25,000-concept roadmap so contributors can see the intended scope without pretending every concept is already a live product. The production catalog is deliberately smaller: only tools that have a working implementation and pass publication, accessibility, security, content, canonical, and crawl checks become public/indexable.

## Three-layer contribution model

1. **Roadmap** — planned concepts are searchable on `/roadmap`. They do not receive individual indexable stub pages.
2. **Contribution pipeline** — a contributor claims or requests a concept, implements it against the current XFree React/TypeScript architecture, adds tests and processing disclosures, and opens a pull request.
3. **Production** — after automated checks and human review, the tool can enter the published registry. The sitemap and prerender pipeline then discover it automatically.

## Start a tool contribution

1. Browse `https://www.xfree.in/roadmap` and choose a planned concept.
2. Open a tool request using the repository issue template or the roadmap's **Request/build on GitHub** link.
3. Confirm the intended inputs, outputs, processing mode, accessibility requirements, and edge cases before writing code.
4. Implement the tool in the existing architecture. Do not introduce a second registry or legacy SSG runtime.
5. Add tests for valid, invalid, empty, and realistic large inputs where applicable.
6. Run `npm run verify` locally when possible.
7. Open a pull request and complete the repository checklist.

Repository: `https://github.com/CodesbyFebin/xfree`

## Publication gates

A tool is not publishable merely because a page can render. Review must confirm:

- real working functionality;
- no hard-coded secrets;
- safe rendering and input handling;
- keyboard and screen-reader usable controls;
- explicit local, cloud, or hybrid processing disclosure;
- truthful limitations and edge cases;
- unique title, description, H1, examples, and supporting copy;
- correct internal links and category/pillar placement;
- self-referencing `https://www.xfree.in/...` canonical;
- a prerendered 200 HTML artifact;
- no sitemap entry before publication approval;
- no duplicate/thin variant created only for search traffic.

Generated editorial pages additionally remain subject to the governed publication pipeline in `src/content-pipeline/`, including approval and fingerprint checks.

## Good-first-issue workflow

Maintainers can run the manual **Good First Issue Candidates** GitHub Action. By default it only produces a deterministic candidate artifact from the roadmap. Issue creation requires an explicit workflow input and is capped to a small batch with duplicate-title checks. This prevents automated issue spam while still making the roadmap actionable.

## Contributor recognition

Merged pull requests remain permanently visible in Git history and release notes. Contributor recognition should be factual and tied to accepted work. XFree does not manufacture contributors, stars, testimonials, usage figures, or fake activity.

## Security rules for new tools

- Prefer browser-local processing when it is genuinely appropriate.
- If submitted content leaves the browser, name the provider and make the handoff explicit.
- Avoid `eval`, `Function`, unsafe HTML injection, and unnecessary third-party code.
- Treat all tool input as untrusted.
- Keep secrets server-side and environment-driven.
- Do not weaken CSP or other site-wide security headers for one tool without review.

## Search/indexing rules

The roadmap exists for users and contributors, not to manufacture thousands of pages. Planned concepts stay on the single roadmap surface. Individual tool URLs become indexable only after implementation and review. That implementation-first rule is the core SEO/AEO/GEO quality gate.
