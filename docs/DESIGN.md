# XFree Design System

Status: production design source of truth
Updated: 2026-08-23

## 1. Product surfaces

XFree has two related but distinct surfaces.

### Public site — light editorial utility directory
Use a light stone/white canvas, indigo-to-violet brand gradients, restrained shadows, strong type hierarchy, rounded 16–32px cards, and crawlable content-first sections.

Primary page rhythm:
1. sticky navigation
2. proof-first hero
3. dynamic trust/stat strip
4. searchable published-tool directory
5. authority / privacy explanation
6. feature and workflow education
7. use-case / documentation pathways
8. FAQ
9. gradient CTA
10. dark information-dense footer

### XFree Studio — dark command center
Use a deep neutral application canvas with indigo accents, compact panels, local/cloud mode chips, command-bar focus glow, workflow/result cards, chain suggestions, and responsive panel collapse.

Studio must feel like the operational counterpart of the public site, not a separate brand.

## 2. Brand tokens

- Primary: indigo 600 (`#4f46e5`)
- Accent: violet 600 / purple 500
- Success / local mode: emerald 500
- Marketing background: stone 50 / white
- Application background: slate 950
- Marketing text: slate 950 / slate 600
- Application text: white / slate 300 / slate 500
- Marketing border: slate 200
- Application border: slate 800

Gradients should be used for the X mark, hero emphasis, and primary CTA only. Do not turn every card into a gradient.

## 3. Geometry

- page max width: `max-w-7xl`
- major section radius: `rounded-[2rem]`
- cards: `rounded-2xl`
- controls: `rounded-xl`
- pills: `rounded-full`
- standard card padding: 20–28px
- major section vertical rhythm: 64–96px desktop, 40–64px mobile

## 4. Public-site rules

- One H1 per page.
- Tool cards are real `<a href>` links.
- Counts come from production registries, never hardcoded marketing numbers.
- Local-processing claims must be scoped to tools whose `execution` is `local`.
- Optional cloud/AI behavior must be disclosed before transmission.
- Do not publish aggregate ratings, usage counts, benchmark times, file-size limits, or competitor claims without measured evidence.
- Preserve AdSense safe zones and legal/footer links.
- Preserve current canonical `https://www.xfree.in` and sitemap/indexability gates.

## 5. Studio rules

- Local mode is the default visual state.
- Cloud mode is explicit and visually distinct.
- The command bar is the primary interaction.
- Chain suggestions are secondary actions, never autonomous hidden execution.
- Left panel: tools/files/workspace.
- Center: conversation/workflow/command surface.
- Right panel: results/artifacts/status.
- On narrow screens, collapse secondary panels into explicit mobile drawers/tabs.
- Never copy unsafe `innerHTML` patterns from static prototypes into React production code.

## 6. Accessibility

- Keep the skip link.
- Maintain visible focus rings.
- Minimum interactive target approximately 40px where practical.
- Do not rely on color alone for Local/Cloud or status meaning.
- Respect `prefers-reduced-motion`.
- Accordion content uses semantic `<details>/<summary>` where appropriate.

## 7. Reference adaptation policy

The uploaded HTML files are visual and interaction references only. Production React, routing, metadata, schema, CSP, privacy, AdSense, publication registries, and build gates remain authoritative.

Adopt:
- sticky clean header
- indigo/violet gradient identity
- proof-first hero
- stat strip
- white categorized tool cards
- feature/how-it-works/use-case hierarchy
- semantic FAQ accordion
- strong closing CTA
- Studio mode toggle / command bar / panel layout / chain chips

Reject or rewrite unless proven:
- fake aggregate ratings
- `meta keywords` / `revisit-after` as ranking tactics
- hardcoded stale tool counts
- "zero tracking" site-wide claims
- "all data never leaves device" for optional cloud features
- universal sub-second processing
- unlimited file-size claims
- blanket competitor superiority claims
- prototype `innerHTML` rendering

## 8. Change gate

A design change is complete only if existing typecheck, tests, tool audit, SEO validation, AdSense validation, noindex validation, agent validation, CodeQL, secret scan, and dependency audit remain green.