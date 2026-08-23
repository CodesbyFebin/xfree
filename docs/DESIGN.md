# XFree Design System

Status: production design source of truth  
Updated: 2026-08-23

This document is authoritative for UI adaptation. Uploaded HTML prototypes are reference material only; production React, routing, registries, canonical metadata, CSP, privacy disclosures, AdSense rules, execution modes, and automated build gates remain authoritative.

## 1. Product surfaces

XFree has two related but intentionally distinct surfaces.

### Public site — light editorial utility directory
Use a light stone/white canvas, indigo-to-violet brand gradients, restrained shadows, strong type hierarchy, rounded 16–32px cards, crawlable links, direct-answer content, and proof that the tools actually work.

Primary homepage rhythm:
1. sticky navigation
2. proof-first hero
3. verified metric strip
4. search + popular published-tool shortcuts
5. direct-answer / authority block
6. real local playground
7. quick links / featured tools
8. searchable published-tool directory
9. categories / pillars
10. feature and workflow education
11. use-case / documentation pathways
12. FAQ
13. closing CTA
14. dark information-dense footer

### XFree Studio — dark command center
Use a deep neutral application canvas with indigo accents, compact panels, Local/Cloud mode chips, command-bar focus glow, workflow/result cards, chain suggestions, and responsive panel collapse.

Studio must feel like the operational counterpart of the public site, not a separate brand.

## 2. Reference hierarchy

Three HTML reference families have been adapted into the production design language.

### Reference A — light editorial landing page
Primary contribution:
- white/stone marketing canvas
- clean sticky header
- proof-first hero
- large structured stat strip
- white categorized tool cards
- feature / how-it-works / use-case hierarchy
- FAQ and strong closing CTA

### Reference B — dark Agent Studio command center
Primary contribution:
- deep `#0a0b0f` application canvas
- `#12131a` panels and `#1a1b25` result cards
- indigo command focus
- emerald Local Mode and blue Cloud Mode semantics
- compact three-panel geometry
- visible workflow/result state
- mobile tab collapse

### Reference C — SEO-heavy XFree HTML concept
Adopt only the useful experience patterns:
- skip-to-main navigation
- strong focus-visible treatment
- subtle grid/orb hero atmosphere
- prominent search focus state
- crawlable popular-tool shortcuts
- compact badge vocabulary
- verified metrics strip
- live browser-local playground
- direct-answer/AEO block
- pillar/category card hierarchy
- semantic FAQ accordion

Do not treat prototype metadata or marketing copy as production truth.

## 3. Brand tokens

### Shared identity
- Primary indigo: `#4f46e5` / indigo 600
- Secondary indigo: `#6366f1`
- Accent violet: `#8b5cf6`
- Accent purple: `#a855f7`
- Local/success: emerald 500
- Cloud/informational: blue 500
- Warning: amber 500
- Error: rose 500

### Public site
- Canvas: stone 50 / `#fafaf9`
- Card: white
- Main text: slate 950
- Secondary text: slate 600
- Muted text: slate 400–500
- Border: slate 200
- Soft brand surface: indigo 50

### Studio
- Canvas: `#0a0b0f`
- Panel: `#12131a`
- Card: `#1a1b25`
- Elevated card: `#22232f`
- Border: `#2a2b38`
- Main text: slate 100
- Secondary text: slate 300
- Muted text: slate 500

Gradients are reserved for the X mark, hero emphasis, and primary CTA. Do not turn every card into a gradient.

## 4. Typography

- Default UI: system sans stack / Inter-like proportions.
- Code and technical output: monospace stack.
- H1: heavy, compact tracking, usually 40–64px depending on viewport.
- H2: 28–40px.
- Body: 14–18px, line height 1.55–1.8.
- Metadata / badges: 10–12px with controlled tracking.

Use sentence case for interface labels. Avoid all-caps except compact taxonomy or status labels.

## 5. Geometry

- page max width: `max-w-7xl`
- content-reading max width: 720–900px
- major section radius: `rounded-[2rem]`
- cards: `rounded-2xl`
- controls: `rounded-xl`
- pills: `rounded-full`
- standard card padding: 20–28px
- major section vertical rhythm: 64–96px desktop, 40–64px mobile

Use borders more often than heavy shadows. Hover elevation should be subtle, generally 1–3px.

