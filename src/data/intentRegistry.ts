import { IntentDefinition, IntentMatch } from "../types";

const INTENT_REGISTRY_DATA = [
  {
    id: "format-json",
    phrases: [
      "format json",
      "pretty print json",
      "beautify json",
      "make json readable",
      "clean json",
      "json formatter",
      "json beautify"
    ],
    keywords: ["format", "pretty", "beautify", "readable", "indent", "json format"],
    capabilities: ["json-formatting", "json-validation", "json-beautification"],
    preferredToolId: "json-formatter",
    description: "Format JSON to be human-readable with proper indentation"
  },
  {
    id: "validate-json",
    phrases: [
      "validate json",
      "check json syntax",
      "json validator",
      "is my json valid",
      "json syntax check"
    ],
    keywords: ["validate", "check", "syntax", "valid", "error", "verify"],
    capabilities: ["json-validation", "json-syntax-check"],
    preferredToolId: "json-formatter",
    description: "Check if JSON is valid and find syntax errors"
  },
  {
    id: "minify-json",
    phrases: [
      "minify json",
      "compress json",
      "json minifier",
      "reduce json size",
      "minify json data"
    ],
    keywords: ["minify", "compress", "json", "reduce"],
    capabilities: ["json-minification"],
    preferredToolId: "json-formatter",
    description: "Minify JSON to reduce file size"
  },
  {
    id: "repair-json",
    phrases: [
      "fix json",
      "repair json",
      "json broken",
      "clean json",
      "fix malformed json"
    ],
    keywords: ["fix", "repair", "broken", "fix json", "malformed"],
    capabilities: ["json-repair", "json-cleanup"],
    preferredToolId: "json-formatter",
    description: "Fix common JSON syntax errors"
  },
  {
    id: "test-regex",
    phrases: [
      "test regex",
      "regex tester",
      "test regular expression",
      "regex pattern test",
      "check regex",
      "regex match"
    ],
    keywords: ["regex", "test", "pattern", "match", "capture", "group"],
    capabilities: ["regex-testing", "pattern-matching"],
    preferredToolId: "regex-tester",
    description: "Test regular expressions against sample text"
  },
  {
    id: "explain-regex",
    phrases: [
      "explain regex",
      "what does this regex",
      "regex explainer",
      "understand regex pattern",
      "regex breakdown"
    ],
    keywords: ["explain", "understand", "breakdown", "how", "what does"],
    capabilities: ["regex-explanation", "pattern-explanation"],
    preferredToolId: "regex-tester",
    description: "Explain what a regex pattern does in plain English"
  },
  {
    id: "generate-cron",
    phrases: [
      "generate cron",
      "cron expression",
      "create cron schedule",
      "crontab generator",
      "cron job scheduler"
    ],
    keywords: ["cron", "schedule", "generate", "crontab", "scheduler", "timer"],
    capabilities: ["cron-generation", "schedule-creation"],
    preferredToolId: "cron-expression-generator",
    description: "Generate cron expressions for scheduling tasks"
  },
  {
    id: "explain-cron",
    phrases: [
      "explain cron",
      "what does this cron mean",
      "cron explainer",
      "cron to words",
      "read cron schedule"
    ],
    keywords: ["explain", "read", "what does", "cron", "schedule"],
    capabilities: ["cron-explanation"],
    preferredToolId: "cron-expression-generator",
    description: "Translate cron expressions into human-readable text"
  },
  {
    id: "jwt-decode",
    phrases: [
      "decode jwt",
      "jwt decoder",
      "decode token",
      "inspect jwt",
      "jwt payload"
    ],
    keywords: ["jwt", "decode", "decode", "token", "payload", "header"],
    capabilities: ["jwt-decoding", "token-inspection"],
    preferredToolId: "base64-encoder-decoder",
    description: "Decode JWT tokens without needing a secret key"
  },
  {
    id: "base64-decode",
    phrases: [
      "decode base64",
      "base64 decoder",
      "decode base64 string",
      "base64 decode online"
    ],
    keywords: ["base64", "decode", "base64 decode"],
    capabilities: ["base64-decoding"],
    preferredToolId: "base64-encoder-decoder",
    description: "Decode Base64 encoded strings to plain text"
  },
  {
    id: "base64-encode",
    phrases: [
      "encode base64",
      "base64 encoder",
      "encode to base64",
      "base64 encode online"
    ],
    keywords: ["base64", "encode", "to base64"],
    capabilities: ["base64-encoding"],
    preferredToolId: "base64-encoder-decoder",
    description: "Encode plain text to Base64 format"
  },
  {
    id: "generate-sitemap",
    phrases: [
      "generate sitemap",
      "sitemap generator",
      "create sitemap",
      "build xml sitemap",
      "sitemap xml generator"
    ],
    keywords: ["sitemap", "generate", "create", "xml", "google"],
    capabilities: ["sitemap-generation", "xml-creation"],
    preferredToolId: "xml-sitemap-generator",
    description: "Generate XML sitemaps for search engines"
  },
  {
    id: "validate-sitemap",
    phrases: [
      "validate sitemap",
      "sitemap validator",
      "check sitemap",
      "sitemap syntax check"
    ],
    keywords: ["validate", "check", "sitemap", "valid", "syntax"],
    capabilities: ["sitemap-validation"],
    preferredToolId: "xml-sitemap-generator",
    description: "Check if your sitemap XML is valid"
  },
  {
    id: "extract-urls",
    phrases: [
      "extract urls",
      "url extractor",
      "get urls from text",
      "find all urls",
      "bulk url extractor"
    ],
    keywords: ["extract", "urls", "links", "find", "scrape", "bulk"],
    capabilities: ["url-extraction", "link-scraping"],
    preferredToolId: "bulk-url-sitemap",
    description: "Extract URLs from text, HTML, or logs"
  },
  {
    id: "dedupe-urls",
    phrases: [
      "remove duplicate urls",
      "deduplicate urls",
      "unique urls",
      "remove duplicates from urls"
    ],
    keywords: ["duplicate", "unique", "deduplicate", "remove duplicates"],
    capabilities: ["url-deduplication"],
    preferredToolId: "bulk-url-sitemap",
    description: "Remove duplicate URLs from a list"
  },
  {
    id: "generate-robots-txt",
    phrases: [
      "generate robots.txt",
      "robots.txt generator",
      "create robots.txt",
      "robots txt maker",
      "robots file generator"
    ],
    keywords: ["robots.txt", "generate", "create", "allow", "disallow"],
    capabilities: ["robots-txt-generation"],
    preferredToolId: "robots-txt-generator",
    description: "Create robots.txt files for web crawlers"
  },
  {
    id: "test-robots-txt",
    phrases: [
      "test robots.txt",
      "robots.txt tester",
      "check robots.txt rules",
      "validate robots.txt"
    ],
    keywords: ["test", "check", "robots.txt", "validate", "rules"],
    capabilities: ["robots-txt-testing"],
    preferredToolId: "robots-txt-generator",
    description: "Test if your robots.txt rules allow or block specific URLs"
  },
  {
    id: "generate-schema",
    phrases: [
      "generate schema",
      "schema markup",
      "json-ld generator",
      "structured data schema",
      "schema.org markup"
    ],
    keywords: ["schema", "generate", "json-ld", "structured data", "markup"],
    capabilities: ["schema-generation"],
    preferredToolId: "schema-markup-generator",
    description: "Generate Schema.org structured data markup"
  },
  {
    id: "generate-meta-tags",
    phrases: [
      "generate meta tags",
      "meta tag generator",
      "open graph tags",
      "social meta tags",
      "seo meta tags"
    ],
    keywords: ["meta tags", "generate", "og:", "twitter:", "seo"],
    capabilities: ["meta-tag-generation"],
    preferredToolId: "meta-tag-generator",
    description: "Create meta tags, Open Graph, and Twitter cards"
  },
  {
    id: "preview-seo-snippet",
    phrases: [
      "preview seo",
      "google preview",
      "serp snippet preview",
      "seo title preview",
      "meta description preview"
    ],
    keywords: ["preview", "google", "serp", "title", "description"],
    capabilities: ["seo-preview"],
    preferredToolId: "meta-tag-generator",
    description: "Preview how your page will appear in Google search results"
  },
  {
    id: "convert-json-to-csv",
    phrases: [
      "json to csv",
      "convert json to csv",
      "json to excel",
      "json to table"
    ],
    keywords: ["json", "csv", "excel", "convert", "to csv"],
    capabilities: ["json-to-csv-conversion"],
    preferredToolId: "json-formatter",
    description: "Convert JSON data to CSV format for spreadsheets"
  },
  {
    id: "convert-csv-to-json",
    phrases: [
      "csv to json",
      "convert csv to json",
      "excel to json",
      "table to json"
    ],
    keywords: ["csv", "json", "convert", "to json"],
    capabilities: ["csv-to-json-conversion"],
    preferredToolId: "json-formatter",
    description: "Convert CSV spreadsheets to JSON format"
  },
  {
    id: "generate-url-slug",
    phrases: [
      "generate url slug",
      "url slug generator",
      "create url slug",
      "slugify title",
      "seo url slug"
    ],
    keywords: ["slug", "generate", "slugify", "sef", "url"],
    capabilities: ["url-slug-generation"],
    preferredToolId: "url-slug-utm-builder",
    description: "Create SEO-friendly URL slugs from titles"
  },
  {
    id: "build-utm-links",
    phrases: [
      "utm builder",
      "build utm links",
      "utm campaign",
      "create tracking link",
      "utm parameter builder"
    ],
    keywords: ["utm", "tracking", "analytics", "campaign", "link"],
    capabilities: ["utm-generation"],
    preferredToolId: "url-slug-utm-builder",
    description: "Build URLs with UTM parameters for campaign tracking"
  },
  {
    id: "encode-url",
    phrases: [
      "encode url",
      "url encoder",
      "percent encode",
      "encode special chars"
    ],
    keywords: ["encode", "url", "percent", "special characters"],
    capabilities: ["url-encoding"],
    preferredToolId: "url-slug-utm-builder",
    description: "Percent-encode special characters in URLs"
  },
  {
    id: "decode-url",
    phrases: [
      "decode url",
      "url decoder",
      "percent decode",
      "decode url encoding"
    ],
    keywords: ["decode", "url", "percent"],
    capabilities: ["url-decoding"],
    preferredToolId: "url-slug-utm-builder",
    description: "Decode percent-encoded URL characters"
  },
  {
    id: "check-http-status",
    phrases: [
      "check http status",
      "http status checker",
      "url status check",
      "check if url alive"
    ],
    keywords: ["http", "status", "check", "alive", "404", "500"],
    capabilities: ["url-status-checking"],
    preferredToolId: "bulk-url-sitemap",
    description: "Check HTTP status codes for URLs"
  },
  {
    id: "check-redirects",
    phrases: [
      "check redirects",
      "redirect checker",
      "301 redirect",
      "trace redirect chain",
      "check redirect loop"
    ],
    keywords: ["redirect", "301", "302", "chain", "loop", "check"],
    capabilities: ["redirect-checking"],
    preferredToolId: "bulk-url-sitemap",
    description: "Check redirect chains and identify loops"
  },
  {
    id: "generate-cron-schedule",
    phrases: [
      "create cron schedule",
      "cron job",
      "scheduled job",
      "cron expression generator"
    ],
    keywords: ["cron", "schedule", "job", "create", "timer"],
    capabilities: ["cron-scheduling"],
    preferredToolId: "cron-expression-generator",
    description: "Generate cron expressions for task scheduling"
  },
  {
    id: "fix-json-syntax",
    phrases: [
      "fix json errors",
      "json syntax error",
      "why is my json invalid",
      "json parse error",
      "json unexpected token"
    ],
    keywords: ["error", "fix", "syntax error", "parse error", "invalid"],
    capabilities: ["json-error-fixing"],
    preferredToolId: "json-formatter",
    description: "Identify and fix JSON syntax errors"
  },
  {
    id: "minify-css",
    phrases: [
      "minify css",
      "compress css",
      "css minifier",
      "reduce css size"
    ],
    keywords: ["css", "minify", "compress", "reduce"],
    capabilities: ["css-minification"],
    preferredToolId: "css-minifier",
    description: "Compress CSS by removing whitespace and comments"
  },
  {
    id: "minify-html",
    phrases: [
      "minify html",
      "compress html",
      "html minifier",
      "reduce html size"
    ],
    keywords: ["html", "minify", "compress", "reduce"],
    capabilities: ["html-minification"],
    preferredToolId: "html-minifier",
    description: "Compress HTML by removing whitespace and comments"
  },
  {
    id: "sort-lines",
    phrases: [
      "sort lines",
      "alphabetize lines",
      "sort text lines",
      "order lines alphabetically"
    ],
    keywords: ["sort", "alphabetize", "order", "lines", "text"],
    capabilities: ["text-sorting"],
    preferredToolId: "text-diff-checker",
    description: "Sort lines of text alphabetically or numerically"
  },
  {
    id: "find-duplicates",
    phrases: [
      "find duplicates",
      "duplicate finder",
      "detect duplicates",
      "find duplicate lines"
    ],
    keywords: ["duplicate", "find", "detect", "repeat"],
    capabilities: ["duplicate-detection"],
    preferredToolId: "text-diff-checker",
    description: "Find duplicate lines or entries in text"
  },
  {
    id: "xml-formatter",
    phrases: [
      "format xml",
      "beautify xml",
      "xml formatter",
      "pretty print xml"
    ],
    keywords: ["xml", "format", "beautify", "pretty print"],
    capabilities: ["xml-formatting"],
    preferredToolId: "json-formatter",
    description: "Format XML for human readability"
  },
  {
    id: "sql-formatter",
    phrases: [
      "format sql",
      "sql formatter",
      "beautify sql",
      "pretty print sql"
    ],
    keywords: ["sql", "format", "beautify", "pretty print", "query"],
    capabilities: ["sql-formatting"],
    preferredToolId: "cron-expression-generator",
    description: "Format SQL queries for readability"
  },
  {
    id: "yaml-formatter",
    phrases: [
      "format yaml",
      "yaml formatter",
      "yaml beautifier",
      "pretty print yaml"
    ],
    keywords: ["yaml", "format", "beautify", "yml"],
    capabilities: ["yaml-formatting"],
    preferredToolId: "cron-expression-generator",
    description: "Format YAML configuration files"
  },
  {
    id: "convert-timestamp",
    phrases: [
      "convert timestamp",
      "unix timestamp",
      "epoch converter",
      "timestamp to date",
      "date to timestamp"
    ],
    keywords: ["timestamp", "unix", "epoch", "date", "convert"],
    capabilities: ["timestamp-conversion"],
    preferredToolId: "timestamp-color-converter",
    description: "Convert between Unix timestamps and human-readable dates"
  },
  {
    id: "generate-password",
    phrases: [
      "generate password",
      "password generator",
      "random password",
      "secure password",
      "strong password"
    ],
    keywords: ["password", "generate", "random", "secure", "strong"],
    capabilities: ["password-generation"],
    preferredToolId: "base64-encoder-decoder",
    description: "Generate cryptographically secure random passwords"
  },
  {
    id: "hash-generator",
    phrases: [
      "generate sha256",
      "md5 hash",
      "hash generator",
      "crc32",
      "checksum generator"
    ],
    keywords: ["hash", "sha256", "md5", "crc", "checksum", "generate"],
    capabilities: ["hash-generation"],
    preferredToolId: "base64-encoder-decoder",
    description: "Generate SHA-256, MD5, and other cryptographic hashes"
  },
  {
    id: "convert-color",
    phrases: [
      "color converter",
      "hex to rgb",
      "rgb to hex",
      "convert color codes",
      "hsl converter"
    ],
    keywords: ["color", "hex", "rgb", "hsl", "convert", "codes"],
    capabilities: ["color-conversion"],
    preferredToolId: "timestamp-color-converter",
    description: "Convert between color formats (HEX, RGB, HSL)"
  },
  {
    id: "encode-decode",
    phrases: [
      "base64 encode decode",
      "encode decode base64",
      "base64 online tool"
    ],
    keywords: ["base64", "encode", "decode"],
    capabilities: ["base64-encoding", "base64-decoding"],
    preferredToolId: "base64-encoder-decoder",
    description: "Encode to and decode from Base64"
  },
  {
    id: "check-404",
    phrases: [
      "check 404",
      "404 checker",
      "dead link checker",
      "broken link finder"
    ],
    keywords: ["404", "check", "dead", "broken", "link", "dead link"],
    capabilities: ["dead-link-detection"],
    preferredToolId: "bulk-url-sitemap",
    description: "Find broken or dead links"
  },
  {
    id: "validate-robots",
    phrases: [
      "validate robots",
      "test robots rules",
      "check robots.txt",
      "crawl rules"
    ],
    keywords: ["robots.txt", "validate", "test", "rules", "crawl"],
    capabilities: ["robots-validation"],
    preferredToolId: "robots-txt-generator",
    description: "Validate robots.txt crawl rules"
  },
  {
    id: "compare-json",
    phrases: [
      "compare json",
      "json diff",
      "json comparison",
      "see json difference"
    ],
    keywords: ["compare", "diff", "difference", "json"],
    capabilities: ["json-diff"],
    preferredToolId: "json-formatter",
    description: "Compare two JSON payloads to see differences"
  },
  {
    id: "open-graph-preview",
    phrases: [
      "open graph preview",
      "social media preview",
      "facebook preview",
      "linkedin preview",
      "og image preview"
    ],
    keywords: ["open graph", "preview", "social", "facebook", "linkedin"],
    capabilities: ["social-preview"],
    preferredToolId: "meta-tag-generator",
    description: "Preview how content looks when shared on social media"
  },
  {
    id: "twitter-card-preview",
    phrases: [
      "twitter card preview",
      "x card preview",
      "twitter card generator",
      "social preview twitter"
    ],
    keywords: ["twitter", "card", "preview", "x.com", "social"],
    capabilities: ["twitter-preview"],
    preferredToolId: "meta-tag-generator",
    description: "Preview Twitter card appearance"
  },
  {
    id: "remove-query-params",
    phrases: [
      "remove query parameters",
      "clean url parameters",
      "strip utm params",
      "remove tracking params"
    ],
    keywords: ["query", "parameters", "remove", "strip", "tracking", "utm"],
    capabilities: ["url-parameter-cleaning"],
    preferredToolId: "url-slug-utm-builder",
    description: "Remove tracking parameters from URLs"
  },
  {
    id: "check-canonical",
    phrases: [
      "check canonical",
      "canonical tag",
      "canonical url",
      "check rel canonical"
    ],
    keywords: ["canonical", "check", "tag", "self-referencing"],
    capabilities: ["canonical-checking"],
    preferredToolId: "meta-tag-generator",
    description: "Check canonical URL tags"
  },
  {
    id: "minify-json",
    phrases: [
      "minify json",
      "json minifier",
      "compress json",
      "minify json data"
    ],
    keywords: ["minify", "compress", "json", "reduce"],
    capabilities: ["json-minification"],
    preferredToolId: "json-formatter",
    description: "Minify JSON to reduce file size"
  },
  {
    id: "jwt-verify",
    phrases: [
      "verify jwt",
      "jwt verification",
      "check jwt signature",
      "jwt security"
    ],
    keywords: ["verify", "jwt", "signature", "security", "check"],
    capabilities: ["jwt-verification"],
    preferredToolId: "base64-encoder-decoder",
    description: "Verify JWT token signatures (requires secret)"
  },
  {
    id: "xml-validator",
    phrases: [
      "validate xml",
      "xml validator",
      "check xml syntax",
      "xml syntax check"
    ],
    keywords: ["xml", "validate", "syntax", "check", "valid"],
    capabilities: ["xml-validation"],
    preferredToolId: "json-formatter",
    description: "Validate XML syntax and structure"
  },
  {
    id: "text-diff",
    phrases: [
      "text diff",
      "compare text",
      "diff two files",
      "find text differences"
    ],
    keywords: ["diff", "compare", "difference", "text"],
    capabilities: ["text-diff"],
    preferredToolId: "text-diff-checker",
    description: "Compare two pieces of text and show differences"
  },
  {
    id: "generate-uuid",
    phrases: [
      "generate uuid",
      "uuid v4",
      "generate id",
      "unique identifier"
    ],
    keywords: ["uuid", "generate", "id", "unique", "identifier"],
    capabilities: ["uuid-generation"],
    preferredToolId: "base64-encoder-decoder",
    description: "Generate UUID v4 unique identifiers"
  },
  {
    id: "unix-timestamp",
    phrases: [
      "unix timestamp",
      "epoch converter",
      "timestamp tool",
      "convert to date"
    ],
    keywords: ["timestamp", "unix", "epoch", "date", "convert"],
    capabilities: ["timestamp-conversion"],
    preferredToolId: "timestamp-color-converter",
    description: "Convert Unix timestamps to dates and vice versa"
  }
] as const;

