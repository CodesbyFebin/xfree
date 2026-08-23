# Show HN launch notes — XFree workflow recipes

> **Do not paste text from this file into Hacker News.** Current HN guidance (updated March 2026) explicitly asks submitters to write Show HN text by hand and not use an LLM to generate or edit it. This document is an internal fact sheet, demo plan, and accuracy checklist only. The human submitter must write the title and explanatory text from scratch in their own voice on launch day.

## Launch angle to explain in your own words

Center the submission on the thing a reader can immediately try:

- local browser developer tools;
- inspectable, versioned workflow recipes;
- deterministic execution over allowlisted engines;
- optional WebGPU planning as a secondary capability, not the headline promise.

Avoid leading with “AI developer toolbox.” The recipe system is the more concrete and technically differentiated artifact.

## Submission URL

Use the runnable recipe directory directly:

`https://www.xfree.in/recipes`

Do not point the Show HN submission at a marketing article, waitlist, signup flow, or this document.

## Facts the human-written explanation may cover

Write these ideas in your own words rather than copying the bullets verbatim:

- XFree was built around the observation that many small developer tasks do not require a SaaS backend or opaque agent loop.
- The governed release contains 60 published/indexable tools, including 50 tools in the new governed local batch.
- Agent Studio has 100 allowlisted local engines.
- Eight v1 workflow recipes expose exact steps and can be opened directly in Agent Studio.
- Example architecture to inspect in the UI: URL extraction → URL normalization → line deduplication → line sorting → JSON-array transform.
- A shared recipe is structured data, not arbitrary code.
- Recipe payloads contain a recipe ID, version, allowlisted engine IDs, built-in transform IDs, and a closed set of reviewed configuration flags.
- The runner rejects unknown engines, transforms, configuration keys, non-local v1 recipes, and recipes over six steps.
- Deterministic planning/execution is the default for shared v1 recipes.
- A pinned SmolLM2 WebGPU/WebLLM planner is optional; it proposes plans but does not expand execution permissions.
- XFree is not an entirely client-side platform. Local Mode recipes/tools run in-browser; separately labeled optional cloud/API surfaces can transmit explicitly submitted data.
- The PWA caches same-origin application assets while model downloads, API requests, and ads are excluded from service-worker caching.

## Questions worth asking the HN community

Choose only questions the submitter genuinely wants feedback on, and rewrite them naturally:

- Is the recipe schema small enough to audit while still useful?
- Is the visible execution trace easier to trust/debug than prompt-only automation?
- Which deterministic developer workflow would make a useful next recipe?
- Should recipe compatibility be tied to engine-version constraints or capability declarations?

## What to demo in the first 30 seconds

1. Open `/recipes/url-cleanup-pipeline`.
2. Show the version badge, Local Mode badge, and “No LLM required” disclosure.
3. Point out the five engine/transform IDs in the visible execution plan.
4. Click **Open in Agent Studio**.
5. Run the included sample input.
6. Show the step-by-step plan completing and the normalized JSON output.
7. Open the compact share payload and show that it contains IDs/configuration only, not executable source.

## Technical proof points to keep consistent

- 60 published/indexable tools.
- 50 tools in the governed local-tool batch.
- 100 allowlisted local engines.
- Eight v1 recipes.
- Deterministic local recipe execution; no LLM required for v1 recipes.
- Optional WebGPU/WebLLM planning with the pinned SmolLM2 model.
- Recipe runner validates engine IDs, transforms, configuration, and maximum step count before execution.
- Optional cloud/API surfaces remain explicitly separate from Local Mode.

Do not replace these with roadmap numbers. The 25,000-concept roadmap is a planning taxonomy, not a live-tool count.

## HN readiness checklist

- [ ] `/recipes` is live on the production canonical domain and usable without signup.
- [ ] `/recipes/url-cleanup-pipeline` is directly runnable and its Studio deep link works.
- [ ] GitHub `main` matches the production release being shown.
- [ ] CI, security scanning, SEO/canonical checks, and production deployment are green.
- [ ] The submitter checks `showlim` and is currently eligible to post a Show HN.
- [ ] The submitter has genuine HN community participation rather than creating/using an account only for launch promotion.
- [ ] **The title and explanatory text are written manually by the human submitter without LLM generation or editing.**
- [ ] The title describes what users can actually try and avoids marketing superlatives.
- [ ] No request for upvotes, coordinated voting, or cross-post voting.
- [ ] The submitter is available after posting to answer implementation questions and accept criticism.
- [ ] Source links are available for the allowlist, recipe schema, WebLLM planner, and service-worker policy.

## Community guidance references

Re-check these immediately before launch:

- `https://news.ycombinator.com/showhn.html` — official Show HN guidelines.
- `https://news.ycombinator.com/showlim` — current temporary Show HN account/submission restrictions.
- `https://news.ycombinator.com/item?id=22336638` — HN guidance on presenting Show HN projects; the March 2026 update specifically says not to use LLM-generated or LLM-edited submission text.

Rules and restrictions can change. This file is not a substitute for reading the live HN guidance on launch day.
