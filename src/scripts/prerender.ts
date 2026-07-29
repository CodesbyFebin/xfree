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

const DIST = path.join(process.cwd(), "dist");
const BASE = (process.env.PUBLIC_SITE_URL || "https://xfree.in").replace(/\/$/, "");

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
}

function injectMeta(template: string, meta: PageMeta): string {
  const canonical = `${BASE}${meta.route === "/" ? "/" : meta.route}`;
  const headExtras = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="XFree.in" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": meta.jsonLd })}</script>`,
  ].join("\n    ");

  const shell = `
    <noscript>
      <h1>${escapeHtml(meta.h1)}</h1>
      <p>${escapeHtml(meta.intro)}</p>
    </noscript>
    <div id="prerender-shell" hidden aria-hidden="true">
      <h1>${escapeHtml(meta.h1)}</h1>
      <p>${escapeHtml(meta.intro)}</p>
    </div>
  `;

  let out = template.replace(/<title>[^<]*<\/title>/i, "");
  out = out.replace(/<link rel="canonical"[^>]*>\n?/i, "");
  out = out.replace("</head>", `    ${headExtras}\n  </head>`);
  out = out.replace('<div id="root"></div>', `<div id="root"></div>${shell}`);
  return out;
}

function writeRoute(route: string, html: string) {
  const routePath = route === "/" ? "" : route.replace(/^\//, "");
  const dir = path.join(DIST, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

function siteJsonLd() {
  return {
    "@type": "WebSite",
    name: "XFree.in",
    url: `${BASE}/`,
    description: "Free browser-based developer, SEO, and single-purpose AI micro-tools.",
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
    title: "XFree.in — Free Developer, SEO & AI Micro-Tools",
    description: "Free browser-based developer utilities, technical SEO helpers, and single-purpose AI assistants. No signup, no tracking.",
    h1: "Free developer, SEO & AI micro-tools",
    intro: "A curated set of production-grade utilities: JSON/regex/JWT/cron/sitemap/meta-tag/schema tools that run in your browser, plus AI helpers that securely proxy Google Gemini.",
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
    const jsonLd: any[] = [siteJsonLd()];
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
        siteJsonLd(),
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
      siteJsonLd(),
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
    if (tool.faqs?.length) {
      jsonLd.push({
        "@type": "FAQPage",
        mainEntity: tool.faqs.slice(0, 8).map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }
    writeRoute(route, injectMeta(template, { route, title, description, h1: tool.title, intro: tool.explanation || description, jsonLd }));
    count++;
  }

  // 404 page shell
  const notFound = injectMeta(template, {
    route: "/404",
    title: "404 — XFree.in",
    description: "The page you're looking for isn't published on XFree.in.",
    h1: "404 — Page not found",
    intro: "This URL doesn't map to an indexable tool or page. Try the homepage.",
    jsonLd: [siteJsonLd()],
  });
  fs.writeFileSync(path.join(DIST, "404.html"), notFound, "utf-8");

  console.log(`[prerender] wrote ${count} routes + 404.html to dist/`);
}

main();