## 6. Public hero contract

The hero should communicate four things immediately:
1. what XFree does;
2. that the published catalog is real and countable;
3. that Local Mode is browser-local;
4. that Studio is available for workflows.

Required elements:
- one H1;
- one scoped, evidence-backed privacy/execution statement;
- primary Studio CTA;
- secondary published-tools CTA;
- dynamic published-tool count;
- roadmap count clearly labeled as roadmap, not live tools;
- search field over the published registry;
- crawlable popular-tool links to known published routes.

Approved atmosphere:
- faint indigo/violet radial glow;
- subtle 40–60px grid;
- no dense star field on the marketing homepage;
- no large decorative motion that delays interaction.

## 7. Search and discovery

Search is a first-class product control, not decoration.

- Search the verified public registry only.
- Keep a visible keyboard focus ring.
- Placeholder examples may reference existing published tools only.
- Popular shortcuts must be real `<a href>` links.
- Do not add a `SearchAction` schema unless the corresponding public search URL actually resolves and returns useful search results.
- Search suggestions may include categories, tools, pillars, and guides only when their target routes exist.

## 8. Metrics contract

Prototype metric tickers are design inspiration, not data sources.

Preferred production pattern:
- static responsive metric grid;
- dynamic registry-derived published-tool count;
- roadmap count explicitly labeled `Roadmap concepts` or `Tool roadmap`;
- no fake user counts, executions, stars, ratings, uptime, benchmark latency, or community size.

Infinite marquee/ticker animation is optional and should not be the only way metrics are exposed. If used, duplicate content must be `aria-hidden` and motion must stop under `prefers-reduced-motion`.

## 9. Live playground contract

The homepage may include a small interactive proof block when it creates genuine product value.

Current approved implementation:
- local JSON parse/format demo;
- no server/API call;
- safe React text rendering;
- explicit valid/invalid state;
- copy output action;
- direct link to the full JSON Formatter.

Rules:
- demo behavior must be real, not simulated;
- never display fabricated timing or benchmark claims;
- never claim all XFree features are offline-capable because one demo is local;
- never use `innerHTML` for demo output;
- keep demo small enough that it does not displace the published-tool directory.

## 10. Direct-answer / AEO blocks

A direct-answer block is encouraged where it improves human comprehension.

Structure:
- literal question heading such as `What is XFree?`;
- concise answer in the first 1–2 sentences;
- follow with implementation caveats and disclosure links;
- link to How It Works, Security, and Contribution pathways.

AEO/GEO does not justify inflated claims, repetitive keyword variants, or mass FAQ output.

## 11. Tool cards

Tool cards must:
- link to real published routes;
- show a concise functional description;
- use badges only for factual states such as Local, AI/cloud-disclosed, flagship, or new;
- maintain usable focus and hover states;
- avoid fake popularity badges unless popularity is measured from a disclosed data source.

Do not use `Popular`, `Top`, `Best`, ratings, execution counts, or star counts as decorative social proof.

## 12. Category and pillar cards

- Published categories may be indexable when they contain real tools and unique useful copy.
- Pillar pages are indexable only under the existing publishing policy.
- Empty/planned pillars remain `noindex,follow`.
- The 50-pillar taxonomy is architecture, not evidence that 50 pillars are equally mature.
- Planned concepts must never link to fake `/tools/:slug` pages.

## 13. Public-site claim rules

Allowed when backed by current architecture:
- free published tools;
- no XFree account required for published tools;
- Local Mode tools process working input in the browser;
- optional cloud behavior is disclosed before transmission;
- open-source statements only when repository/license evidence exists;
- roadmap counts when explicitly described as roadmap/planning taxonomy.

Rewrite or reject unless directly proven:
- `world's largest`;
- `25,000+ live tools`;
- `100% client-side` as a site-wide statement when cloud surfaces exist;
- `zero tracking` as a blanket site statement where ads/consent/network services exist;
- `zero telemetry` unless technically enforced and audited across every surface;
- `absolute privacy`;
- `unlimited file size`;
- universal sub-second execution;
- guaranteed offline capability;
- fake aggregate ratings;
- invented GitHub stars, contributors, users, usage, or benchmarks;
- competitor superiority without evidence.

