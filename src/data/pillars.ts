/**
 * XFree Pillar Registry — Final Naming Contract
 *
 * Display pattern: "XFree <Topic>"
 * URL pattern:     /<descriptive-topic-slug>
 * H1 pattern:      XFree <Topic>
 *
 * Pillars are added to navigation and sitemap only when they have a
 * verified engine + page. Today, the 10 production tools map onto the
 * pillars that actually exist; all 69 pillars are listed in the taxonomy
 * but their `published` flag governs exposure.
 */

export type PillarGroup =
  | "dev-data"
  | "web-seo"
  | "ai-auto"
  | "media-docs"
  | "security"
  | "business"
  | "platform";

export interface Pillar {
  /** Stable pillar id, monotonic per contract */
  id: number;
  /** "XFree <Topic>" — display name and H1 */
  name: string;
  /** Canonical route without the "xfree-" prefix */
  href: string;
  /** Menu group for header dropdown */
  group: PillarGroup;
  /** Single emoji or short glyph */
  icon: string;
  /** Number of clusters (always 10 by convention) */
  clusters: number;
  /** Number of tools planned under this pillar */
  tools: number;
  /** Published = indexable + nav-eligible */
  published: boolean;
  /** Short description for menus and metadata */
  description: string;
  /** Cluster names (10 by convention) */
  clusterList: string[];
  /** Pillar type: tool (60 header pillars) or platform (9 extras) */
  type: "tool" | "platform";
}