export type IntentId = typeof INTENT_REGISTRY_DATA[number]["id"];

export const INTENT_REGISTRY: IntentDefinition[] = INTENT_REGISTRY_DATA.map((intent) => ({
  ...intent,
  phrases: [...intent.phrases],
  keywords: [...intent.keywords],
  capabilities: [...intent.capabilities]
}));

export function getIntentById(id: IntentId): IntentDefinition | undefined {
  return INTENT_REGISTRY.find((i) => i.id === id);
}

export function findIntentsForQuery(query: string): IntentMatch[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  return INTENT_REGISTRY
    .map((intent) => {
      const phraseScore = intent.phrases.some((p) => p === lowerQuery) ? 3 : 0;
      const keywordScore = intent.keywords.some((k) => k === lowerQuery) ? 2 : 0;
      const containsPhrase = intent.phrases.some((p) => lowerQuery.includes(p)) ? 1 : 0;
      const containsKeyword = intent.keywords.some((k) => lowerQuery.includes(k)) ? 1 : 0;
      const totalScore = phraseScore + keywordScore + containsPhrase + containsKeyword;

      let confidence: "high" | "medium" | "low" = "low";
      if (totalScore >= 4) confidence = "high";
      else if (totalScore >= 2) confidence = "medium";

      return {
        intent,
        score: totalScore,
        confidence
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function getToolIdForIntent(intentId: IntentId): string | null {
  const intent = getIntentById(intentId);
  return intent ? intent.preferredToolId : null;
}