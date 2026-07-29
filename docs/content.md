# Content pipeline

## What's shipping

Each of the 10 indexable tools has a hand-authored guide in [`src/data/toolGuides.ts`](../src/data/toolGuides.ts). A guide has:

- `overview` — one paragraph, tool-specific, no marketing filler.
- `workedExamples` — 2–4 real inputs + expected outputs + why-it-matters explanation.
- `whenToUse` — 3–4 concrete situations.
- `whenNotToUse` — honest limitations. **Do not skip this.** Pages that only list positives read as promotional; pages that admit limits read as authoritative and get cited.
- `troubleshooting` — symptom → fix pairs.
- `relatedSlugs` — internal links to other real tools.
- `lastReviewed` — ISO date.

The guide renders in two places:

1. **Server-side in the prerendered HTML** ([src/scripts/prerender.ts](../src/scripts/prerender.ts)) — inside `<noscript>` and a hidden `<div id="prerender-shell">`. This is what Googlebot / OAI-SearchBot / PerplexityBot see before any JS runs.
2. **Client-side in `ToolPageLayout`** ([src/components/ToolGuide.tsx](../src/components/ToolGuide.tsx)) — the actual visible version once React hydrates.

The two versions are identical content. Do not diverge them — Google flags cloaking.

## Authorship disclosure

Guides are drafted with LLM assistance and reviewed by the XFree.in team before ship. The rendered page and JSON-LD credit "XFree.in team" as the author (an `Organization`, not a fake person). This complies with Google's stance on AI-assisted content: allowed if it's useful and honest about who's taking editorial responsibility.

**Rule: if you haven't read a guide, don't ship it.** Every `TODO:` string is a blocker.

## Adding a guide for a new tool

1. Wire the tool component in [App.tsx](../src/App.tsx#L247) and flip the tool's `status` to `"indexable"` in [src/data/toolsRegistry.ts](../src/data/toolsRegistry.ts).
2. Scaffold a stub:
   ```bash
   npm run generate:guides -- --slug=your-new-tool-slug
   ```
   Copy the printed stub into `TOOL_GUIDES` in [src/data/toolGuides.ts](../src/data/toolGuides.ts).
3. Replace every `TODO:` with real content. Test each worked example against the actual tool — if the tool doesn't produce the output you claim, the guide is a lie.
4. Rebuild:
   ```bash
   npm run build:vercel
   grep "Worked examples" dist/tools/your-new-tool-slug/index.html
   ```
   That grep must find the string in the raw HTML — that's your confirmation the guide is indexable pre-JS.
5. Deploy. Ping IndexNow:
   ```bash
   PUBLIC_SITE_URL=https://www.xfree.in npm run indexnow -- --url=https://www.xfree.in/tools/your-new-tool-slug
   ```

## What you must NOT do

- **Do not use `--gemini` and ship what comes back unedited.** The scaffolder deliberately does not auto-fill from Gemini for exactly this reason. Draft with Gemini in a separate session (interactive, so you can push back on hallucinations), then paste the reviewed result into the guide file.
- **Do not fabricate testimonials, reviews, or user comments.** Not in guides, not on landing pages, nowhere. Real UGC is fine — solicit it, moderate it, attribute it. Fake UGC is illegal in most jurisdictions and detectable.
- **Do not clone the same guide across tools with a search-and-replace on the tool name.** Google's [scaled content abuse policy](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content-abuse) catches this. Every guide has to be actually different — different examples, different edge cases, different failure modes.
- **Do not add guides for tools whose React component doesn't exist or doesn't work.** A guide promises the tool does X; if the tool doesn't do X, the guide is misleading. Ship the tool first.

## Reviewing existing guides

For each guide already in `TOOL_GUIDES`, sanity-check:

- [ ] Every worked-example `input` produces the claimed `output` when pasted into the actual tool.
- [ ] Nothing in `whenToUse` overstates what the tool does.
- [ ] `whenNotToUse` covers a real limit, not a fake "we're so honest here's a non-limitation" tell.
- [ ] `troubleshooting` items are things you'd actually hit, not hypothetical.
- [ ] `relatedSlugs` all exist in [src/data/toolsRegistry.ts](../src/data/toolsRegistry.ts) as indexable tools (the audit script catches this indirectly — a bad slug won't render, and the noindex lint doesn't cover it).
- [ ] `lastReviewed` reflects the last time a human actually re-read the guide.

Bump `lastReviewed` when you re-verify, not automatically on every deploy. The date is a trust signal, not a marketing counter.
