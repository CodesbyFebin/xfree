// XFree Pillar Registry — authoritative source for the 60 topical pillars,
// 6 header groups, and 9 platform/authority pillars. Every name begins with
// "XFree" per the naming contract. Lifecycle is explicit: every definition
// carries `status` and `indexable`; visibility in navigation, sitemap, and
// prerender is derived from `PUBLIC_PILLARS`.

export type PillarStatus = "draft" | "pending_review" | "published" | "retired";
export type HeaderGroupId =
  | "dev-data"
  | "web-seo"
  | "ai-auto"
  | "media-docs"
  | "sec-net"
  | "biz-prod";

export interface PillarDefinition {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  headerGroup: HeaderGroupId;
  status: PillarStatus;
  indexable: boolean;
  contentApproved: boolean;
  // Sub-clusters are governed records. The pillar route is published when
  // contentApproved is true; sub-clusters gate themselves.
  approvedClusterIds: string[];
  // Tools that genuinely belong to this pillar (slug references). Empty for
  // pillars whose tools are not yet verified.
  verifiedToolSlugs: string[];
  // Stable per-pillar "lastmod" derived from content, not the deploy date.
  lastmod: string;
}

export interface HeaderGroupDefinition {
  id: HeaderGroupId;
  label: string;
  shortLabel: string;
  description: string;
  order: number;
}

// Six header groups, ordered to match the navigation contract.
export const HEADER_GROUPS: HeaderGroupDefinition[] = [
  { id: "dev-data", label: "XFree Dev & Data", shortLabel: "Dev & Data", description: "Developer, JSON, code, API, regex, encoding, generators.", order: 1 },
  { id: "web-seo", label: "XFree Web & SEO", shortLabel: "Web & SEO", description: "Web, SEO, URL, schema, crawl, metadata, performance.", order: 2 },
  { id: "ai-auto", label: "XFree AI & Automation", shortLabel: "AI & Automation", description: "AI, prompts, RAG, agents, MCP, agentic workflows.", order: 3 },
  { id: "media-docs", label: "XFree Media & Documents", shortLabel: "Media & Docs", description: "Image, video, audio, PDF, Markdown, subtitles, files.", order: 4 },
  { id: "sec-net", label: "XFree Security & Network", shortLabel: "Security & Network", description: "Hash, password, JWT, privacy, network, DNS, certificates.", order: 5 },
  { id: "biz-prod", label: "XFree Business & Productivity", shortLabel: "Business & Productivity", description: "Text, content, calculators, date/time, finance, marketing.", order: 6 },
];

// Nine platform and authority pillars. These are governed separately from the
// 60 topical pillars: they live in the header dropdown and footer, but they
// do not have a "headerGroup" since they aren't part of the six content
// groups. They may point at www, app, or external destinations.
export interface AuthorityPillar {
  id: string;
  name: string;
  href: string;
  external: boolean;
  status: PillarStatus;
  indexable: boolean;
  description: string;
}

export const AUTHORITY_PILLARS: AuthorityPillar[] = [
  { id: "studio", name: "XFree Studio", href: "https://app.xfree.in/", external: true, status: "published", indexable: true, description: "Verified local engines, workflows, and optional Cloud Mode." },
  { id: "openhost", name: "XFree OpenHost", href: "/openhost", external: false, status: "draft", indexable: false, description: "Planned static hosting surface. Not yet published; will not be exposed as a public link until the service ships." },
  { id: "downloads", name: "XFree Downloads", href: "/downloads", external: false, status: "draft", indexable: false, description: "Versioned offline bundles. Page does not list artifacts until each has a verified checksum." },
  { id: "how-it-works", name: "XFree How It Works", href: "/how-it-works", external: false, status: "published", indexable: true, description: "How XFree processes data in your browser by default." },
  { id: "use-cases", name: "XFree Use Cases", href: "/use-cases", external: false, status: "published", indexable: true, description: "Editorial use cases for XFree across developer and SEO roles." },
  { id: "docs", name: "XFree Documentation", href: "/docs", external: false, status: "published", indexable: true, description: "XFree documentation hub." },
  { id: "guides", name: "XFree Guides", href: "/guides", external: false, status: "published", indexable: true, description: "Reviewed guides covering XFree tools and patterns." },
  { id: "blog", name: "XFree Blog", href: "/blog", external: false, status: "published", indexable: true, description: "Editorial posts on XFree capabilities and standards." },
  { id: "pillars", name: "XFree Pillar Directory", href: "/pillars", external: false, status: "published", indexable: true, description: "The full 60-pillar directory, organized by the six header groups." },
];

