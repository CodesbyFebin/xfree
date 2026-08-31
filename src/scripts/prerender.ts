/**
 * Static prerender: emit per-route HTML files under dist/ so that public pages
 * expose unique title/description/canonical/JSON-LD in raw HTML before any JS runs.
 *
 * This is a "meta shell" prerender — it injects per-page <title>, meta, canonical,
 * H1, primary copy, and JSON-LD into the built index.html, then writes to
 * dist/<route>/index.html. The React app hydrates over the shell client-side.
 * Not a full SSR render, but enough for correct indexation and previews.
 */
import fs from "fs";
import path from "path";
import { PUBLIC_TOOLS, PUBLIC_CATEGORIES } from "../data/publicTools";
import { STATIC_ROUTES } from "../data/routes";
import { guideForSlug } from "../data/toolGuides";
import { GUIDES } from "../data/guides";
import { GENERATED_PUBLISHED_CONTENT } from "../data/generatedPublishedContent";
import { CANONICAL_ORIGIN } from "../data/siteConfig";
import { PILLARS_50, ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";
import { getPublishedToolsForPillar, isPillarIndexable } from "../data/pillarPublishing";

const DIST = path.join(process.cwd(), "dist");
const BASE = CANONICAL_ORIGIN;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function readTemplate(): string {
  const p = path.join(DIST, "index.html");
  if (!fs.existsSync(p)) throw new Error(`dist/index.html not found — run \`vite build\` first`);
  return fs.readFileSync(p, "utf-8");
}

interface PageMeta {
  route: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  jsonLd: any[];
  guide?: import("../data/toolGuides").GuideContent;
  robots?: "index,follow" | "noindex,follow";
  canonical?: string | null;
}

function renderGuideHtml(guide: import("../data/toolGuides").GuideContent, toolTitle: string): string {
  const examples = guide.workedExamples
    .map((ex) => `<article><h4>${escapeHtml(ex.title)}</h4><p><strong>Input:</strong></p><pre>${escapeHtml(ex.input)}</pre><p><strong>Output:</strong></p><pre>${escapeHtml(ex.output)}</pre><p>${escapeHtml(ex.explanation)}</p></article>`)
    .join("");
  const whenTo = guide.whenToUse.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const whenNot = guide.whenNotToUse.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const trouble = guide.troubleshooting.map((t) => `<dt>${escapeHtml(t.symptom)}</dt><dd>${escapeHtml(t.fix)}</dd>`).join("");
  return `<section><h2>The ${escapeHtml(toolTitle)} guide</h2><p>${escapeHtml(guide.overview)}</p><h3>Worked examples</h3>${examples}<h3>When to use</h3><ul>${whenTo}</ul><h3>When not to use</h3><ul>${whenNot}</ul><h3>Troubleshooting</h3><dl>${trouble}</dl><p><em>Authored by the XFree.in team. Last reviewed ${escapeHtml(guide.lastReviewed)}.</em></p></section>`;
}

function renderGuideBodyHtml(g: import("../data/guides").Guide): string {
  const sections = g.sections.map((s) => {
    const paras = (s.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const bullets = s.bullets ? `<ul>${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : "";
    const code = s.code ? `<pre>${escapeHtml(s.code.body)}</pre>` : "";
    return `<section><h2>${escapeHtml(s.heading)}</h2>${paras}${bullets}${code}</section>`;
  }).join("");
  return `${sections}<p><em>Authored by the XFree.in team. Last reviewed ${escapeHtml(g.lastReviewed)}.</em></p>`;
}

function injectMeta(template: string, meta: PageMeta, extraBodyHtml = ""): string {
  const canonical = meta.canonical === undefined
    ? `${BASE}${meta.route === "/" ? "/" : meta.route}`
    : meta.canonical;
  const robots = meta.robots || "index,follow";

  const headExtras = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    canonical ? `<link rel="canonical" href="${canonical}" />` : "",
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    canonical ? `<meta property="og:url" content="${canonical}" />` : "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="XFree.in" />`,
    `<meta property="og:image" content="${BASE}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="XFree.in — free developer, SEO and AI tools" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${BASE}/og-image.png" />`,
    meta.jsonLd.length
      ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": meta.jsonLd })}</script>`
      : "",
  ].filter(Boolean).join("\n    ");

  const guideHtml = meta.guide ? renderGuideHtml(meta.guide, meta.h1) : "";
  const shell = `<div id="prerender-shell" style="max-width:1180px;margin:0 auto;padding:32px 20px;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;line-height:1.6">
    <nav aria-label="Primary" style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px">
      <a href="/">Home</a><a href="/guides">Guides</a><a href="/how-it-works">How it works</a><a href="/docs">Docs</a><a href="/contribute">Contribute</a><a href="/faq">FAQ</a>
    </nav>
    <main>
      <h1>${escapeHtml(meta.h1)}</h1>
      <p>${escapeHtml(meta.intro)}</p>
      ${guideHtml}
      ${extraBodyHtml}
    </main>
  </div>`;

  // Remove any SEO tags from the shared Vite shell, then inject exactly one
  // route-specific set. The visible prerender shell is removed by main.tsx
  // before React mounts; with JavaScript disabled it remains useful content.
  let out = template.replace(/<title>[^<]*<\/title>\s*/gi, () => "");
  out = out.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, () => "");
  out = out.replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, () => "");
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, () => "");
  out = out.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, () => "");
  out = out.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, () => "");
  out = out.replace("</head>", () => `    ${headExtras}\n  </head>`);
  out = out.replace('<div id="root"></div>', () => `${shell}<div id="root"></div>`);
  return out;
}

