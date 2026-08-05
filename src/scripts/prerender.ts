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
import { INDEXABLE_TOOLS, CATEGORIES } from "../data/toolsRegistry";
import { STATIC_ROUTES } from "../data/routes";
import { guideForSlug } from "../data/toolGuides";
import { GUIDES } from "../data/guides";

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

function injectMeta(template: string, meta: PageMeta, extraBodyHtml?: string): string {
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
    <div id="prerender-shell" hidden aria-hidden="true">
      <h1>${escapeHtml(meta.h1)}</h1>
      <p>${escapeHtml(meta.intro)}</p>
      ${guideHtml}
      ${extra}
    </div>
  `;

  // Function-form replacements avoid JS's $&/$`/$'/$n interpretation in the
  // replacement string, which would otherwise embed the entire template
  // prefix/suffix into the shell whenever guide/example text contains `$`.
  let out = template.replace(/<title>[^<]*<\/title>/i, () => "");
  out = out.replace(/<link rel="canonical"[^>]*>\n?/i, () => "");
  out = out.replace("</head>", () => `    ${headExtras}\n  </head>`);
  out = out.replace('<div id="root"></div>', () => `<div id="root"></div>${shell}`);
  return out;
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
    "@type": "WebSite",
    "@id": `${BASE}/#website`,
    name: "XFree",
    alternateName: ["XFree.in", "xfree.in"],
    url: `${BASE}/`,
    description: "Free browser-based developer, SEO, and single-purpose AI micro-tools.",
    inLanguage: "en",
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
    title: "XFree — Free Developer, SEO & AI Tools | XFree.in",
    description: "XFree is a free browser-based suite of developer utilities, technical SEO helpers, formatters, validators, converters, and single-purpose AI tools. No signup required.",
    h1: "XFree — Free Developer, SEO & AI Tools",
    intro: "XFree is a free browser-based platform for developer utilities, technical SEO tools, formatters, validators, converters, and focused AI micro-tools. Everything runs in your browser unless a tool explicitly proxies to Google Gemini — and that's disclosed on the tool itself.",
  },
  "/xfree-app": {
    title: "XFree App — Install the Free Browser-Based Developer & SEO Toolkit",
    description: "Install XFree as a Progressive Web App on desktop, Android, or iOS to use free developer, SEO, formatting, and AI tools without a browser tab.",
    h1: "XFree App",
    intro: "XFree is available as an installable Progressive Web App. Add it to your desktop dock or mobile home screen for one-tap access to every tool. Everything still runs in your browser — the PWA install is just a shortcut, not a separate binary.",
  },
  "/about": { title: "About XFree.in", description: "About the XFree.in micro-tools platform: mission, principles, and who it's built for.", h1: "About XFree.in", intro: "XFree.in is a small, focused micro-tool platform for developers, SEOs, and technical writers." },
  "/contact": { title: "Contact XFree.in", description: "Contact XFree.in for bug reports, tool requests, or partnership inquiries.", h1: "Contact us", intro: "Send us a note — we read every message." },
  "/privacy": { title: "Privacy Policy — XFree.in", description: "How XFree.in handles data: local tools stay local; AI tools securely proxy Google Gemini. What we log and what we don't.", h1: "Privacy Policy", intro: "Local tools run entirely in your browser. AI tools send input to our server and to Google Gemini. Details below." },
  "/terms": { title: "Terms of Service — XFree.in", description: "Terms of service for XFree.in micro-tools.", h1: "Terms of Service", intro: "Acceptable use and service limitations for XFree.in tools." },
  "/security": { title: "Security & Sandbox — XFree.in", description: "XFree.in security posture: CSP, rate limits, secret handling, and abuse controls on AI endpoints.", h1: "Security", intro: "How we harden the platform against abuse and protect your data." },
  "/faq": { title: "Frequently Asked Questions — XFree.in", description: "Common questions about XFree.in: pricing, privacy, AI, and how tools work.", h1: "FAQ", intro: "Answers to common questions about XFree.in." },
  "/how-it-works": { title: "How XFree.in Works", description: "How the XFree.in micro-tools platform works: local execution vs AI proxy, and where your data goes.", h1: "How XFree.in works", intro: "Local tools process data in your browser. AI tools proxy through our rate-limited server to Google Gemini." },
  "/use-cases": { title: "Use Cases — XFree.in", description: "Real-world workflows powered by XFree.in developer and SEO micro-tools.", h1: "Use cases", intro: "Where teams use XFree.in in their day-to-day work." },
  "/docs": { title: "Documentation — XFree.in", description: "Documentation for XFree.in tools and APIs.", h1: "Documentation", intro: "Guides for using XFree.in tools effectively." },
  "/blog": { title: "Blog — XFree.in", description: "Articles and updates from the XFree.in team.", h1: "Blog", intro: "Articles from the XFree.in team." },
  "/clusters": { title: "Keyword Clusters — XFree.in", description: "Programmatic SEO keyword cluster directory mapping search intent to XFree.in tools.", h1: "Keyword cluster directory", intro: "Browse search-intent clusters mapped to XFree.in tools." },
  "/thinking": { title: "Deep Reasoning Mode — XFree.in", description: "Deep step-by-step analytical reasoning powered by Google Gemini.", h1: "Deep reasoning mode", intro: "For hard problems: complex SQL, regex, and architecture questions." },
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

  for (const cat of CATEGORIES) {
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

  for (const tool of INDEXABLE_TOOLS) {
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
