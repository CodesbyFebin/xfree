import { ToolDefinition } from "../types";
import seedToolsData from "../scripts/tools-seed.json";

export const CATEGORIES: { id: string; label: string; description: string; icon: string }[] = [
  {
    id: "seo-tools",
    label: "SEO & URL Tools",
    description: "Bulk extraction, XML sitemaps, Meta OpenGraph previews, Robots.txt, and Schema markup",
    icon: "Globe",
  },
  {
    id: "developer-tools",
    label: "Developer Tools",
    description: "Format, validate, diff, and convert JSON, XML, YAML, Regex, Cron, JWT, and SQL",
    icon: "Code2",
  },
  {
    id: "ai-tools",
    label: "Single-Purpose AI Tools",
    description: "Narrow, deterministic AI assistants for Regex, SQL, JSON Repair, SEO Meta, and Commit Messages",
    icon: "Sparkles",
  },
  {
    id: "text-tools",
    label: "Text & Diff Tools",
    description: "Text diffing, line sorting, word count, slugifier, and regex replacements",
    icon: "FileText",
  },
  {
    id: "converters",
    label: "Converters & Encoders",
    description: "Base64, URL encoding, Unix Timestamps, Color space conversion, and CSS units",
    icon: "ArrowLeftRight",
  },
  {
    id: "generators",
    label: "Generators",
    description: "UUID v4, Cron schedules, Hash generation (SHA-256/MD5), and UTM campaign links",
    icon: "Wand2",
  },
  {
    id: "validators",
    label: "Validators",
    description: "JSON, XML, Sitemap, Schema.org, and Robots.txt rule validators",
    icon: "CheckCircle2",
  },
];

function generate20Faqs(title: string, pillarKeyword: string, supportingKeywords: string[] = []): { question: string; answer: string }[] {
  const k1 = supportingKeywords[0] || pillarKeyword;
  const cleanTitle = title.replace(/\s*\|\s*Free Online Tool/i, "");

  return [
    {
      question: `What is the ${cleanTitle}?`,
      answer: `The ${cleanTitle} is a free, browser-based web utility designed to help marketers, webmasters, and developers execute ${pillarKeyword} tasks instantly without installing software or signing up.`
    },
    {
      question: `How does this free ${pillarKeyword} tool work?`,
      answer: `Our tool processes your input data directly in your browser using modern client-side JavaScript. Simply enter or paste your content, select your desired options, and receive real-time formatted results instantly.`
    },
    {
      question: `Is my input data safe and private when using ${cleanTitle}?`,
      answer: `Yes, 100% safe. All parsing, processing, and formatting happen locally inside your web browser. Your data is never uploaded to external servers or logged in database systems.`
    },
    {
      question: `Is ${cleanTitle} completely free to use without hidden limits?`,
      answer: `Yes, XFree.in offers completely free tools with zero usage limits, no credit card required, and no artificial daily quotas.`
    },
    {
      question: `Do I need to install software, extensions, or register an account?`,
      answer: `No setup or account required. You can access ${cleanTitle} from any modern browser on desktop or mobile devices anytime.`
    },
    {
      question: `How does ${cleanTitle} assist with search engine optimization (SEO)?`,
      answer: `By ensuring clean data formatting, correct technical structures, and accurate keyword optimization (${k1}), ${cleanTitle} helps improve site health, search indexing speed, and user experience.`
    },
    {
      question: `Can I process bulk data or large files using this tool?`,
      answer: `Yes! ${cleanTitle} is built with batch processing utilities and virtualized rendering to handle large inputs efficiently without slowing down your browser.`
    },
    {
      question: `What input formats are supported by ${cleanTitle}?`,
      answer: `Depending on the tool, you can upload or paste plain text, CSV spreadsheets, JSON payloads, XML snippets, or raw code blocks.`
    },
    {
      question: `Is there a daily limit on how many requests I can make?`,
      answer: `There are no limits! You can run unlimited checks, conversions, and generations as often as needed.`
    },
    {
      question: `How does ${cleanTitle} compare to paid software or desktop suites?`,
      answer: `Unlike paid software that requires expensive subscriptions and heavy downloads, ${cleanTitle} gives you instant web access with zero latency and complete privacy for free.`
    },
    {
      question: `Can I use ${cleanTitle} on mobile phones and tablets?`,
      answer: `Yes! All tools on XFree.in are built with responsive touch-friendly user interfaces designed specifically for mobile, tablet, and desktop viewports.`
    },
    {
      question: `How can I export or save my results from ${cleanTitle}?`,
      answer: `You can copy results with 1-click buttons, export to JSON or CSV formats, or download raw text/file files directly to your device.`
    },
    {
      question: `How does this tool help with ${k1}?`,
      answer: `${cleanTitle} streamlines workflows for ${k1} by automating manual validation, formatting, and conversion tasks in seconds.`
    },
    {
      question: `Can I use this tool offline after loading the page?`,
      answer: `Yes! Because the logic executes client-side, once the page loads, ${cleanTitle} can continue processing your data even if your connection drops.`
    },
    {
      question: `What are the best practices for ${pillarKeyword}?`,
      answer: `Always verify input formatting, keep clean backups of raw datasets, and use structured tools like ${cleanTitle} to prevent human error.`
    },
    {
      question: `Is ${cleanTitle} regularly updated?`,
      answer: `Yes, XFree.in maintains active updates to ensure compliance with the latest web standards, browser security policies, and search engine directives.`
    },
    {
      question: `Can I integrate outputs from ${cleanTitle} into my dev or marketing workflows?`,
      answer: `Absolutely. Outputs are standard, valid formats (JSON, XML, CSV, HTML, plain text) ready to copy directly into codebases, CMS platforms, or reports.`
    },
    {
      question: `Who can benefit most from using ${cleanTitle}?`,
      answer: `Digital marketers, SEO specialists, software developers, data analysts, content creators, and students rely on ${cleanTitle} for daily workflow speed.`
    },
    {
      question: `Does ${cleanTitle} require an API key or account login?`,
      answer: `No API key or sign-up is required for standard client-side tools. For AI features, standard Gemini backend integration handles request authentication seamlessly.`
    },
    {
      question: `Why should I choose XFree.in for ${pillarKeyword}?`,
      answer: `XFree.in delivers lightning-fast, ad-light, privacy-first web utilities with zero paywalls, clear user interface designs, and rich FAQ guidance.`
    }
  ];
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  "seo-tools": "SEO & URL Tools",
  "developer-tools": "Developer Tools",
  "ai-tools": "Single-Purpose AI Tools",
  "text-tools": "Text & Diff Tools",
  "converters": "Converters & Encoders",
  "generators": "Generators",
  "validators": "Validators"
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  "seo-tools": "Globe",
  "developer-tools": "Code2",
  "ai-tools": "Sparkles",
  "text-tools": "FileText",
  "converters": "ArrowLeftRight",
  "generators": "Wand2",
  "validators": "CheckCircle2"
};

