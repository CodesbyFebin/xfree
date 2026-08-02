import { INDEXABLE_TOOLS, CATEGORIES } from "../data/toolsRegistry";

const DEFAULT_BASE_URL = "https://www.xfree.in";

/**
 * Escapes special XML characters to prevent XML parsing errors.
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats date to ISO 8601 string or RFC 822 for RSS.
 */
function getIsoDate(): string {
  return new Date().toISOString();
}

function getRssDate(): string {
  return new Date().toUTCString();
}

/**
 * Generates Google & Bing compliant sitemap.xml for all indexable production tools + categories + hubs.
 */
export function generateSitemapXml(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const currentDate = getIsoDate().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

  // 1. Root / Home
  xml += `  <url>\n`;
  xml += `    <loc>${escapeXml(`${cleanBase}/`)}</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Static Content Pages
  const staticPages = [
    { path: "/how-it-works", priority: "0.8", freq: "weekly" },
    { path: "/use-cases", priority: "0.8", freq: "weekly" },
    { path: "/docs", priority: "0.8", freq: "weekly" },
    { path: "/blog", priority: "0.8", freq: "daily" },
    { path: "/faq", priority: "0.7", freq: "monthly" },
    { path: "/about", priority: "0.6", freq: "monthly" },
    { path: "/contact", priority: "0.5", freq: "monthly" },
    { path: "/privacy", priority: "0.3", freq: "yearly" },
    { path: "/terms", priority: "0.3", freq: "yearly" },
    { path: "/security", priority: "0.5", freq: "monthly" },
    { path: "/clusters", priority: "0.9", freq: "daily" },
    { path: "/thinking", priority: "0.8", freq: "weekly" },
    { path: "/xfree-app", priority: "0.9", freq: "monthly" },
  ];

  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${cleanBase}${page.path}`)}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${page.freq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 3. Category Hub Pages
  for (const cat of CATEGORIES) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${cleanBase}/category/${cat.id}`)}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;
  }

  // 4. Canonical Working Micro-Tools Pages (Only status:indexable production tools)
  const seenSlugs = new Set<string>();
  for (const tool of INDEXABLE_TOOLS) {
    if (!tool.slug || seenSlugs.has(tool.slug)) continue;
    seenSlugs.add(tool.slug);

    const priority = tool.isFlagship ? "0.9" : "0.8";
    const lastmod = tool.lastModified || currentDate;
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${cleanBase}/tools/${tool.slug}`)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Generates RSS 2.0 feed (rss.xml) containing all indexable production micro-tools for fast search engine & LLM crawler indexing.
 */
export function generateRssXml(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const buildDate = getRssDate();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>XFree.in — Free Online Developer, SEO, AI &amp; Converter Micro-Tools</title>\n`;
  rss += `    <link>${escapeXml(cleanBase)}</link>\n`;
  rss += `    <description>100% Free client-side developer, SEO, AI, and converter micro-tools. Instant browser execution, zero signup, zero tracking.</description>\n`;
  rss += `    <language>en-us</language>\n`;
  rss += `    <lastBuildDate>${buildDate}</lastBuildDate>\n`;
  rss += `    <pubDate>${buildDate}</pubDate>\n`;
  rss += `    <ttl>60</ttl>\n`;
  rss += `    <atom:link href="${escapeXml(`${cleanBase}/rss.xml`)}" rel="self" type="application/rss+xml"/>\n`;

  for (const tool of INDEXABLE_TOOLS) {
    const toolUrl = `${cleanBase}/tools/${tool.slug}`;
    const pubDate = buildDate;
    const categoryName = tool.categoryLabel || tool.category;

    rss += `    <item>\n`;
    rss += `      <title>${escapeXml(tool.title)}</title>\n`;
    rss += `      <link>${escapeXml(toolUrl)}</link>\n`;
    rss += `      <guid isPermaLink="true">${escapeXml(toolUrl)}</guid>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
    rss += `      <category>${escapeXml(categoryName)}</category>\n`;
    rss += `      <description>${escapeXml(`${tool.shortDescription} Pillar Keyword: ${tool.pillarKeyword}. 100% Free browser utility with instant execution.`)}</description>\n`;
    rss += `      <content:encoded><![CDATA[`;
    rss += `<h3>${escapeXml(tool.title)}</h3>`;
    rss += `<p><strong>Pillar Keyword:</strong> ${escapeXml(tool.pillarKeyword)}</p>`;
    rss += `<p>${escapeXml(tool.explanation)}</p>`;
    if (tool.howToUse && tool.howToUse.length > 0) {
      rss += `<h4>How to Use:</h4><ul>`;
      for (const step of tool.howToUse) {
        rss += `<li>${escapeXml(step)}</li>`;
      }
      rss += `</ul>`;
    }
    rss += `]]></content:encoded>\n`;
    rss += `    </item>\n`;
  }

  rss += `  </channel>\n`;
  rss += `</rss>`;
  return rss;
}

/**
 * Generates llms.txt (Standard format for LLM agents & AI search crawlers).
 */
