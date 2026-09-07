import { PUBLIC_TOOLS, PUBLIC_CATEGORIES } from "../data/publicTools";
import { GUIDES } from "../data/guides";
import { GENERATED_PUBLISHED_CONTENT } from "../data/generatedPublishedContent";
import { CANONICAL_ORIGIN, SITE_CONTENT_LASTMOD } from "../data/siteConfig";
import { PILLARS_60 } from "../data/pillarRegistry";
import { INDEXABLE_TOOLS } from "../data/toolsRegistry";
import { STATIC_ROUTES } from "../data/routes";

const DEFAULT_BASE_URL = CANONICAL_ORIGIN;

export type SitemapEntry = {
  path: string;
  lastmod: string;
};

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanOrigin(baseUrl: string): string {
  // Canonical artifacts should never inherit request/preview hosts. Accept an
  // explicit generator override only when it is already HTTPS + www.xfree.in.
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol === "https:" && parsed.hostname === "www.xfree.in") {
      return parsed.origin;
    }
  } catch {
    // fall through to the fixed production origin
  }
  return DEFAULT_BASE_URL;
}

function normalizeDate(value?: string): string {
  if (!value) return SITE_CONTENT_LASTMOD;
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : SITE_CONTENT_LASTMOD;
}

function toRfc822(value: string): string {
  const date = new Date(`${normalizeDate(value)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime())
    ? new Date(`${SITE_CONTENT_LASTMOD}T00:00:00.000Z`).toUTCString()
    : date.toUTCString();
}

function maxLastmod(entries: SitemapEntry[]): string {
  if (!entries.length) return SITE_CONTENT_LASTMOD;
  return entries.reduce((latest, entry) => entry.lastmod > latest ? entry.lastmod : latest, entries[0].lastmod);
}

// Driven directly from STATIC_ROUTES (the same list the client router and
// prerender.ts use) instead of a hand-maintained copy — a hand-maintained
// copy had drifted to include three routes with no Route case anywhere
// (/contribute, /instaserver, /json-tools) and was still submitting them to
// search engines via sitemap.xml.
const STATIC_PAGE_ENTRIES: SitemapEntry[] = STATIC_ROUTES.map((path) => ({
  path,
  lastmod: SITE_CONTENT_LASTMOD,
}));

export function getPageSitemapEntries(): SitemapEntry[] {
  return [
    ...STATIC_PAGE_ENTRIES,
    ...PUBLIC_CATEGORIES.map((category) => ({
      path: `/${category.id}`,
      lastmod: SITE_CONTENT_LASTMOD,
    })),
    // Was gated on pillar.indexable/contentApproved, both undefined on every
    // entry in PILLARS_60 — this silently excluded all 60 pillars from the
    // sitemap even though every one of them is linked from the header nav
    // and (as of the prerender.ts fix) has a real prerendered page. Also
    // fixed the path: this used "/pillar/:slug" (singular), but the actual
    // client router (src/App.tsx's getRouteFromPath) only recognizes
    // "/pillars/:slug" (plural) — the sitemap was pointing at URLs the app
    // itself would 404 on.
    ...PILLARS_60.map((pillar) => ({
      path: `/pillars/${pillar.slug}`,
      lastmod: pillar.lastReviewed || SITE_CONTENT_LASTMOD,
    })),
  ];
}

export function getToolSitemapEntries(): SitemapEntry[] {
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const tool of PUBLIC_TOOLS) {
    if (!tool.slug || seen.has(tool.slug)) continue;
    seen.add(tool.slug);
    entries.push({
      path: `/tools/${tool.slug}`,
      lastmod: normalizeDate(tool.lastModified),
    });
  }

  for (const artifact of Object.values(GENERATED_PUBLISHED_CONTENT)) {
    const a = artifact as Record<string, unknown>;
    if (!a.slug || typeof a.slug !== "string" || seen.has(a.slug)) continue;
    seen.add(a.slug);
    const approval = (a.approval || {}) as Record<string, unknown>;
    const reviewedAt = typeof approval.reviewedAt === "string" ? approval.reviewedAt : SITE_CONTENT_LASTMOD;
    entries.push({
      path: `/tools/${a.slug}`,
      lastmod: normalizeDate(reviewedAt),
    });
  }

  return entries;
}

export function getGuideSitemapEntries(): SitemapEntry[] {
  return [
    { path: "/guides", lastmod: SITE_CONTENT_LASTMOD },
    ...GUIDES.map((guide) => ({
      path: `/guides/${guide.slug}`,
      lastmod: normalizeDate(guide.lastReviewed),
    })),
  ];
}

function renderUrlset(entries: SitemapEntry[], baseUrl: string): string {
  const cleanBase = cleanOrigin(baseUrl);
  const unique = new Map(entries.map((entry) => [entry.path, entry]));
  const rows = Array.from(unique.values())
    .map((entry) => `  <url>\n    <loc>${escapeXml(`${cleanBase}${entry.path === "/" ? "/" : entry.path}`)}</loc>\n    <lastmod>${escapeXml(normalizeDate(entry.lastmod))}</lastmod>\n  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>`;
}

/** Full compatibility sitemap containing every canonical indexable URL. */
export function generateSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string {
  return renderUrlset([
    ...getPageSitemapEntries(),
    ...getToolSitemapEntries(),
    ...getGuideSitemapEntries(),
  ], baseUrl);
}

export function generatePagesSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string {
  return renderUrlset(getPageSitemapEntries(), baseUrl);
}

export function generateToolsSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string {
  return renderUrlset(getToolSitemapEntries(), baseUrl);
}

export function generateGuidesSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string {
  return renderUrlset(getGuideSitemapEntries(), baseUrl);
}

export function generateSitemapIndexXml(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  const groups = [
    { path: "/sitemap-pages.xml", lastmod: maxLastmod(getPageSitemapEntries()) },
    { path: "/sitemap-tools.xml", lastmod: maxLastmod(getToolSitemapEntries()) },
    { path: "/sitemap-guides.xml", lastmod: maxLastmod(getGuideSitemapEntries()) },
  ];

  const rows = groups.map((group) => `  <sitemap>\n    <loc>${escapeXml(`${cleanBase}${group.path}`)}</loc>\n    <lastmod>${escapeXml(group.lastmod)}</lastmod>\n  </sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>`;
}

/** RSS is a discovery/feed surface, not a sitemap. Dates come from content. */
export function generateRssXml(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  const tools = getToolSitemapEntries();
  const buildDate = toRfc822(maxLastmod(tools));

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>XFree.in — Free Developer, SEO &amp; AI Micro-Tools</title>\n`;
  rss += `    <link>${escapeXml(`${cleanBase}/`)}</link>\n`;
  rss += `    <description>Published browser-based developer, SEO, AI, and converter micro-tools with clear processing disclosures.</description>\n`;
  rss += `    <language>en-us</language>\n`;
  rss += `    <lastBuildDate>${buildDate}</lastBuildDate>\n`;
  rss += `    <atom:link href="${escapeXml(`${cleanBase}/rss.xml`)}" rel="self" type="application/rss+xml"/>\n`;

  const toolDate = new Map(tools.map((entry) => [entry.path.replace("/tools/", ""), entry.lastmod]));
  for (const tool of PUBLIC_TOOLS) {
    const toolUrl = `${cleanBase}/tools/${tool.slug}`;
    const categoryName = tool.categoryLabel || tool.category;
    rss += `    <item>\n`;
    rss += `      <title>${escapeXml(tool.title)}</title>\n`;
    rss += `      <link>${escapeXml(toolUrl)}</link>\n`;
    rss += `      <guid isPermaLink="true">${escapeXml(toolUrl)}</guid>\n`;
    rss += `      <pubDate>${toRfc822(toolDate.get(tool.slug) || SITE_CONTENT_LASTMOD)}</pubDate>\n`;
    rss += `      <category>${escapeXml(categoryName)}</category>\n`;
    rss += `      <description>${escapeXml(tool.shortDescription)}</description>\n`;
    rss += `      <content:encoded><![CDATA[<h3>${escapeXml(tool.title)}</h3><p>${escapeXml(tool.explanation)}</p>]]></content:encoded>\n`;
    rss += `    </item>\n`;
  }

  rss += `  </channel>\n</rss>`;
  return rss;
}

export function generateLlmsTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  let text = `# XFree.in — Free Developer, SEO & AI Micro-Tools\n\n`;
  text += `> XFree.in publishes focused browser-based developer utilities, technical SEO tools, formatters, converters, and clearly disclosed AI assistants.\n\n`;
  text += `## Meta\n`;
  text += `- Version: 1.0.0\n`;
  text += `- Last Updated: ${new Date().toISOString().split("T")[0]}\n`;
  text += `- Capability Schema: ${cleanBase}/capabilities.json\n`;
  text += `- Full Corpus: ${cleanBase}/llms-full.txt\n\n`;
  text += `## Primary Sections\n\n`;
  text += `- [Home](${cleanBase}/): Search and browse the published tool directory.\n`;
  text += `- [Guides](${cleanBase}/guides): Reviewed documentation connected to published tools.\n`;
  text += `- [How It Works](${cleanBase}/how-it-works): Processing modes, browser execution, and optional cloud handoffs.\n`;
  text += `- [Pillars](${cleanBase}/pillars): ${PILLARS_60.length} developer and SEO topic pillars.\n`;
  text += `- [Use Cases](${cleanBase}/use-cases): Real-world workflows built from published tools.\n`;
  text += `- [FAQ](${cleanBase}/faq): Common questions about pricing, privacy, and AI features.\n`;
  text += `- [About](${cleanBase}/about): What XFree is and the principles it's built on.\n\n`;

  text += `## Categories\n\n`;
  for (const cat of PUBLIC_CATEGORIES) {
    text += `- [${cat.label}](${cleanBase}/${cat.id}): ${cat.description}\n`;
  }

  text += `\n## Published Pillars\n\n`;
  for (const pillar of PILLARS_60) {
    text += `- [${pillar.name}](${cleanBase}/pillars/${pillar.slug}): ${pillar.description}\n`;
  }

  text += `\n## Published Tools\n\n`;
  for (const tool of PUBLIC_TOOLS) {
    text += `- [${tool.title}](${cleanBase}/tools/${tool.slug}): ${tool.shortDescription}\n`;
  }
  return text;
}

