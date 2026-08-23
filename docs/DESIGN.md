# XFree Design System

Status: production design source of truth  
Updated: 2026-08-23

Uploaded HTML prototypes are design references only. Production React, routing, registries, canonical metadata, CSP, privacy disclosures, AdSense rules, execution modes, recipes, and build gates remain authoritative.

## 1. Product surfaces

XFree has two related surfaces.

### Public site — editorial utility directory

The public site supports **Light and Dark themes** with one shared layout and persistent user preference.

Light mode:
- stone/white canvas;
- slate 950 primary text;
- indigo/violet brand accents;
- quiet borders and restrained shadows.

Dark mode:
- deep neutral canvas inspired by the SEO-heavy HTML reference;
- `#0a0b0f` / `#12131a` surfaces;
- indigo/violet focus and gradient accents;
- slate 100/300 copy and `#2a2b38` borders.

The public page structure remains identical in both modes so theme choice cannot alter crawlability, semantics, routes, or content.

### XFree Studio — dark operational command center

Studio intentionally remains operational-dark regardless of the public theme preference. The user preference persists and is restored when the user returns to the public site.

Studio tokens:
- canvas `#0a0b0f`;
- panels `#12131a`;
- result cards `#1a1b25`;
- elevated cards `#22232f`;
- borders `#2a2b38`;
- Local = emerald;
- Cloud = blue;
- command focus = indigo.

## 2. Reference hierarchy

### Reference A — light editorial landing
Adopt:
- sticky white/glass header;
- proof-first hero;
- clean metric strip;
- white categorized cards;
- feature/how-it-works/use-case rhythm;
- FAQ and strong closing CTA.

### Reference B — dark Studio command center
Adopt:
- deep application canvas;
- compact Local/Cloud mode chips;
- three-panel workspace geometry;
- command-bar focus treatment;
- visible workflow/result states;
- mobile panel collapse.

### Reference C — SEO-heavy XFree HTML concept
Adopt:
- skip-to-main link;
- subtle grid/orb hero atmosphere;
- focused search control;
- crawlable popular-tool shortcuts;
- factual badges;
- live browser-local playground;
- direct-answer blocks;
- category/pillar hierarchy;
- semantic FAQ accordion.

Reject prototype metadata, stale domains, placeholder IDs, fake social proof, and unsupported claims.

## 3. Brand tokens

Shared:
- primary indigo `#4f46e5`;
- secondary indigo `#6366f1`;
- violet `#8b5cf6`;
- purple `#a855f7`;
- Local/success emerald 500;
- Cloud/info blue 500;
- warning amber 500;
- error rose 500.

Gradients are reserved for the X mark, hero emphasis, and primary CTA.

## 4. Theme contract

- `ThemeProvider` owns `light | dark`.
- Preference key: `xfree_theme`.
- If no stored preference exists, initialize from `prefers-color-scheme`.
- The root `<html>` receives `.dark`, `data-theme`, and matching `color-scheme`.
- Tailwind dark variants are class-driven, not media-only.
- The global header exposes one accessible Light/Dark toggle with Sun/Moon state.
- Theme choice must not change canonical URLs, structured data, sitemap membership, ad behavior, processing mode, or recipe execution.
- Studio keeps `xfree-studio-dark` for operational contrast.
- The homepage uses `xfree-home-marketing` as a palette scope; never force `xfree-home-light`.
- All nonessential transition/motion is effectively disabled under `prefers-reduced-motion: reduce`.

## 5. Typography and geometry

- system sans / Inter-like UI proportions;
- monospace for code, recipe IDs, engine IDs, and technical output;
- H1 40–64px desktop;
- H2 28–40px;
- body 14–18px at 1.55–1.8 line height;
- max page width `max-w-7xl`;
- reading width 720–900px;
- major section radius `rounded-[2rem]`;
- cards `rounded-2xl`;
- controls `rounded-xl`;
- pills `rounded-full`.

Use borders more often than heavy shadows. Hover elevation stays subtle.

## 6. Final keyword architecture

Keyword structure is a **copy/metadata ownership model**, not a keyword-stuffing list and not a `<meta name="keywords">` source.

Each major surface owns one primary search intent:

| Surface | Primary intent | Supporting language |
|---|---|---|
| `/` | `free developer tools` | browser developer tools, no signup developer tools, local browser tools, technical SEO tools |
| `/recipes` + `/recipes/*` | `local browser workflow recipes` | developer workflow recipes, inspectable tool chains, reproducible browser workflows |
| Studio | `local agent workflow studio` | browser agent workflows, deterministic tool chaining, WebGPU agent planning |
| `/category/developer-tools` | `browser developer utilities` | developer formatters, validators, data conversion tools |
| `/category/seo-tools` | `technical SEO tools` | browser SEO utilities, sitemap tools, URL audit tools |
| `/tools/:slug` | specific tool intent | XFree + tool name + only truthful modifiers |

Rules:
- one primary intent per page family;
- secondary phrases only when they improve human copy;
- do not repeat modifier variants mechanically;
- do not create doorway pages for phrase permutations;
- brand-disambiguation copy may use `XFree + [tool/workflow]` naturally;
- never claim “zero competition”, guaranteed Page 1, or measured volume/KD without real external evidence;
- no fake multilingual hreflang until equivalent localized pages actually exist.

## 7. Public hero contract

The hero must communicate:
1. XFree publishes free developer tools;
2. the published catalog count is dynamic and real;
3. Local Mode is browser-local for features labeled Local;
4. workflow recipes and Studio are available;
5. optional cloud functionality is separate and disclosed.

