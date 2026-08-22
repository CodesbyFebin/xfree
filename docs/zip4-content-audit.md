# ZIP 4 content audit — 22 August 2026

Source inspected: `xfree.in—free-ai-+-developer-micro-tools-platform (4).zip`.
The archive was analyzed in an isolated temporary directory and was not copied
over the working repository.

## Findings

- `tools-seed.json` contains 400 records but only 399 unique slugs.
  `timezone-converter` occurs twice.
- The 400 records span only four seed clusters: SEO, developer, AI, and
  converters (100 records each).
- One hundred records route to the same `AiMicroTool` component. Many other
  records reuse broad components whose behavior is not proven to implement the
  named task.
- `clustersData.ts` declares 35 explicit clusters and programmatically appends
  65 keyword-list clusters. This is a 100-cluster keyword inventory, not an
  authoritative 30 × 50 engineering dataset.
- The seed registry marks generated records `status: "indexable"`, generates 20
  generic FAQs for each, uses generic examples/instructions, and makes a broad
  `100% Client-Side Privacy` claim. Those records must not become public pages.
- The archive contains a useful pool of task and long-tail keyword ideas, but it
  does not provide verified inputs, outputs, edge behavior, implementation
  evidence, or a tested Studio engine for most records.

## Publication decision

The ZIP is accepted as research input only. It is not merged into
`PUBLIC_TOOLS`, the sitemap, generated published content, or public tool counts.
A ZIP keyword becomes eligible only after it is mapped to a tested Studio engine
and receives truthful processing evidence, substantive page-specific content,
automated validation, similarity review, and exact-revision human approval.

## First pilot

The first candidate is `content/pilot/json-to-csv.json`, based on the verified
`json-to-csv` Web Worker engine. It targets task-and-constraint searches without
claiming unsupported offline behavior, telemetry guarantees, fixed performance,
or universal file-size limits. Run `npm run pipeline:pilot` after dependencies
are installed to validate it and place it in the ignored human-review queue.
It remains `noindex` until an explicit approval and a second publication pass.
