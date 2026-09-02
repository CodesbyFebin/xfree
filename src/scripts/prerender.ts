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

const DIST = path.join(process.cwd(), "dist");
const BASE = (process.env.PUBLIC_SITE_URL || "https://www.xfree.in").replace(/\/$/, "");

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

function injectMeta(template: string, meta: PageMeta, extraBodyHtml?: string, prerenderRootHtml?: string): string {
  const canonical = `${BASE}${meta.route === "/" ? "/" : meta.route}`;
  const headExtras = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="XFree" />`,
    `<meta property="og:image" content="${BASE}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="XFree logo" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${BASE}/og-image.png" />`,
    // AdSense meta + script are in index.html (template) so prerender does NOT
    // re-inject them here — that would produce duplicate meta tags per route.
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": meta.jsonLd })}</script>`,
  ].join("\n    ");

  const guideHtml = meta.guide ? renderGuideHtml(meta.guide, meta.h1) : "";
  const extra = extraBodyHtml || "";
  const shell = `
    <noscript>
      <h1>${escapeHtml(meta.h1)}</h1>
      <p>${escapeHtml(meta.intro)}</p>
      ${guideHtml}
      ${extra}
    </noscript>
  `;

  // Function-form replacements avoid JS's $&/$`/$'/$n interpretation in the
  // replacement string, which would otherwise embed the entire template
  // prefix/suffix into the shell whenever guide/example text contains `$`.
  let out = template.replace(/<title>[^<]*<\/title>/i, () => "");
  out = out.replace(/<link rel="canonical"[^>]*>\n?/i, () => "");
  out = out.replace("</head>", () => `    ${headExtras}\n  </head>`);
  out = out.replace('<div id="root"></div>', () => `<div id="root">${prerenderRootHtml || ""}</div>${shell}`);
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
  return `<article><header><h1>${escapeHtml(page.metadata.h1)}</h1><p><a href="${escapeHtml(page.studioDeepLink)}">Open in XFree Studio</a></p></header><section aria-labelledby="direct-answer"><h2 id="direct-answer">What is the ${escapeHtml(page.metadata.h1)} and how does it work?</h2><p>${escapeHtml(page.content.directAnswer)}</p></section><section aria-labelledby="technical-details"><h2 id="technical-details">Technical architecture and local processing</h2><p>${escapeHtml(page.content.technicalDetails)}</p></section><section aria-labelledby="instructions"><h2 id="instructions">Step-by-step usage guide</h2><p>${escapeHtml(page.content.instructions)}</p></section><section><h2>Worked examples</h2>${examples}</section><aside><h2>Verified specifications</h2><p>Processing: ${escapeHtml(page.processing.mode)}</p><ul>${limitations}</ul></aside><section aria-labelledby="troubleshooting"><h2 id="troubleshooting">Technical troubleshooting and edge cases</h2>${faqs}</section></article>`;
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
    title: `XFree — ${PUBLIC_TOOLS.length} Free Developer, SEO & AI Tools`,
    description: `Explore ${PUBLIC_TOOLS.length} published developer, technical SEO, formatter, converter, and focused AI tools. Local Mode is the default and no signup is required.`,
    h1: "XFree — Free Developer, SEO & AI Tools",
    intro: `XFree currently publishes ${PUBLIC_TOOLS.length} working developer, technical SEO, formatter, converter, and focused AI tools. Local Mode is the default; tools that use cloud providers disclose that before submission.`,
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
  "/terms": { title: "Terms of Service — XFree.in", description: "Terms of service for XFree.in micro-tools.", h1: "Terms of Service", intro: "Acceptable use and service limitations for XFree.in tools." },
  "/security": { title: "Security & Sandbox — XFree.in", description: "XFree.in security posture: CSP, rate limits, secret handling, and abuse controls on AI endpoints.", h1: "Security", intro: "How we harden the platform against abuse and protect your data." },
  "/faq": { title: "FAQ & Guidance — Local and Cloud Tools | XFree.in", description: "Answers about XFree Local Mode, optional cloud processing, browser limits, sensitive data, accounts, tool verification, and production use.", h1: "FAQ & Guidance", intro: "Understand which tools run locally, when optional cloud processing sends submitted content to a named provider, how browser limits affect large input, and why generated output still requires production review." },
  "/how-it-works": { title: "How XFree Works — Browser Tools and Optional Cloud Mode", description: "Follow XFree processing from a published tool page through browser JavaScript or Web Workers to result review, export, and optional cloud handoff.", h1: "How XFree.in works", intro: "XFree exposes only published, indexable tools. Local operations use the browser implementation declared on each tool page; optional cloud features require an explicit choice and disclose the provider before submitted content leaves the browser." },
  "/use-cases": { title: "Developer and SEO Tool Use Cases & Examples | XFree.in", description: "Practical XFree workflows for technical SEO, API payload inspection, regex testing, scheduled jobs, metadata previews, and content comparison.", h1: "Use cases & examples", intro: "Explore practical workflows built from currently published tools: prepare crawl data, validate API payloads, test JavaScript regex patterns, plan cron schedules, compare text revisions, and preview metadata before publishing." },
  "/docs": { title: "XFree Documentation Hub — Inputs, Examples and Limits", description: "Find verified XFree tool references, input and output behavior, worked examples, processing disclosures, limitations, and reviewed technical guides.", h1: "Documentation Hub", intro: "Documentation follows the behavior of published implementations. Draft engines stay excluded, processing language is scoped per tool, and examples describe limitations instead of promising universal standards compliance." },
  "/blog": { title: "XFree Blog & Pillar Guides — Reviewed Technical Content", description: "Read XFree technical guides and progressively published pillar content with permanent URLs, unique metadata, real examples, and working tool links.", h1: "Blog & Pillar Guides", intro: "Current editorial content consists of reviewed guides with permanent routes. Planned pillar and cluster pages remain private until their utility, examples, metadata, and internal links are complete." },
};

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
    writeRoute(route, injectMeta(template, { route, ...m, jsonLd }));
    count++;
  }

  for (const cat of PUBLIC_CATEGORIES) {
    const route = `/category/${cat.id}`;
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
    }));
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
        { name: tool.categoryLabel || tool.category, url: `${BASE}/category/${tool.category}` },
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

    writeRoute(route, injectMeta(template, { route, title, description, h1: tool.title, intro, jsonLd, guide }));
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
    }, undefined, bodyHtml));
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
  }));
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
    jsonLd: [organizationJsonLd(), siteJsonLd()],
  });
  fs.writeFileSync(path.join(DIST, "404.html"), notFound, "utf-8");

  console.log(`[prerender] wrote ${count} routes + 404.html to dist/`);
}

main();
