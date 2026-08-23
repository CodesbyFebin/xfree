# XFree HTML Keyword Architecture

Status: production SEO/content architecture reference  
Source: uploaded XFree HTML prototype, 2026-08-23  
Authority: strategy only; live registries, canonical routing, indexability policy, privacy disclosures, and build gates remain authoritative.

## 1. Core rule

The HTML contains a useful keyword architecture, but not every phrase is a production claim.

Use the vocabulary to improve:
- page intent;
- titles and H1s;
- H2/H3 topic coverage;
- internal anchor text;
- FAQ/AEO questions;
- category and pillar relevance;
- tool descriptions.

Do **not** add a `meta keywords` tag for ranking. Google does not use it as a ranking signal. Do not create duplicate doorway pages for every modifier combination.

The production pattern is:

`XFree + [tool/category/pillar] + [real intent modifier] + [real benefit]`

Examples:
- `XFree JSON Formatter — free, browser-based JSON formatting`
- `XFree Regex Tester — no-login JavaScript regex testing`
- `XFree Technical SEO Tools — sitemaps, schema and robots.txt utilities`

One canonical page owns the primary intent. Modifier variants belong in useful copy, FAQs, examples and anchors on that page.

## 2. Tier 0 — brand and entity vocabulary

Primary brand/entity terms:
- XFree
- X Free
- XFree.in
- XFree app
- XFree tools
- XFree online tools
- XFree developer tools
- XFree SEO tools
- XFree AI tools
- XFree privacy-first tools
- XFree micro tools suite
- XFree Studio
- XFree free tools no signup

Recommended ownership:
- `/` owns the broad XFree entity and product terms.
- `https://app.xfree.in/` owns Studio/application intent.
- category/tool/pillar pages use `XFree + specific topic`, not generic brand repetition.

## 3. Tier 1 — homepage primary intent

The homepage should cover these families naturally:
- free developer tools
- free SEO tools
- browser-based developer tools
- privacy-first developer tools
- no signup developer tools
- browser tools for developers
- Local Mode developer tools
- open-source developer utilities
- developer micro-tools
- SEO micro-tools
- free browser utilities

Recommended semantic hierarchy:
- Title: brand + developer/SEO/AI tool category + no-signup differentiator.
- H1: `Free Developer, SEO & AI Tools`.
- Lead: browser workspace + Local Mode + clearly disclosed cloud features.
- Supporting H2s: published tools, categories, how it works, roadmap, FAQs, Studio/workflows.

## 4. Tier 2 — modifier system

### Access / price
- free
- no signup
- no login
- no account
- online

### Execution / privacy
- browser-based
- in-browser
- Local Mode
- client-side
- privacy-first
- open source

`client-side` must be scoped to tools that actually run locally. Never apply it as a blanket site claim when cloud-assisted features exist.

### Functional action terms
- formatter
- validator
- tester
- generator
- converter
- decoder
- encoder
- checker
- analyzer
- builder
- minifier
- beautifier
- inspector

These are high-intent nouns and should generally map one-to-one to real tool capabilities.

## 5. Tier 3 — tool intent clusters extracted from the HTML

### JSON Formatter
Canonical owner: `/tools/json-formatter`

Primary:
- XFree JSON Formatter
- JSON formatter online free
- format JSON online
- JSON validator
- JSON beautifier

Supporting:
- JSON minifier
- JSON repair tool
- JSON tree inspector
- format, validate, repair and minify JSON

### Regex Tester
Canonical owner: `/tools/regex-tester`

Primary:
- XFree Regex Tester
- regex tester no login
- JavaScript regex tester

Supporting:
- regex match group tester
- regex replacement tester
- test JS regex patterns

### XML Sitemap Generator
Canonical owner: `/tools/xml-sitemap-generator`

Primary:
- XFree Sitemap Generator
- XML sitemap generator
- Google XML sitemap generator

Supporting:
- HTML link extractor
- SEO sitemap generator
- extract links from HTML

### Meta Tag Generator
Canonical owner: `/tools/meta-tag-generator`

Primary:
- XFree Meta Tag Generator
- meta title generator
- meta description generator

Supporting:
- Open Graph generator
- social card preview
- SEO meta generator

### JWT Decoder
Canonical owner: `/tools/jwt-decoder`

Primary:
- XFree JWT Decoder
- JWT decoder client-side
- JSON Web Token decoder

Supporting:
- decode OAuth JWT
- JWT payload inspector
- Base64 JWT decoder

### Cron Generator
Canonical owner: use the production registry slug; the prototype's `/tool/cron-generator/` is not authoritative.