// Map seed entries into ToolDefinition objects.
// IMPORTANT: seed entries do not have a real React component wired in App.tsx,
// so they are marked as draft/non-indexable. They still power the on-site
// keyword directory but never reach the sitemap and never render as tool pages.
const PROCESSED_SEED_TOOLS: ToolDefinition[] = (seedToolsData as any[]).map((seed) => {
  const catLabel = CATEGORY_LABEL_MAP[seed.cluster] || "Utilities";
  const iconName = CATEGORY_ICON_MAP[seed.cluster] || "Wand2";
  const isAi = seed.cluster === "ai-tools";

  return {
    id: seed.slug,
    slug: seed.slug,
    title: seed.title,
    pillarKeyword: seed.pillarKeyword,
    shortDescription: seed.description,
    category: seed.cluster,
    categoryLabel: catLabel,
    iconName: iconName,
    execution: isAi ? "ai" : "local",
    status: "draft",
    lastModified: "2026-03-15",
    isAi: isAi,
    toolComponent: seed.toolComponent,
    tags: [seed.pillarKeyword, ...(seed.supportingKeywords || []), seed.cluster],
    exampleInput: seed.exampleInput || `Sample input data for ${seed.title}`,
    explanation: `The ${seed.title} is a planned XFree.in utility for ${seed.pillarKeyword}.`,
    howToUse: [
      `Enter or paste your raw text into the input editor.`,
      `Select your desired options or filters.`,
      `Click 'Process Data' or view instant transformation.`,
      `Copy results or export to file.`
    ],
    privacyNotice: isAi
      ? "AI-powered tool. Input is sent to XFree.in and processed by Google Gemini. Do not submit confidential data."
      : "This tool runs entirely in your browser. Input is not sent to XFree.in servers.",
    faqs: generate20Faqs(seed.title, seed.pillarKeyword, seed.supportingKeywords),
    relatedToolIds: ["bulk-url-sitemap", "json-formatter-validator-diff", "regex-tester-explainer"]
  };
});