export const PILLARS: Pillar[] = [
  // ═══════════ 1. Dev & Data ═══════════
  {
    id: 1, name: "XFree Developer Tools", href: "/dev-tools", group: "dev-data",
    icon: "⚡", clusters: 10, tools: 10, published: true,
    description: "Format, validate, debug and convert code with browser-based developer utilities.",
    type: "tool",
    clusterList: ["JSON", "Code", "Text", "API", "Database", "Regex", "Encoding", "Identifiers", "Terminal", "Debugging"],
  },
  {
    id: 2, name: "XFree JSON & Data Tools", href: "/json-data-tools", group: "dev-data",
    icon: "{ }", clusters: 10, tools: 10, published: true,
    description: "Format, validate, flatten, sort, filter and visualize structured data in the browser.",
    type: "tool",
    clusterList: ["Formatting", "Validation", "Conversion", "Flattening", "Sorting", "Filtering", "Comparison", "Deduplication", "Querying", "Visualization"],
  },
  {
    id: 3, name: "XFree Code Formatting Tools", href: "/code-formatting-tools", group: "dev-data",
    icon: "</>", clusters: 10, tools: 8, published: true,
    description: "Format, minify, escape and lint source across HTML, CSS, JavaScript, TypeScript, SQL, XML, YAML and Markdown.",
    type: "tool",
    clusterList: ["HTML", "CSS", "JavaScript", "TypeScript", "SQL", "XML", "YAML", "Markdown", "Minification", "Escaping"],
  },
  {
    id: 4, name: "XFree API Tools", href: "/api-tools", group: "dev-data",
    icon: "🔌", clusters: 10, tools: 6, published: true,
    description: "Build, test, mock and document HTTP, GraphQL and webhook APIs.",
    type: "tool",
    clusterList: ["Requests", "Responses", "Headers", "Authentication", "OpenAPI", "GraphQL", "Webhooks", "Mocks", "Pagination", "Testing"],
  },
  {
    id: 5, name: "XFree Database Tools", href: "/database-tools", group: "dev-data",
    icon: "🗄️", clusters: 10, tools: 5, published: false,
    description: "Format SQL, generate schemas, export CSV/JSON, build connection strings and migrate.",
    type: "tool",
    clusterList: ["SQL Formatting", "Schemas", "Queries", "Migrations", "CSV Imports", "JSON Exports", "Indexes", "Connection Strings", "Normalization", "Comparison"],
  },
  {
    id: 6, name: "XFree Regex Tools", href: "/regex-tools", group: "dev-data",
    icon: ".*", clusters: 10, tools: 4, published: true,
    description: "Test, build, explain, escape and replace regular expressions live.",
    type: "tool",
    clusterList: ["Testing", "Building", "Explaining", "Escaping", "Replacing", "Extracting", "Validation", "Language Patterns", "Flags", "Debugging"],
  },
  {
    id: 7, name: "XFree Encoding Tools", href: "/encoding-tools", group: "dev-data",
    icon: "🔐", clusters: 10, tools: 7, published: true,
    description: "Encode, decode and convert between Base64, URL, HTML entities, Unicode, hex, binary and JWT.",
    type: "tool",
    clusterList: ["Base64", "URL", "HTML Entities", "Unicode", "Hexadecimal", "Binary", "JWT", "MIME", "QR Payloads", "Character Sets"],
  },
  {
    id: 8, name: "XFree Converter Tools", href: "/converters", group: "dev-data",
    icon: "🔄", clusters: 10, tools: 9, published: true,
    description: "Convert between JSON, CSV, XML, YAML, Markdown, units, timestamps and color spaces.",
    type: "tool",
    clusterList: ["JSON/CSV", "XML/JSON", "YAML/JSON", "Markdown/HTML", "Units", "Timestamps", "Colors", "Text Formats", "Binary Formats", "File Formats"],
  },
  {
    id: 9, name: "XFree Validator Tools", href: "/validators", group: "dev-data",
    icon: "✓", clusters: 10, tools: 6, published: false,
    description: "Validate JSON, XML, YAML, URLs, emails, schemas, HTML, CSS, tokens and structured data.",
    type: "tool",
    clusterList: ["JSON", "XML", "YAML", "URLs", "Email", "Schemas", "HTML", "CSS", "Tokens", "Structured Data"],
  },
  {
    id: 10, name: "XFree Generator Tools", href: "/generators", group: "dev-data",
    icon: "⚙️", clusters: 10, tools: 8, published: true,
    description: "Generate UUIDs, passwords, hashes, tokens, mock data, snippets, configs and identifiers.",
    type: "tool",
    clusterList: ["UUIDs", "Passwords", "Hashes", "Tokens", "Mock Data", "Code Snippets", "Configuration", "Identifiers", "Timestamps", "Templates"],
  },

  // ═══════════ 2. Web & SEO ═══════════
  {
    id: 11, name: "XFree Web Tools", href: "/web-tools", group: "web-seo",
    icon: "🌐", clusters: 10, tools: 7, published: false,
    description: "Build, test and inspect HTML, CSS, DOM, forms, links, images, PWA and web components.",
    type: "tool",
    clusterList: ["HTML", "CSS", "JavaScript", "DOM", "Forms", "Links", "Images", "Responsive", "PWA", "Web Components"],
  },
  {
    id: 12, name: "XFree SEO Tools", href: "/seo-tools", group: "web-seo",
    icon: "📊", clusters: 10, tools: 10, published: true,
    description: "Audit, generate, validate and monitor technical, on-page and content SEO.",
    type: "tool",
    clusterList: ["Technical SEO", "On-Page", "Keywords", "Links", "Content", "Local SEO", "International", "Voice Search", "Core Web Vitals", "Log Analysis"],
  },
  {
    id: 13, name: "XFree URL Tools", href: "/url-tools", group: "web-seo",
    icon: "🔗", clusters: 10, tools: 5, published: true,
    description: "Encode, decode, parse, build, slugify, normalize and add UTM parameters to URLs.",
    type: "tool",
    clusterList: ["Encode", "Decode", "Parse", "Build", "Shorten", "Slugify", "UTM Builder", "Canonical", "Redirect", "Normalize"],
  },
  {
    id: 14, name: "XFree Schema Tools", href: "/schema-tools", group: "web-seo",
    icon: "🏷️", clusters: 10, tools: 4, published: true,
    description: "Generate JSON-LD, Microdata and RDFa structured data for Organization, Article, Product, FAQ, Breadcrumb and more.",
    type: "tool",
    clusterList: ["JSON-LD", "Microdata", "RDFa", "Organization", "Article", "Product", "FAQ", "Breadcrumb", "Review", "Event"],
  },
  {
    id: 15, name: "XFree Crawl & Indexing Tools", href: "/crawl-indexing-tools", group: "web-seo",
    icon: "🕷️", clusters: 10, tools: 5, published: true,
    description: "Generate sitemaps, robots.txt, audit indexability, test render and analyze crawl logs.",
    type: "tool",
    clusterList: ["Sitemaps", "Robots.txt", "Canonicals", "Indexability", "Render Testing", "Crawl Budget", "Log Analysis", "Fetch Render", "Internal Links", "Orphan Pages"],
  },
  {
    id: 16, name: "XFree Website Audit Tools", href: "/website-audit-tools", group: "web-seo",
    icon: "🔍", clusters: 10, tools: 3, published: false,
    description: "Run full audits for performance, accessibility, SEO, security, mobile and content quality.",
    type: "tool",
    clusterList: ["Full Audit", "Performance", "Accessibility", "SEO Score", "Security", "Mobile", "Content Quality", "Broken Links", "Duplicate Content", "Core Vitals"],
  },
  {
    id: 17, name: "XFree Metadata Tools", href: "/metadata-tools", group: "web-seo",
    icon: "📋", clusters: 8, tools: 4, published: true,
    description: "Build meta titles, descriptions, canonicals, Open Graph, Twitter Cards, hreflang and robots meta.",
    type: "tool",
    clusterList: ["Meta Tags", "Open Graph", "Twitter Cards", "Title Tags", "Descriptions", "Canonical", "Hreflang", "Robots Meta"],
  },
  {
    id: 18, name: "XFree Performance Tools", href: "/performance-tools", group: "web-seo",
    icon: "⚡", clusters: 10, tools: 3, published: false,
    description: "Measure LCP, INP, CLS, TTFB, bundle size, image optimization, font loading and cache strategy.",
    type: "tool",
    clusterList: ["LCP", "INP", "CLS", "TTFB", "Bundle Size", "Image Optimization", "Font Loading", "Cache Strategy", "CDN", "Lazy Loading"],
  },
  {
    id: 19, name: "XFree Accessibility Tools", href: "/accessibility-tools", group: "web-seo",
    icon: "♿", clusters: 10, tools: 2, published: false,
    description: "Audit ARIA, contrast, keyboard, screen reader, focus order, alt text and motion.",
    type: "tool",
    clusterList: ["ARIA", "Contrast", "Keyboard", "Screen Reader", "Focus Order", "Alt Text", "Color Blindness", "Motion", "Forms", "Navigation"],
  },
  {
    id: 20, name: "XFree Social Preview Tools", href: "/social-preview-tools", group: "web-seo",
    icon: "📱", clusters: 10, tools: 3, published: false,
    description: "Preview Open Graph and Twitter Cards across Facebook, LinkedIn, Slack, Discord, WhatsApp and email.",
    type: "tool",
    clusterList: ["OG Preview", "Twitter Card", "LinkedIn", "Facebook", "iMessage", "Slack", "Discord", "WhatsApp", "Email Preview", "Rich Snippets"],
  },

  // ═══════════ 3. AI & Automation ═══════════
  {
    id: 21, name: "XFree AI Tools", href: "/ai-tools", group: "ai-auto",
    icon: "🤖", clusters: 10, tools: 4, published: false,
    description: "Chat, completion, classification, summarization, translation, sentiment, entity extraction and embeddings.",
    type: "tool",
    clusterList: ["Chat", "Completion", "Classification", "Summarization", "Translation", "Sentiment", "Entity Extraction", "Topic Modeling", "Embeddings", "Generation"],
  },
  {
    id: 22, name: "XFree Prompt Tools", href: "/prompt-tools", group: "ai-auto",
    icon: "💬", clusters: 10, tools: 3, published: false,
    description: "Templates, token counter, chain builder, few-shot, system prompts, role playing and output formatting.",
    type: "tool",
    clusterList: ["Templates", "Token Counter", "Chain Builder", "Few-Shot", "System Prompts", "Role Playing", "Constraint Setting", "Output Formatting", "Evaluation", "Versioning"],
  },
  {
    id: 23, name: "XFree RAG Tools", href: "/rag-tools", group: "ai-auto",
    icon: "📎", clusters: 10, tools: 2, published: false,
    description: "Chunking, embeddings, retrieval, reranking, context window, hybrid search, citation and pipeline builder.",
    type: "tool",
    clusterList: ["Chunking", "Embeddings", "Retrieval", "Reranking", "Context Window", "Hybrid Search", "Metadata Filtering", "Citation", "Evaluation", "Pipeline Builder"],
  },
  {
    id: 24, name: "XFree LLM Tools", href: "/llm-tools", group: "ai-auto",
    icon: "🧠", clusters: 10, tools: 2, published: false,
    description: "Compare models, count tokens, estimate cost, benchmark, stream responses and route between providers.",
    type: "tool",
    clusterList: ["Model Comparison", "Token Limits", "Cost Calculator", "Benchmark", "Fine-Tuning Data", "Prompt Engineering", "Output Parsing", "Streaming", "Batch API", "Model Routing"],
  },
  {
    id: 25, name: "XFree Agent Tools", href: "/agent-tools", group: "ai-auto",
    icon: "🕵️", clusters: 10, tools: 3, published: false,
    description: "Tool schemas, function calling, memory, planning, reflection, multi-agent, orchestration and guardrails.",
    type: "tool",
    clusterList: ["Tool Schemas", "Function Calling", "Memory", "Planning", "Reflection", "Multi-Agent", "Orchestration", "Guardrails", "Observability", "Evaluation"],
  },
  {
    id: 26, name: "XFree MCP Tools", href: "/mcp-tools", group: "ai-auto",
    icon: "🔌", clusters: 10, tools: 1, published: false,
    description: "Manifest, server config, tool registration, resource binding, prompt templates, transport and discovery.",
    type: "tool",
    clusterList: ["Manifest", "Server Config", "Tool Registration", "Resource Binding", "Prompt Templates", "Transport", "Authentication", "Capabilities", "Discovery", "Testing"],
  },
  {
    id: 27, name: "XFree Agentic Workflows", href: "/agentic-workflows", group: "ai-auto",
    icon: "🔀", clusters: 10, tools: 2, published: false,
    description: "Workflow builder, step composition, branching, looping, error handling, human-in-loop and approval gates.",
    type: "tool",
    clusterList: ["Workflow Builder", "Step Composition", "Branching", "Looping", "Error Handling", "Human-in-Loop", "Approval Gates", "Scheduling", "Monitoring", "Export"],
  },
  {
    id: 28, name: "XFree Automation Tools", href: "/automation-tools", group: "ai-auto",
    icon: "⚡", clusters: 10, tools: 2, published: false,
    description: "Cron, webhooks, event triggers, batch jobs, queue, retry logic, scheduling and notifications.",
    type: "tool",
    clusterList: ["Cron", "Webhooks", "Event Triggers", "Batch Jobs", "Queue", "Retry Logic", "Scheduling", "Notifications", "Integrations", "Logging"],
  },
  {
    id: 29, name: "XFree AI Evaluation Tools", href: "/ai-evaluation-tools", group: "ai-auto",
    icon: "📏", clusters: 10, tools: 1, published: false,
    description: "Measure accuracy, BLEU, ROUGE, perplexity, human eval, LLM-as-judge, dataset split and regression.",
    type: "tool",
    clusterList: ["Accuracy", "BLEU", "ROUGE", "Perplexity", "Human Eval", "LLM-as-Judge", "Dataset Split", "A/B Testing", "Regression", "Reporting"],
  },
  {
    id: 30, name: "XFree AI Data Tools", href: "/ai-data-tools", group: "ai-auto",
    icon: "📊", clusters: 10, tools: 2, published: false,
    description: "Prepare, clean, label, augment, split, convert, deduplicate and export training datasets.",
    type: "tool",
    clusterList: ["Dataset Prep", "Cleaning", "Labeling", "Augmentation", "Split", "Format Conversion", "Annotation", "Deduplication", "Quality Filter", "Export"],
  },

  // ═══════════ 4. Media & Documents ═══════════
  {
    id: 31, name: "XFree Image Tools", href: "/image-tools", group: "media-docs",
    icon: "🖼️", clusters: 10, tools: 6, published: false,
    description: "Convert, compress, resize, crop, format, inspect metadata, watermark and batch-optimize images.",
    type: "tool",
    clusterList: ["Conversion", "Compression", "Resizing", "Cropping", "Format", "Metadata", "Color", "Watermark", "Batch", "Optimization"],
  },
  {
    id: 32, name: "XFree Video Tools", href: "/video", group: "media-docs",
    icon: "🎬", clusters: 10, tools: 8, published: false,
    description: "Trim, convert, frame-grab, generate thumbnails, mux audio, validate subtitles and compress.",
    type: "tool",
    clusterList: ["Trimming", "Conversion", "Frames", "Thumbnails", "Audio", "Subtitles", "Metadata", "Compression", "Streaming", "Validation"],
  },
  {
    id: 33, name: "XFree Audio Tools", href: "/audio-tools", group: "media-docs",
    icon: "🎵", clusters: 10, tools: 3, published: false,
    description: "Convert, compress, normalize, trim, analyze waveform, extract metadata and export audio.",
    type: "tool",
    clusterList: ["Conversion", "Compression", "Metadata", "Waveform", "Normalization", "Trimming", "Format", "Extraction", "Analysis", "Export"],
  },
  {
    id: 34, name: "XFree PDF Tools", href: "/pdf-tools", group: "media-docs",
    icon: "📄", clusters: 10, tools: 4, published: false,
    description: "Merge, split, compress, convert, watermark, OCR, manipulate pages and sign PDFs.",
    type: "tool",
    clusterList: ["Merge", "Split", "Compress", "Convert", "Metadata", "Watermark", "Extract Text", "Page Manipulation", "OCR", "Sign"],
  },
  {
    id: 35, name: "XFree Document Tools", href: "/document-tools", group: "media-docs",
    icon: "📝", clusters: 10, tools: 3, published: false,
    description: "Compare, merge, convert, template, version and export Word, RTF, ODT and plain text documents.",
    type: "tool",
    clusterList: ["Word", "Format Convert", "Template", "Compare", "Merge", "Extract", "Metadata", "Version", "Comment", "Export"],
  },
  {
    id: 36, name: "XFree Spreadsheet Tools", href: "/spreadsheet-tools", group: "media-docs",
    icon: "📊", clusters: 10, tools: 3, published: false,
    description: "Clean, merge, split, validate, transform, build formulas and export CSV and Excel sheets.",
    type: "tool",
    clusterList: ["CSV", "Excel", "Formula", "Pivot", "Clean", "Merge", "Split", "Validate", "Transform", "Export"],
  },
  {
    id: 37, name: "XFree Markdown Tools", href: "/markdown-tools", group: "media-docs",
    icon: "📑", clusters: 10, tools: 3, published: false,
    description: "Preview, convert, lint, generate TOC, validate frontmatter, links, tables and code blocks.",
    type: "tool",
    clusterList: ["Preview", "Convert", "Lint", "TOC", "Frontmatter", "Links", "Images", "Tables", "Code Blocks", "Export"],
  },
  {
    id: 38, name: "XFree Subtitle Tools", href: "/subtitle-tools", group: "media-docs",
    icon: "💬", clusters: 10, tools: 4, published: false,
    description: "Convert, validate, shift, merge, split and translate SRT, VTT and ASS subtitle files.",
    type: "tool",
    clusterList: ["SRT", "VTT", "ASS", "Timing", "Convert", "Validate", "Shift", "Merge", "Split", "Translate"],
  },
  {
    id: 39, name: "XFree File Tools", href: "/file-tools", group: "media-docs",
    icon: "📁", clusters: 10, tools: 3, published: false,
    description: "Convert, compress, rename, checksum, deduplicate, organize and export files in bulk.",
    type: "tool",
    clusterList: ["Convert", "Compress", "Rename", "Compare", "Checksum", "Metadata", "Batch", "Organize", "Duplicate Finder", "Export"],
  },
  {
    id: 40, name: "XFree Creative Tools", href: "/creative-tools", group: "media-docs",
    icon: "🎨", clusters: 10, tools: 2, published: false,
    description: "Generate color palettes, gradients, patterns, SVG, icons, typography and templates.",
    type: "tool",
    clusterList: ["Color Palette", "Gradient", "Pattern", "SVG", "Icon", "Typography", "Layout", "Mockup", "Export", "Template"],
  },

  // ═══════════ 5. Security & Network ═══════════
  {
    id: 41, name: "XFree Security Tools", href: "/security-tools", group: "security",
    icon: "🔒", clusters: 10, tools: 5, published: false,
    description: "Audit headers, scan CSP, validate HSTS, audit cookies, CORS and compliance.",
    type: "tool",
    clusterList: ["Audit", "Scan", "Headers", "CSP", "HSTS", "Permissions", "Cookies", "CORS", "CSP Report", "Compliance"],
  },
  {
    id: 42, name: "XFree Hash Tools", href: "/hash-tools", group: "security",
    icon: "#️⃣", clusters: 10, tools: 3, published: false,
    description: "Compute SHA-256, SHA-1, MD5, Bcrypt, Argon2, HMAC, file hashes and verify integrity.",
    type: "tool",
    clusterList: ["SHA-256", "SHA-1", "MD5", "Bcrypt", "Argon2", "HMAC", "File Hash", "Compare", "Batch", "Verify"],
  },
  {
    id: 43, name: "XFree Password Tools", href: "/password-tools", group: "security",
    icon: "🔑", clusters: 10, tools: 3, published: false,
    description: "Generate, audit, validate, rotate and export strong passwords with entropy analysis.",
    type: "tool",
    clusterList: ["Generate", "Strength", "Policy", "Manager", "History", "Breach Check", "Entropy", "Pattern", "Export", "Rotate"],
  },
  {
    id: 44, name: "XFree JWT & Token Tools", href: "/token-tools", group: "security",
    icon: "🎫", clusters: 10, tools: 3, published: true,
    description: "Decode, validate, sign, verify and inspect OAuth JWT headers, payloads, claims and expiry.",
    type: "tool",
    clusterList: ["Decode", "Validate", "Sign", "Verify", "Header", "Payload", "Claims", "Expiry", "Refresh", "Revoke"],
  },
  {
    id: 45, name: "XFree Privacy Tools", href: "/privacy-tools", group: "security",
    icon: "🛡️", clusters: 10, tools: 2, published: false,
    description: "Detect trackers, audit cookies, check fingerprinting, DNS leak, WebRTC, referrer and permissions.",
    type: "tool",
    clusterList: ["Tracker Detection", "Cookie Audit", "Fingerprint", "DNS Leak", "WebRTC", "Referrer", "Permission", "Data Request", "Anonymize", "Policy"],
  },
  {
    id: 46, name: "XFree Network Tools", href: "/network-tools", group: "security",
    icon: "🌐", clusters: 10, tools: 3, published: false,
    description: "Calculate IP, subnet, CIDR, ping, traceroute, WHOIS, port scan, latency and bandwidth.",
    type: "tool",
    clusterList: ["IP Calc", "Subnet", "CIDR", "Ping", "Traceroute", "WHOIS", "Port Scan", "Bandwidth", "Latency", "Protocol"],
  },
  {
    id: 47, name: "XFree DNS Tools", href: "/dns-tools", group: "security",
    icon: "📡", clusters: 10, tools: 3, published: false,
    description: "Lookup DNS records, check propagation, validate DNSSEC, reverse, MX, TXT, SPF, DKIM and DMARC.",
    type: "tool",
    clusterList: ["Lookup", "Records", "Propagation", "DNSSEC", "Reverse", "MX", "TXT", "SPF", "DKIM", "DMARC"],
  },
  {
    id: 48, name: "XFree HTTP Tools", href: "/http-tools", group: "security",
    icon: "📡", clusters: 10, tools: 3, published: false,
    description: "Inspect HTTP headers, status codes, methods, CORS, cookies, auth, redirect, cache and compression.",
    type: "tool",
    clusterList: ["Headers", "Status Codes", "Methods", "CORS", "Cookies", "Auth", "Redirect", "Cache", "Compression", "Timing"],
  },
  {
    id: 49, name: "XFree Certificate Tools", href: "/certificate-tools", group: "security",
    icon: "📜", clusters: 10, tools: 2, published: false,
    description: "Check SSL, expiry, chain, generate CSR, convert PEM, compare, install, renew and validate HSTS.",
    type: "tool",
    clusterList: ["SSL Check", "Expiry", "Chain", "CSR", "PEM", "Convert", "Compare", "Install", "Renew", "HSTS"],
  },
  {
    id: 50, name: "XFree Security Header Tools", href: "/security-header-tools", group: "security",
    icon: "🛡️", clusters: 10, tools: 2, published: false,
    description: "Build CSP, HSTS, X-Frame, X-Content, Referrer, Permissions, Feature Policy, Report-To, COOP and COEP headers.",
    type: "tool",
    clusterList: ["CSP Builder", "HSTS", "X-Frame", "X-Content", "Referrer", "Permissions", "Feature Policy", "Report-To", "COOP", "COEP"],
  },

  // ═══════════ 6. Business & Productivity ═══════════
  {
    id: 51, name: "XFree Text Tools", href: "/text-tools", group: "business",
    icon: "📝", clusters: 10, tools: 8, published: true,
    description: "Count words, convert case, sort, deduplicate, find-and-replace, diff and normalize text.",
    type: "tool",
    clusterList: ["Word Count", "Case Convert", "Sort Lines", "Deduplicate", "Find Replace", "Regex", "Diff", "Normalize", "Encode", "Transform"],
  },
  {
    id: 52, name: "XFree Content Tools", href: "/content-tools", group: "business",
    icon: "✍️", tools: 3, clusters: 10, published: false,
    description: "Score readability, structure outlines, headings, tone, length, SEO and plagiarism risk.",
    type: "tool",
    clusterList: ["Readability", "Structure", "Outline", "Headings", "Tone", "Length", "SEO Score", "Plagiarism", "Outline", "Publish"],
  },
  {
    id: 53, name: "XFree Writing Tools", href: "/writing-tools", group: "business",
    icon: "🖊️", tools: 2, clusters: 10, published: false,
    description: "Improve grammar, style, clarity, conciseness, active voice, jargon, tone and audience fit.",
    type: "tool",
    clusterList: ["Grammar", "Style", "Clarity", "Conciseness", "Active Voice", "Jargon", "Tone", "Audience", "Template", "Export"],
  },
  {
    id: 54, name: "XFree Calculator Tools", href: "/calculators", group: "business",
    icon: "🔢", tools: 4, clusters: 10, published: false,
    description: "Unit conversion, math, percentages, ratios, scientific, statistical, financial and custom calculators.",
    type: "tool",
    clusterList: ["Unit Convert", "Math", "Percentage", "Ratio", "Scientific", "Statistical", "Financial", "Health", "Construction", "Custom"],
  },
  {
    id: 55, name: "XFree Date & Time Tools", href: "/date-time-tools", group: "business",
    icon: "📅", tools: 3, clusters: 10, published: false,
    description: "Timestamps, timezones, durations, countdowns, calendars, cron expressions and age calculations.",
    type: "tool",
    clusterList: ["Timestamp", "Timezone", "Duration", "Countdown", "Calendar", "Cron", "Format", "Diff", "Business Days", "Age"],
  },
  {
    id: 56, name: "XFree Finance Tools", href: "/finance-tools", group: "business",
    icon: "💰", tools: 3, clusters: 10, published: false,
    description: "SIP, EMI, compound interest, loans, investments, tax, currency, budget, depreciation and ROI.",
    type: "tool",
    clusterList: ["SIP", "EMI", "Compound Interest", "Loan", "Investment", "Tax", "Currency", "Budget", "Depreciation", "ROI"],
  },
  {
    id: 57, name: "XFree Marketing Tools", href: "/marketing-tools", group: "business",
    icon: "📣", tools: 2, clusters: 10, published: false,
    description: "UTM builder, campaigns, email subject lines, A/B tests, funnels, ROI, personas, copy and analytics.",
    type: "tool",
    clusterList: ["UTM Builder", "Campaign", "Email Subject", "A/B Test", "Funnel", "ROI", "Persona", "Copy", "Landing Page", "Analytics"],
  },
  {
    id: 58, name: "XFree Productivity Tools", href: "/productivity-tools", group: "business",
    icon: "⚡", tools: 2, clusters: 10, published: false,
    description: "Timer, pomodoro, notes, checklists, habits, goals, focus, templates and sync.",
    type: "tool",
    clusterList: ["Timer", "Pomodoro", "Notes", "Checklist", "Habit", "Goal", "Focus", "Template", "Export", "Sync"],
  },
  {
    id: 59, name: "XFree Education Tools", href: "/education-tools", group: "business",
    icon: "🎓", tools: 1, clusters: 10, published: false,
    description: "Flashcards, quizzes, grading, rubrics, lesson plans, curriculum, citation and bibliography.",
    type: "tool",
    clusterList: ["Flashcard", "Quiz", "Grade", "Rubric", "Lesson Plan", "Curriculum", "Citation", "Bibliography", "Study Guide", "Export"],
  },
  {
    id: 60, name: "XFree Business Tools", href: "/business-tools", group: "business",
    icon: "💼", tools: 2, clusters: 10, published: false,
    description: "Invoices, proposals, contracts, reports, presentations, charts, org charts, SWOT, KPI and dashboards.",
    type: "tool",
    clusterList: ["Invoice", "Proposal", "Contract", "Report", "Presentation", "Chart", "Org Chart", "SWOT", "KPI", "Dashboard"],
  },

  // ═══════════ 9 platform pillars (61–69) ═══════════
  {
    id: 61, name: "XFree Studio", href: "https://app.xfree.in/", group: "platform",
    icon: "⚡", tools: 0, clusters: 0, published: true,
    description: "Open XFree Studio — the browser-based tool execution environment.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 62, name: "XFree OpenHost", href: "/openhost", group: "platform",
    icon: "🌐", tools: 0, clusters: 0, published: false,
    description: "Discover, run and share XFree tools in your browser with no install required.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 63, name: "XFree Downloads", href: "/downloads", group: "platform",
    icon: "📦", tools: 0, clusters: 0, published: false,
    description: "Download offline bundles and standalone tool snapshots for local use.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 64, name: "XFree How It Works", href: "/how-it-works", group: "platform",
    icon: "🔧", tools: 0, clusters: 0, published: true,
    description: "How XFree tools run entirely in your browser without a backend roundtrip.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 65, name: "XFree Use Cases", href: "/use-cases", group: "platform",
    icon: "💡", tools: 0, clusters: 0, published: true,
    description: "Real workflows that combine multiple XFree tools to ship faster.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 66, name: "XFree Documentation", href: "/docs", group: "platform",
    icon: "📚", tools: 0, clusters: 0, published: true,
    description: "Reference documentation for the XFree platform, APIs and CLI.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 67, name: "XFree Guides", href: "/guides", group: "platform",
    icon: "📖", tools: 0, clusters: 0, published: true,
    description: "Long-form guides that walk through common XFree workflows.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 68, name: "XFree Blog", href: "/blog", group: "platform",
    icon: "✍️", tools: 0, clusters: 0, published: true,
    description: "XFree product news, engineering deep-dives and ecosystem updates.",
    type: "platform",
    clusterList: [],
  },
  {
    id: 69, name: "XFree Pillar Directory", href: "/pillars", group: "platform",
    icon: "🗂️", tools: 0, clusters: 0, published: true,
    description: "The complete XFree pillar taxonomy: 69 pillars, 600 clusters, fully governed.",
    type: "platform",
    clusterList: [],
  },
];

