# XFree Publication Contract

Session date: 2026-09-10. What makes a tool "public" on `www.xfree.in`, and
the state of the registry that decides it.

## The rule

A tool is public (linked from navigation, search, categories, pillars,
related-tools, Signals, structured data, the sitemap, and RSS/JSON feeds)
when, in `next-app/lib/data/toolsWithSEO.ts`:

```ts
status === 'published'
indexable === true
```

`engineVerified` does **not** currently gate publication (see reconciliation
below) - it is a documentation/audit field, not a filter any consuming code
reads.

## Registry reconciliation (2026-09-10)

Starting state: 58 published/indexable tools, only 19 marked
`engineVerified: true`. The other 39 were not broken - `engineVerified` was
simply never set on them (it was added once, for the first batch of tools,
and never updated as the other 39 were built). Verified via:

1. **Structural check**: every one of the 58 tool ids has exactly one entry
   in the tools page's `TOOL_COMPONENTS` map
   (`app/[locale]/tools/[[...slug]]/page.tsx`) - no gaps, no orphans.
2. **Automated scan**: `grep` across every `components/tools/*.tsx` for
   `TODO|FIXME|not implemented|coming soon|placeholder only|fake|stub` -
   zero matches.
3. **Spot reads**: several of the 39 (e.g. `CreditCardValidatorTool`'s real
   Luhn checksum + IIN prefix detection, `WhoisLookupTool`'s real RDAP call,
   `TomlValidatorTool`'s real `smol-toml` parse) read in full and confirmed
   non-stub.

`engineVerified` was corrected to `true` across all 58. Full per-tool
evidence (engine identifier, existence checks, audit method, inbound
related-tool link count, disposition, notes) is in
`reports/tool-verification-reconciliation.csv`.

**Not done**: a full manual read of all 58 tool pages' marketing copy against
their component's actual behavior (full "claims match behavior" audit). Three
tools (`dns-lookup`, `ip-lookup`, `whois-lookup`) were found via this session's
separate content-truth pass to be the only ones that call an external server
(grepped every tool component for `fetch(`) - their `execution: 'workflow'`
field and `privacyNotice` text were already correct in the data model; the
defect was blanket "100% client-side" marketing copy on other pages that never
checked it (fixed - see `docs/SECURITY_MODEL.md` is the wrong doc for this;
see the `fix(content)` commits on this branch).

## Resolved: two registries consolidated (2026-09-10, follow-up session)

`next-app/lib/data/tools.ts` used to be a second, separately hand-maintained
58-tool array (also named `TOOLS`), imported by the homepage, about/use-cases
pages, `tools.json`, `capabilities.json`, the RSS feeds, `llms-full.txt`, the
`/api/v1/*` endpoints, and `Footer.tsx`. Diffed programmatically before
touching anything: same 58 slugs, same `status`/`indexable`/`execution`
values in both files (no factual/execution divergence), but ~50 different
`shortDescription` strings and one different `title` (`cron-parser`: "Cron
Parser" vs. "Cron Expression Parser") - copy drift accumulated across two
hand-maintained copies.

`lib/data/tools.ts` is now a thin re-export of `toolsWithSEO.ts`'s `TOOLS`
and `CATEGORIES` (the same pattern `toolsWithSEO.ts` itself already used
internally: `export const TOOLS = TOOLS_WITH_SEO`), keeping only the two
derived exports (`INDEXABLE_TOOL_SLUGS`, `TOOLS_BY_CATEGORY`/
`getToolsByCategory`) that nothing else provided. `TOOL_MAP`/`findToolById`
were dropped from this file - confirmed via grep that no importer used them
from `./tools` specifically (only `TOOLS` and `CATEGORIES` were ever
imported from here). Verified via `typecheck`, `lint`, a full `next build`,
and all three `verify:*` scripts passing unchanged after the swap.

All 16 previously-importing files now render the same copy the tool detail
pages already use - the homepage/about/use-cases/categories pages,
`tools.json`, `capabilities.json`, the RSS feeds, and `llms-full.txt` will
show slightly different (corrected, deduplicated) `shortDescription` text
for ~50 tools as a result. This is the intended effect of the consolidation,
not a regression.

## Studio's own tool set

`public/studio/index.html`'s `ENGINES` array is a **separate concept**, not
part of this contract - it's Studio's (app.xfree.in) internal tool list for
its own command-center UI, not the www.xfree.in tools catalog. A partial
id-mapping between the two lives in
`app/[locale]/tools/[[...slug]]/page.tsx`'s `STUDIO_ENGINE_IDS` (documented
inline as verified against Studio's real `ENGINES` array, not assumed).