## 14. URL, domain, and metadata truth

Production URL rules override every prototype.

- Canonical search origin: `https://www.xfree.in`
- Studio/application origin: `https://app.xfree.in`
- Repository: the connected production GitHub repository, not prototype organization names.
- Do not emit `studio.xfree.in` unless that domain is intentionally configured and verified.
- Do not regress canonicals to apex `https://xfree.in`.
- Do not emit fake language alternates.
- `meta keywords`, `revisit-after`, `ai-index`, and similar prototype tags are not authority signals and should not be added as SEO theater.

Schema must describe real page content and real functionality. Do not expose fake SearchAction, Product, ClaimReview, ratings, or unavailable features.

## 15. Studio rules

- Local mode is the default visual state.
- Cloud mode is explicit and visually distinct.
- The command bar is the primary interaction.
- Chain suggestions are secondary actions, never autonomous hidden execution.
- Left panel: tools/files/workspace.
- Center: conversation/workflow/command surface.
- Right panel: results/artifacts/status.
- On narrow screens, collapse secondary panels into explicit mobile drawers/tabs.
- Never copy unsafe prototype `innerHTML` rendering into React production code.
- WebGPU/model downloads remain opt-in and disclosed.
- Cloud model selection must preserve the existing data-transmission disclosure.

## 16. Motion

Approved motion:
- 150–300ms hover/focus transitions;
- subtle card lift;
- restrained indigo glow;
- progress indicators tied to real state;
- optional slow decorative orb motion only when inexpensive.

Do not:
- continuously animate large page regions;
- animate metrics solely for spectacle;
- hide content behind entrance animation;
- create motion that interferes with tool input or copying.

Under `prefers-reduced-motion: reduce`, disable nonessential animation and smooth scrolling.

## 17. Accessibility

- Keep the skip link targeting `#main-content`.
- Main content should be programmatically focusable after skip navigation.
- Maintain visible `:focus-visible` rings.
- Minimum interactive target approximately 40px where practical.
- Do not rely on color alone for Local/Cloud or status meaning.
- Accordion content uses semantic `<details>/<summary>` where appropriate.
- Icon-only controls require accessible names.
- Tool result text must remain selectable and readable without animation.
- Decorative or duplicated ticker content must be hidden from assistive technology.

## 18. Advertising and monetization layout

- Preserve the existing 160px internal safe-zone contract around manual ad units.
- Never place ad units adjacent to tool action buttons.
- Ads cannot cover tool input/output or mobile navigation.
- Do not imitate tool controls with ad styling.
- Marketing redesigns must retain trust/legal footer access.

## 19. Reference adaptation policy

Adopt from uploaded HTML when it improves actual user experience:
- sticky clean header;
- indigo/violet identity;
- proof-first hero;
- grid/orb atmosphere;
- registry search;
- real popular-tool anchors;
- verified metric strip;
- local live playground;
- direct-answer block;
- categorized tool cards;
- feature/how-it-works/use-case hierarchy;
- semantic FAQ accordion;
- strong closing CTA;
- Studio mode toggle / command bar / panel layout / result cards / chain chips.

Reject or rewrite unless proven:
- prototype `innerHTML` rendering;
- stale apex canonicals;
- stale/unused Studio domains;
- prototype GitHub organization names;
- placeholder AdSense publisher IDs;
- fake social links;
- fake aggregate ratings;
- `meta keywords` / `revisit-after` as ranking tactics;
- hardcoded stale live-tool counts;
- site-wide `zero tracking` or `zero telemetry` claims;
- all-data-never-leaves-device claims across cloud surfaces;
- fake offline support;
- universal performance guarantees;
- unsafe advice to paste secrets/API keys into generic tools;
- mass-indexing of roadmap concepts.

## 20. Change gate

A design change is complete only if all applicable existing gates remain green:
- `npm ci`
- typecheck
- tests
- tool registry audit
- production build/prerender
- batch-1 local-tool validation
- Agent Studio validation
- SEO/canonical validation
- AdSense validation
- noindex validation
- documentation link checks
- CodeQL
- secret scan
- production dependency audit

A Vercel preview failure caused solely by an account build-rate throttle is an external deployment constraint, not a code-quality waiver. Production must still be verified on the exact merged Git SHA when Vercel accepts a build.