export function generateLlmsFullTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  let text = `# XFree.in Full Published Tool Reference\n\n`;
  text += `This file documents only tools in the public published/indexable registry. Draft and planned tools are intentionally excluded.\n\n`;

  for (const tool of PUBLIC_TOOLS) {
    text += `---\n\n### ${tool.title}\n`;
    text += `- **URL**: ${cleanBase}/tools/${tool.slug}\n`;
    text += `- **Category**: ${tool.categoryLabel || tool.category}\n`;
    text += `- **Description**: ${tool.shortDescription}\n`;
    text += `- **Processing**: ${tool.privacyNotice || (tool.isAi ? "Cloud processing is disclosed before submission." : "Runs locally in the browser.")}\n`;
    text += `- **Explanation**: ${tool.explanation}\n`;
    if (tool.howToUse?.length) {
      text += `- **How to use**:\n`;
      tool.howToUse.forEach((step, index) => { text += `  ${index + 1}. ${step}\n`; });
    }
    if (tool.faqs?.length) {
      text += `- **Top FAQs**:\n`;
      for (const faq of tool.faqs.slice(0, 3)) {
        text += `  - **Q: ${faq.question}**\n    A: ${faq.answer}\n`;
      }
    }
    text += `\n`;
  }
  return text;
}

export function generateRobotsTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  return `# XFree.in crawl policy
# 10/10 standard for Search, Answer, and Generative Engine Optimization

User-agent: *
Allow: /
Allow: /blog/
Allow: /docs/
Disallow: /api/
Disallow: /_app-shell
Crawl-delay: 1

# Search and answer-engine crawlers
User-agent: Googlebot
Allow: /
Allow: /blog/
Allow: /docs/
Disallow: /api/
Disallow: /_app-shell
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Allow: /blog/
Allow: /docs/
Disallow: /api/
Disallow: /_app-shell
Crawl-delay: 0

User-agent: OAI-SearchBot
Allow: /
Allow: /blog/
Allow: /docs/
Disallow: /api/
Disallow: /_app-shell
Crawl-delay: 0

User-agent: ChatGPT-User
Allow: /
Allow: /blog/
Allow: /docs/
Disallow: /api/
Disallow: /_app-shell
Crawl-delay: 0

User-agent: PerplexityBot
Allow: /
Allow: /blog/
Allow: /docs/
Disallow: /api/
Disallow: /_app-shell
Crawl-delay: 0

# Canonical discovery entry point
Sitemap: ${cleanBase}/sitemap-index.xml
`;
}

