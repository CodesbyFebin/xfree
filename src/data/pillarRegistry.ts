/**
 * Authoritative registry of the 60 topical pillars that organize the
 * XFree tool catalogue. Each pillar maps to a category cluster and
 * cross-links to its sibling pillars via `relatedPillarSlugs`.
 *
 * The pillar data below is the single source of truth for:
 *   — navigation group ordering (6 categories)
 *   — pillar hub routes (`/pillars/:slug`)
 *   — category hub routes (`/category/:categorySlug`)
 *   — related-pillar interlinking (editorial cross-links)
 *   — keyword targeting for SEO / AEO / GEO
 */

export type PillarCategory =
  | "dev-data"
  | "web-seo"
  | "ai-auto"
  | "media-docs"
  | "security"
  | "business";

export interface PillarDefinition {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  fullDescription?: string;
  icon: string;
  emoji: string;
  category: PillarCategory;
  keywords: string[];
  relatedPillarSlugs: string[];
  lastReviewed: string;
  num: string;
  id?: string;
  headerGroup?: PillarCategory;
  status?: "published" | "draft";
  indexable?: boolean;
  contentApproved?: boolean;
}

export const PILLAR_CATEGORIES: ReadonlyArray<{
  id: PillarCategory;
  label: string;
  description: string;
  icon: string;
}> = [
  { id: "dev-data", label: "Developer & Data Tools", description: "Formatters, validators, debuggers, regex, encoding, converters", icon: "⚡" },
  { id: "web-seo", label: "Web & SEO Tools", description: "Sitemaps, meta tags, schema, crawl, performance, accessibility", icon: "🌐" },
  { id: "ai-auto", label: "AI & Automation Tools", description: "Prompt engineering, LLM tools, agents, RAG, MCP workflows", icon: "🧠" },
  { id: "media-docs", label: "Media & Documents Tools", description: "Image, video, audio, PDF, documents, spreadsheets, markdown", icon: "📁" },
  { id: "security", label: "Security & Privacy Tools", description: "Hash, passwords, JWT, DNS, HTTP, certificates, encryption", icon: "🔒" },
  { id: "business", label: "Business & Productivity Tools", description: "Text, writing, calculators, finance, marketing, productivity", icon: "💼" },
];