function renderGeneratedArtifactHtml(page: import("../content-pipeline/published-artifact-schema").PublishedArtifact): string {
  const examples = page.content.examples.map((example) =>
    `<article><h3>${escapeHtml(example.title)}</h3><p><strong>Input</strong></p><pre><code>${escapeHtml(example.input)}</code></pre><p><strong>Output</strong></p><pre><code>${escapeHtml(example.output)}</code></pre><p>${escapeHtml(example.explanation)}</p></article>`,
  ).join("");
  const faqs = page.content.faqs.map((faq) =>
    `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`,
  ).join("");
  const limitations = page.processing.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<article><p><a href="${escapeHtml(page.studioDeepLink)}">Open in XFree Studio</a></p><section aria-labelledby="direct-answer"><h2 id="direct-answer">What is the ${escapeHtml(page.metadata.h1)} and how does it work?</h2><p>${escapeHtml(page.content.directAnswer)}</p></section><section aria-labelledby="technical-details"><h2 id="technical-details">Technical architecture and local processing</h2><p>${escapeHtml(page.content.technicalDetails)}</p></section><section aria-labelledby="instructions"><h2 id="instructions">Step-by-step usage guide</h2><p>${escapeHtml(page.content.instructions)}</p></section><section><h2>Worked examples</h2>${examples}</section><aside><h2>Verified specifications</h2><p>Processing: ${escapeHtml(page.processing.mode)}</p><ul>${limitations}</ul></aside><section aria-labelledby="troubleshooting"><h2 id="troubleshooting">Technical troubleshooting and edge cases</h2>${faqs}</section></article>`;
}

function writeRoute(route: string, html: string) {
  const routePath = route === "/" ? "" : route.replace(/^\//, "");
  const dir = path.join(DIST, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${BASE}/#organization`,
    name: "XFree",
    alternateName: ["XFree.in", "xfree.in"],
    url: `${BASE}/`,
    logo: {
      "@type": "ImageObject",
      url: `${BASE}/favicon-512x512.png`,
      width: 512,
      height: 512,
    },
    description: "XFree develops free browser-based developer, SEO, and single-purpose AI micro-tools.",
    // Only include real, verified profiles. Add to this list as you claim them.
    sameAs: [] as string[],
  };
}