// PUBLIC_TOOLS still carries the legacy per-tool category ids (seo-tools,
// developer-tools, ...); PUBLIC_CATEGORIES (= PILLAR_CATEGORIES) uses the
// newer pillar-category ids (web-seo, dev-data, ...). Same mapping as
// prerender.ts's category-hub breadcrumb fix — keep in sync if either changes.
const TOOL_CATEGORY_TO_PILLAR_CATEGORY: Record<string, string> = {
  "seo-tools": "web-seo",
  "developer-tools": "dev-data",
  "security-tools": "security",
  "converters": "dev-data",
  "generators": "dev-data",
  "ai-tools": "ai-auto",
  "media-docs": "media-docs",
  "business-tools": "business",
};

export function generateAiTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  const categoryLines = PUBLIC_CATEGORIES.map((cat) => {
    const count = PUBLIC_TOOLS.filter(
      (t) => (TOOL_CATEGORY_TO_PILLAR_CATEGORY[t.category] || t.category) === cat.id
    ).length;
    return `- ${cat.label}: ${count} tool${count === 1 ? "" : "s"} — ${cleanBase}/${cat.id}`;
  }).join("\n");

  return `# ai.txt — machine-readable guidance for AI agents and crawlers
# XFree.in — Free Developer, SEO & AI Micro-Tools
# Generated from live source data. Last updated: ${SITE_CONTENT_LASTMOD}

## What this site is
XFree.in publishes ${PUBLIC_TOOLS.length} browser-based developer, SEO, and AI micro-tools,
organized across ${PUBLIC_CATEGORIES.length} categories and ${PILLARS_60.length} topic pillars.
Most tools run entirely client-side in the browser; tools that call a cloud model
disclose this before you submit input. No tool requires an account.

## Source of truth
- Canonical origin: ${cleanBase}
- Source code (MIT licensed): https://github.com/CodesbyFebin/xfree
- Machine-readable index: ${cleanBase}/llms.txt (short) and ${cleanBase}/llms-full.txt (full)
- Sitemap index: ${cleanBase}/sitemap-index.xml
- Structured tool data: ${cleanBase}/tools.json and ${cleanBase}/capabilities.json

## Categories
${categoryLines}

## Permitted use
- Indexing, summarizing, and linking to any published page is welcome.
- Quoting tool descriptions, FAQs, and how-to steps with attribution is welcome.
- Do not present XFree tool output as your own without disclosing the source when asked.
- Do not scrape and republish this catalog as a competing directory without attribution.

## Restrictions
- Do not submit user-identifying or third-party personal data through XFree's tools on
  a person's behalf without their knowledge — several tools process input via a cloud
  API and this site cannot control what a caller submits.
- Automated high-volume scraping should use the sitemap and JSON endpoints above rather
  than repeated full-page crawls.

## Contact
- General / partnership inquiries: contact@xfree.in
- Security reports: security@xfree.in (see ${cleanBase}/.well-known/security.txt)
`;
}

