# XFree content publication pipeline

The pipeline treats generated editorial text as untrusted input. Generation never controls canonical URLs, structured data, robots directives, publication status, or routing.

## Dataset contract

The release dataset uses `schemaVersion: 1`, exactly 30 active pillars, and at least 50 validated tool specifications per pillar. Run `validateReleaseDataset` before generation. This validates matrix completeness; it does not make individual pages publishable.

Every tool specification must identify a tested engine and provide processing evidence, inputs, outputs, use cases, and known limitations. A page remains non-indexable until its engine exists in the Studio registry and its exact generated revision receives human approval.

Each release tool slug must own a distinct tested Studio engine ID. Reusing a
small engine set across hundreds of keyword aliases fails the dataset gate,
because unique prose cannot turn aliases into distinct working utilities.

## Review a queued page

```bash
npm run pipeline:review -- --slug json-record-flattener
```

Override the review directory when required:

```bash
npm run pipeline:review -- --slug json-record-flattener --review-dir ./review-output
```

The command prints the word count, closest similarity match, H1, direct answer, and section inventory.

## Record approval

```bash
npm run pipeline:approve -- \
  --slug json-record-flattener \
  --reviewer "Reviewer name" \
  --notes "Verified the engine behavior, examples, limitations, and processing disclosure."
```

For a similarity score of 0.78 or higher, explicitly acknowledge the reviewed match:

```bash
npm run pipeline:approve -- \
  --slug json-record-flattener \
  --reviewer "Reviewer name" \
  --notes "Compared both pages and confirmed materially different tasks and examples." \
  --review-similarity existing-json-tool
```

The command writes `content-approvals.json`. It does not publish the page. Rerun the orchestrator with the approval ledger; all technical, source-fingerprint, content-fingerprint, and similarity gates run again before the page can become indexable.

There is intentionally no bulk-approval command.

## Seed the first verified pilot

```bash
npm run pipeline:pilot
```

This validates committed candidates under `content/pilot/` against the current
Studio engine registry and writes passing candidates to the ignored review queue
as `pending_review` with `noindex, nofollow`. It never publishes them. The first
candidate is the Web Worker-backed JSON-to-CSV page; expand this directory only
with behavior verified against real engines.

## Compile approved artifacts into the site

```bash
npm run compile:published
```

The compiler reads only `content/published/*.json`; it never treats the review
queue as public content. If published files exist, it requires the complete
authoritative dataset and approval ledger, then rechecks the source fingerprint,
content-bound approval, registered Studio engine, deep link, similarity gate, and
all publication rules. Any mismatch fails the build.

Successful artifacts are written to the generated TypeScript registry consumed
by the React router, sitemap generator, metadata controller, and static
prerenderer. Generated content is rendered through structured React elements and
escaped static HTML—never through untrusted raw HTML. Handwritten public tool
pages take precedence if a generated artifact reuses their slug.

Both production build commands run this compiler before generating the sitemap
or Vite bundle. With no approved artifacts, it emits an empty registry.

SHA-256 approval binding provides revision integrity: changing approved content
invalidates its approval. It is not an identity signature; authenticated signing
can be added later if the reviewer threat model requires it.

## Controlled matrix generation

```bash
# Recommended first run: one validated pillar
npm run pipeline:batch -- --pillar json-data-tools

# Full validated matrix: requires an explicit safety acknowledgement
npm run pipeline:batch -- --confirm-full
```

The runner loads `content/dataset/xfree-1500-v1.json`, requires the complete
30 × 50 release contract, and uses the existing Gemini dependency to produce
editorial JSON through the hardened orchestrator. It supports `--dataset`,
`--pillar`, `--limit`, and `--delay-ms`. More than 50 selected records require
`--confirm-full`. Cached unchanged review candidates are not regenerated unless
an approval is present, preserving API budget and exact-revision review state.
Drafts or provider failures make the command exit non-zero; a run never prints a
false blanket success message.

At the current eight-engine Studio scope, a 1,500-page release dataset must fail.
Scale page generation only as genuinely distinct, tested engines are shipped.

## Advertising on generated pages

`GeneratedToolPage` includes one responsive display-unit position after the
worked examples and before troubleshooting. It is separated from the Studio CTA
and other actions, clearly labelled “Advertisement”, and renders nothing unless
`VITE_ADSENSE_TOOL_SLOT` contains a real numeric unit ID. Initialization uses a
React effect and the globally loaded AdSense queue; editorial content cannot
inject scripts or choose ad configuration.

The publisher account and loader already exist in `index.html`. Do not invent a
slot ID or place units next to download, copy, navigation, chat, or tool controls.
Before enabling the slot for affected traffic, verify the site's configured
Google-certified consent-management flow for the EEA, UK, and Switzerland.
Content approval notes should verify editorial and engine facts; ad-layout review
is a separate release check and is not evidence that technical content is true.