export function generateLlmsTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = baseUrl.replace(/\/$/, "");

  let text = `# XFree.in — Free Online Developer, SEO, AI & Converter Micro-Tools Suite\n\n`;
  text += `> XFree.in provides free online, browser-based developer tools, technical SEO utilities, single-purpose AI assistants, code formatters, and data converters with 100% client-side execution and zero data logging.\n\n`;

  text += `## Primary Sections & Hubs\n\n`;
  text += `- [Home Page](${cleanBase}/): Complete registry search and grid view of indexable micro-tools.\n`;
  text += `- [100 Keyword Clusters Hub](${cleanBase}/clusters): Programmatic SEO directory mapping 100 search intent clusters and supporting keywords.\n`;
  text += `- [Gemini Deep Thinking Mode](${cleanBase}/api/ai/thinking): Server-side high-reasoning Gemini 3.1 Pro endpoint for complex SQL, Regex, and SEO architectural analysis.\n\n`;

  text += `## Categories\n\n`;
  for (const cat of CATEGORIES) {
    text += `- [${cat.label}](${cleanBase}/category/${cat.id}): ${cat.description}\n`;
  }

  text += `\n## Core API Endpoints for Developers & AI Agents\n\n`;
  text += `- \`POST /api/ai\`: Single-purpose AI proxy (ai-regex, ai-json-repair, ai-meta-optimizer, ai-sql-generator, ai-search-intent, ai-code-explainer, ai-commit-generator, ai-schema-generator).\n`;
  text += `- \`POST /api/ai/batch\`: Batch processing endpoint for bulk CSV/TXT items.\n`;
  text += `- \`POST /api/ai/thinking\`: Deep reasoning endpoint powered by Google Gemini reasoning model (configurable via GEMINI_THINKING_MODEL) with high thinking budget.\n`;
  text += `- \`POST /api/ai/chat\`: Multi-turn conversational developer AI assistant.\n\n`;

  text += `## Complete Index of Indexable Micro-Tools\n\n`;
  for (const tool of INDEXABLE_TOOLS) {
    text += `- [${tool.title}](${cleanBase}/tools/${tool.slug}): ${tool.shortDescription} (Pillar: ${tool.pillarKeyword})\n`;
  }

  return text;
}

/**
 * Generates llms-full.txt (Comprehensive detailed technical knowledge base for LLM context injection).
 */
export function generateLlmsFullTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = baseUrl.replace(/\/$/, "");

  let text = `# XFree.in Full System Specification & Indexable Micro-Tools Knowledge Base\n\n`;
  text += `This document provides full technical details, Pillar Keywords, explanations, FAQs, and usage rules for indexable production micro-tools on XFree.in.\n\n`;

  for (const tool of INDEXABLE_TOOLS) {
    text += `--- \n\n`;
    text += `### ${tool.title}\n`;
    text += `- **URL**: ${cleanBase}/tools/${tool.slug}\n`;
    text += `- **Category**: ${tool.categoryLabel || tool.category}\n`;
    text += `- **Pillar Keyword**: ${tool.pillarKeyword}\n`;
    text += `- **Description**: ${tool.shortDescription}\n`;
    text += `- **Explanation**: ${tool.explanation}\n`;

    if (tool.howToUse && tool.howToUse.length > 0) {
      text += `- **How to Use**:\n`;
      for (const step of tool.howToUse) {
        text += `  1. ${step}\n`;
      }
    }

    if (tool.faqs && tool.faqs.length > 0) {
      text += `- **Top FAQs**:\n`;
      for (const faq of tool.faqs.slice(0, 3)) {
        text += `  - **Q: ${faq.question}**\n    A: ${faq.answer}\n`;
      }
    }
    text += `\n`;
  }

  return text;
}

/**
 * Generates robots.txt directing search engine & LLM crawlers to sitemaps and feeds.
 */
export function generateRobotsTxt(baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBase = baseUrl.replace(/\/$/, "");

  // Split-brain policy:
  //   Allow — live-fetch / citation bots that answer user queries and cite us.
  //   Allow — traditional search bots.
  //   Disallow — bulk training / data-scraping crawlers.
  // Edit if your policy differs. `Disallow: /api/` applies to everyone; the
  // per-agent sections override for AI/training decisions.
  return `# Global rules
User-agent: *
Allow: /
Disallow: /api/

# --- Traditional search engines ---
User-agent: Googlebot
Allow: /
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /api/

User-agent: DuckDuckBot
Allow: /
Disallow: /api/

User-agent: BraveBot
Allow: /
Disallow: /api/

# --- AI citation / live-fetch bots (allowed — they cite you back) ---
User-agent: OAI-SearchBot
Allow: /
Disallow: /api/

User-agent: ChatGPT-User
Allow: /
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /api/

User-agent: Claude-SearchBot
Allow: /
Disallow: /api/

User-agent: Claude-User
Allow: /
Disallow: /api/

User-agent: Applebot
Allow: /
Disallow: /api/

# --- Bulk training crawlers (disallowed by default; flip if you consent) ---
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Applebot-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /

User-agent: Bytespider
Disallow: /

# Discovery files
Sitemap: ${cleanBase}/sitemap.xml
Sitemap: ${cleanBase}/rss.xml
`;
}
