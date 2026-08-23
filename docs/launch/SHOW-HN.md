# Show HN launch draft — XFree workflow recipes

## Recommended title

**Show HN: XFree – local browser tools with inspectable workflow recipes**

Alternative, if the WebGPU planner is central to the demo on launch day:

**Show HN: XFree – local browser tools with optional WebGPU workflow planning**

Prefer the first title. The reproducible recipe system is the distinctive, immediately testable artifact; WebGPU planning is optional and should not make the project sound like another generic AI wrapper.

## Submission URL

Use the runnable recipe directory directly:

`https://www.xfree.in/recipes`

Do not point the Show HN submission at a marketing article, waitlist, or signup flow.

## Suggested first comment

I built XFree because many small developer tasks do not need a SaaS backend or an opaque agent loop.

The current governed release has 60 published tools, 50 tools in the new local-tool batch, and 100 allowlisted local engines. I have now added a small recipe layer on top: eight versioned workflows that expose the exact execution steps and can be opened directly in Agent Studio.

For example, the URL Cleanup Pipeline is:

`http-url-extract → url-normalize → line-dedupe → line-sort → lines-to-json-array`

The important implementation constraint is that a shared recipe is data, not code. Its payload contains a recipe ID, version, allowlisted engine IDs, built-in transform IDs, and a very small set of reviewed configuration flags. The runner rejects unknown engines, transforms, config keys, non-local v1 recipes, and plans over six steps. A recipe link therefore cannot introduce arbitrary JavaScript or expand the browser app's execution authority.

The default workflow planner is deterministic. There is also an optional local WebGPU/WebLLM planner using the pinned SmolLM2 model, but the individual execution steps are still visible and validated against the same engine allowlist before they run.

I also want to be precise about the privacy claim: XFree is not an entirely client-side platform. The initial workflow recipes and published Local Mode tools run in the browser, while separately labeled optional cloud/API features can transmit explicitly submitted data to configured providers. The PWA caches same-origin application assets; model downloads, API requests, and ads are excluded from the service-worker cache.

I would particularly value feedback on three things:

1. Is the recipe schema small enough to be auditable but expressive enough to be useful?
2. Is the execution trace clear enough to debug and trust compared with prompt-only automation?
3. Which deterministic developer workflow would be the best ninth recipe?

Source: `https://github.com/CodesbyFebin/xfree`

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
- [ ] The submitter account is currently eligible to post a Show HN and has genuine community participation.
- [ ] The title describes what users can actually try; it does not use superlatives such as “ultimate,” “revolutionary,” or “best.”
- [ ] No request for upvotes, coordinated voting, or cross-post voting.
- [ ] Be available after posting to answer implementation questions and accept criticism.
- [ ] Link directly to source when discussing the allowlist, recipe schema, WebLLM planner, or service-worker policy.

## Community guidance references

Before launch, re-check the current versions of:

- `https://news.ycombinator.com/showhn.html` — official Show HN guidelines.
- `https://news.ycombinator.com/showlim` — current Show HN account/submission restrictions.
- `https://news.ycombinator.com/item?id=22336638` — HN guidance on presenting Show HN projects with technical clarity rather than marketing copy.

Rules and restrictions can change; treat these links as launch-day checks, not permanent assumptions.