Required:
- one H1;
- dynamic published-tool count;
- primary Studio CTA;
- published-tools CTA;
- workflow-recipes CTA;
- registry search;
- real popular-tool anchors;
- roadmap count explicitly labeled as roadmap.

## 8. Search and discovery

- search verified public registry only;
- visible focus ring;
- popular shortcuts must be real anchors;
- search examples may reference existing published tools only;
- do not add fake SearchAction behavior;
- recipes, categories, pillars, and guides may appear only when their routes exist.

## 9. Workflow recipe design contract

Recipes are a product demonstration, not arbitrary automation scripts.

Every public recipe must show:
- recipe ID;
- semantic version;
- input example;
- ordered execution plan;
- individual `engine:` or `transform:` IDs;
- processing mode;
- LLM requirement;
- bounded safe configuration;
- expected output shape;
- **Open in Agent Studio** action;
- copyable declarative JSON representation.

Security rules:
- no arbitrary JavaScript;
- no shell commands;
- no remote script URLs;
- no hidden network calls;
- 1–6 steps;
- every engine/transform validated against the Agent Core allowlist;
- starter recipes declare `networkAccess=false`;
- recipe examples execute in CI.

Recipe card styling follows the public theme. Execution UI follows the Studio dark surface.

## 10. Metrics contract

Use registry-derived or static architectural facts only:
- published tool count;
- recipe count;
- roadmap concepts explicitly labeled roadmap;
- no-signup state;
- build-gate state when actually enforced.

Never invent users, executions, ratings, stars, uptime, or benchmark latency.

## 11. Tool and recipe cards

Cards must:
- link to real routes;
- show concise functional descriptions;
- use factual badges only;
- maintain keyboard focus and readable contrast in both themes;
- avoid decorative “Popular/Best/Top” unless backed by a disclosed source.

## 12. Direct-answer / AEO blocks

Use literal question/answer structure where it improves comprehension.

- answer in the first 1–2 sentences;
- follow with real implementation caveats;
- link to How It Works, Security, Recipes, and Contribute where relevant;
- FAQ schema must match visible answers;
- AEO/GEO never justifies repetition or mass FAQ generation.

## 13. Category, pillar, and roadmap rules

- categories can be indexable when they contain real published tools and unique copy;
- pillars are indexable only under the existing publishing policy;
- empty/planned pillars remain `noindex,follow`;
- roadmap remains a planning surface, not a live-tool count;
- planned concepts never link to fake tool pages.

## 14. Claim rules

Allowed when currently true:
- free published tools;
- no XFree account required for published tools and starter recipes;
- Local Mode input stays in browser execution for that feature;
- starter recipes are local and allowlist-validated;
- optional cloud behavior is disclosed before submission;
- open-source statements backed by repository/license evidence;
- roadmap counts explicitly labeled planning taxonomy.

Reject/rewrite unless directly proven:
- whole-platform `100% client-side`;
- `zero tracking` where advertising/consent/network services exist;
- `absolute privacy`;
- unlimited file size;
- universal sub-second performance;
- guaranteed offline operation;
- fake aggregate ratings;
- fake users/stars/contributors;
- competitor superiority without evidence.

## 15. URL and metadata truth

- canonical search origin: `https://www.xfree.in`;
- Studio origin: `https://app.xfree.in`;
- production repository: `https://github.com/CodesbyFebin/xfree`;
- recipes: `/recipes` and `/recipes/:slug`;
- no stale `studio.xfree.in` links;
- no apex canonical regression;
- no fake language alternates;
- no `meta keywords` or `revisit-after` SEO theater.

## 16. Studio rules

- Local mode is default;
- Cloud mode is explicit and visually distinct;
- command bar is primary interaction;
- deterministic recipe deep links reconstruct the exact versioned plan;
- WebGPU planner can propose only allowlist-valid capabilities;
- left = tools/files/workspace;
- center = command/workflow;
- right = results/artifacts;
- local folder access remains explicit and permission-scoped;
- model downloads remain opt-in and disclosed;
- never copy prototype `innerHTML` rendering into React production code.

## 17. Accessibility

- skip link targets `#main-content`;
- visible `:focus-visible` rings;
- approximately 40px interactive targets where practical;
- icon-only controls require labels;
- status does not rely on color alone;
- semantic `<details>/<summary>` for FAQ where appropriate;
- selectable tool/recipe output;
- Light/Dark themes must preserve readable contrast.

## 18. Advertising

- preserve 160px internal safe-zone around manual ad units;
- never put ads adjacent to tool action buttons;
- no overlays covering tool/recipe workspaces;
- no styling that makes ads resemble tool controls;
- redesigns retain privacy/terms/contact/footer access.

## 19. Reference adaptation policy

Adopt experience improvements, not prototype claims.

Reject:
- unsafe `innerHTML` output;
- stale domains;
- placeholder AdSense IDs;
- fake social links;
- fake metrics;
- site-wide privacy absolutes;
- mass-indexed roadmap concepts;
- unsupported SEO guarantees.

## 20. Change gate

A design/keyword/recipe release is complete only when applicable gates are green:
- `npm ci`;
- typecheck;
- tests;
- tool registry audit;
- production build/prerender;
- batch-1 local-tool validation;
- Agent Studio validation;
- **recipe validation and example execution**;
- **theme + keyword ownership validation**;
- SEO/canonical validation;
- AdSense validation;
- noindex validation;
- documentation link checks;
- CodeQL;
- secret scan;
- production dependency audit.

A Vercel preview blocked only by an account build-rate throttle is an external platform constraint, never a code-quality waiver. Production still requires verification on the exact merged Git SHA when Vercel accepts a build.
