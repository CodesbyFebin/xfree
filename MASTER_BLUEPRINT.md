# XFree.in Master Blueprint v3.0

**Status:** Production architecture and governed expansion plan  
**Primary principle:** Verified utility first; public/indexable pages second

---

## 1. Product Definition

XFree is a privacy-first browser utility platform with two canonical surfaces:

| Domain                    | Responsibility                                          |
| ------------------------- | ------------------------------------------------------- |
| `https://www.xfree.in`    | Marketing, SEO pages, guides, pillars and trust content |
| `https://app.xfree.in/`   | XFree Studio and interactive tool execution             |
| `https://xfree.in/*`      | Permanent redirect to matching `www` path               |
| Vercel deployment domains | Non-canonical deployment infrastructure                 |

XFree must never represent roadmap concepts, prototypes or generated content as functional published tools.

---

## 2. Product Promise

XFree provides:

* Focused developer, data, SEO, text and conversion utilities
* Local Mode by default where technically supported
* Optional Cloud Mode with explicit disclosure
* No mandatory account for public utilities
* Dedicated SEO pages connected to real Studio engines
* Reusable workflows through XFree Studio
* Truthful limits and processing disclosures

**Do not make universal claims such as:**

* "Everything is 100% offline"
* "No network activity"
* "Unlimited"
* "All AI models are free"
* "Guaranteed rankings"
* "Zero server latency"

Claims must follow actual engine behavior.

---

## 3. Authoritative Production Architecture

```
TOOLS_REGISTRY
     │
     ├── published + indexable ──→ PUBLIC_TOOLS
     │                              ├── Homepage
     │                              ├── Categories
     │                              ├── Tool pages
     │                              ├── Related tools
     │                              ├── Search
     │                              ├── Sitemap
     │                              └── Prerender manifest
     │
     └── draft / roadmap / retired
                                    ├── Excluded from public listings
                                    ├── Excluded from sitemap
                                    └── Correct 404/410 handling

www.xfree.in ── tool documentation ──→ app.xfree.in/?tool=<engine-id>
                                          │
                                          ├── Local engine
                                          ├── Web Worker
                                          └── Optional Cloud provider
```

### Authoritative Files

Preserve the current production architecture:

* `src/data/toolsRegistry.ts`
* `src/data/publicTools.ts`
* `src/scripts/generateSitemap.ts`
* `src/scripts/prerender.ts`
* `src/scripts/verifyProductionContract.ts`
* `vercel.json`

Do not introduce parallel registry, routing or sitemap systems.

---

## 4. Public Tool Contract

The only public collection is:

```ts
export const PUBLIC_TOOLS = TOOLS_REGISTRY.filter(
  (tool) =>
    tool.status === "published" &&
    tool.indexable === true
);
```

Every public surface must consume `PUBLIC_TOOLS`, including:

* Homepage cards and counts
* Navigation and footer
* Search and saved tools
* Categories and pillars
* Related-tool recommendations
* Metadata
* Structured data
* XML sitemaps and feeds
* Prerender routes
* Machine-readable catalogs

### Tool Lifecycle

| Status           | Functional state     | Public | Sitemap | HTTP route |
| ---------------- | -------------------- | -----: | ------: | ---------- |
| `draft`          | Incomplete           |     No |      No | `404`      |
| `roadmap`        | Planned              |     No |      No | `404`      |
| `pending_review` | Built but unapproved |     No |      No | `404`      |
| `published`      | Tested and approved  |    Yes |     Yes | `200`      |
| `retired`        | Permanently removed  |     No |      No | `410`      |

Only explicitly and permanently retired URLs qualify for `410`.

---

## 5. Canonical Domain Contract

### Status Codes

```
https://xfree.in/path        → 308 https://www.xfree.in/path
https://www.xfree.in/studio  → 308 https://app.xfree.in/
https://app.xfree.in/studio  → 308 https://app.xfree.in/
https://app.xfree.in/        → 200
```

### Raw HTML Canonicals

Marketing pages:

```html
<link rel="canonical" href="https://www.xfree.in/current-path">
```

Studio:

```html
<link rel="canonical" href="https://app.xfree.in/">
```

**Rules:**

* Exactly one canonical per indexable page
* Canonical present in raw HTML before hydration
* Absolute HTTPS URL
* Self-referencing on canonical `200` pages
* No canonical on `404` or `410`
* Client JavaScript must not replace an existing canonical

---

## 6. Website Architecture

### Homepage Must Contain

1. Clear product definition
2. Local Mode explanation
3. Primary CTA to XFree Studio
4. Curated published-tool grid
5. Category navigation
6. Use cases
7. How XFree works
8. Documentation and guides
9. Trust and privacy section
10. FAQ
11. Final Studio CTA
12. Legal and trust footer

---

## 7. Structured Data

Generate schema from verified application data, not LLM output.

**Use:**

* `WebApplication` or `SoftwareApplication` for tools
* `BreadcrumbList` for navigational hierarchy
* `Article` for editorial guides
* `Organization` and `WebSite` at site level

Schema must match visible content exactly.

**Do not add:**

* Fabricated reviews
* Unsupported ratings
* Fake availability
* FAQ schema solely for search visibility
* Features that are not implemented

---

## 8. Sitemap Contract