// Primary 10 production catalog tools (Indexable)
const HAND_CRAFTED_TOOLS: ToolDefinition[] = [
  {
    id: "bulk-url-sitemap",
    slug: "bulk-url-extractor-sitemap-generator",
    title: "Bulk URL Extractor & Sitemap Generator",
    pillarKeyword: "Free Bulk URL Extractor & Sitemap Generator Online",
    shortDescription: "Extract URLs from massive raw text or HTML, clean, deduplicate, filter by domain, and generate valid XML Sitemaps with Sitemap-Index splitting.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    isFlagship: true,
    tags: ["sitemap", "url extractor", "bulk urls", "xml sitemap", "seo", "domain filter"],
    exampleInput: `Check out our site at https://example.com/blog/seo-guide and https://example.com/about!\nhttps://example.com/products/view?id=123 and duplicate link https://example.com/about.`,
    explanation: "Parses raw text, HTML, or logs to isolate HTTP/HTTPS URLs, deduplicate them, filter by domain, and export Google-compliant XML Sitemaps.",
    howToUse: [
      "Paste any raw text or HTML snippet into the input area.",
      "Select domain filter, query parameter removal, and deduplication options.",
      "View real-time extracted URL stats.",
      "Download generated XML Sitemap file."
    ],
    privacyNotice: "100% Client-Side Privacy: Processing happens entirely inside browser memory.",
    faqs: generate20Faqs("Bulk URL Extractor & Sitemap Generator", "bulk url extractor sitemap generator"),
    relatedToolIds: ["robots-txt-generator", "meta-tag-open-graph-preview", "schema-markup-generator"]
  },
  {
    id: "xml-sitemap-generator",
    slug: "xml-sitemap-generator",
    title: "XML Sitemap Generator & Validator",
    pillarKeyword: "XML Sitemap Generator",
    shortDescription: "Generate valid Google & Bing XML sitemaps with priority, changefreq, lastmod, and automatic chunking for large link sets.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["xml sitemap", "seo", "google indexing", "sitemap validator"],
    exampleInput: "https://example.com/\nhttps://example.com/about\nhttps://example.com/services",
    explanation: "Converts lists of web URLs into schema-compliant XML sitemaps with proper XML escaping and sitemap index generation.",
    howToUse: [
      "Enter list of URLs line by line.",
      "Adjust priority and change frequency settings.",
      "Click generate and download sitemap.xml."
    ],
    privacyNotice: "100% Client-Side Privacy: All processing occurs locally.",
    faqs: generate20Faqs("XML Sitemap Generator", "xml sitemap generator"),
    relatedToolIds: ["bulk-url-sitemap", "robots-txt-generator"]
  },
  {
    id: "json-formatter-validator-diff",
    slug: "json-formatter-validator-diff",
    title: "JSON / XML Formatter, Validator & Tree Viewer",
    pillarKeyword: "JSON Formatter and Validator",
    shortDescription: "Format, validate, repair, minify, and inspect JSON/XML data with interactive tree views and error location diagnostics.",
    category: "developer-tools",
    categoryLabel: "Developer Tools",
    iconName: "Code2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    isFlagship: true,
    tags: ["json formatter", "json validator", "json tree", "json repair", "xml format"],
    exampleInput: '{"name": "XFree Platform", "tools": 10, "active": true, "tags": ["seo", "dev"]}',
    explanation: "Parses JSON and XML payloads, identifies syntax errors with line/column markers, provides formatting, minification, and visual tree hierarchy.",
    howToUse: [
      "Paste JSON or XML payload into the input editor.",
      "Toggle between Format, Minify, and Interactive Tree modes.",
      "Review validation diagnostics or click Auto-Fix for minor syntax repairs."
    ],
    privacyNotice: "100% Client-Side Privacy: Processing occurs locally in browser memory.",
    faqs: generate20Faqs("JSON Formatter and Validator", "json formatter validator"),
    relatedToolIds: ["regex-tester-explainer", "base64-url-encoder-jwt-decoder"]
  },
  {
    id: "regex-tester-explainer",
    slug: "regex-tester-explainer",
    title: "Regex Tester & Interactive Match Explainer",
    pillarKeyword: "Regex Tester",
    shortDescription: "Test regular expressions live with match group breakdown, string replacement previews, and flags (g, i, m).",
    category: "developer-tools",
    categoryLabel: "Developer Tools",
    iconName: "Code2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["regex tester", "regular expression", "regex match", "regex replace"],
    exampleInput: "Contact support@xfree.in or sales@company.com for inquiries.",
    explanation: "Evaluates regex patterns against sample text in real-time, showing match groups, indices, and string replacement outputs.",
    howToUse: [
      "Type regular expression pattern and flags.",
      "Enter test string into input box.",
      "View highlighted matches and captured group tables."
    ],
    privacyNotice: "100% Client-Side Privacy: Regex execution runs locally.",
    faqs: generate20Faqs("Regex Tester", "regex tester"),
    relatedToolIds: ["json-formatter-validator-diff", "cron-expression-generator"]
  },
  {
    id: "cron-expression-generator",
    slug: "cron-expression-generator",
    title: "Cron Expression Generator & Human Translator",
    pillarKeyword: "Cron Expression Generator",
    shortDescription: "Generate standard 5-part cron schedule expressions, view plain-English explanations, and calculate upcoming execution times.",
    category: "generators",
    categoryLabel: "Generators",
    iconName: "Wand2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["cron generator", "cron syntax", "cron schedule", "cron expression"],
    exampleInput: "*/15 9-17 * * 1-5",
    explanation: "Translates cron syntax into human-readable sentences and calculates exact future execution timestamps.",
    howToUse: [
      "Configure minute, hour, day of month, month, and day of week options.",
      "Review generated 5-part cron expression string.",
      "Inspect upcoming execution times list."
    ],
    privacyNotice: "100% Client-Side Privacy: Cron calculations run locally.",
    faqs: generate20Faqs("Cron Expression Generator", "cron expression generator"),
    relatedToolIds: ["regex-tester-explainer", "url-slug-utm-builder"]
  },
  {
    id: "meta-tag-open-graph-preview",
    slug: "meta-tag-open-graph-preview",
    title: "Meta Tag & Open Graph Social Card Preview",
    pillarKeyword: "Meta Tag Generator",
    shortDescription: "Generate meta title tags, meta descriptions, and Open Graph / Twitter Cards with real-time Google SERP and social card previews.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["meta tags", "open graph", "twitter card", "serp preview", "seo"],
    exampleInput: "Title: XFree.in Platform\nDescription: Free developer and SEO micro-tools.",
    explanation: "Constructs HTML meta tags for title, description, canonical URL, og:title, og:image, and twitter:card with length character count validation.",
    howToUse: [
      "Fill in page title, description, canonical URL, and OG image link.",
      "Inspect live Google search result snippet and Twitter/Facebook preview card.",
      "Copy generated HTML code snippet."
    ],
    privacyNotice: "100% Client-Side Privacy: All previews render locally.",
    faqs: generate20Faqs("Meta Tag Generator", "meta tag generator"),
    relatedToolIds: ["schema-markup-generator", "robots-txt-generator"]
  },
  {
    id: "robots-txt-generator",
    slug: "robots-txt-generator",
    title: "Robots.txt Generator & User-Agent Rule Tester",
    pillarKeyword: "Robots.txt Generator",
    shortDescription: "Create valid robots.txt directives for search engine crawlers, test path allowance rules, and specify XML sitemaps.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["robots.txt", "crawler rules", "allow disallow", "seo auditing"],
    exampleInput: "User-agent: *\nDisallow: /admin/\nSitemap: https://xfree.in/sitemap.xml",
    explanation: "Builds RFC 9309 compliant robots.txt files with Allow/Disallow rule groups, crawl-delay directives, and sitemap references.",
    howToUse: [
      "Add user-agent rules (e.g. Googlebot, Bingbot, *).",
      "Specify allowed and disallowed path rules.",
      "Test URL path against current rules to verify crawler permissions."
    ],
    privacyNotice: "100% Client-Side Privacy: Robots.txt rules execute locally.",
    faqs: generate20Faqs("Robots.txt Generator", "robots txt generator"),
    relatedToolIds: ["bulk-url-sitemap", "meta-tag-open-graph-preview"]
  },
  {
    id: "schema-markup-generator",
    slug: "schema-markup-generator",
    title: "Schema Markup Generator (JSON-LD Structured Data)",
    pillarKeyword: "Schema Markup Generator",
    shortDescription: "Generate valid Schema.org JSON-LD structured data for WebSite, Organization, SoftwareApplication, FAQPage, Article, and Breadcrumbs.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["schema markup", "json-ld", "structured data", "faq schema", "rich snippet"],
    exampleInput: "Name: XFree\nURL: https://xfree.in",
    explanation: "Generates rich snippet structured data in valid JSON-LD format with form validation and Google Rich Results compliance checks.",
    howToUse: [
      "Select Schema type (e.g. WebSite, Organization, FAQPage, Article).",
      "Fill in required metadata fields.",
      "Copy formatted JSON-LD script tag."
    ],
    privacyNotice: "100% Client-Side Privacy: Schema JSON-LD is generated locally.",
    faqs: generate20Faqs("Schema Markup Generator", "schema markup generator"),
    relatedToolIds: ["meta-tag-open-graph-preview", "bulk-url-sitemap"]
  },
  {
    id: "base64-url-encoder-jwt-decoder",
    slug: "base64-url-encoder-jwt-decoder",
    title: "Base64 Encoder/Decoder & JWT Token Inspector",
    pillarKeyword: "Base64 & JWT Decoder",
    shortDescription: "Safely encode and decode Base64 strings, UTF-8 text, Base64URL parameters, and inspect OAuth JWT headers, payloads, and claims.",
    category: "converters",
    categoryLabel: "Converters & Encoders",
    iconName: "ArrowLeftRight",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["base64", "jwt decoder", "url encode", "base64url", "oauth token"],
    exampleInput: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRGV2IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    explanation: "Decodes JWT headers and payload claims without transmitting tokens to external servers. Supports UTF-8 safe Base64 and Base64URL encoding/decoding.",
    howToUse: [
      "Select JWT, Base64, or URL mode.",
      "Paste token or text input.",
      "View decoded header, payload claims, and expiration date."
    ],
    privacyNotice: "100% Client-Side Privacy: Tokens and strings are decoded locally in browser memory.",
    faqs: generate20Faqs("Base64 & JWT Decoder", "base64 jwt decoder"),
    relatedToolIds: ["json-formatter-validator-diff", "url-slug-utm-builder"]
  },
  {
    id: "url-slug-utm-builder",
    slug: "url-slug-utm-builder",
    title: "URL Slug Generator & Campaign UTM Parameter Builder",
    pillarKeyword: "URL Slug Generator",
    shortDescription: "Clean title strings into SEO-friendly URL slugs, and build campaign URLs with UTM parameters (source, medium, campaign, term, content).",
    category: "generators",
    categoryLabel: "Generators",
    iconName: "Wand2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["url slug", "utm builder", "google analytics", "campaign tracking", "clean url"],
    exampleInput: "Title: How to Build a Modern Technical SEO Sitemap in 2026!",
    explanation: "Converts strings into lowercase, hyphen-separated clean URL slugs while stripping special characters. Appends validated Google Analytics UTM parameters to base URLs.",
    howToUse: [
      "Type title string to generate clean URL slug.",
      "Enter destination URL and campaign UTM details.",
      "Copy final clean tracking URL."
    ],
    privacyNotice: "100% Client-Side Privacy: All string operations run locally.",
    faqs: generate20Faqs("URL Slug Generator", "url slug generator"),
    relatedToolIds: ["bulk-url-sitemap", "base64-url-encoder-jwt-decoder"]
  }
];

// Combine seed tools and handcrafted tools while removing duplicate IDs
const toolMap = new Map<string, ToolDefinition>();

PROCESSED_SEED_TOOLS.forEach(tool => {
  toolMap.set(tool.id, tool);
});

HAND_CRAFTED_TOOLS.forEach(tool => {
  toolMap.set(tool.id, tool);
});

export const TOOLS_REGISTRY: ToolDefinition[] = Array.from(toolMap.values());

// Tools that have a real wired React component AND are approved for indexing/sitemap.
export const INDEXABLE_TOOLS: ToolDefinition[] = TOOLS_REGISTRY.filter(
  (t) => t.status === "indexable",
);

export const INDEXABLE_TOOL_SLUGS: Set<string> = new Set(INDEXABLE_TOOLS.map((t) => t.slug));

export function findIndexableTool(slug: string): ToolDefinition | undefined {
  return INDEXABLE_TOOLS.find((t) => t.slug === slug);
}

export function findToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((t) => t.slug === slug || t.id === slug);
}