function siteJsonLd() {
  return {
    "@type": ["WebSite", "WebApplication"],
    "@id": `${BASE}/#website`,
    name: "XFree",
    alternateName: ["XFree.in", "xfree.in"],
    url: `${BASE}/`,
    description: "Free browser-based developer, SEO, and single-purpose AI micro-tools.",
    inLanguage: "en",
    applicationCategory: "Utilities",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": `${BASE}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function breadcrumbs(items: Array<{ name: string; url: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

const STATIC_META: Record<string, { title: string; description: string; h1: string; intro: string }> = {
  "/": {
    title: "Free Developer, SEO & AI Tools — XFree.in | No Signup",
    description: `Use ${PUBLIC_TOOLS.length} published XFree developer, SEO, formatter, converter, and focused AI tools. No signup; local processing is the default and cloud features are disclosed.`,
    h1: "XFree: Free Developer, SEO & AI Tools",
    intro: `Get X done for free with ${PUBLIC_TOOLS.length} published developer, technical SEO, formatter, converter, and focused AI tools. Local Mode is the default; cloud-powered features disclose the provider before submission.`,
  },
  "/xfree-app": {
    title: "XFree App — Install the Free Browser-Based Developer & SEO Toolkit",
    description: "Install XFree as a Progressive Web App on desktop, Android, or iOS to use free developer, SEO, formatting, and AI tools without a browser tab.",
    h1: "XFree App",
    intro: "XFree is available as an installable Progressive Web App. Add it to your desktop dock or mobile home screen for one-tap access to every tool. Everything still runs in your browser — the PWA install is just a shortcut, not a separate binary.",
  },
  "/studio": {
    title: "XFree Studio — Local Tools & Optional NVIDIA Cloud",
    description: "Use XFree browser tools locally by default or explicitly enable NVIDIA Cloud Mode with account-aware model discovery.",
    h1: "XFree Studio",
    intro: "Local Mode is the default. NVIDIA Cloud Mode is optional and sends only the messages you submit after enabling it.",
  },
  "/about": { title: "About XFree.in", description: "About the XFree.in micro-tools platform: mission, principles, and who it's built for.", h1: "About XFree.in", intro: "XFree.in is a small, focused micro-tool platform for developers, SEOs, and technical writers." },
  "/contact": { title: "Contact XFree.in", description: "Contact XFree.in for bug reports, tool requests, or partnership inquiries.", h1: "Contact us", intro: "Send us a note — we read every message." },
  "/privacy": { title: "Privacy Policy — XFree.in", description: "How XFree.in handles Local Mode tools, optional Cloud AI, service logs, forms, advertising, cookies, and privacy requests.", h1: "Privacy Policy", intro: "Published Local Mode tools process working data in your browser. Optional Cloud AI and third-party services are disclosed separately." },
  "/terms": { title: "Terms of Service — XFree.in", description: "Read XFree.in terms for acceptable use, local and cloud processing, AI output limitations, intellectual property, service availability, and liability.", h1: "Terms of Service", intro: "Acceptable use and service limitations for XFree.in tools." },
  "/security": { title: "Security & Sandbox — XFree.in", description: "XFree.in security posture: CSP, rate limits, secret handling, and abuse controls on AI endpoints.", h1: "Security", intro: "How we harden the platform against abuse and protect your data." },
  "/faq": { title: "FAQ & Guidance — Local and Cloud Tools | XFree.in", description: "Answers about XFree Local Mode, optional cloud processing, browser limits, sensitive data, accounts, tool verification, and production use.", h1: "FAQ & Guidance", intro: "Understand which tools run locally, when optional cloud processing sends submitted content to a named provider, how browser limits affect large input, and why generated output still requires production review." },
  "/how-it-works": { title: "How XFree Works — Browser Tools and Optional Cloud Mode", description: "Follow XFree processing from a published tool page through browser JavaScript or Web Workers to result review, export, and optional cloud handoff.", h1: "How XFree.in works", intro: "XFree exposes only published, indexable tools. Local operations use the browser implementation declared on each tool page; optional cloud features require an explicit choice and disclose the provider before submitted content leaves the browser." },
  "/use-cases": { title: "Developer and SEO Tool Use Cases & Examples | XFree.in", description: "Practical XFree workflows for technical SEO, API payload inspection, regex testing, scheduled jobs, metadata previews, and content comparison.", h1: "Use cases & examples", intro: "Explore practical workflows built from currently published tools: prepare crawl data, validate API payloads, test JavaScript regex patterns, plan cron schedules, compare text revisions, and preview metadata before publishing." },
  "/docs": { title: "XFree Documentation Hub — Inputs, Examples and Limits", description: "Find verified XFree tool references, input and output behavior, worked examples, processing disclosures, limitations, and reviewed technical guides.", h1: "Documentation Hub", intro: "Documentation follows the behavior of published implementations. Draft engines stay excluded, processing language is scoped per tool, and examples describe limitations instead of promising universal standards compliance." },
  "/blog": { title: "XFree Blog & Pillar Guides — Reviewed Technical Content", description: "Read XFree technical guides and progressively published pillar content with permanent URLs, unique metadata, real examples, and working tool links.", h1: "Blog & Pillar Guides", intro: "Current editorial content consists of reviewed guides with permanent routes. Planned pillar and cluster pages remain private until their utility, examples, metadata, and internal links are complete." },
  "/pillars": { title: "XFree Tool Pillars — Developer & SEO Utilities", description: "Explore XFree's 50 developer and SEO tool pillars. Pillars with published utilities are indexable; planned concepts remain roadmap-only until implementation and review.", h1: "XFree Developer & SEO Pillar Directory", intro: `Browse all 50 roadmap pillars. ${PUBLIC_TOOLS.length} verified tools are published today; empty pillars remain planning surfaces rather than thin indexable pages.` },
  "/roadmap": { title: "XFree 25,000-Concept Tool Roadmap — Planned Developer Utilities", description: "Explore XFree's 25,000-concept planning matrix. This roadmap is not a claim that 25,000 tools are live; concepts remain noindex until built, tested, and approved.", h1: "XFree 25,000-Concept Tool Roadmap", intro: `The ${ROADMAP_CONCEPT_COUNT.toLocaleString()}-concept matrix is a transparent planning taxonomy, not a count of live tools. Published tools are listed separately and planned concepts do not receive indexable stub URLs.` },
  "/contribute": { title: "Contribute to XFree — Build Free Developer & SEO Tools", description: "Build and contribute real XFree developer and SEO tools through the public roadmap, automated quality gates, security review, and governed publication pipeline.", h1: "Contribute to XFree — Build Free Developer & SEO Tools", intro: "Choose a roadmap concept, build a real implementation, pass automated and human quality gates, and only then request publication and indexability." },
  "/instaserver": { title: "InstaServer — Free Open-Source Alternative to InstaPods & Vercel", description: "InstaServer is a free, open-source MCP server that deploys app containers on your own machine via Docker, with free public URLs. No account, no rate limit.", h1: "InstaServer — a free, open-source alternative to InstaPods and Vercel", intro: "InstaServer gives an AI agent InstaPods-style deploy tools — deploy_pod, exec_command, get_logs, file read/write — except every pod is a real Docker container on your own machine, with a public URL from a free Cloudflare quick tunnel. No account, no signup, no platform-imposed rate limit." },
  "/json-tools": { title: "Free JSON Tools — Formatter, Validator & Converter", description: "18 free browser-based JSON tools: format, validate, minify, convert to/from CSV and JSON Lines, sort keys, and inspect arrays. No signup.", h1: "Free JSON Tools — Formatter, Validator, Converter & Inspector", intro: "18 browser-local JSON utilities in one place: format and validate a payload, convert it to or from CSV and JSON Lines, sort or deduplicate arrays, resolve a JSON Pointer, or escape a string for embedding. Every tool runs in your browser — no JSON you paste is sent to XFree.in servers." },
};


function renderHomeDirectoryLinks(): string {
  const categories = PUBLIC_CATEGORIES.map((category) =>
    `<li><a href="/${escapeHtml(category.id)}">${escapeHtml(category.label)}</a> — ${escapeHtml(category.description)}</li>`,
  ).join("");
  const tools = PUBLIC_TOOLS.slice(0, 10).map((tool) =>
    `<li><a href="/tools/${escapeHtml(tool.slug)}">${escapeHtml(tool.title)}</a> — ${escapeHtml(tool.shortDescription)}</li>`,
  ).join("");
  return `<section><h2>What is XFree?</h2><p>XFree is a free browser-based developer and SEO tool suite. It currently exposes ${PUBLIC_TOOLS.length} verified published utilities; the ${ROADMAP_CONCEPT_COUNT.toLocaleString()}-concept matrix is a public roadmap, not a live-tool count.</p><p><a href="/pillars">Browse the XFree pillar directory</a> · <a href="/guides">Read reviewed XFree guides</a> · <a href="/how-it-works">See how XFree processing works</a> · <a href="/contribute">Contribute a tool</a></p></section><section><h2>Explore XFree SEO & developer tool categories</h2><ul>${categories}</ul></section><section><h2>Published XFree tools</h2><ul>${tools}</ul></section><section><h2>Frequently asked questions about XFree</h2><h3>Is XFree free and no-signup?</h3><p>Yes. Published XFree tools can be opened without creating an XFree account. Optional third-party or cloud features are disclosed separately when used.</p><h3>What does Local Mode mean?</h3><p>Local Mode means working input is processed in the browser rather than being submitted to an XFree processing service. Each published tool states its actual processing behavior.</p><h3>Are all ${ROADMAP_CONCEPT_COUNT.toLocaleString()} roadmap concepts live?</h3><p>No. The roadmap is a planning taxonomy. Planned concepts stay outside the public sitemap until implementation, testing, editorial review, canonical validation, and internal-link checks pass.</p><h3>How can I contribute?</h3><p>Choose a roadmap concept, open a tool request, implement it against the current repository architecture, add tests and disclosures, then submit a pull request for automated and human review.</p></section>`;
}

function renderContributeBody(): string {
  return `<section><h2>How the XFree roadmap becomes production</h2><ol><li><strong>Roadmap:</strong> planned concepts remain searchable on one noindex roadmap surface.</li><li><strong>Contribution pipeline:</strong> contributors implement functionality, tests, processing disclosures, accessibility, documentation, and error handling.</li><li><strong>Published production:</strong> approved tools enter the public registry, prerender pipeline, internal link graph, and canonical sitemap automatically.</li></ol></section><section><h2>Publication gates for contributed tools</h2><ul><li>Working implementation with truthful limitations</li><li>Local, cloud, or hybrid processing disclosure</li><li>Security review and no hard-coded secrets</li><li>Keyboard and screen-reader usable controls</li><li>Unique H1, title, description, examples, and supporting copy</li><li>Self-canonical ${BASE} route and prerendered 200 HTML</li><li>No sitemap entry before publication approval</li></ul><p><a href="https://github.com/CodesbyFebin/xfree/issues/new/choose">Request or claim a tool on GitHub</a> · <a href="/roadmap">Browse the roadmap</a></p></section><section><h2>Safe good-first-issue automation</h2><p>The maintainer-run workflow generates a deterministic candidate artifact by default. Issue creation requires an explicit workflow input, is capped to a small batch, and checks existing titles before creating anything.</p></section>`;
}

function renderInstaServerBody(): string {
  const repo = "https://github.com/CodesbyFebin/instaserver";
  return `<section><h2>Why this exists</h2><p>Centralized platforms are convenient until their free tier throttles you. A burst of pushes in an hour can trip a build-rate limit and silently freeze production deploys for days. InstaServer trades platform convenience for owning the whole stack: your machine, your Docker engine, your uptime, no ceiling.</p></section><section><h2>Runtime presets</h2><ul><li><strong>static</strong> — nginx:alpine, serves uploaded files as-is.</li><li><strong>nodejs</strong> — node:20-alpine, npm install then node &lt;entry&gt;.</li><li><strong>python</strong> — python:3.12-alpine, pip install then python &lt;entry&gt;.</li></ul></section><section><h2>MCP tool surface</h2><ul><li>deploy_pod — create-if-missing, upload, install deps, restart, open a public URL, verify it answers</li><li>list_pods / get_pod / manage_pod / delete_pod</li><li>exec_command / get_logs</li><li>list_files / read_file / write_file</li></ul></section><section><h2>Limitations, stated honestly</h2><ul><li>Your machine needs to be on for pods to be reachable.</li><li>Free Cloudflare quick tunnels are best-effort, not an SLA.</li><li>No custom domains, no multi-region, no built-in TLS beyond the tunnel.</li></ul><p><a href="${repo}" target="_blank" rel="noopener noreferrer">View source on GitHub</a></p></section>`;
}

const JSON_TOOL_SLUGS = [
  "json-formatter", "json-pretty-printer", "json-minifier", "json-syntax-validator", "json-key-sorter",
  "json-to-csv-converter", "csv-to-json-converter", "jsonl-to-json-array", "json-array-to-jsonl",
  "json-value-type-inspector", "json-object-key-extractor", "json-array-length-counter",
  "json-pointer-resolver", "json-nesting-depth-calculator", "json-array-deduplicator", "json-array-sorter",
  "json-string-escaper", "json-string-unescaper",
];

function renderJsonToolsBody(): string {
  const tools = PUBLIC_TOOLS.filter((tool) => JSON_TOOL_SLUGS.includes(tool.slug));
  const items = tools.map((tool) => `<li><a href="/tools/${escapeHtml(tool.slug)}">${escapeHtml(tool.title)}</a> — ${escapeHtml(tool.shortDescription)}</li>`).join("");
  return `<section><h2>${tools.length} JSON tools</h2><ul>${items}</ul></section><section><h2>Does any of this leave the browser?</h2><p>No. Every JSON tool here runs as browser JavaScript. The JSON payloads you paste are never uploaded to XFree.in or any AI backend.</p></section>`;
}

function renderCategoryToolLinks(categoryId: string): string {
  const tools = PUBLIC_TOOLS.filter((tool) => tool.category === categoryId);
  return `<section><h2>Published tools in this category</h2><ul>${tools.map((tool) => `<li><a href="/tools/${escapeHtml(tool.slug)}">${escapeHtml(tool.title)}</a> — ${escapeHtml(tool.shortDescription)}</li>`).join("")}</ul></section>`;
}

function renderGuideIndexLinks(): string {
  return `<section><h2>Reviewed guides</h2><ul>${GUIDES.map((guide) => `<li><a href="/guides/${escapeHtml(guide.slug)}">${escapeHtml(guide.title)}</a> — ${escapeHtml(guide.description)}</li>`).join("")}</ul></section>`;
}

function main() {
  const template = readTemplate();
  let count = 0;

  for (const route of STATIC_ROUTES) {
    const m = STATIC_META[route];
    if (!m) continue;
    const jsonLd: any[] = [organizationJsonLd(), siteJsonLd()];
    if (route !== "/") {
      jsonLd.push(breadcrumbs([{ name: "Home", url: `${BASE}/` }, { name: m.h1, url: `${BASE}${route}` }]));
    }
    const routeMeta: PageMeta = route === "/studio"
      ? { route, ...m, jsonLd, canonical: "https://app.xfree.in/" }
      : route === "/roadmap"
        ? { route, ...m, jsonLd: [], robots: "noindex,follow" }
        : { route, ...m, jsonLd };
    writeRoute(route, injectMeta(template, routeMeta, route === "/" ? renderHomeDirectoryLinks() : route === "/contribute" ? renderContributeBody() : route === "/instaserver" ? renderInstaServerBody() : route === "/json-tools" ? renderJsonToolsBody() : ""));
    count++;
  }

  for (const cat of PUBLIC_CATEGORIES) {
    const route = `/${cat.id}`;
    const title = `${cat.label} — XFree.in`;
    const description = cat.description;
    writeRoute(route, injectMeta(template, {
      route,
      title,
      description,
      h1: cat.label,
      intro: description,
      jsonLd: [
        organizationJsonLd(), siteJsonLd(),
        breadcrumbs([{ name: "Home", url: `${BASE}/` }, { name: cat.label, url: `${BASE}${route}` }]),
        {
          "@type": "CollectionPage",
          name: title,
          description,
          url: `${BASE}${route}`,
        },
      ],
    }, renderCategoryToolLinks(cat.id)));
    count++;
  }

  for (const pillar of PILLARS_50) {
    const route = `/pillar/${pillar.slug}`;
    const publishedTools = getPublishedToolsForPillar(pillar.slug);
    const indexable = isPillarIndexable(pillar.slug);
    const title = `${pillar.name} Tools | XFree.in`;
    const description = `Browse published XFree ${pillar.name} tools and reviewed roadmap context. Planned concepts stay noindex until implementation and editorial gates pass.`;
    const links = publishedTools.length
      ? `<section><h2>Published XFree ${escapeHtml(pillar.name)} tools</h2><ul>${publishedTools.map((tool) => `<li><a href="/tools/${escapeHtml(tool.slug)}">${escapeHtml(tool.title)}</a> — ${escapeHtml(tool.shortDescription)}</li>`).join("")}</ul></section>`
      : `<section><h2>Roadmap status</h2><p>No tool in this pillar has passed publication gates yet. Planned concepts remain on the roadmap and do not receive indexable stub pages.</p></section>`;
    const jsonLd = indexable ? [
      organizationJsonLd(), siteJsonLd(),
      breadcrumbs([{ name: "Home", url: `${BASE}/` }, { name: "Pillars", url: `${BASE}/pillars` }, { name: pillar.name, url: `${BASE}${route}` }]),
      { "@type": "CollectionPage", name: title, description, url: `${BASE}${route}` },
    ] : [];
    writeRoute(route, injectMeta(template, {
      route, title, description, h1: `XFree ${pillar.name} Tools`,
      intro: `${pillar.description} ${indexable ? `${publishedTools.length} verified tool${publishedTools.length === 1 ? " is" : "s are"} currently published in this pillar.` : "This pillar is roadmap-only today."}`,
      jsonLd, robots: indexable ? "index,follow" : "noindex,follow",
    }, `${links}<section><h2>How XFree publishes this pillar</h2><p>Tools become indexable only after a working implementation, tests, processing disclosure, unique documentation, metadata validation, and internal-link review.</p><p><a href="/roadmap">Explore the planning roadmap</a> · <a href="/pillars">Back to all pillars</a></p></section>`));
    count++;
  }

  for (const tool of PUBLIC_TOOLS) {
    const route = `/tools/${tool.slug}`;
    const title = `${tool.title} — XFree.in`;
    const description = tool.shortDescription;
    const jsonLd: any[] = [
      organizationJsonLd(), siteJsonLd(),
      breadcrumbs([
        { name: "Home", url: `${BASE}/` },
        { name: tool.categoryLabel || tool.category, url: `${BASE}/${tool.category}` },
        { name: tool.title, url: `${BASE}${route}` },
      ]),
      {
        "@type": "SoftwareApplication",
        name: tool.title,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any (browser)",
        description,
        url: `${BASE}${route}`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ];
    if (tool.howToUse?.length) {
      jsonLd.push({
        "@type": "HowTo",
        name: `How to use ${tool.title}`,
        description,
        step: tool.howToUse.map((text, i) => ({ "@type": "HowToStep", position: i + 1, name: `Step ${i + 1}`, text })),
      });
    }
    // Cap FAQPage schema at 6. Google's structured-data policy requires the
    // schema questions to match visible answers; publishing 20 near-identical
    // generic Q&A is scaled-content shape. Better to emit only the top 6 that
    // are page-specific.
    if (tool.faqs?.length) {
      jsonLd.push({
        "@type": "FAQPage",
        mainEntity: tool.faqs.slice(0, 6).map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }

    const guide = guideForSlug(tool.slug);
    let intro = tool.explanation || description;
    if (guide) {
      intro = guide.overview;
      jsonLd.push({
        "@type": "TechArticle",
        headline: `${tool.title}: guide with worked examples`,
        description: guide.overview,
        author: { "@type": "Organization", name: "XFree.in team", url: `${BASE}/about` },
        publisher: { "@type": "Organization", name: "XFree.in", url: `${BASE}/` },
        datePublished: guide.lastReviewed,
        dateModified: guide.lastReviewed,
        mainEntityOfPage: `${BASE}${route}`,
      });
    }

    const toolLinks = `<p><a href="/${escapeHtml(tool.category)}">Browse ${escapeHtml(tool.categoryLabel || tool.category)}</a>${guide ? ` · <a href="/guides">Browse reviewed guides</a>` : ""}</p>`;
    writeRoute(route, injectMeta(template, { route, title, description, h1: tool.title, intro, jsonLd, guide }, toolLinks));
    count++;
  }

  // Generated pages are compiled from content/published only after their
  // source, engine, QA gates, and exact content-bound approval are rechecked.
  // Handwritten public tool pages win on slug collisions.
  const handwrittenToolSlugs = new Set(PUBLIC_TOOLS.map((tool) => tool.slug));
  for (const page of Object.values(GENERATED_PUBLISHED_CONTENT)) {
    if (handwrittenToolSlugs.has(page.slug)) continue;
    const route = `/tools/${page.slug}`;
    const bodyHtml = renderGeneratedArtifactHtml(page);
    writeRoute(route, injectMeta(template, {
      route,
      title: page.metadata.title,
      description: page.metadata.description,
      h1: page.metadata.h1,
      intro: page.content.directAnswer,
      jsonLd: [
        organizationJsonLd(),
        siteJsonLd(),
        breadcrumbs([
          { name: "Home", url: `${BASE}/` },
          { name: page.metadata.h1, url: `${BASE}${route}` },
        ]),
        page.jsonLd,
      ],
    }, bodyHtml));
    count++;
  }

  // Guides index
  writeRoute("/guides", injectMeta(template, {
    route: "/guides",
    title: "Guides — XFree.in",
    description: "Practical guides for developers and SEOs on regex, cron, JSON errors, canonical vs redirect, and more.",
    h1: "Guides",
    intro: "Short, practical guides for developers and SEOs. Each is a standalone reference with runnable examples.",
    jsonLd: [
      organizationJsonLd(),
      siteJsonLd(),
      breadcrumbs([{ name: "Home", url: `${BASE}/` }, { name: "Guides", url: `${BASE}/guides` }]),
      {
        "@type": "CollectionPage",
        name: "XFree Guides",
        url: `${BASE}/guides`,
        hasPart: GUIDES.map((g) => ({
          "@type": "TechArticle",
          headline: g.title,
          url: `${BASE}/guides/${g.slug}`,
          datePublished: g.lastReviewed,
        })),
      },
    ],
  }, renderGuideIndexLinks()));
  count++;

  // Each guide
  for (const g of GUIDES) {
    const route = `/guides/${g.slug}`;
    const bodyHtml = renderGuideBodyHtml(g);
    const html = injectMeta(template, {
      route,
      title: `${g.title} — XFree.in`,
      description: g.description,
      h1: g.title,
      intro: g.intro,
      jsonLd: [
        organizationJsonLd(),
        siteJsonLd(),
        breadcrumbs([
          { name: "Home", url: `${BASE}/` },
          { name: "Guides", url: `${BASE}/guides` },
          { name: g.title, url: `${BASE}${route}` },
        ]),
        {
          "@type": "TechArticle",
          headline: g.title,
          description: g.description,
          author: { "@type": "Organization", name: "XFree.in team", url: `${BASE}/about` },
          publisher: { "@id": `${BASE}/#organization` },
          datePublished: g.lastReviewed,
          dateModified: g.lastReviewed,
          mainEntityOfPage: `${BASE}${route}`,
          inLanguage: "en",
        },
      ],
    }, bodyHtml);
    writeRoute(route, html);
    count++;
  }

  // 404 page shell
  const notFound = injectMeta(template, {
    route: "/404",
    title: "404 — XFree.in",
    description: "The page you're looking for isn't published on XFree.in.",
    h1: "404 — Page not found",
    intro: "This URL doesn't map to an indexable tool or page. Try the homepage.",
    jsonLd: [],
    robots: "noindex,follow",
    canonical: null,
  });
  fs.writeFileSync(path.join(DIST, "404.html"), notFound, "utf-8");

  console.log(`[prerender] wrote ${count} routes + 404.html to dist/`);
}

main();