export const PILLARS_60: ReadonlyArray<PillarDefinition> = [
  { slug: "dev-tools", num: "01", name: "XFree Developer Tools", tagline: "Formatters, validators, debuggers, regex, encoding, converters, base64, JWT, UUID, cron, SQL, hex, YAML", description: "XFree developer tools: format, validate, debug, and convert structured data without signup. 100% client-side.", emoji: "⚡", icon: "code", category: "dev-data", keywords: ["developer tools", "json formatter", "regex tester", "base64 encoder", "jwt decoder", "uuid generator", "cron generator", "sql formatter", "yaml validator", "hex to text"], relatedPillarSlugs: ["json-data-tools", "regex-tools", "encoding-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "json-data-tools", num: "02", name: "XFree JSON Data Tools", tagline: "JSON formatter, validator, flattener, sorter, diff, converter", description: "XFree JSON data tools: format, validate, flatten, sort, diff, and convert JSON data. No server, no signup.", emoji: "🧩", icon: "json", category: "dev-data", keywords: ["json formatter", "json validator", "json flattener", "json sorter", "json diff", "json to csv", "json to yaml", "json minify", "json parse"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "code-formatting-tools", num: "03", name: "XFree Code Formatting Tools", tagline: "HTML, CSS, JS, TypeScript, XML, SQL formatter and minifier", description: "XFree code formatting tools: beautify, minify, and lint HTML, CSS, JS, TypeScript, XML, SQL, and more.", emoji: "✨", icon: "format", category: "dev-data", keywords: ["html formatter", "css minifier", "js formatter", "typescript formatter", "xml formatter", "sql formatter", "code beautifier", "code minifier"], relatedPillarSlugs: ["dev-tools", "regex-tools", "encoding-tools"], lastReviewed: "2026-09-05" },
  { slug: "api-tools", num: "04", name: "XFree API Development Tools", tagline: "OpenAPI spec validator, endpoint tester, request builder, curl generator", description: "XFree API tools: validate OpenAPI specs, test endpoints, build requests, and generate curl commands.", emoji: "🔌", icon: "api", category: "dev-data", keywords: ["openapi validator", "api tester", "rest client", "curl generator", "swagger validator", "graphql explorer", "endpoint monitor", "request builder"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "encoding-tools", "security-tools"], lastReviewed: "2026-09-05" },
  { slug: "database-tools", num: "05", name: "XFree Database Tools", tagline: "SQL formatter, query builder, schema designer, migration generator", description: "XFree database tools: format SQL, build queries, design schemas, and generate migrations.", emoji: "🗄️", icon: "database", category: "dev-data", keywords: ["sql formatter", "sql validator", "query builder", "schema designer", "migration generator", "mongodb formatter", "postgresql utils"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "encoding-tools"], lastReviewed: "2026-09-05" },
  { slug: "regex-tools", num: "06", name: "XFree Regex Tools", tagline: "Regex tester, explainer, builder, cheat sheet, pattern library", description: "XFree regex tools: test, explain, and build regex patterns with match groups and explanations.", emoji: "🔍", icon: "regex", category: "dev-data", keywords: ["regex tester", "regex explainer", "regex builder", "regex cheat sheet", "pattern matcher", "regex debugger", "regex library"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "json-data-tools"], lastReviewed: "2026-09-05" },
  { slug: "encoding-tools", num: "07", name: "XFree Encoding Tools", tagline: "Base64, URL, hex, binary, ASCII converter encoder decoder", description: "XFree encoding tools: convert between Base64, URL, hex, binary, ASCII, and more formats.", emoji: "🔤", icon: "encode", category: "dev-data", keywords: ["base64 encoder", "base64 decoder", "url encoder", "hex converter", "binary converter", "ascii converter", "encoding checker"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "regex-tools"], lastReviewed: "2026-09-05" },
  { slug: "converters", num: "08", name: "XFree File Converters", tagline: "JSON to CSV, YAML to JSON, XML to JSON, CSV to JSON, data format conversion", description: "XFree file converters: transform between JSON, CSV, YAML, XML, and other data formats.", emoji: "🔄", icon: "convert", category: "dev-data", keywords: ["json to csv", "yaml to json", "xml to json", "csv to json", "json to yaml", "data format converter"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "json-data-tools"], lastReviewed: "2026-09-05" },
  { slug: "validators", num: "09", name: "XFree Data Validators", tagline: "JSON schema validator, HTML validator, CSS validator, XML validator", description: "XFree validators: validate JSON Schema, HTML, CSS, XML, and other structured documents.", emoji: "✓", icon: "validate", category: "dev-data", keywords: ["json schema validator", "html validator", "css validator", "xml validator", "data validator", "syntax checker", "format validator"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "generators", num: "10", name: "XFree Online Generators", tagline: "UUID v4, QR code, password, cron, lorem ipsum, API key, hash generator", description: "XFree generators: create UUIDs, QR codes, passwords, cron expressions, and other random data.", emoji: "🎲", icon: "generate", category: "dev-data", keywords: ["uuid v4 generator", "qr code generator", "password generator", "cron expression generator", "random string generator", "api key generator", "fake data generator"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "password-tools"], lastReviewed: "2026-09-05" },
  { slug: "web-tools", num: "11", name: "XFree Web Tools", tagline: "HTTP headers, status codes, URL parser, cookies, user agent, redirect checker", description: "XFree web tools: inspect HTTP headers, status codes, URLs, cookies, and user agents.", emoji: "🌐", icon: "web", category: "web-seo", keywords: ["http header checker", "status code lookup", "url parser", "cookie inspector", "user agent parser", "redirect checker", "web inspector"], relatedPillarSlugs: ["dev-tools", "url-tools", "http-tools"], lastReviewed: "2026-09-05" },
  { slug: "seo-tools", num: "12", name: "XFree SEO Tools", tagline: "Keyword rank tracker, SERP checker, backlink analyzer, meta tags, sitemap", description: "XFree SEO tools: check keyword rankings, SERP positions, backlinks, meta tags, and sitemaps.", emoji: "📈", icon: "seo", category: "web-seo", keywords: ["seo tools", "keyword rank tracker", "serp checker", "backlink analyzer", "meta tag generator", "sitemap generator", "seo audit"], relatedPillarSlugs: ["dev-tools", "metadata-tools", "schema-tools", "crawl-indexing-tools"], lastReviewed: "2026-09-05" },
  { slug: "url-tools", num: "13", name: "XFree URL Tools", tagline: "URL parser, encoder, shortener, redirect checker, UTM builder, slug generator", description: "XFree URL tools: parse, encode, shorten, and check redirects for URLs.", emoji: "🔗", icon: "url", category: "web-seo", keywords: ["url parser", "url encoder", "url shortener", "redirect checker", "utm builder", "slug generator", "url expander"], relatedPillarSlugs: ["dev-tools", "web-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "schema-tools", num: "14", name: "XFree Schema Markup Tools", tagline: "JSON-LD generator, schema validator, structured data tester, FAQ, HowTo, Breadcrumb", description: "XFree schema tools: generate and validate JSON-LD structured data markup for SEO.", emoji: "🏷️", icon: "schema", category: "web-seo", keywords: ["json-ld generator", "schema markup validator", "structured data tester", "faq schema", "howto schema", "breadcrumb schema", "rich results"], relatedPillarSlugs: ["dev-tools", "seo-tools", "url-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "crawl-indexing-tools", num: "15", name: "XFree Crawl & Indexing Tools", tagline: "Sitemap generator, robots.txt checker, fetch as Google, URL inspection, crawl delay", description: "XFree crawl and indexing tools: generate sitemaps, check robots.txt, and simulate fetch.", emoji: "🕷️", icon: "crawl", category: "web-seo", keywords: ["sitemap generator", "robots.txt checker", "fetch as google", "url inspection", "crawl delay", "indexing tool"], relatedPillarSlugs: ["dev-tools", "seo-tools", "url-tools"], lastReviewed: "2026-09-05" },
  { slug: "website-audit-tools", num: "16", name: "XFree Website Audit Tools", tagline: "SEO audit, page speed, mobile-friendly, broken links, meta descriptions, canonical tags", description: "XFree website audit tools: analyze SEO performance, page speed, mobile-friendliness, and broken links.", emoji: "🔍", icon: "audit", category: "web-seo", keywords: ["website audit", "page speed test", "mobile-friendly test", "broken link checker", "seo audit tool", "canonical checker"], relatedPillarSlugs: ["dev-tools", "seo-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "metadata-tools", num: "17", name: "XFree Metadata Tools", tagline: "Meta tag generator, title/description checker, OG preview, Twitter cards, canonical tags", description: "XFree metadata tools: generate and preview meta tags for search and social.", emoji: "📝", icon: "meta", category: "web-seo", keywords: ["meta tag generator", "title checker", "description editor", "og preview", "twitter card generator", "canonical tag", "meta tags"], relatedPillarSlugs: ["dev-tools", "seo-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "performance-tools", num: "18", name: "XFree Performance Tools", tagline: "Page speed, compression, minify, image optimization, lazy load, cache headers", description: "XFree performance tools: analyze and optimize page load speed, compression, and caching.", emoji: "⚡", icon: "perf", category: "web-seo", keywords: ["page speed test", "gzip compression", "minify css js", "image optimization", "lazy loading", "cache headers", "performance audit"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05" },
  { slug: "accessibility-tools", num: "19", name: "XFree Accessibility Tools", tagline: "WCAG checker, alt text generator, contrast ratio, ARIA validator, screen reader test", description: "XFree accessibility tools: check WCAG compliance, generate alt text, and validate ARIA markup.", emoji: "♿", icon: "a11y", category: "web-seo", keywords: ["wcag checker", "alt text generator", "contrast ratio", "aria validator", "accessibility test", "screen reader simulation"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05" },
  { slug: "social-preview-tools", num: "20", name: "XFree Social Preview Tools", tagline: "OG image preview, Twitter card, Facebook scraper, link preview, embed generator", description: "XFree social preview tools: generate and preview Open Graph images and social card metadata.", emoji: "📲", icon: "social", category: "web-seo", keywords: ["og image preview", "twitter card preview", "facebook link preview", "social embed generator", "og tags", "social media preview"], relatedPillarSlugs: ["dev-tools", "seo-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "ai-tools", num: "21", name: "XFree AI Tools", tagline: "AI text generator, image generator, chatbot, code assistant, summarizer, translator", description: "XFree AI tools: generate text, images, code, and summaries using AI models.", emoji: "🧠", icon: "ai", category: "ai-auto", keywords: ["ai text generator", "ai image generator", "chatbot", "code assistant", "text summarizer", "ai translator", "ai tools"], relatedPillarSlugs: ["dev-tools", "prompt-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "prompt-tools", num: "22", name: "XFree Prompt Engineering Tools", tagline: "Prompt optimizer, A/B tester, chain-of-thought builder, prompt library, token counter", description: "XFree prompt tools: optimize, test, and build prompts for AI models.", emoji: "💬", icon: "prompt", category: "ai-auto", keywords: ["prompt optimizer", "prompt tester", "chain of thought", "prompt library", "token counter", "prompt engineering"], relatedPillarSlugs: ["dev-tools", "ai-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "rag-tools", num: "23", name: "XFree RAG Tools", tagline: "Document chunking, embedding generator, vector DB tester, retrieval evaluator, knowledge base builder", description: "XFree RAG tools: chunk documents, generate embeddings, and build retrieval systems.", emoji: "📚", icon: "rag", category: "ai-auto", keywords: ["document chunking", "embedding generator", "vector database", "retrieval evaluator", "knowledge base builder", "rag tools"], relatedPillarSlugs: ["dev-tools", "ai-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "llm-tools", num: "24", name: "XFree LLM Tools", tagline: "Token counter, model comparator, prompt cost calculator, output parser, temperature tester", description: "XFree LLM tools: count tokens, compare models, and calculate costs for AI inference.", emoji: "🧮", icon: "llm", category: "ai-auto", keywords: ["token counter", "model comparator", "prompt cost calculator", "output parser", "temperature tester"], relatedPillarSlugs: ["dev-tools", "ai-tools", "prompt-tools"], lastReviewed: "2026-09-05" },
  { slug: "agent-tools", num: "25", name: "XFree AI Agent Tools", tagline: "Agent runner, tool use simulator, planning engine, memory builder, action logger", description: "XFree agent tools: run, simulate, and debug AI agents with tool use and planning.", emoji: "🤖", icon: "agent", category: "ai-auto", keywords: ["ai agent", "agent runner", "tool use simulator", "planning engine", "agent memory"], relatedPillarSlugs: ["dev-tools", "ai-tools", "mcp-tools"], lastReviewed: "2026-09-05" },
  { slug: "mcp-tools", num: "26", name: "XFree MCP Tools", tagline: "MCP server tester, client builder, protocol inspector, spec validator, integration generator", description: "XFree MCP tools: test, build, and inspect Model Context Protocol servers.", emoji: "🔌", icon: "mcp", category: "ai-auto", keywords: ["mcp tools", "mcp server", "mcp client", "protocol inspector", "mcp spec validator"], relatedPillarSlugs: ["dev-tools", "ai-tools", "agent-tools"], lastReviewed: "2026-09-05" },
  { slug: "agentic-workflows", num: "27", name: "XFree Agentic Workflows", tagline: "Workflow designer, chain builder, trigger configurator, state manager, output validator", description: "XFree agentic workflow tools: design, build, and manage automated AI workflows.", emoji: "🔄", icon: "workflow", category: "ai-auto", keywords: ["agentic workflow", "workflow designer", "chain builder", "trigger configurator", "state manager"], relatedPillarSlugs: ["dev-tools", "ai-tools", "agent-tools"], lastReviewed: "2026-09-05" },
  { slug: "automation-tools", num: "28", name: "XFree Automation Tools", tagline: "Zapier alternative, webhook tester, API connector, schedule runner, notification builder", description: "XFree automation tools: create automations, test webhooks, and connect APIs.", emoji: "🎛️", icon: "auto", category: "ai-auto", keywords: ["automation tools", "zapier alternative", "webhook tester", "api connector", "schedule runner"], relatedPillarSlugs: ["dev-tools", "ai-tools", "api-tools"], lastReviewed: "2026-09-05" },
  { slug: "ai-evaluation-tools", num: "29", name: "XFree AI Evaluation Tools", tagline: "Prompt evaluator, output scorer, bias detector, hallucination checker, test case generator", description: "XFree AI evaluation tools: test, score, and audit AI model outputs for quality and bias.", emoji: "📊", icon: "eval", category: "ai-auto", keywords: ["ai evaluation", "prompt evaluator", "output scorer", "bias detector", "hallucination checker"], relatedPillarSlugs: ["dev-tools", "ai-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "ai-data-tools", num: "30", name: "XFree AI Data Tools", tagline: "Dataset cleaner, prompt dataset builder, data labeler, synthetic data generator, data validator", description: "XFree AI data tools: clean, generate, and validate datasets for AI training.", emoji: "📂", icon: "aidata", category: "ai-auto", keywords: ["ai data tools", "dataset cleaner", "synthetic data generator", "data labeler", "prompt dataset"], relatedPillarSlugs: ["dev-tools", "ai-tools", "json-data-tools"], lastReviewed: "2026-09-05" },
  { slug: "image-tools", num: "31", name: "XFree Image Tools", tagline: "Image resizer, format converter, compressor, watermark, crop, rotate, background remover", description: "XFree image tools: resize, convert, compress, and edit images directly in the browser.", emoji: "🖼️", icon: "image", category: "media-docs", keywords: ["image resizer", "image converter", "image compressor", "watermark tool", "image crop", "background remover"], relatedPillarSlugs: ["dev-tools", "converters", "file-tools"], lastReviewed: "2026-09-05" },
  { slug: "video", num: "32", name: "XFree Video Tools", tagline: "Video converter, compressor, cutter, gif maker, thumbnail, subtitle adder, mp4 to mp3", description: "XFree video tools: convert, compress, cut, and edit videos in the browser.", emoji: "🎬", icon: "video", category: "media-docs", keywords: ["video converter", "video compressor", "video cutter", "gif maker", "thumbnail generator", "mp4 to mp3"], relatedPillarSlugs: ["dev-tools", "image-tools", "audio-tools"], lastReviewed: "2026-09-05" },
  { slug: "audio-tools", num: "33", name: "XFree Audio Tools", tagline: "Audio converter, compressor, cutter, mp3 to wav, voice changer, noise reducer, waveform", description: "XFree audio tools: convert, compress, cut, and edit audio files in the browser.", emoji: "🎵", icon: "audio", category: "media-docs", keywords: ["audio converter", "audio compressor", "audio cutter", "mp3 to wav", "voice changer", "noise reducer"], relatedPillarSlugs: ["dev-tools", "video", "image-tools"], lastReviewed: "2026-09-05" },
  { slug: "pdf-tools", num: "34", name: "XFree PDF Tools", tagline: "Merge, split, compress, rotate, delete pages, extract text, watermark, convert PDF", description: "XFree PDF tools: merge, split, compress, and edit PDF documents in the browser.", emoji: "📄", icon: "pdf", category: "media-docs", keywords: ["pdf merge", "pdf split", "pdf compress", "pdf rotate", "extract pdf text", "pdf watermark", "pdf converter"], relatedPillarSlugs: ["dev-tools", "document-tools", "converters"], lastReviewed: "2026-09-05" },
  { slug: "document-tools", num: "35", name: "XFree Document Tools", tagline: "Word to PDF, DOCX editor, text extractor, page counter, format converter, metadata remover", description: "XFree document tools: edit, convert, and extract text from Word, DOCX, and other documents.", emoji: "📝", icon: "doc", category: "media-docs", keywords: ["word to pdf", "docx editor", "text extractor", "page counter", "document converter"], relatedPillarSlugs: ["dev-tools", "pdf-tools", "markdown-tools"], lastReviewed: "2026-09-05" },
  { slug: "spreadsheet-tools", num: "36", name: "XFree Spreadsheet Tools", tagline: "Excel editor, CSV manager, formula tester, chart generator, pivot table, data validator", description: "XFree spreadsheet tools: edit CSV/Excel files, test formulas, and generate charts.", emoji: "📊", icon: "sheet", category: "media-docs", keywords: ["excel editor", "csv manager", "formula tester", "chart generator", "pivot table"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "converters"], lastReviewed: "2026-09-05" },
  { slug: "markdown-tools", num: "37", name: "XFree Markdown Tools", tagline: "Markdown to HTML, HTML to Markdown, preview, linter, table generator, TOC builder", description: "XFree markdown tools: convert between Markdown and HTML, preview, and lint Markdown files.", emoji: "📜", icon: "md", category: "media-docs", keywords: ["markdown to html", "html to markdown", "markdown preview", "markdown linter", "table generator", "toc builder"], relatedPillarSlugs: ["dev-tools", "converters", "document-tools"], lastReviewed: "2026-09-05" },
  { slug: "subtitle-tools", num: "38", name: "XFree Subtitle Tools", tagline: "Subtitle converter, editor, translator, synchronizer, format converter, generator", description: "XFree subtitle tools: convert, edit, translate, and synchronize subtitle files.", emoji: "🎞️", icon: "subtitle", category: "media-docs", keywords: ["subtitle converter", "subtitle editor", "subtitle translator", "subtitle synchronizer", "srt converter"], relatedPillarSlugs: ["dev-tools", "converters", "video"], lastReviewed: "2026-09-05" },
  { slug: "file-tools", num: "39", name: "XFree File Tools", tagline: "File compressor, type detector, size analyzer, extension changer, duplicate finder, merger", description: "XFree file tools: compress, detect types, analyze sizes, and manage files in the browser.", emoji: "📦", icon: "file", category: "media-docs", keywords: ["file compressor", "file type detector", "file size analyzer", "extension changer", "duplicate finder"], relatedPillarSlugs: ["dev-tools", "image-tools", "pdf-tools"], lastReviewed: "2026-09-05" },
  { slug: "creative-tools", num: "40", name: "XFree Creative Tools", tagline: "Color palette, gradient generator, palette extractor, font pairer, SVG editor, icon finder", description: "XFree creative tools: generate color palettes, gradients, and pair fonts for design projects.", emoji: "🎨", icon: "creative", category: "media-docs", keywords: ["color palette generator", "gradient generator", "palette extractor", "font pairer", "svg editor", "icon finder"], relatedPillarSlugs: ["dev-tools", "image-tools", "text-tools"], lastReviewed: "2026-09-05" },
  { slug: "security-tools", num: "41", name: "XFree Security Tools", tagline: "SSL checker, security headers, port scanner, vulnerability scanner, password strength, CSRF tester", description: "XFree security tools: check SSL, scan headers, and test for vulnerabilities.", emoji: "🛡️", icon: "security", category: "security", keywords: ["ssl checker", "security headers", "port scanner", "vulnerability scanner", "password strength", "csrf tester"], relatedPillarSlugs: ["dev-tools", "hash-tools", "certificate-tools"], lastReviewed: "2026-09-05" },
  { slug: "hash-tools", num: "42", name: "XFree Hash Tools", tagline: "MD5, SHA1, SHA256, SHA512, CRC32, HMAC generator, hash checker, rainbow table", description: "XFree hash tools: generate and compare MD5, SHA1, SHA256, SHA512, and other hashes.", emoji: "🔐", icon: "hash", category: "security", keywords: ["md5 generator", "sha256 hash", "sha512 hash", "hmac generator", "hash checker", "crc32"], relatedPillarSlugs: ["dev-tools", "security-tools", "password-tools"], lastReviewed: "2026-09-05" },
  { slug: "password-tools", num: "43", name: "XFree Password Tools", tagline: "Password generator, strength checker, entropy calculator, breach checker, manager", description: "XFree password tools: generate secure passwords and check their strength and breach status.", emoji: "🔑", icon: "pass", category: "security", keywords: ["password generator", "password strength", "password entropy", "breach checker", "password manager"], relatedPillarSlugs: ["dev-tools", "security-tools", "hash-tools"], lastReviewed: "2026-09-05" },
  { slug: "token-tools", num: "44", name: "XFree JWT & Token Tools", tagline: "JWT decoder, encoder, validator, signature verifier, token generator, OAuth tester", description: "XFree JWT tools: decode, encode, validate, and verify JSON Web Tokens.", emoji: "🎫", icon: "jwt", category: "security", keywords: ["jwt decoder", "jwt encoder", "jwt validator", "jwt signature verifier", "oauth tester", "token generator"], relatedPillarSlugs: ["dev-tools", "security-tools", "encoding-tools"], lastReviewed: "2026-09-05" },
  { slug: "privacy-tools", num: "45", name: "XFree Privacy Tools", tagline: "Cookie consent generator, privacy policy, data mapper, PII detector, GDPR/CCPA compliance", description: "XFree privacy tools: generate cookie consent, detect PII, and ensure GDPR/CCPA compliance.", emoji: "🔏", icon: "privacy", category: "security", keywords: ["cookie consent generator", "privacy policy generator", "pii detector", "gdpr compliance", "ccpa compliance"], relatedPillarSlugs: ["dev-tools", "security-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "network-tools", num: "46", name: "XFree Network Tools", tagline: "Port scanner, IP lookup, bandwidth tester, latency checker, traceroute, WHOIS lookup", description: "XFree network tools: look up IPs, scan ports, and test network performance.", emoji: "🌐", icon: "net", category: "security", keywords: ["ip lookup", "port scanner", "bandwidth test", "latency checker", "traceroute", "whois lookup"], relatedPillarSlugs: ["dev-tools", "security-tools", "dns-tools"], lastReviewed: "2026-09-05" },
  { slug: "dns-tools", num: "47", name: "XFree DNS Tools", tagline: "DNS lookup, SPF checker, DKIM validator, DMARC analyzer, record inspector, propagation", description: "XFree DNS tools: look up DNS records, check SPF/DKIM/DMARC, and inspect propagation.", emoji: "📡", icon: "dns", category: "security", keywords: ["dns lookup", "spf checker", "dkim validator", "dmarc analyzer", "dns record inspector"], relatedPillarSlugs: ["dev-tools", "security-tools", "network-tools"], lastReviewed: "2026-09-05" },
  { slug: "http-tools", num: "48", name: "XFree HTTP Tools", tagline: "HTTP client, request builder, response inspector, status code lookup, header parser, curl converter", description: "XFree HTTP tools: build, send, and inspect HTTP requests and responses.", emoji: "📡", icon: "http", category: "security", keywords: ["http client", "request builder", "response inspector", "status code lookup", "header parser", "curl converter"], relatedPillarSlugs: ["dev-tools", "security-tools", "web-tools"], lastReviewed: "2026-09-05" },
  { slug: "certificate-tools", num: "49", name: "XFree Certificate Tools", tagline: "SSL cert decoder, CSR generator, expiration checker, chain validator, cert converter", description: "XFree certificate tools: decode, generate, and validate SSL/TLS certificates.", emoji: "📜", icon: "cert", category: "security", keywords: ["ssl cert decoder", "csr generator", "certificate expiration", "certificate chain validator"], relatedPillarSlugs: ["dev-tools", "security-tools", "hash-tools"], lastReviewed: "2026-09-05" },
  { slug: "security-header-tools", num: "50", name: "XFree Security Header Tools", tagline: "CSP generator, header analyzer, clickjacking tester, XSS filter, HSTS checker, referrer policy", description: "XFree security header tools: analyze and generate security headers for your website.", emoji: "🛡️", icon: "sheaders", category: "security", keywords: ["csp generator", "security header analyzer", "clickjacking tester", "xss filter", "hsts checker"], relatedPillarSlugs: ["dev-tools", "security-tools", "seo-tools"], lastReviewed: "2026-09-05" },
  { slug: "text-tools", num: "51", name: "XFree Text Tools", tagline: "Word counter, character counter, case converter, line counter, text cleaner, formatter", description: "XFree text tools: count words, convert cases, and clean up text.", emoji: "📝", icon: "text", category: "business", keywords: ["word counter", "character counter", "case converter", "line counter", "text cleaner", "text formatter"], relatedPillarSlugs: ["dev-tools", "writing-tools", "content-tools"], lastReviewed: "2026-09-05" },
  { slug: "content-tools", num: "52", name: "XFree Content Tools", tagline: "Readability checker, keyword density, content analyzer, plagiarism checker, meta desc, title tag", description: "XFree content tools: analyze readability, check keyword density, and optimize content for SEO.", emoji: "📚", icon: "content", category: "business", keywords: ["readability checker", "keyword density", "content analyzer", "plagiarism checker", "meta description", "title tag"], relatedPillarSlugs: ["dev-tools", "text-tools", "writing-tools"], lastReviewed: "2026-09-05" },
  { slug: "writing-tools", num: "53", name: "XFree Writing Tools", tagline: "Grammar checker, spell checker, style analyzer, tone detector, paraphraser, headline generator", description: "XFree writing tools: check grammar, spelling, and style to improve your writing.", emoji: "✍️", icon: "write", category: "business", keywords: ["grammar checker", "spell checker", "style analyzer", "tone detector", "paraphraser", "headline generator"], relatedPillarSlugs: ["dev-tools", "text-tools", "content-tools"], lastReviewed: "2026-09-05" },
  { slug: "calculators", num: "54", name: "XFree Calculator Tools", tagline: "Math calculator, percentage, BMI, age, mortgage, currency converter, ROI, tax calculator", description: "XFree calculators: calculate math, percentages, mortgages, currency, and more.", emoji: "🧮", icon: "calc", category: "business", keywords: ["math calculator", "percentage calculator", "bmi calculator", "mortgage calculator", "currency converter", "roi calculator"], relatedPillarSlugs: ["dev-tools", "date-time-tools", "finance-tools"], lastReviewed: "2026-09-05" },
  { slug: "date-time-tools", num: "55", name: "XFree Date & Time Tools", tagline: "Timestamp converter, date formatter, timezone converter, countdown timer, age calculator, weekday", description: "XFree date and time tools: convert timestamps, format dates, and convert timezones.", emoji: "📅", icon: "dt", category: "business", keywords: ["timestamp converter", "date formatter", "timezone converter", "countdown timer", "age calculator", "weekday calculator"], relatedPillarSlugs: ["dev-tools", "calculators", "finance-tools"], lastReviewed: "2026-09-05" },
  { slug: "finance-tools", num: "56", name: "XFree Finance Tools", tagline: "Currency converter, inflation calculator, loan calculator, compound interest, ROI, budget planner", description: "XFree finance tools: convert currencies and calculate loans, investments, and budgets.", emoji: "💰", icon: "finance", category: "business", keywords: ["currency converter", "inflation calculator", "loan calculator", "compound interest", "roi calculator", "budget planner"], relatedPillarSlugs: ["dev-tools", "calculators", "date-time-tools"], lastReviewed: "2026-09-05" },
  { slug: "marketing-tools", num: "57", name: "XFree Marketing Tools", tagline: "Email subject line, UTM builder, campaign tracker, social bio, hashtag generator, color palette", description: "XFree marketing tools: build UTM links, generate hashtags, and track campaigns.", emoji: "📣", icon: "mktg", category: "business", keywords: ["utm builder", "email subject line", "campaign tracker", "social bio generator", "hashtag generator", "color palette"], relatedPillarSlugs: ["dev-tools", "seo-tools", "social-preview-tools"], lastReviewed: "2026-09-05" },
  { slug: "productivity-tools", num: "58", name: "XFree Productivity Tools", tagline: "To-do list, habit tracker, focus timer, note taker, task scheduler, reminder generator", description: "XFree productivity tools: manage tasks, track habits, and stay focused.", emoji: "⏰", icon: "prod", category: "business", keywords: ["to-do list", "habit tracker", "focus timer", "note taker", "task scheduler", "reminder generator"], relatedPillarSlugs: ["dev-tools", "date-time-tools", "text-tools"], lastReviewed: "2026-09-05" },
  { slug: "education-tools", num: "59", name: "XFree Education Tools", tagline: "Flashcard generator, quiz maker, study planner, grade calculator, timetable builder, note organizer", description: "XFree education tools: create flashcards, quizzes, and study plans.", emoji: "🎓", icon: "edu", category: "business", keywords: ["flashcard generator", "quiz maker", "study planner", "grade calculator", "timetable builder", "note organizer"], relatedPillarSlugs: ["dev-tools", "text-tools", "productivity-tools"], lastReviewed: "2026-09-05" },
  { slug: "business-tools", num: "60", name: "XFree Business Tools", tagline: "Invoice generator, business card maker, contract template, pitch deck, valuation calculator, SWOT", description: "XFree business tools: generate invoices, business cards, and contracts.", emoji: "💼", icon: "biz", category: "business", keywords: ["invoice generator", "business card maker", "contract template", "pitch deck generator", "valuation calculator", "swot analysis"], relatedPillarSlugs: ["dev-tools", "finance-tools", "marketing-tools"], lastReviewed: "2026-09-05" },
];

export const PILLARS_BY_SLUG: ReadonlyMap<string, PillarDefinition> = new Map(
  PILLARS_60.map((p) => [p.slug, p]),
);

export const PILLARS_BY_CATEGORY: ReadonlyMap<PillarCategory, ReadonlyArray<PillarDefinition>> = (() => {
  const m = new Map<PillarCategory, PillarDefinition[]>();
  for (const cat of PILLAR_CATEGORIES) {
    m.set(cat.id, PILLARS_60.filter((p) => p.category === cat.id));
  }
  return m;
})();

export function getPillarBySlug(slug: string): PillarDefinition | undefined {
  return PILLARS_BY_SLUG.get(slug);
}

export function getRelatedPillars(pillar: PillarDefinition): PillarDefinition[] {
  return pillar.relatedPillarSlugs
    .map((slug) => PILLARS_BY_SLUG.get(slug))
    .filter((p): p is PillarDefinition => p !== undefined);
}

export const INDEXED_PILLARS: ReadonlyArray<PillarDefinition> = PILLARS_60;

/* ══════════════════════════════════════════════════════════════════
   Normalize — ensure every pillar has id/headerGroup/status fields
   ══════════════════════════════════════════════════════════════════ */
PILLARS_60.forEach((p) => {
  p.id = p.slug;
  p.headerGroup = p.category;
  p.status = "published";
  p.indexable = true;
  p.contentApproved = true;
});

/* ══════════════════════════════════════════════════════════════════
   Header groups — 6 top-level categories for navigation
   ══════════════════════════════════════════════════════════════════ */
export interface HeaderGroup {
  id: PillarCategory;
  label: string;
  description: string;
  icon: string;
  pillars: ReadonlyArray<PillarDefinition>;
}

export const HEADER_GROUPS: ReadonlyArray<HeaderGroup> = PILLAR_CATEGORIES.map((cat) => ({
  id: cat.id,
  label: cat.label,
  description: cat.description,
  icon: cat.icon,
  pillars: PILLARS_60.filter((p) => p.category === cat.id),
}));

/* ══════════════════════════════════════════════════════════════════
   Authority / platform pillars (non-topical)
   ══════════════════════════════════════════════════════════════════ */
export interface AuthorityPillar extends PillarDefinition {}

export const AUTHORITY_PILLARS: ReadonlyArray<AuthorityPillar> = [
  { slug: "xfree-app", num: "A1", name: "XFree App", tagline: "Installable PWA developer tool suite", description: "XFree as a Progressive Web App.", emoji: "📱", icon: "app", category: "dev-data", keywords: ["xfree app", "pwa", "installable"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "how-it-works", num: "A2", name: "XFree How It Works", tagline: "Local vs Cloud processing explained", description: "How XFree processes data locally and in the cloud.", emoji: "🔧", icon: "howto", category: "dev-data", keywords: ["how it works", "local mode", "cloud mode"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "pricing", num: "A3", name: "XFree Pricing", tagline: "Free, open source, forever", description: "XFree is completely free with no signup or paywalls.", emoji: "💰", icon: "price", category: "business", keywords: ["pricing", "free", "open source"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "roadmap", num: "A4", name: "XFree Roadmap", tagline: "What's coming next", description: "The public roadmap for XFree micro-tools.", emoji: "🗺️", icon: "road", category: "business", keywords: ["roadmap", "changelog"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "about", num: "A5", name: "About XFree", tagline: "Mission and principles", description: "About the XFree project.", emoji: "ℹ️", icon: "about", category: "business", keywords: ["about", "mission"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "contact", num: "A6", name: "Contact", tagline: "Get in touch", description: "Contact the XFree team.", emoji: "📧", icon: "contact", category: "business", keywords: ["contact", "support"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "documentation", num: "A7", name: "Documentation", tagline: "Developer docs and guides", description: "Documentation for all XFree tools.", emoji: "📚", icon: "docs", category: "dev-data", keywords: ["docs", "documentation", "guides"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "blog", num: "A8", name: "Blog", tagline: "Updates and articles", description: "Latest articles from the XFree team.", emoji: "✍️", icon: "blog", category: "business", keywords: ["blog", "updates"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "community", num: "A9", name: "Community", tagline: "GitHub discussions and contributions", description: "Join the XFree community.", emoji: "👥", icon: "community", category: "dev-data", keywords: ["community", "github", "contribute"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
];

/* ══════════════════════════════════════════════════════════════════
   Public collections (published, indexable, approved)
   ══════════════════════════════════════════════════════════════════ */
export const PUBLIC_PILLARS: ReadonlyArray<PillarDefinition> = PILLARS_60.filter(
  (p) => p.status === "published" && p.indexable === true && p.contentApproved === true,
);

export const PUBLIC_AUTHORITY_PILLARS: ReadonlyArray<AuthorityPillar> = AUTHORITY_PILLARS.filter(
  (p) => p.status === "published" && p.indexable === true && p.contentApproved === true,
);

export const PUBLIC_HEADER_GROUPS: ReadonlyArray<HeaderGroup> = HEADER_GROUPS.map((g) => ({
  ...g,
  pillars: g.pillars.filter((p) => p.status === "published" && p.indexable === true && p.contentApproved === true),
})).filter((g) => g.pillars.length > 0);

/* ══════════════════════════════════════════════════════════════════
   Utility functions
   ══════════════════════════════════════════════════════════════════ */
export function pillarResponseForStatus(pillar: PillarDefinition): 200 | 404 | 410 {
  if (pillar.status === "published") return 200;
  return 404;
}

export function getGitHubIssueUrl(title: string, name?: string, description?: string): string {
  const params = new URLSearchParams();
  params.set("title", title);
  if (name) params.set("name", name);
  if (description) params.set("description", description);
  return `https://github.com/xfree-in/xfree/issues/new?${params.toString()}`;
}

export const CLUSTERS_50: string[] = [
  "utilities", "generators", "converters", "validators", "analyzers",
  "formatters", "debuggers", "optimizers", "testers", "builders",
  "calculators", "encoders-decoders", "visualizers", "linters", "simulators",
  "playgrounds", "extractors", "mappers", "transformers", "compilers",
  "snippets", "templates", "checkers", "monitors", "scanners",
  "profilers", "benchmarkers", "migrators", "synchronizers", "packagers",
  "bundlers", "transpilers", "polyfills", "shims", "mockers",
  "stubs", "fakers", "data-generators", "parsers", "serializers",
  "deserializers", "query-builders", "schema-designers", "indexers", "cachers",
];