Primary:
- XFree Cron Generator
- cron expression generator
- human-readable cron generator

Supporting:
- DevOps cron generator
- CI/CD cron generator

### Additional prototype tool terms
Use only when a verified published canonical exists:
- XFree HTML minifier
- HTML minifier online
- XFree Hash Generator
- hash generator online
- Base64 encoder / decoder
- UUID generator
- password generator

Do not create new indexed pages merely because these phrases exist in the prototype.

## 6. Tier 4 — category hubs

Eight explicit category clusters are present in the HTML:

1. `XFree Developer Tools`
   - formatters
   - validators
   - debuggers

2. `XFree SEO Tools`
   - sitemaps
   - meta tags
   - schema

3. `XFree AI Tools`
   - prompt tools
   - token counters

4. `XFree Text Tools`
   - word count
   - diff
   - case conversion

5. `XFree Converters`
   - JSON
   - CSV
   - Base64
   - YAML

6. `XFree Generators`
   - UUID
   - QR
   - password
   - cron

7. `XFree Validators`
   - JSON Schema
   - HTML
   - CSS

8. `XFree Security Tools`
   - hashing
   - encryption
   - JWT
   - HMAC

Canonical pattern:
`/category/[category-slug]`

Each category page should own the broad category query and link only to real published tools in that category.

## 7. Tier 5 — pillar / topical-authority clusters visible in the HTML

The HTML exposes 12 named pillar clusters:

1. XFree Frontend Development Tools
   - HTML, CSS, JavaScript, React, Vue, Svelte

2. XFree Backend Development Tools
   - Node.js, Python, Go, Rust

3. XFree DevOps & CI/CD Tools
   - GitHub Actions, Docker, Kubernetes

4. XFree Cybersecurity & Privacy Tools
   - cryptography, hashing, JWT, CSP

5. XFree Technical SEO Tools
   - schema, sitemaps, robots.txt

6. XFree Content & Copywriting Tools
   - readability, word count

7. XFree Data Engineering Tools
   - CSV, JSON, XML, ETL

8. XFree AI & Machine Learning Tools
   - prompts, tokens, embeddings

9. XFree Database Management Tools
   - SQL, ER diagrams, seed data

10. XFree API Development Tools
    - OpenAPI, GraphQL, REST

11. XFree Cloud Infrastructure Tools
    - AWS, Azure, GCP configuration

12. XFree Mobile Development Tools
    - iOS, Android, React Native

Canonical pattern:
`/pillar/[pillar-slug]`

Index only pillars admitted by the existing publication policy. Planned or empty pillars remain `noindex,follow`.

## 8. Tier 6 — FAQ / AEO query structure

The HTML contains eight explicit question intents:

- What is XFree app?
- Is XFree really free with no signup?
- How does XFree ensure privacy?
- What tools does XFree offer?
- Can I use XFree offline?
- Is XFree open source?
- What is XFree alternative to CodeBeautify?
- How many tools are on XFree?

Production treatment:
- keep questions that improve real user comprehension;
- use concise direct answers first;
- expose visible FAQ content before emitting FAQ schema;
- rewrite offline and competitor-comparison answers so they do not overclaim;
- quote current registry-derived counts, not prototype counts.

## 9. Tier 7 — roadmap / knowledge-graph vocabulary

Useful planning terms:
- 50 XFree Pillar Hubs
- 50 pillars
- 2,500 topic clusters
- 25,000 roadmap concepts
- XFree Roadmap
- XFree Knowledge Graph
- public XFree roadmap
- community contributions

The `25,000` number means planned concepts, not live published tools.

Preferred implementation is dynamic:
`{PUBLIC_TOOLS.length} published tools · {ROADMAP_CONCEPT_COUNT} roadmap concepts`

Never hardcode the live count in durable copy.

## 10. Tier 8 — trust, privacy and workflow vocabulary

High-value supporting phrases:
- Local Mode by default
- privacy-first
- browser-local processing
- no account required
- no signup
- execution mode disclosure
- open-source
- MIT License
- XFree Studio
- tool chaining
- workflow tools
- browser workspace
- security
- privacy policy
- how XFree works

Avoid turning privacy language into absolute guarantees. XFree uses advertising/consent/network infrastructure and has explicitly labeled cloud features.

## 11. Tier 9 — resource and internal-anchor vocabulary

Resource anchors extracted from the HTML:
- XFree Categories
- Popular XFree Tools
- 50 XFree Pillar Hubs
- XFree Roadmap
- How XFree Works
- XFree Use Cases
- XFree Documentation
- XFree Blog
- About XFree
- Contact XFree
- XFree Privacy Policy
- XFree Terms of Service
- XFree Security