export function generateSecurityTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  const expires = `${new Date().getUTCFullYear() + 1}-12-31T23:59:59.000Z`;
  return `Contact: mailto:security@xfree.in
Contact: https://github.com/CodesbyFebin/xfree/security/advisories/new
Expires: ${expires}
Preferred-Languages: en
Canonical: ${cleanBase}/.well-known/security.txt
`;
}

export function generateHumansTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  return `/* TEAM */
Site: XFree.in
Contact: contact@xfree.in
GitHub: https://github.com/CodesbyFebin/xfree

/* SITE */
Last update: ${SITE_CONTENT_LASTMOD}
Standards: HTML5, JSON-LD (schema.org)
Components: Vite, React, TypeScript, Express
License: MIT

/* CATALOG */
Published tools: ${PUBLIC_TOOLS.length}
Topic pillars: ${PILLARS_60.length}
Canonical origin: ${cleanBase}
`;
}

export function generateJsonFeed(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  const tools = getToolSitemapEntries();
  const toolDate = new Map(tools.map((entry) => [entry.path.replace("/tools/", ""), entry.lastmod]));

  const items = PUBLIC_TOOLS.map((tool) => {
    const toolUrl = `${cleanBase}/tools/${tool.slug}`;
    return {
      id: toolUrl,
      url: toolUrl,
      title: tool.title,
      summary: tool.shortDescription,
      content_text: tool.explanation || tool.shortDescription,
      date_published: `${normalizeDate(toolDate.get(tool.slug))}T00:00:00.000Z`,
      tags: [tool.categoryLabel || tool.category],
    };
  });

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "XFree.in — Free Developer, SEO & AI Micro-Tools",
    home_page_url: `${cleanBase}/`,
    feed_url: `${cleanBase}/feed.json`,
    description: "Published browser-based developer, SEO, AI, and converter micro-tools with clear processing disclosures.",
    language: "en-US",
    items,
  };
  return JSON.stringify(feed, null, 2);
}