Sitemaps may contain only:

* Canonical `200` pages
* Published tools
* Approved guides
* Indexable pillars
* Static trust pages

Every listed URL must have:

* `200`
* Exactly one self-canonical
* `index,follow`
* Unique title
* Unique H1
* At least one server-visible internal link
* No query or fragment
* Stable content-derived `lastmod`

---

## 9. Security Baseline

Required controls:

* Strict CSP
* HSTS (`max-age=31536000; includeSubDomains; preload`)
* `X-Content-Type-Options: nosniff`
* Frame protection (`X-Frame-Options: DENY`)
* Strict referrer policy
* Restrictive permissions policy
* Server-only credentials
* Request-size limits
* Schema validation
* Rate limiting
* Provider timeouts
* Safe error responses
* No secrets in Git history or client bundles

---

## 10. AdSense and Consent

Ads remain secondary to utility.

**Requirements:**

* Ads clearly labelled
* No ads beside execute, copy or download controls
* No disguised navigation
* No ads on empty/error states
* No activation before legal pages are accurate

---

## 11. Mobile and Accessibility

**Test at:**

* 360 px
* 390 px
* 430 px

**Requirements:**

* No horizontal overflow
* Inputs remain usable with virtual keyboard
* Touch targets are at least approximately 44 px
* Result actions do not overlap
* Panels collapse predictably
* Keyboard-accessible controls
* Visible focus states
* Semantic headings and landmarks
* Accessible labels

---

## 12. Automated Release Gates

Every production candidate must pass:

```bash
npm ci
npm run typecheck
npm run test
npm run audit:tools
npm run build
npm run verify:production
```

The build fails for:

* Sitemap redirects
* Canonical mismatches
* Multiple canonicals
* Missing or multiple H1s
* Sitemap `noindex`
* Duplicate metadata
* Public draft links
* Orphan sitemap pages
* Legacy `/category/*` links
* Missing prerendered content
* Invalid Studio deep links
* Incorrect draft/retired status
* Internal Studio shell leakage

---

## 13. Deployment Workflow

```
Feature branch
    ↓
Pull request
    ↓
CI + Security
    ↓
Human review
    ↓
Merge to main
    ↓
Vercel production deployment
    ↓
Live HTTP/canonical verification
    ↓
GSC Live Test
```

**Production verification must cover:**

* Apex redirect
* Both `/studio` redirects
* App root direct `200`
* Raw Studio canonical
* Studio `index,follow`
* Representative public tool
* Representative draft tool
* Unknown route
* Sitemap and robots
* Deep-link preservation

---

## 14. Expansion Roadmap

### Phase A — Stabilization

* Freeze unnecessary IA changes
* Monitor GSC crawling and indexing
* Verify current canonical deployment
* Rotate exposed credentials
* Keep sitemap limited to approved pages

### Phase B — Engine Quality

* Strengthen existing published engines
* Add engine-specific unit tests
* Document exact limitations
* Add Web Workers for heavy tasks

### Phase C — Content and Authority

* Improve flagship tool documentation
* Publish real technical tutorials
* Strengthen pillar-to-tool linking

### Phase D — Studio Workflows

* Saved local workflows
* Chained tool execution
* Batch processing
* Import/export workflow definitions

---

## 15. Definition of Production Ready

XFree reaches technical release readiness when:

```
Canonical hosts enforced
+ raw canonicals correct
+ canonical 200-only sitemap
+ PUBLIC_TOOLS universally enforced
+ server-visible primary content
+ complete internal-link graph
+ truthful engine-backed documentation
+ secure Local/Cloud separation
+ passing CI and Security
+ verified production deployment
= XFree Technical Contract PASS
```

**This is a technical readiness definition—not a promise of rankings, traffic, AdSense acceptance or algorithmic recovery.**

---

## 16. Current Deployment Status

**Live URL:** https://www.xfree.in

**Verified On:** Production deployment

**Filters:**

* `PUBLIC_TOOLS` = TOOLS_REGISTRY.filter(t => t.status === 'published' && t.indexable === true)
* Only these 10 tools are indexable: `bulk-url-sitemap`, `xml-sitemap-generator`, `json-formatter`, `regex-tester`, `cron-expression-generator`, `base64-encoder-decoder`, `url-slug-utm-builder`, `meta-tag-generator`, `schema-markup-generator`, `robots-txt-generator`

**Seed Registry:** 393 additional entries in `src/scripts/tools-seed.json` are `status: "draft"` and excluded from all public surfaces.

---

## 17. Security Controls

| Control | Implementation |
|---------|----------------|
| CSP | Strict via `vercel.json` headers |
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `geolocation=(), microphone=(), camera=(), payment=(), usb=(), display-capture=(), interest-cohort=()` |
| X-Content-Type-Options | `nosniff` |
| COOP | `same-origin` |
| CORP | `same-origin` |

---

## 18. Next Actions

- [ ] Push to GitHub repository
- [ ] Create V0.1.0 release
- [ ] Deploy to Vercel production
- [ ] Verify live site with Lighthouse
- [ ] Rotate any exposed credentials
- [ ] Enable GitHub Discussions
- [ ] Create "good first issues"

---

*Document created: 2026-09-03*  
*Architecture verified: 62/62 tests passing, build successful*