Internal-link rule:
- descriptive anchor text is preferred;
- link to the canonical production route;
- avoid repeating the exact same commercial phrase unnaturally across every section;
- never link planned tool concepts to fake `/tools/:slug` routes.

## 12. Audience vocabulary

The HTML targets:
- developers
- SEO professionals
- digital marketers
- creators
- AI builders
- security professionals
- DevOps engineers

Use audience terms mainly in use-case copy, not as mass page-generation dimensions.

## 13. Search-intent ownership map

| Intent | Canonical owner |
|---|---|
| XFree / XFree app / XFree tools | `/` |
| Free developer / SEO / AI tools | `/` |
| Category discovery | `/category/:slug` |
| Specific utility action | `/tools/:slug` |
| Topical authority | `/pillar/:slug` when publication policy allows |
| How it works / privacy model | `/how-it-works`, `/security`, `/privacy` |
| Usage scenarios | `/use-cases` |
| Documentation | `/docs` |
| Roadmap / planned concepts | `/roadmap` (`noindex` if current policy says so) |
| Studio workflows | `https://app.xfree.in/` |
| FAQ questions | `/faq` plus relevant contextual page FAQs |

## 14. Recommended modifier-stacking pattern

Use modifier stacking as language variation, not as doorway-page generation.

Pattern:
`XFree + [Tool] + [Modifier] + [Benefit]`

Examples:
- `XFree JSON Formatter — free browser JSON formatter with validation`
- `XFree Regex Tester — no-login JavaScript regex testing with match groups`
- `XFree JWT Decoder — client-side JWT payload inspection`
- `XFree Sitemap Generator — browser XML sitemap builder for technical SEO`

Good modifiers:
- free
- no signup
- no login
- browser-based
- in-browser
- Local Mode
- client-side when proven
- open source
- privacy-first

Benefits should be specific:
- validate
- format
- decode
- inspect
- generate
- convert
- compare
- copy
- export

## 15. Homepage keyword placement contract

### Title
Use one compact entity + category + differentiator combination.

Recommended family:
`XFree App — Free Developer, SEO & AI Tools | No Signup`

### H1
`Free Developer, SEO & AI Tools`

### Lead copy
Include naturally:
- browser workspace
- developer utilities
- technical SEO helpers
- validators
- converters
- Local Mode
- no account required
- optional cloud disclosure

### H2 families
- Featured XFree Tools
- XFree Tool Categories
- How XFree Works
- XFree Pillars / Tool Directory
- XFree Roadmap
- Frequently Asked Questions About XFree
- XFree Studio / workflow CTA

Do not force every keyword into every heading.

## 16. Production rewrites required from the prototype

| Prototype phrase | Production-safe treatment |
|---|---|
| `25,000+ tools` | `{published count} published tools + 25,000 roadmap concepts` |
| `25,000 utilities` | `25,000 planned concepts` |
| `500 tools` on each pillar | remove unless it explicitly means roadmap arithmetic |
| `100% client-side` site-wide | scope to published Local Mode tools |
| `no data leaves your device` | scope to a specific Local Mode execution path |
| `zero tracking` | remove blanket claim; disclose ads/consent/network services |
| `zero telemetry` | use only if technically proven across all surfaces |
| `works completely offline` | use only for verified PWA/cached capability |
| `no usage limits` | use only if enforced |
| `blazing fast` / `zero network latency` | replace with factual local-execution explanation |
| `ultimate` / `most comprehensive` | avoid unsupported superlatives |
| fake `Popular` badges | use only with measured data; otherwise use factual state badges |
| fake multilingual hreflang | emit only after equivalent localized pages exist |
| `studio.xfree.in` | production Studio origin is `https://app.xfree.in` |
| apex canonical `https://xfree.in` | canonical search origin is `https://www.xfree.in` |

## 17. Indexation rule

A keyword does not justify a page.

Create/index a page only when:
1. a real tool or substantial information resource exists;
2. content is unique and useful;
3. the route has a canonical;
4. the registry/publication policy marks it indexable;
5. it passes SEO, content, security and AdSense gates.

Modifier combinations should enrich existing canonical pages first.

## 18. Source-derived keyword inventory

The companion CSV `reports/xfree-html-keyword-map.csv` contains the normalized inventory with:
- tier;
- cluster;
- keyword/query;
- intent;
- target route;
- recommended placement;
- status (`approved`, `scoped`, `conditional`, `rewrite`, `reject`).

This keyword map is an editorial and information-architecture tool. It is not a directive to mass-generate pages.
