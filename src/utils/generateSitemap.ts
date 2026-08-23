import { PUBLIC_TOOLS, PUBLIC_CATEGORIES } from "../data/publicTools";
import { GUIDES } from "../data/guides";
import { WORKFLOW_RECIPES } from "../data/recipes";
import { GENERATED_PUBLISHED_CONTENT } from "../data/generatedPublishedContent";
import { CANONICAL_ORIGIN, SITE_CONTENT_LASTMOD } from "../data/siteConfig";
import { INDEXABLE_PILLARS } from "../data/pillarPublishing";
import { ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";

const DEFAULT_BASE_URL = CANONICAL_ORIGIN;

export type SitemapEntry = {
  path: string;
  lastmod: string;
};

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function cleanOrigin(baseUrl: string): string {
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol === "https:" && parsed.hostname === "www.xfree.in") return parsed.origin;
  } catch {
    // fall through to fixed origin
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
  return Number.isNaN(date.getTime()) ? new Date(`${SITE_CONTENT_LASTMOD}T00:00:00.000Z`).toUTCString() : date.toUTCString();
}

function maxLastmod(entries: SitemapEntry[]): string {
  if (!entries.length) return SITE_CONTENT_LASTMOD;
  return entries.reduce((latest, entry) => entry.lastmod > latest ? entry.lastmod : latest, entries[0].lastmod);
}

const STATIC_PAGE_ENTRIES: SitemapEntry[] = [
  { path: "/", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/how-it-works", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/use-cases", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/docs", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/blog", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/faq", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/about", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/contact", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/privacy", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/terms", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/security", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/xfree-app", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/recipes", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/pillars", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/contribute", lastmod: SITE_CONTENT_LASTMOD },
];

export function getRecipeSitemapEntries(): SitemapEntry[] {
  return WORKFLOW_RECIPES.map((recipe) => ({ path: `/recipes/${recipe.slug}`, lastmod: SITE_CONTENT_LASTMOD }));
}

export function getPageSitemapEntries(): SitemapEntry[] {
  return [
    ...STATIC_PAGE_ENTRIES,
    ...getRecipeSitemapEntries(),
    ...PUBLIC_CATEGORIES.map((category) => ({ path: `/category/${category.id}`, lastmod: SITE_CONTENT_LASTMOD })),
    ...INDEXABLE_PILLARS.map((pillar) => ({ path: `/pillar/${pillar.slug}`, lastmod: SITE_CONTENT_LASTMOD })),
  ];
}

export function getToolSitemapEntries(): SitemapEntry[] {
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];
  for (const tool of PUBLIC_TOOLS) {
    if (!tool.slug || seen.has(tool.slug)) continue;
    seen.add(tool.slug);
    entries.push({ path: `/tools/${tool.slug}`, lastmod: normalizeDate(tool.lastModified) });
  }
  for (const artifact of Object.values(GENERATED_PUBLISHED_CONTENT)) {
    if (!artifact.slug || seen.has(artifact.slug)) continue;
    seen.add(artifact.slug);
    entries.push({ path: `/tools/${artifact.slug}`, lastmod: normalizeDate(artifact.approval.reviewedAt) });
  }
  return entries;
}

export function getGuideSitemapEntries(): SitemapEntry[] {
  return [{ path: "/guides", lastmod: SITE_CONTENT_LASTMOD }, ...GUIDES.map((guide) => ({ path: `/guides/${guide.slug}`, lastmod: normalizeDate(guide.lastReviewed) }))];
}