// ---------------------------------------------------------------------------
// 60 topical pillars, in the exact order of the master prompt.
// Default status for newly registered pillars is "draft". We mark a pillar as
// "published" only when:
//   - contentApproved: substantial pillar content exists on disk
//   - verifiedToolSlugs: at least one verified engine-driven tool is live
//   - approvedClusterIds: at least one cluster is governed
// Until all three are satisfied the pillar is hidden from navigation,
// sitemap, and prerender. No pillar is published "automatically" on import.
// ---------------------------------------------------------------------------

function pillar(
  id: number,
  name: string,
  slug: string,
  icon: string,
  description: string,
  group: HeaderGroupId,
  status: PillarStatus = "draft",
  indexable: boolean = false,
  contentApproved: boolean = false,
  approvedClusterIds: string[] = [],
  verifiedToolSlugs: string[] = [],
  lastmod: string = "2026-09-03",
): PillarDefinition {
  return { id, name, slug, icon, description, headerGroup: group, status, indexable, contentApproved, approvedClusterIds, verifiedToolSlugs, lastmod };
}

export const PILLARS_60: PillarDefinition[] = [
  // ── XFree Dev & Data (10) ──
  pillar(1, "XFree Developer Tools", "dev-tools", "⚡", "Format, validate, diff, and convert JSON, XML, YAML, Regex, Cron, JWT, and SQL — all in your browser.", "dev-data", "published", true, true, ["json-formatting","regex-tester","cron-builder"], ["json-formatter","regex-tester","cron-expression-generator"], "2026-08-15"),
  pillar(2, "XFree JSON & Data Tools", "json-data-tools", "{}", "Format, validate, convert, flatten, sort, filter, compare, deduplicate, query, and visualize JSON and structured data.", "dev-data", "published", true, true, ["json-format","json-validate","json-convert"], ["json-formatter"], "2026-08-15"),
  pillar(3, "XFree Code Formatting Tools", "code-formatting-tools", "<>", "HTML, CSS, JavaScript, TypeScript, SQL, XML, YAML, Markdown minification and escaping utilities.", "dev-data", "draft", false, false, [], [], "2026-09-03"),
  pillar(4, "XFree API Tools", "api-tools", "🔌", "Requests, responses, headers, authentication, OpenAPI, GraphQL, webhooks, mocks, and testing.", "dev-data", "draft", false, false, [], [], "2026-09-03"),
  pillar(5, "XFree Database Tools", "database-tools", "🗄️", "SQL formatting, schemas, queries, migrations, CSV imports, JSON exports, and normalization.", "dev-data", "draft", false, false, [], [], "2026-09-03"),
  pillar(6, "XFree Regex Tools", "regex-tools", ".*", "Test, build, explain, escape, replace, extract, and debug regular expression patterns.", "dev-data", "published", true, true, ["regex-test","regex-build","regex-extract"], ["regex-tester"], "2026-08-15"),
  pillar(7, "XFree Encoding Tools", "encoding-tools", "🔐", "Base64, URL, HTML entities, Unicode, hexadecimal, binary, JWT, MIME, and character sets.", "dev-data", "published", true, true, ["base64","url-encode","jwt"], ["base64-encoder-decoder"], "2026-08-15"),
  pillar(8, "XFree Converter Tools", "converters", "🔄", "JSON/CSV, XML/JSON, YAML/JSON, Markdown/HTML, units, timestamps, colors, and file formats.", "dev-data", "draft", false, false, [], [], "2026-09-03"),
  pillar(9, "XFree Validator Tools", "validators", "✓", "JSON, XML, YAML, URLs, email, schemas, HTML, CSS, tokens, and structured data.", "dev-data", "draft", false, false, [], [], "2026-09-03"),
  pillar(10, "XFree Generator Tools", "generators", "⚙️", "UUIDs, passwords, hashes, tokens, mock data, code snippets, identifiers, and templates.", "dev-data", "draft", false, false, [], [], "2026-09-03"),

  // ── XFree Web & SEO (10) ──
  pillar(11, "XFree Web Tools", "web-tools", "🌐", "HTML, CSS, JavaScript, headers, manifests, robots, and browser diagnostics.", "web-seo", "draft", false, false, [], [], "2026-09-03"),
  pillar(12, "XFree SEO Tools", "seo-tools", "📊", "Metadata, canonical, sitemap, robots.txt, schema, and redirect inspection.", "web-seo", "published", true, true, ["metadata","sitemap","schema"], ["meta-tag-generator","schema-markup-generator","robots-txt-generator","bulk-url-sitemap"], "2026-08-15"),
  pillar(13, "XFree URL Tools", "url-tools", "🔗", "Parsing, slug generation, UTM building, extraction, and normalization.", "web-seo", "published", true, true, ["slug","utm","extraction"], ["url-slug-utm-builder","bulk-url-sitemap"], "2026-08-15"),
  pillar(14, "XFree Schema Tools", "schema-tools", "📋", "JSON-LD generators, validators, previews, and entity modelling.", "web-seo", "published", true, true, ["json-ld","validate","preview"], ["schema-markup-generator"], "2026-08-15"),
  pillar(15, "XFree Crawl & Indexing Tools", "crawl-indexing-tools", "🕷️", "XML sitemaps, robots.txt, canonical checking, indexability, and redirect-chain inspection.", "web-seo", "published", true, true, ["sitemap","robots","redirects"], ["xml-sitemap-generator","robots-txt-generator"], "2026-08-15"),
  pillar(16, "XFree Website Audit Tools", "website-audit-tools", "🔍", "Technical SEO, accessibility, performance, and security checks.", "web-seo", "draft", false, false, [], [], "2026-09-03"),
  pillar(17, "XFree Metadata Tools", "metadata-tools", "🏷️", "Meta tags, Open Graph, Twitter Cards, title-length, and description checking.", "web-seo", "published", true, true, ["meta","og","twitter"], ["meta-tag-generator"], "2026-08-15"),
  pillar(18, "XFree Performance Tools", "performance-tools", "⚡", "Core Web Vitals, load-time analysis, and resource optimization.", "web-seo", "draft", false, false, [], [], "2026-09-03"),
  pillar(19, "XFree Accessibility Tools", "accessibility-tools", "♿", "ARIA validation, contrast checking, and screen-reader testing.", "web-seo", "draft", false, false, [], [], "2026-09-03"),
  pillar(20, "XFree Social Preview Tools", "social-preview-tools", "📱", "Open Graph previews, post formatting, aspect ratios, and link preparation.", "web-seo", "draft", false, false, [], [], "2026-09-03"),

  // ── XFree AI & Automation (10) ──
  pillar(21, "XFree AI Tools", "ai-tools", "🤖", "Prompt preparation, token estimation, structured output, and model utilities.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(22, "XFree Prompt Tools", "prompt-tools", "💬", "Prompt building, comparison, validation, variables, and reusable templates.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(23, "XFree RAG Tools", "rag-tools", "📚", "Chunking, retrieval dataset preparation, evaluation, and context inspection.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(24, "XFree LLM Tools", "llm-tools", "🧠", "Token counting, context-window estimation, and model comparison.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(25, "XFree Agent Tools", "agent-tools", "🎯", "Tool schemas, action definitions, routing tests, and agent configuration.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(26, "XFree MCP Tools", "mcp-tools", "🔧", "MCP manifest inspection, server configuration, and capability validation.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(27, "XFree Agentic Workflows", "agentic-workflows", "🔗", "Verified multi-step pipelines with visible execution and approval boundaries.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(28, "XFree Automation Tools", "automation-tools", "⚙️", "Workflow composition, batch operations, scheduling definitions, and exports.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(29, "XFree AI Evaluation Tools", "ai-evaluation-tools", "📈", "Benchmark comparison, output scoring, and model evaluation utilities.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),
  pillar(30, "XFree AI Data Tools", "ai-data-tools", "📦", "Dataset formatting, JSONL conversion, embedding preparation, and data cleaning.", "ai-auto", "draft", false, false, [], [], "2026-09-03"),

  // ── XFree Media & Documents (10) ──
  pillar(31, "XFree Image Tools", "image-tools", "🖼️", "Resize, crop, compress, convert, inspect, and remove metadata from images.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(32, "XFree Video Tools", "video", "🎬", "Trim, convert, inspect, extract frames, and process subtitles. Only verified engines are listed.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(33, "XFree Audio Tools", "audio-tools", "🎵", "Trim, convert, inspect, normalize, and extract audio.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(34, "XFree PDF Tools", "pdf-tools", "📄", "Merge, split, reorder, inspect, extract, and compress PDF files.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(35, "XFree Document Tools", "document-tools", "📝", "PDF, Markdown, CSV, and structured document operations.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(36, "XFree Spreadsheet Tools", "spreadsheet-tools", "📊", "CSV, TSV, Excel conversion, formula inspection, and data transformation.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(37, "XFree Markdown Tools", "markdown-tools", "📑", "Preview, convert, lint, format, and transform Markdown documents.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(38, "XFree Subtitle Tools", "subtitle-tools", "💬", "SRT, VTT, ASS conversion, timing adjustment, and format validation.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(39, "XFree File Tools", "file-tools", "📁", "Checksums, metadata, MIME inspection, naming, and batch organization.", "media-docs", "draft", false, false, [], [], "2026-09-03"),
  pillar(40, "XFree Creative Tools", "creative-tools", "🎨", "Color palettes, gradients, SVG generation, and design utilities.", "media-docs", "draft", false, false, [], [], "2026-09-03"),

  // ── XFree Security & Network (10) ──
  pillar(41, "XFree Security Tools", "security-tools", "🛡️", "Hashing, password generation, JWT inspection, and security-header evaluation.", "sec-net", "published", true, true, ["hash","password","jwt"], ["base64-encoder-decoder"], "2026-08-15"),
  pillar(42, "XFree Hash Tools", "hash-tools", "#️⃣", "SHA-256, SHA-512, MD5, checksums, and hash comparison utilities.", "sec-net", "draft", false, false, [], [], "2026-09-03"),
  pillar(43, "XFree Password Tools", "password-tools", "🔑", "Password generation, strength analysis, and policy validation.", "sec-net", "draft", false, false, [], [], "2026-09-03"),
  pillar(44, "XFree JWT & Token Tools", "token-tools", "🎫", "JWT decoding, token inspection, claims validation, and expiry checking.", "sec-net", "published", true, true, ["decode","validate","expiry"], ["base64-encoder-decoder"], "2026-08-15"),
  pillar(45, "XFree Privacy Tools", "privacy-tools", "🕵️", "Privacy analysis, tracker detection, and data-protection utilities.", "sec-net", "draft", false, false, [], [], "2026-09-03"),
  pillar(46, "XFree Network Tools", "network-tools", "🌍", "IP calculation, subnet masks, CIDR notation, and network diagnostics.", "sec-net", "draft", false, false, [], [], "2026-09-03"),
  pillar(47, "XFree DNS Tools", "dns-tools", "📡", "DNS record lookup, propagation checking, and zone file validation.", "sec-net", "draft", false, false, [], [], "2026-09-03"),
  pillar(48, "XFree HTTP Tools", "http-tools", "📡", "Header inspection, status code reference, and request analysis.", "sec-net", "draft", false, false, [], [], "2026-09-03"),
  pillar(49, "XFree Certificate Tools", "certificate-tools", "📜", "SSL/TLS certificate parsing, chain validation, and expiry checking.", "sec-net", "draft", false, false, [], [], "2026-09-03"),
  pillar(50, "XFree Security Header Tools", "security-header-tools", "🔒", "CSP, HSTS, X-Frame-Options, and security-header evaluation.", "sec-net", "draft", false, false, [], [], "2026-09-03"),

  // ── XFree Business & Productivity (10) ──
  pillar(51, "XFree Text Tools", "text-tools", "📝", "Case conversion, word counting, text comparison, extraction, and cleanup.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(52, "XFree Content Tools", "content-tools", "✍️", "Outlines, readability, keyword extraction, and content-structure validation.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(53, "XFree Writing Tools", "writing-tools", "✏️", "Grammar checking, style analysis, and writing assistance utilities.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(54, "XFree Calculator Tools", "calculators", "🧮", "Unit conversion, mathematical computation, and specialized calculators.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(55, "XFree Date & Time Tools", "date-time-tools", "📅", "Timestamps, timezone conversion, cron expressions, and date arithmetic.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(56, "XFree Finance Tools", "finance-tools", "💰", "Currency conversion, interest calculation, and financial utilities.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(57, "XFree Marketing Tools", "marketing-tools", "📣", "UTM builders, campaign URL generation, and marketing utilities.", "biz-prod", "published", true, true, ["utm","campaign"], ["url-slug-utm-builder"], "2026-08-15"),
  pillar(58, "XFree Productivity Tools", "productivity-tools", "📋", "Task formatting, note conversion, and workflow utilities.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(59, "XFree Education Tools", "education-tools", "🎓", "Flashcard generation, quiz formatting, and learning utilities.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
  pillar(60, "XFree Business Tools", "business-tools", "💼", "Invoice formatting, document templates, and business utilities.", "biz-prod", "draft", false, false, [], [], "2026-09-03"),
];

// Derived public collections — single source of truth for navigation, sitemap,
// prerender, and structured data. Nothing else in the codebase is allowed to
// publish a pillar or tool independently of these filters.
export const PUBLIC_PILLARS: PillarDefinition[] = PILLARS_60.filter(
  (pillar) => pillar.status === "published" && pillar.indexable === true && pillar.contentApproved === true,
);

export const PUBLIC_HEADER_GROUPS = HEADER_GROUPS
  .map((group) => ({
    ...group,
    pillars: PUBLIC_PILLARS.filter((pillar) => pillar.headerGroup === group.id),
  }))
  .filter((group) => group.pillars.length > 0);

export const PUBLIC_AUTHORITY_PILLARS: AuthorityPillar[] = AUTHORITY_PILLARS.filter(
  (pillar) => pillar.status === "published" && pillar.indexable === true,
);

export const PILLAR_BY_SLUG: ReadonlyMap<string, PillarDefinition> = new Map(
  PILLARS_60.map((pillar) => [pillar.slug, pillar]),
);

export function getPillarBySlug(slug: string): PillarDefinition | undefined {
  return PILLAR_BY_SLUG.get(slug);
}

export function pillarResponseForStatus(pillar: PillarDefinition): 200 | 404 | 410 {
  if (pillar.status === "published") return 200;
  if (pillar.status === "retired") return 410;
  return 404;
}