/**
 * Canonical six dropdown groups, in display order. Items appear in the
 * order of pillar ids 1..60. The "platform" group is the ninth nav
 * surface (Studio, OpenHost, Downloads, etc.), not a 7th menu.
 */
export const HEADER_GROUPS: { label: string; group: PillarGroup; items: { label: string; href: string }[] }[] = [
  {
    label: "XFree Dev & Data",
    group: "dev-data",
    items: PILLARS.filter((p) => p.group === "dev-data" && p.type === "tool").map((p) => ({ label: p.name, href: p.href })),
  },
  {
    label: "XFree Web & SEO",
    group: "web-seo",
    items: PILLARS.filter((p) => p.group === "web-seo" && p.type === "tool").map((p) => ({ label: p.name, href: p.href })),
  },
  {
    label: "XFree AI & Automation",
    group: "ai-auto",
    items: PILLARS.filter((p) => p.group === "ai-auto" && p.type === "tool").map((p) => ({ label: p.name, href: p.href })),
  },
  {
    label: "XFree Media & Documents",
    group: "media-docs",
    items: PILLARS.filter((p) => p.group === "media-docs" && p.type === "tool").map((p) => ({ label: p.name, href: p.href })),
  },
  {
    label: "XFree Security & Network",
    group: "security",
    items: PILLARS.filter((p) => p.group === "security" && p.type === "tool").map((p) => ({ label: p.name, href: p.href })),
  },
  {
    label: "XFree Business & Productivity",
    group: "business",
    items: PILLARS.filter((p) => p.group === "business" && p.type === "tool").map((p) => ({ label: p.name, href: p.href })),
  },
];

/** All pillars that are eligible to be exposed in navigation and sitemaps. */
export const PUBLIC_PILLARS: Pillar[] = PILLARS.filter((p) => p.published);

export const PUBLIC_TOOL_PILLARS: Pillar[] = PUBLIC_PILLARS.filter((p) => p.type === "tool");

export const PUBLIC_PILLAR_HREFS: Set<string> = new Set(PUBLIC_PILLARS.map((p) => p.href));

/**
 * Public header groups: only include items whose pillar is published, and
 * drop any group that ends up empty. The platform group (Studio, etc.) is
 * not a header dropdown — it is rendered as a separate top-level surface.
 */
export const PUBLIC_HEADER_GROUPS = HEADER_GROUPS.map((g) => ({
  label: g.label,
  group: g.group,
  items: g.items.filter((item) => PUBLIC_PILLAR_HREFS.has(item.href)),
})).filter((g) => g.items.length > 0);

export function findPillarByHref(href: string): Pillar | undefined {
  return PILLARS.find((p) => p.href === href);
}

export function isPublishedPillarHref(href: string): boolean {
  return PUBLIC_PILLAR_HREFS.has(href);
}