function renderUrlset(entries: SitemapEntry[], baseUrl: string): string {
  const cleanBase = cleanOrigin(baseUrl);
  const unique = new Map(entries.map((entry) => [entry.path, entry]));
  const rows = Array.from(unique.values()).map((entry) => `  <url>\n    <loc>${escapeXml(`${cleanBase}${entry.path === "/" ? "/" : entry.path}`)}</loc>\n    <lastmod>${escapeXml(normalizeDate(entry.lastmod))}</lastmod>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>`;
}

export function generateSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string {
  return renderUrlset([...getPageSitemapEntries(), ...getToolSitemapEntries(), ...getGuideSitemapEntries()], baseUrl);
}
export function generatePagesSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string { return renderUrlset(getPageSitemapEntries(), baseUrl); }
export function generateToolsSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string { return renderUrlset(getToolSitemapEntries(), baseUrl); }
export function generateGuidesSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string { return renderUrlset(getGuideSitemapEntries(), baseUrl); }

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

export function generateRssXml(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  const tools = getToolSitemapEntries();
  const buildDate = toRfc822(maxLastmod(tools));
  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n  <channel>\n`;
  rss += `    <title>XFree.in — Free Developer, SEO &amp; AI Micro-Tools</title>\n    <link>${escapeXml(`${cleanBase}/`)}</link>\n    <description>Published browser-based developer, SEO, AI, and converter micro-tools with clear processing disclosures.</description>\n    <language>en-us</language>\n    <lastBuildDate>${buildDate}</lastBuildDate>\n    <atom:link href="${escapeXml(`${cleanBase}/rss.xml`)}" rel="self" type="application/rss+xml"/>\n`;
  const toolDate = new Map(tools.map((entry) => [entry.path.replace("/tools/", ""), entry.lastmod]));
  for (const tool of PUBLIC_TOOLS) {
    const toolUrl = `${cleanBase}/tools/${tool.slug}`;
    rss += `    <item>\n      <title>${escapeXml(tool.title)}</title>\n      <link>${escapeXml(toolUrl)}</link>\n      <guid isPermaLink="true">${escapeXml(toolUrl)}</guid>\n      <pubDate>${toRfc822(toolDate.get(tool.slug) || SITE_CONTENT_LASTMOD)}</pubDate>\n      <category>${escapeXml(tool.categoryLabel || tool.category)}</category>\n      <description>${escapeXml(tool.shortDescription)}</description>\n      <content:encoded><![CDATA[<h3>${escapeXml(tool.title)}</h3><p>${escapeXml(tool.explanation)}</p>]]></content:encoded>\n    </item>\n`;
  }
  rss += `  </channel>\n</rss>`;
  return rss;
}

export function generateLlmsTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  let text = `# XFree.in — Free Developer, SEO & AI Micro-Tools\n\n`;
  text += `> XFree.in publishes focused browser developer utilities, technical SEO tools, formatters, converters, inspectable local workflow recipes, and clearly disclosed optional AI assistants.\n\n`;
  text += `## Primary Sections\n\n`;
  text += `- [Home](${cleanBase}/): Search and browse the published tool directory.\n`;
  text += `- [Recipes](${cleanBase}/recipes): ${WORKFLOW_RECIPES.length} versioned local browser workflow recipes with inspectable allowlisted steps.\n`;
  text += `- [Guides](${cleanBase}/guides): Reviewed documentation connected to published tools.\n`;
  text += `- [How It Works](${cleanBase}/how-it-works): Processing modes, browser execution, deterministic recipes, and optional cloud handoffs.\n`;
  text += `- [Pillars](${cleanBase}/pillars): 50 developer and SEO topic pillars; only pillars backed by published tools enter the sitemap.\n`;
  text += `- [Roadmap](${cleanBase}/roadmap): ${ROADMAP_CONCEPT_COUNT.toLocaleString()} planned concepts on a noindex discovery page; this is not a count of live tools.\n`;
  text += `- [Contribute](${cleanBase}/contribute): Open-source contribution workflow, publication gates, and safe good-first-issue process.\n`;
  text += `- [OpenAPI](${cleanBase}/openapi.json): Machine-readable description of the public XFree API surface.\n\n`;
  text += `## Workflow Recipes\n\n`;
  for (const recipe of WORKFLOW_RECIPES) text += `- [${recipe.title}](${cleanBase}/recipes/${recipe.slug}): ${recipe.shortDescription}\n`;
  text += `\n## Categories\n\n`;
  for (const cat of PUBLIC_CATEGORIES) text += `- [${cat.label}](${cleanBase}/category/${cat.id}): ${cat.description}\n`;
  text += `\n## Published Pillars\n\n`;
  for (const pillar of INDEXABLE_PILLARS) text += `- [${pillar.name}](${cleanBase}/pillar/${pillar.slug}): ${pillar.description}\n`;
  text += `\n## Published Tools\n\n`;
  for (const tool of PUBLIC_TOOLS) text += `- [${tool.title}](${cleanBase}/tools/${tool.slug}): ${tool.shortDescription}\n`;
  return text;
}

export function generateLlmsFullTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  let text = `# XFree.in Full Published Tool and Recipe Reference\n\n`;
  text += `This file documents public published/indexable tools and versioned workflow recipes. Draft and planned tool concepts are intentionally excluded.\n\n`;
  text += `## Versioned workflow recipes\n\n`;
  for (const recipe of WORKFLOW_RECIPES) {
    text += `---\n\n### ${recipe.title}\n- **URL**: ${cleanBase}/recipes/${recipe.slug}\n- **Version**: ${recipe.version}\n- **Processing**: Local\n- **LLM required**: No\n- **Description**: ${recipe.shortDescription}\n- **Steps**:\n`;
    recipe.steps.forEach((step, index) => { text += `  ${index + 1}. ${step.label} (${step.kind === "engine" ? `engine:${step.engineId}` : `transform:${step.transformId}`})\n`; });
    text += `\n`;
  }
  text += `## Published tools\n\n`;
  for (const tool of PUBLIC_TOOLS) {
    text += `---\n\n### ${tool.title}\n- **URL**: ${cleanBase}/tools/${tool.slug}\n- **Category**: ${tool.categoryLabel || tool.category}\n- **Description**: ${tool.shortDescription}\n- **Processing**: ${tool.privacyNotice || (tool.isAi ? "Cloud processing is disclosed before submission." : "Runs locally in the browser.")}\n- **Explanation**: ${tool.explanation}\n`;
    if (tool.howToUse?.length) { text += `- **How to use**:\n`; tool.howToUse.forEach((step, index) => { text += `  ${index + 1}. ${step}\n`; }); }
    if (tool.faqs?.length) { text += `- **Top FAQs**:\n`; for (const faq of tool.faqs.slice(0, 3)) text += `  - **Q: ${faq.question}**\n    A: ${faq.answer}\n`; }
    text += `\n`;
  }
  return text;
}

export function generateRobotsTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = cleanOrigin(baseUrl);
  return `# XFree.in crawl policy\nUser-agent: *\nAllow: /\nDisallow: /api/\n\n# Search and answer-engine crawlers\nUser-agent: Googlebot\nAllow: /\nDisallow: /api/\n\nUser-agent: Bingbot\nAllow: /\nDisallow: /api/\n\nUser-agent: OAI-SearchBot\nAllow: /\nDisallow: /api/\n\nUser-agent: ChatGPT-User\nAllow: /\nDisallow: /api/\n\nUser-agent: PerplexityBot\nAllow: /\nDisallow: /api/\n\n# Canonical discovery entry point\nSitemap: ${cleanBase}/sitemap-index.xml\n`;
}
