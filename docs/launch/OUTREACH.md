# XFree adoption outreach sequence

## Launch order

1. **Ship workflow recipes to production.** The product demonstration must exist before outreach.
2. **Position GitHub around Try it → Inspect it → Contribute it.** Source should answer trust questions immediately.
3. **Launch technical discussions on Hacker News and relevant Reddit communities.** Lead with reproducible workflows and implementation details.
4. **Submit to curated developer-resource / awesome lists.** Verify each list's contribution policy immediately before opening a PR.
5. **Publish recurring build-in-public releases.** New recipes, engines, tests, browser compatibility improvements, and real limitations are stronger recurring stories than feature-count announcements.

## Readiness gate before any outreach

- `/recipes` and all eight initial detail pages return production 200s.
- Recipe Studio deep links work from the canonical public site.
- `main` CI/security checks are green.
- Production deployment SHA matches the GitHub release SHA.
- Canonical URLs and recipe sitemap entries are live.
- `recipes.json` and per-recipe JSON are accessible.
- Public counts match the current release: 60 published tools, 50 governed local-batch tools, 100 allowlisted local engines.
- Optional WebGPU/WebLLM planning is described as optional, not required for deterministic recipe execution.
- No platform-wide “100% client-side” claim.

## Curated-list targeting

Prioritize collections where XFree's current product is genuinely relevant:

- developer tools / browser developer utilities;
- privacy-conscious browser tools;
- WebGPU / WebAI / local-in-browser AI projects;
- TypeScript developer resources;
- frontend/browser tooling;
- open-source technical SEO tooling;
- local-first software collections whose inclusion rules do not require a server distribution.

### Do not target `awesome-selfhosted` yet

Do not submit XFree to self-hosting-specific lists until the project ships and documents a genuinely self-hostable distribution with an installation path that satisfies the target list's current definition. A public GitHub repository or browser PWA alone should not be marketed as a self-hosted service.

## Outreach PR template

Use this shape when a curated repository's contribution guide allows additions:

```text
XFree — open-source browser developer tools and versioned local workflow recipes.

Why it fits this list:
- 60 published developer/SEO/data utilities;
- deterministic local workflow recipes composed from allowlisted browser engines;
- inspectable execution plans and versioned recipe JSON;
- optional WebGPU/WebLLM planner separated from execution authority;
- usable without an XFree account.

Project: https://www.xfree.in/recipes
Source: https://github.com/CodesbyFebin/xfree
License: MIT
```

Adjust the wording to the target repository's format. Never mass-submit identical PRs.

## What makes a good recurring release post

Prefer a concrete artifact and measured engineering change:

- “Added a safe recipe schema that cannot carry arbitrary JavaScript.”
- “Added three deterministic URL workflows and tests for normalization edge cases.”
- “Reduced Studio bundle size by code-splitting the optional local model runtime.”
- “Added Safari/Firefox fallback behavior for File System Access limitations.”
- “Added a recipe compatibility/version migration policy.”
- “Added a local benchmark harness for 100 browser engines.”

Avoid:

- “25,000 tools launched.” The 25,000 figure is a roadmap concept count.
- “100% client-side platform.” Optional cloud/API functionality exists.
- “Zero tracking” unless every production third-party surface has been verified at that release.
- “Unlimited” or performance guarantees without an enforced/tested definition.
- generic AI-superlative launch copy.

## Community feedback loop

Turn launch feedback into small public issues with evidence:

1. Link the discussion/comment that motivated the change when appropriate.
2. State the reproducible behavior or limitation.
3. Add a failing test or acceptance criterion before implementation when possible.
4. Keep roadmap ideas non-indexable until a working implementation passes publication gates.
5. Release recipe changes with explicit versioning when behavior changes incompatibly.

## Recipe ecosystem next steps

After the first eight recipes have real usage feedback:

- add a formal JSON Schema for recipe payloads;
- define backward-compatible vs breaking recipe-version rules;
- add import/export UI with preview-before-run;
- sign or hash canonical recipe definitions for integrity checks;
- add recipe test vectors (sample input + expected output hash/content);
- add capability requirements (e.g. Web Crypto, Worker, WebGPU) without silently degrading behavior;
- allow community recipe proposals through review rather than accepting executable scripts;
- add recipe provenance (`official`, `community-reviewed`) only when the review workflow exists.

The objective is an ecosystem developers can **run, inspect, reproduce, fork, discuss, and contribute to** without turning shared automation into a remote-code-execution mechanism.
