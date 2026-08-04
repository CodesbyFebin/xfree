import { createRequire } from "module"; const require = createRequire(import.meta.url);

// src/server/app.ts
import express from "express";
import crypto2 from "crypto";
import { ThinkingLevel } from "@google/genai";

// src/server/env.ts
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();
var EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3e3),
  PUBLIC_SITE_URL: z.string().url().default("https://www.xfree.in"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_DEFAULT_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_THINKING_MODEL: z.string().default("gemini-2.5-pro"),
  GEMINI_BATCH_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(2048),
  GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(3e4),
  AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  AI_RATE_LIMIT_PER_DAY: z.coerce.number().int().positive().default(100),
  AI_THINKING_LIMIT_PER_DAY: z.coerce.number().int().positive().default(15),
  AI_BATCH_MAX_ITEMS: z.coerce.number().int().positive().default(20),
  AI_GLOBAL_DAILY_LIMIT: z.coerce.number().int().positive().default(5e3),
  CONTACT_TO_EMAIL: z.string().email().default("contact@xfree.in"),
  CONTACT_FROM_EMAIL: z.string().email().default("noreply@xfree.in"),
  RESEND_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(1)
});
function loadConfig() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`[env] Invalid environment configuration (using defaults for missing values):
${issues}`);
    return EnvSchema.parse({});
  }
  const cfg = parsed.data;
  if (cfg.NODE_ENV === "production" && !cfg.GEMINI_API_KEY) {
    console.warn("[env] GEMINI_API_KEY is not set. AI endpoints will return 503 until it is provisioned.");
  }
  return cfg;
}
var config2 = loadConfig();
var isProduction = config2.NODE_ENV === "production";

// src/server/gemini.ts
import { GoogleGenAI } from "@google/genai";
var cached = null;
var GeminiNotConfiguredError = class extends Error {
  constructor() {
    super("Gemini API is not configured on this deployment.");
    this.status = 503;
    this.name = "GeminiNotConfiguredError";
  }
};
function getGeminiClient() {
  if (!config2.GEMINI_API_KEY) {
    throw new GeminiNotConfiguredError();
  }
  if (!cached) {
    cached = new GoogleGenAI({ apiKey: config2.GEMINI_API_KEY });
  }
  return cached;
}
async function generateWithTimeout(fn) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config2.GEMINI_REQUEST_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// src/server/tasks.ts
var BASE = "You are XFree.in AI, a specialised developer and SEO micro-tool backend. Produce clean, concise, precise, immediately usable output.";
var AI_TASKS = {
  general: {
    systemInstruction: BASE,
    jsonOutput: false,
    temperature: 0.3,
    promptTemplate: (input) => input
  },
  "ai-regex": {
    systemInstruction: `You are a Regex Master AI. Convert user natural language requirements into a valid Regular Expression. Return JSON with:
- "pattern": regex pattern string (without slashes)
- "flags": flags string (e.g. "gim")
- "explanation": bulleted clear explanation of each part
- "testCases": array of {"input": string, "shouldMatch": boolean}`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Generate a regex for: "${input}". Output strictly valid JSON.`
  },
  "ai-json-repair": {
    systemInstruction: `You are a JSON Repair and Schema AI. Repair broken JSON. Return JSON with:
- "repairedJson": valid formatted JSON string
- "explanation": list of fixes applied
- "typeScriptInterface": TS interface for this shape`,
    jsonOutput: true,
    temperature: 0.1,
    promptTemplate: (input) => `Repair and format this JSON:
\`\`\`
${input}
\`\`\`
Output strictly valid JSON.`
  },
  "ai-meta-optimizer": {
    systemInstruction: `You are an SEO Meta Tag Optimizer. Return JSON with: "title" (50-60 chars), "metaDescription" (145-155 chars), "ogTitle", "ogDescription", "keywords" (array of 5), "ctrTips" (array of 2).`,
    jsonOutput: true,
    temperature: 0.3,
    promptTemplate: (input) => `Optimize meta tags for:
"${input}"
Output strictly valid JSON.`
  },
  "ai-sql-generator": {
    systemInstruction: `You are a Senior SQL Engineer. Return JSON with: "sql", "dialects" (object with postgres/mysql/sqlite), "explanation", "performanceTip".`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Generate or fix SQL for: "${input}". Output strictly valid JSON.`
  },
  "ai-search-intent": {
    systemInstruction: `You are an SEO Keyword & Search Intent Classifier. Return JSON with "keywords" array of {"keyword","intent","difficulty","suggestedCluster","contentTopic"}.`,
    jsonOutput: true,
    temperature: 0.3,
    promptTemplate: (input) => `Analyse search intent for:
${input}
Output strictly valid JSON.`
  },
  "ai-code-explainer": {
    systemInstruction: `You are a Code & Stack Trace Analyzer. Return JSON with "rootCause","fixCode","explanation","preventionTip".`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Analyse and fix:
\`\`\`
${input}
\`\`\`
Output strictly valid JSON.`
  },
  "ai-commit-generator": {
    systemInstruction: `You are a Conventional Commits generator. Return JSON with "commitMessage","extendedBody","type","scope".`,
    jsonOutput: true,
    temperature: 0.3,
    promptTemplate: (input) => `Generate conventional commit for:
${input}
Output strictly valid JSON.`
  },
  "ai-schema-generator": {
    systemInstruction: `You are a Schema.org JSON-LD expert. Return JSON with "jsonLd","schemaType","validationNotes".`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Generate JSON-LD for:
${input}
Output strictly valid JSON.`
  }
};
var CHAT_SYSTEM_INSTRUCTION = "You are XFree.in AI Assistant \u2014 an expert developer, technical SEO specialist, and web utility consultant. Provide clear, accurate, actionable guidance. Refuse requests that require confidential user data or credentials.";
var THINKING_SYSTEM_INSTRUCTION = "You are XFree Deep Reasoning Engine. Perform thorough step-by-step analysis before delivering the final clean solution. Focus on correctness over verbosity.";
function isValidTaskId(id) {
  return typeof id === "string" && id in AI_TASKS;
}

// src/server/rate-limit.ts
import crypto from "crypto";
var store = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.resetAt <= now) store.delete(k);
  }
}, 6e4).unref?.();
function keyOf(req, scope) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "unknown";
  const hashed = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return `${scope}:${hashed}`;
}
function hit(key, limit, windowMs) {
  const now = Date.now();
  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  b.count += 1;
  return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count), resetAt: b.resetAt };
}
function rateLimit(opts) {
  return function rateLimitMiddleware(req, res, next) {
    const key = keyOf(req, opts.scope);
    const r = hit(key, opts.limit, opts.windowMs);
    res.setHeader("X-RateLimit-Limit", String(opts.limit));
    res.setHeader("X-RateLimit-Remaining", String(r.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(r.resetAt / 1e3)));
    if (!r.allowed) {
      const retryAfter = Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1e3));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "rate_limited",
        message: `Rate limit exceeded for ${opts.scope}. Retry after ${retryAfter}s.`
      });
    }
    next();
  };
}
var globalDailyCount = 0;
var globalDailyResetAt = Date.now() + 864e5;
function globalDailyGuard(limit) {
  return function globalDailyMiddleware(_req, res, next) {
    const now = Date.now();
    if (now >= globalDailyResetAt) {
      globalDailyCount = 0;
      globalDailyResetAt = now + 864e5;
    }
    globalDailyCount += 1;
    if (globalDailyCount > limit) {
      return res.status(503).json({
        error: "service_daily_cap_reached",
        message: "Daily AI usage cap reached for this deployment. Please try again tomorrow."
      });
    }
    next();
  };
}

// src/server/schemas.ts
import { z as z2 } from "zod";
var taskIdSchema = z2.enum(Object.keys(AI_TASKS));
var AiRequestSchema = z2.object({
  taskId: taskIdSchema.default("general"),
  input: z2.string().trim().min(1, "Input required").max(8e3, "Input too long")
});
var AiBatchSchema = z2.object({
  taskId: taskIdSchema,
  items: z2.array(z2.string().trim().min(1).max(2e3)).min(1).max(20)
});
var AiChatSchema = z2.object({
  messages: z2.array(
    z2.object({
      role: z2.enum(["user", "assistant"]),
      content: z2.string().trim().min(1).max(4e3)
    })
  ).min(1).max(20)
});
var AiThinkingSchema = z2.object({
  taskId: taskIdSchema.default("general"),
  prompt: z2.string().trim().min(1).max(8e3)
});
var ContactSchema = z2.object({
  email: z2.string().email().max(200).optional().or(z2.literal("")),
  message: z2.string().trim().min(10, "Message must be at least 10 characters").max(4e3),
  website: z2.string().max(0).optional()
});
var LeadSchema = z2.object({
  email: z2.string().email().max(200),
  taskDescription: z2.string().trim().min(3).max(1e3),
  recommendedToolSlug: z2.string().max(200).optional(),
  recommendedToolTitle: z2.string().max(300).optional(),
  source: z2.enum(["popup", "exit-intent", "cta", "manual"]).default("popup"),
  path: z2.string().max(500).optional(),
  consent: z2.literal(true, { errorMap: () => ({ message: "consent required" }) }),
  website: z2.string().max(0).optional()
});
var FeedbackSchema = z2.object({
  category: z2.enum(["bug", "feature", "general", "usability"]),
  message: z2.string().trim().min(5).max(4e3),
  contact: z2.string().max(200).optional().or(z2.literal("")),
  toolId: z2.string().max(120).optional(),
  toolTitle: z2.string().max(200).optional(),
  path: z2.string().max(500).optional(),
  website: z2.string().max(0).optional()
});

// src/server/delivery.ts
async function deliverMessage(kind, payload) {
  if (config2.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config2.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: config2.CONTACT_FROM_EMAIL,
          to: [config2.CONTACT_TO_EMAIL],
          subject: `[xfree.in ${kind}] ${payload.subject}`,
          text: payload.text + (payload.meta ? `

---
${JSON.stringify(payload.meta, null, 2)}` : "")
        })
      });
      if (!res.ok) {
        console.error(`[delivery] resend failed: ${res.status}`);
        return { ok: false, provider: "resend" };
      }
      return { ok: true, provider: "resend" };
    } catch (err) {
      console.error("[delivery] resend error", err);
      return { ok: false, provider: "resend" };
    }
  }
  console.log(`[delivery:${kind}] ${payload.subject}
${payload.text}`, payload.meta ?? {});
  return { ok: true, provider: "log" };
}

// src/middleware/security-headers.ts
var CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "script-src-elem 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://csi.gstatic.com https://fundingchoicesmessages.google.com",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://fundingchoicesmessages.google.com",
  "upgrade-insecure-requests"
];
function securityHeadersMiddleware(_req, res, next) {
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), display-capture=(), interest-cohort=()"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", CSP_DIRECTIVES.join("; "));
  next();
}

// src/scripts/tools-seed.json
var tools_seed_default = [
  {
    slug: "bulk-url-extractor",
    cluster: "seo-tools",
    title: "Bulk URL Extractor | Free Online Tool",
    description: "Extract all URLs and links from webpage source HTML or raw text into clean lists.",
    pillarKeyword: "bulk url extractor",
    supportingKeywords: [
      "extract urls from webpage",
      "url extractor online",
      "link scraper"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "url-encoder-decoder",
    cluster: "seo-tools",
    title: "URL Encoder/Decoder | Free Online Tool",
    description: "Encode or decode special characters in URLs according to RFC 3986 specs.",
    pillarKeyword: "url encoder decoder",
    supportingKeywords: [
      "url encode online",
      "url decode online",
      "percent encoding tool"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "url-shortener-free",
    cluster: "seo-tools",
    title: "Free URL Shortener | Free Online Tool",
    description: "Shorten long web links into concise, shareable URLs.",
    pillarKeyword: "url shortener free",
    supportingKeywords: [
      "shorten link free",
      "custom url shortener",
      "link shortener"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "url-expander-online",
    cluster: "seo-tools",
    title: "URL Expander | Free Online Tool",
    description: "Reveal the true destination of shortened or redirected URLs safely.",
    pillarKeyword: "url expander online",
    supportingKeywords: [
      "unshorten url",
      "check redirect destination",
      "url expander"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "url-parser-online",
    cluster: "seo-tools",
    title: "URL Parser | Free Online Tool",
    description: "Parse and inspect protocol, hostname, port, path, and query parameters of any URL.",
    pillarKeyword: "url parser online",
    supportingKeywords: [
      "url breakdown tool",
      "parse url parameters",
      "url structure analyzer"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "url-slug-generator",
    cluster: "seo-tools",
    title: "URL Slug Generator | Free Online Tool",
    description: "Convert page titles and phrases into clean, SEO-friendly URL slugs.",
    pillarKeyword: "url slug generator",
    supportingKeywords: [
      "slugify title",
      "seo slug creator",
      "clean url builder"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "utm-builder",
    cluster: "seo-tools",
    title: "UTM Campaign Builder | Free Online Tool",
    description: "Build tracked Google Analytics campaign URLs with source, medium, campaign, and term tags.",
    pillarKeyword: "utm builder",
    supportingKeywords: [
      "google utm builder",
      "tracking link creator",
      "utm parameter generator"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "utm-analyzer",
    cluster: "seo-tools",
    title: "UTM Analyzer & Debugger | Free Online Tool",
    description: "Parse, analyze, and validate UTM tracking parameters from marketing campaign links.",
    pillarKeyword: "utm analyzer",
    supportingKeywords: [
      "parse utm parameters",
      "decode utm link",
      "utm validator"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "canonical-url-checker",
    cluster: "seo-tools",
    title: "Canonical URL Checker | Free Online Tool",
    description: "Inspect canonical tags on target URLs to verify self-referencing and consolidation.",
    pillarKeyword: "canonical url checker",
    supportingKeywords: [
      "check canonical tag",
      "canonical tag tester",
      "rel canonical checker"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "redirect-chain-checker",
    cluster: "seo-tools",
    title: "Redirect Chain Checker | Free Online Tool",
    description: "Trace 301 and 302 HTTP redirect chains and identify redirect loops.",
    pillarKeyword: "redirect chain checker",
    supportingKeywords: [
      "trace redirect path",
      "301 redirect checker",
      "redirect loop detector"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "broken-link-checker-free",
    cluster: "seo-tools",
    title: "Broken Link Checker | Free Online Tool",
    description: "Identify broken links, 404 errors, and dead URLs across webpages.",
    pillarKeyword: "broken link checker free",
    supportingKeywords: [
      "404 link checker",
      "dead link finder",
      "check website links"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "http-status-checker",
    cluster: "seo-tools",
    title: "HTTP Status Code Checker | Free Online Tool",
    description: "Test HTTP response status codes (200, 301, 302, 404, 500) for target web links.",
    pillarKeyword: "http status checker",
    supportingKeywords: [
      "check http status",
      "header response checker",
      "url status test"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "url-to-ip",
    cluster: "seo-tools",
    title: "URL to IP Converter | Free Online Tool",
    description: "Resolve domain names and web URLs to server IP addresses instantly.",
    pillarKeyword: "url to ip",
    supportingKeywords: [
      "domain to ip lookup",
      "website ip resolver",
      "dns ip check"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "ip-to-url",
    cluster: "seo-tools",
    title: "IP to Hostname Converter | Free Online Tool",
    description: "Perform reverse DNS lookup to find domain names associated with IP addresses.",
    pillarKeyword: "ip to url",
    supportingKeywords: [
      "reverse dns lookup",
      "ip to domain",
      "ip host finder"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "url-parameter-builder",
    cluster: "seo-tools",
    title: "URL Parameter Builder | Free Online Tool",
    description: "Easily append, modify, and format query parameters on target web URLs.",
    pillarKeyword: "url parameter builder",
    supportingKeywords: [
      "build query string",
      "append url parameters",
      "query string builder"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "xml-sitemap-generator",
    cluster: "seo-tools",
    title: "XML Sitemap Generator | Free Online Tool",
    description: "Generate Google-compliant XML sitemaps automatically from link lists or crawl text.",
    pillarKeyword: "xml sitemap generator",
    supportingKeywords: [
      "free sitemap creator",
      "sitemap index builder",
      "xml sitemap tool"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "sitemap-validator",
    cluster: "seo-tools",
    title: "Sitemap Validator | Free Online Tool",
    description: "Validate XML sitemap syntax, check tag structure, and detect broken URLs.",
    pillarKeyword: "sitemap validator",
    supportingKeywords: [
      "check xml sitemap",
      "sitemap error checker",
      "validate sitemap xml"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "sitemap-index-generator",
    cluster: "seo-tools",
    title: "Sitemap Index Generator | Free Online Tool",
    description: "Combine multiple XML sitemap files into a master Google sitemap index.",
    pillarKeyword: "sitemap index generator",
    supportingKeywords: [
      "sitemap index builder",
      "merge sitemaps",
      "master sitemap creator"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "html-sitemap-generator",
    cluster: "seo-tools",
    title: "HTML Sitemap Generator | Free Online Tool",
    description: "Convert URL collections into structured HTML sitemap pages for site navigation.",
    pillarKeyword: "html sitemap generator",
    supportingKeywords: [
      "visual sitemap creator",
      "html link directory",
      "user sitemap maker"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "video-sitemap-generator",
    cluster: "seo-tools",
    title: "Video Sitemap Generator | Free Online Tool",
    description: "Generate specialized XML video sitemaps with thumbnail, title, and duration metadata.",
    pillarKeyword: "video sitemap generator",
    supportingKeywords: [
      "video sitemap builder",
      "google video sitemap",
      "video seo schema"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "image-sitemap-generator",
    cluster: "seo-tools",
    title: "Image Sitemap Generator | Free Online Tool",
    description: "Build image XML sitemaps to enhance Google Image Search indexing.",
    pillarKeyword: "image sitemap generator",
    supportingKeywords: [
      "image sitemap builder",
      "google image sitemap",
      "photo sitemap tool"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "news-sitemap-generator",
    cluster: "seo-tools",
    title: "Google News Sitemap Generator | Free Online Tool",
    description: "Create Google News compliant XML sitemaps with publication name and date fields.",
    pillarKeyword: "news sitemap generator",
    supportingKeywords: [
      "google news sitemap",
      "news article sitemap",
      "publisher sitemap"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "robots-txt-generator",
    cluster: "seo-tools",
    title: "Robots.txt Generator | Free Online Tool",
    description: "Generate customized robots.txt files with crawl-delay and user-agent disallow rules.",
    pillarKeyword: "robots.txt generator",
    supportingKeywords: [
      "create robots.txt",
      "robots txt builder",
      "googlebot disallow creator"
    ],
    toolComponent: "RobotsTxtGenerator"
  },
  {
    slug: "robots-txt-tester",
    cluster: "seo-tools",
    title: "Robots.txt Tester | Free Online Tool",
    description: "Test user-agent access rules against robots.txt directives to check crawlability.",
    pillarKeyword: "robots.txt tester",
    supportingKeywords: [
      "test robots.txt rules",
      "robots txt validator",
      "check googlebot access"
    ],
    toolComponent: "RobotsTxtGenerator"
  },
  {
    slug: "sitemap-splitter",
    cluster: "seo-tools",
    title: "Sitemap Splitter | Free Online Tool",
    description: "Split massive XML sitemaps containing over 50,000 URLs into smaller chunks.",
    pillarKeyword: "sitemap splitter",
    supportingKeywords: [
      "split large sitemap",
      "chunk xml sitemap",
      "sitemap file divider"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "sitemap-url-extractor",
    cluster: "seo-tools",
    title: "Sitemap URL Extractor | Free Online Tool",
    description: "Parse and extract all individual URL locations from XML sitemap files.",
    pillarKeyword: "sitemap url extractor",
    supportingKeywords: [
      "extract urls from sitemap",
      "parse sitemap xml",
      "sitemap link scraper"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "sitemap-to-csv",
    cluster: "seo-tools",
    title: "Sitemap to CSV Converter | Free Online Tool",
    description: "Convert XML sitemap links, lastmod dates, and priorities into CSV spreadsheets.",
    pillarKeyword: "sitemap to csv",
    supportingKeywords: [
      "sitemap csv exporter",
      "export sitemap to excel",
      "xml sitemap to table"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "csv-to-sitemap",
    cluster: "seo-tools",
    title: "CSV to Sitemap Converter | Free Online Tool",
    description: "Convert CSV URL lists into valid XML sitemaps ready for Search Console submission.",
    pillarKeyword: "csv to sitemap",
    supportingKeywords: [
      "csv to xml sitemap",
      "build sitemap from csv",
      "excel to sitemap"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "meta-tag-generator",
    cluster: "seo-tools",
    title: "Meta Tag Generator | Free Online Tool",
    description: "Create optimized HTML title tags, meta descriptions, and viewport configurations.",
    pillarKeyword: "meta tag generator",
    supportingKeywords: [
      "seo meta tag builder",
      "create meta tags",
      "html meta tag tool"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "open-graph-generator",
    cluster: "seo-tools",
    title: "Open Graph Meta Generator | Free Online Tool",
    description: "Generate og:title, og:image, and og:description tags for Facebook and LinkedIn.",
    pillarKeyword: "open graph generator",
    supportingKeywords: [
      "og tag generator",
      "facebook meta tags",
      "social preview builder"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "twitter-card-generator",
    cluster: "seo-tools",
    title: "Twitter Card Generator | Free Online Tool",
    description: "Create summary and large image Twitter Card meta tags for X/Twitter sharing.",
    pillarKeyword: "twitter card generator",
    supportingKeywords: [
      "x card generator",
      "twitter meta tags",
      "twitter preview tool"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "serp-preview-tool",
    cluster: "seo-tools",
    title: "SERP Snippet Preview | Free Online Tool",
    description: "Preview how your title, meta description, and URL will appear in Google Search results.",
    pillarKeyword: "serp preview tool",
    supportingKeywords: [
      "google search preview",
      "serp snippet simulator",
      "title description preview"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "title-tag-generator",
    cluster: "seo-tools",
    title: "Title Tag Generator | Free Online Tool",
    description: "Generate catchy, keyword-rich SEO title tags within character and pixel limits.",
    pillarKeyword: "title tag generator",
    supportingKeywords: [
      "seo title maker",
      "click-worthy title creator",
      "headline tag builder"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "meta-description-generator",
    cluster: "seo-tools",
    title: "Meta Description Generator | Free Online Tool",
    description: "Draft high-converting meta descriptions optimized for 155-character limits.",
    pillarKeyword: "meta description generator",
    supportingKeywords: [
      "seo description builder",
      "meta snippet writer",
      "search description maker"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "schema-markup-generator",
    cluster: "seo-tools",
    title: "Schema Markup Generator | Free Online Tool",
    description: "Build JSON-LD structured data markup for Google Rich Results.",
    pillarKeyword: "schema markup generator",
    supportingKeywords: [
      "schema org builder",
      "json-ld markup creator",
      "rich snippet generator"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "json-ld-generator",
    cluster: "seo-tools",
    title: "JSON-LD Generator | Free Online Tool",
    description: "Create clean JSON-LD scripts for structured data search engine optimization.",
    pillarKeyword: "json-ld generator",
    supportingKeywords: [
      "json ld builder",
      "structured data generator",
      "google json-ld maker"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "faq-schema-generator",
    cluster: "seo-tools",
    title: "FAQ Schema Generator | Free Online Tool",
    description: "Generate FAQPage JSON-LD schema to secure FAQ rich snippets in Google SERPs.",
    pillarKeyword: "faq schema generator",
    supportingKeywords: [
      "faq page schema",
      "faq rich snippet creator",
      "json-ld faq builder"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "howto-schema-generator",
    cluster: "seo-tools",
    title: "HowTo Schema Generator | Free Online Tool",
    description: "Create HowTo structured data markup with step-by-step instructions and images.",
    pillarKeyword: "howto schema generator",
    supportingKeywords: [
      "how to schema builder",
      "how-to rich snippet",
      "json ld howto maker"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "product-schema-generator",
    cluster: "seo-tools",
    title: "Product Schema Generator | Free Online Tool",
    description: "Build Product JSON-LD schema with price, rating, availability, and review fields.",
    pillarKeyword: "product schema generator",
    supportingKeywords: [
      "ecommerce schema creator",
      "product rich snippet",
      "json ld product tool"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "article-schema-generator",
    cluster: "seo-tools",
    title: "Article Schema Generator | Free Online Tool",
    description: "Generate NewsArticle and BlogPosting JSON-LD schema markup for blog posts.",
    pillarKeyword: "article schema generator",
    supportingKeywords: [
      "blog schema generator",
      "news article schema",
      "article rich snippet"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "recipe-schema-generator",
    cluster: "seo-tools",
    title: "Recipe Schema Generator | Free Online Tool",
    description: "Create Recipe schema markup with cooking time, ingredients, and nutrition info.",
    pillarKeyword: "recipe schema generator",
    supportingKeywords: [
      "recipe rich snippet",
      "food blog schema maker",
      "cooking schema generator"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "video-schema-generator",
    cluster: "seo-tools",
    title: "Video Schema Generator | Free Online Tool",
    description: "Build VideoObject JSON-LD markup with embed URLs, thumbnails, and upload dates.",
    pillarKeyword: "video schema generator",
    supportingKeywords: [
      "video object schema",
      "video rich snippet creator",
      "youtube video schema"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "local-business-schema",
    cluster: "seo-tools",
    title: "Local Business Schema Generator | Free Online Tool",
    description: "Create LocalBusiness structured data with NAP info, geo coordinates, and hours.",
    pillarKeyword: "local business schema",
    supportingKeywords: [
      "local seo schema builder",
      "gmb schema creator",
      "json ld local business"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "breadcrumb-schema",
    cluster: "seo-tools",
    title: "Breadcrumb Schema Generator | Free Online Tool",
    description: "Generate BreadcrumbList JSON-LD schema to show clean breadcrumbs in Google SERPs.",
    pillarKeyword: "breadcrumb schema",
    supportingKeywords: [
      "breadcrumb list schema",
      "json-ld breadcrumb maker",
      "serp breadcrumbs"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "organization-schema",
    cluster: "seo-tools",
    title: "Organization Schema Generator | Free Online Tool",
    description: "Build Organization JSON-LD markup with company logo, social profiles, and contact.",
    pillarKeyword: "organization schema",
    supportingKeywords: [
      "company schema builder",
      "organization rich snippet",
      "json ld organization"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "keyword-density-checker",
    cluster: "seo-tools",
    title: "Keyword Density Checker | Free Online Tool",
    description: "Analyze word frequency, 1-3 word phrase density, and keyword stuffing risk.",
    pillarKeyword: "keyword density checker",
    supportingKeywords: [
      "check keyword density",
      "word frequency analyzer",
      "seo content density"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "keyword-grouping-tool",
    cluster: "seo-tools",
    title: "Keyword Grouping Tool | Free Online Tool",
    description: "Group list of keywords into tight semantic clusters for content strategy.",
    pillarKeyword: "keyword grouping tool",
    supportingKeywords: [
      "keyword clustering tool",
      "group search terms",
      "keyword categorization"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "long-tail-keyword-generator",
    cluster: "seo-tools",
    title: "Long Tail Keyword Generator | Free Online Tool",
    description: "Discover high-intent long-tail keyword variations for low-competition ranking.",
    pillarKeyword: "long tail keyword generator",
    supportingKeywords: [
      "find long tail keywords",
      "niche keyword finder",
      "search query generator"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "keyword-cluster-tool",
    cluster: "seo-tools",
    title: "Keyword Cluster Tool | Free Online Tool",
    description: "Group keywords into topical clusters based on search intent and semantic overlaps.",
    pillarKeyword: "keyword cluster tool",
    supportingKeywords: [
      "topical authority builder",
      "keyword matrix generator",
      "semantic cluster maker"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "search-intent-classifier",
    cluster: "seo-tools",
    title: "Search Intent Classifier | Free Online Tool",
    description: "Classify keywords into Informational, Navigational, Commercial, or Transactional intent.",
    pillarKeyword: "search intent classifier",
    supportingKeywords: [
      "intent analysis tool",
      "determine search intent",
      "keyword intent checker"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "lsi-keyword-generator",
    cluster: "seo-tools",
    title: "LSI Keyword Generator | Free Online Tool",
    description: "Find Latent Semantic Indexing (LSI) terms to enrich blog content context.",
    pillarKeyword: "lsi keyword generator",
    supportingKeywords: [
      "semantic keywords finder",
      "lsi terms creator",
      "related term generator"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "keyword-difficulty-checker",
    cluster: "seo-tools",
    title: "Keyword Difficulty Checker | Free Online Tool",
    description: "Evaluate organic search competition and keyword ranking difficulty estimates.",
    pillarKeyword: "keyword difficulty checker",
    supportingKeywords: [
      "check keyword difficulty",
      "seo difficulty score",
      "keyword competition tool"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "serp-keyword-extractor",
    cluster: "seo-tools",
    title: "SERP Keyword Extractor | Free Online Tool",
    description: "Extract top keywords, headings, and terms from search engine result snippets.",
    pillarKeyword: "serp keyword extractor",
    supportingKeywords: [
      "serp term scraper",
      "search result keyword finder",
      "serp content analyzer"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "people-also-ask-extractor",
    cluster: "seo-tools",
    title: "People Also Ask Extractor | Free Online Tool",
    description: "Scrape and extract questions from Google's People Also Ask (PAA) boxes.",
    pillarKeyword: "people also ask extractor",
    supportingKeywords: [
      "extract google paa",
      "find search questions",
      "paa scraper tool"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "related-keywords-finder",
    cluster: "seo-tools",
    title: "Related Keywords Finder | Free Online Tool",
    description: "Discover related search queries and search suggestions for core seed keywords.",
    pillarKeyword: "related keywords finder",
    supportingKeywords: [
      "google search suggestions",
      "find related queries",
      "keyword ideas maker"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "hashtag-generator",
    cluster: "seo-tools",
    title: "Hashtag Generator | Free Online Tool",
    description: "Generate trending hashtags for Instagram, TikTok, LinkedIn, and X/Twitter.",
    pillarKeyword: "hashtag generator",
    supportingKeywords: [
      "social hashtag creator",
      "viral hashtag finder",
      "instagram tag builder"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "youtube-tag-extractor",
    cluster: "seo-tools",
    title: "YouTube Tag Extractor | Free Online Tool",
    description: "Extract video tags and keywords from any YouTube video URL.",
    pillarKeyword: "youtube tag extractor",
    supportingKeywords: [
      "scrape youtube tags",
      "youtube keyword finder",
      "video tag scraper"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "amazon-keyword-tool",
    cluster: "seo-tools",
    title: "Amazon Keyword Tool | Free Online Tool",
    description: "Generate Amazon auto-suggest search terms for e-commerce product SEO.",
    pillarKeyword: "amazon keyword tool",
    supportingKeywords: [
      "amazon seo keywords",
      "product search tags",
      "amazon listing keywords"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "etsy-tag-generator",
    cluster: "seo-tools",
    title: "Etsy Tag Generator | Free Online Tool",
    description: "Find high-converting tags and search keywords for Etsy shop product listings.",
    pillarKeyword: "etsy tag generator",
    supportingKeywords: [
      "etsy listing tags",
      "handmade product keywords",
      "etsy seo generator"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "pinterest-keyword-tool",
    cluster: "seo-tools",
    title: "Pinterest Keyword Tool | Free Online Tool",
    description: "Discover high-volume Pinterest search terms for pin descriptions and boards.",
    pillarKeyword: "pinterest keyword tool",
    supportingKeywords: [
      "pinterest search tags",
      "pin keyword generator",
      "pinterest seo tool"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "tiktok-hashtag-generator",
    cluster: "seo-tools",
    title: "TikTok Hashtag Generator | Free Online Tool",
    description: "Find viral TikTok hashtags and sound trends to maximize video reach.",
    pillarKeyword: "tiktok hashtag generator",
    supportingKeywords: [
      "tiktok video tags",
      "trending tiktok hashtags",
      "tiktok seo tool"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "meta-keywords-generator",
    cluster: "seo-tools",
    title: "Meta Keywords Generator | Free Online Tool",
    description: "Extract core tags and generate meta keywords lists for document categorization.",
    pillarKeyword: "meta keywords generator",
    supportingKeywords: [
      "create meta keywords",
      "extract document tags",
      "page keyword tagger"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "seo-analyzer-free",
    cluster: "seo-tools",
    title: "Website SEO Analyzer | Free Online Tool",
    description: "Perform on-page SEO audits, inspect tags, image alt text, and heading structure.",
    pillarKeyword: "seo analyzer free",
    supportingKeywords: [
      "free seo audit tool",
      "website health check",
      "on page seo checker"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "page-speed-analyzer",
    cluster: "seo-tools",
    title: "Page Speed Analyzer | Free Online Tool",
    description: "Analyze webpage performance metrics and identify speed bottlenecks.",
    pillarKeyword: "page speed analyzer",
    supportingKeywords: [
      "test load speed",
      "website speed checker",
      "performance auditor"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "core-web-vitals-test",
    cluster: "seo-tools",
    title: "Core Web Vitals Tester | Free Online Tool",
    description: "Measure LCP, FID/INP, and CLS scores for desktop and mobile page user experience.",
    pillarKeyword: "core web vitals test",
    supportingKeywords: [
      "check core web vitals",
      "lcp cls analyzer",
      "google web vitals test"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "mobile-friendly-test",
    cluster: "seo-tools",
    title: "Mobile Friendly Test | Free Online Tool",
    description: "Inspect viewport tags, text readability, and touch targets for mobile usability.",
    pillarKeyword: "mobile friendly test",
    supportingKeywords: [
      "check mobile responsiveness",
      "responsive design test",
      "mobile usability audit"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "ssl-checker-online",
    cluster: "seo-tools",
    title: "SSL Certificate Checker | Free Online Tool",
    description: "Check SSL/TLS certificate validity, expiration date, issuer, and cipher suite.",
    pillarKeyword: "ssl checker online",
    supportingKeywords: [
      "test ssl certificate",
      "https validity check",
      "ssl expiry inspector"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "dns-propagation-checker",
    cluster: "seo-tools",
    title: "DNS Propagation Checker | Free Online Tool",
    description: "Verify global DNS record propagation across multiple DNS servers worldwide.",
    pillarKeyword: "dns propagation checker",
    supportingKeywords: [
      "global dns check",
      "dns propagation test",
      "check domain propagation"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "dns-lookup-tool",
    cluster: "seo-tools",
    title: "DNS Record Lookup | Free Online Tool",
    description: "Query A, AAAA, MX, CNAME, TXT, and NS records for any domain name.",
    pillarKeyword: "dns lookup tool",
    supportingKeywords: [
      "lookup dns records",
      "query mx records",
      "domain dns query"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "whois-lookup-free",
    cluster: "seo-tools",
    title: "WHOIS Lookup Tool | Free Online Tool",
    description: "Inspect domain registration details, registrar, creation date, and expiration.",
    pillarKeyword: "whois lookup free",
    supportingKeywords: [
      "domain whois lookup",
      "check domain owner",
      "domain age lookup"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "domain-age-checker",
    cluster: "seo-tools",
    title: "Domain Age Checker | Free Online Tool",
    description: "Calculate exact age, registration date, and domain domain authority history.",
    pillarKeyword: "domain age checker",
    supportingKeywords: [
      "check age of domain",
      "domain history lookup",
      "domain creation date"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "backlink-checker-free",
    cluster: "seo-tools",
    title: "Backlink Checker | Free Online Tool",
    description: "Analyze incoming referring domains and backlink profiles for web domains.",
    pillarKeyword: "backlink checker free",
    supportingKeywords: [
      "check domain backlinks",
      "referring sites finder",
      "inbound link checker"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "domain-authority-checker",
    cluster: "seo-tools",
    title: "Domain Authority Checker | Free Online Tool",
    description: "Estimate domain authority, trust score, and domain ranking potential.",
    pillarKeyword: "domain authority checker",
    supportingKeywords: [
      "check da score",
      "domain rating checker",
      "website trust score"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "page-authority-checker",
    cluster: "seo-tools",
    title: "Page Authority Checker | Free Online Tool",
    description: "Analyze individual page authority scores and ranking strength.",
    pillarKeyword: "page authority checker",
    supportingKeywords: [
      "check pa score",
      "page rating inspector",
      "url authority score"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "spam-score-checker",
    cluster: "seo-tools",
    title: "Spam Score Checker | Free Online Tool",
    description: "Evaluate domain link spam flags and potential toxic backlink penalties.",
    pillarKeyword: "spam score checker",
    supportingKeywords: [
      "check website spam score",
      "link toxicity checker",
      "seo penalty check"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "hreflang-generator",
    cluster: "seo-tools",
    title: "Hreflang Tag Generator | Free Online Tool",
    description: "Generate hreflang link tags for multi-language and multi-regional websites.",
    pillarKeyword: "hreflang generator",
    supportingKeywords: [
      "multi language seo tag",
      "hreflang builder",
      "language alternate tags"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "hreflang-validator",
    cluster: "seo-tools",
    title: "Hreflang Validator | Free Online Tool",
    description: "Validate hreflang implementation, return tags, and ISO language/region codes.",
    pillarKeyword: "hreflang validator",
    supportingKeywords: [
      "check hreflang syntax",
      "hreflang auditor",
      "test language tags"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "internal-link-analyzer",
    cluster: "seo-tools",
    title: "Internal Link Analyzer | Free Online Tool",
    description: "Audit internal link counts, anchor text diversity, and link architecture.",
    pillarKeyword: "internal link analyzer",
    supportingKeywords: [
      "check internal links",
      "link depth analyzer",
      "internal page rank"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "orphan-page-finder",
    cluster: "seo-tools",
    title: "Orphan Page Finder | Free Online Tool",
    description: "Identify unlinked orphan pages that lack internal inbound links.",
    pillarKeyword: "orphan page finder",
    supportingKeywords: [
      "find orphan pages",
      "unlinked page detector",
      "crawl audit tool"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "duplicate-content-checker",
    cluster: "seo-tools",
    title: "Duplicate Content Checker | Free Online Tool",
    description: "Compare webpage text to identify internal or external content duplication.",
    pillarKeyword: "duplicate content checker",
    supportingKeywords: [
      "check copied content",
      "plagiarism seo tool",
      "content similarity check"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "local-seo-checker",
    cluster: "seo-tools",
    title: "Local SEO Checker | Free Online Tool",
    description: "Audit local citations, NAP consistency, and local map pack rank signals.",
    pillarKeyword: "local seo checker",
    supportingKeywords: [
      "local search audit",
      "nap consistency check",
      "local pack analyzer"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "gmb-optimizer",
    cluster: "seo-tools",
    title: "Google My Business Optimizer | Free Online Tool",
    description: "Optimize GMB listing profile info, categories, and business description tags.",
    pillarKeyword: "gmb optimizer",
    supportingKeywords: [
      "gmb audit tool",
      "google business profile optimizer",
      "local listing tool"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "nap-consistency-checker",
    cluster: "seo-tools",
    title: "NAP Consistency Checker | Free Online Tool",
    description: "Verify Name, Address, and Phone accuracy across top local business directories.",
    pillarKeyword: "nap consistency checker",
    supportingKeywords: [
      "check nap consistency",
      "local citation audit",
      "directory nap check"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "citation-finder",
    cluster: "seo-tools",
    title: "Citation Finder | Free Online Tool",
    description: "Discover local citation opportunities and niche directory submission sites.",
    pillarKeyword: "citation finder",
    supportingKeywords: [
      "find local citations",
      "business directory finder",
      "local backlink finder"
    ],
    toolComponent: "SchemaGenerator"
  },
  {
    slug: "multilingual-seo-tool",
    cluster: "seo-tools",
    title: "Multi-language SEO Tool | Free Online Tool",
    description: "Optimize international content alternate tags, canonicals, and language targets.",
    pillarKeyword: "multilingual seo tool",
    supportingKeywords: [
      "international seo tool",
      "multilingual tag generator",
      "global seo optimizer"
    ],
    toolComponent: "MetaOpenGraphGenerator"
  },
  {
    slug: "country-code-extractor",
    cluster: "seo-tools",
    title: "Country Code Extractor | Free Online Tool",
    description: "Extract ISO 2-letter and 3-letter country codes from URLs, TLDs, or address lists.",
    pillarKeyword: "country code extractor",
    supportingKeywords: [
      "iso country code finder",
      "tld country extractor",
      "country code lookup"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "currency-locale-detector",
    cluster: "seo-tools",
    title: "Currency Locale Detector | Free Online Tool",
    description: "Detect currency codes, symbols, and formatting rules based on country locale.",
    pillarKeyword: "currency locale detector",
    supportingKeywords: [
      "currency formatting tool",
      "locale detector",
      "currency code lookup"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "timezone-seo-tool",
    cluster: "seo-tools",
    title: "Timezone SEO Tool | Free Online Tool",
    description: "Calculate optimal publish times and schedule posts across global timezones.",
    pillarKeyword: "timezone seo tool",
    supportingKeywords: [
      "global publish scheduler",
      "timezone posting tool",
      "seo time converter"
    ],
    toolComponent: "CronExpressionGenerator"
  },
  {
    slug: "geo-targeting-tester",
    cluster: "seo-tools",
    title: "Geo Targeting Tester | Free Online Tool",
    description: "Test search result rendering across different geographic IP locations.",
    pillarKeyword: "geo targeting tester",
    supportingKeywords: [
      "test geo search results",
      "location based search",
      "ip search tester"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "ip-geolocation",
    cluster: "seo-tools",
    title: "IP Geolocation Tool | Free Online Tool",
    description: "Lookup geographic location, country, city, and ISP information for any IP address.",
    pillarKeyword: "ip geolocation",
    supportingKeywords: [
      "ip location finder",
      "check ip country",
      "geolocation lookup"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "cdn-tester",
    cluster: "seo-tools",
    title: "CDN Tester | Free Online Tool",
    description: "Test Content Delivery Network response headers, edge caching, and TTFB latency.",
    pillarKeyword: "cdn tester",
    supportingKeywords: [
      "check cdn caching",
      "edge latency test",
      "cdn header inspector"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "tld-analyzer",
    cluster: "seo-tools",
    title: "TLD Analyzer | Free Online Tool",
    description: "Analyze top-level domain extensions (.com, .io, .ai) for search engine trust.",
    pillarKeyword: "tld analyzer",
    supportingKeywords: [
      "tld trust score",
      "domain extension analyzer",
      "check tld authority"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "seo-report-generator",
    cluster: "seo-tools",
    title: "SEO Report Generator | Free Online Tool",
    description: "Generate comprehensive PDF and CSV audit reports for clients and stakeholders.",
    pillarKeyword: "seo report generator",
    supportingKeywords: [
      "client seo report",
      "audit report maker",
      "export seo audit"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "competitor-analysis-tool",
    cluster: "seo-tools",
    title: "Competitor Analysis Tool | Free Online Tool",
    description: "Compare keyword overlap, content length, and meta tags against organic competitors.",
    pillarKeyword: "competitor analysis tool",
    supportingKeywords: [
      "seo competitor comparison",
      "domain gap analysis",
      "competitor keyword check"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "serp-tracker-free",
    cluster: "seo-tools",
    title: "SERP Tracker | Free Online Tool",
    description: "Track target keyword positions in Google Search results over time.",
    pillarKeyword: "serp tracker free",
    supportingKeywords: [
      "rank tracking tool",
      "check serp position",
      "organic rank tracker"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "rank-checker-free",
    cluster: "seo-tools",
    title: "Rank Checker | Free Online Tool",
    description: "Check live search engine rankings for target domain keywords.",
    pillarKeyword: "rank checker free",
    supportingKeywords: [
      "check google ranking",
      "keyword rank lookup",
      "live serp rank"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "keyword-position-tracker",
    cluster: "seo-tools",
    title: "Keyword Position Tracker | Free Online Tool",
    description: "Monitor fluctuations in organic search result rankings.",
    pillarKeyword: "keyword position tracker",
    supportingKeywords: [
      "position fluctuation checker",
      "rank tracker free",
      "serp monitor"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "traffic-estimator",
    cluster: "seo-tools",
    title: "Traffic Estimator | Free Online Tool",
    description: "Estimate organic search traffic potential based on monthly search volumes.",
    pillarKeyword: "traffic estimator",
    supportingKeywords: [
      "calculate organic traffic",
      "traffic volume calculator",
      "search volume estimator"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "seo-roi-calculator",
    cluster: "seo-tools",
    title: "SEO ROI Calculator | Free Online Tool",
    description: "Calculate projected return on investment for organic search SEO campaigns.",
    pillarKeyword: "seo roi calculator",
    supportingKeywords: [
      "calculate seo roi",
      "seo revenue estimator",
      "organic search roi"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "seo-audit-checklist",
    cluster: "seo-tools",
    title: "SEO Audit Checklist | Free Online Tool",
    description: "Interactive 50-point technical, content, and link SEO audit checklist.",
    pillarKeyword: "seo audit checklist",
    supportingKeywords: [
      "technical audit checklist",
      "on page seo checklist",
      "website audit guide"
    ],
    toolComponent: "BulkUrlExtractor"
  },
  {
    slug: "json-formatter",
    cluster: "developer-tools",
    title: "JSON Formatter | Free Online Tool",
    description: "Format, beautify, validate, and minify JSON payloads with syntax highlighting.",
    pillarKeyword: "json formatter",
    supportingKeywords: [
      "json validator",
      "json minifier",
      "json beautifier"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "json-validator",
    cluster: "developer-tools",
    title: "JSON Validator | Free Online Tool",
    description: "Validate JSON syntax, highlight errors, and fix structural malformations.",
    pillarKeyword: "json validator",
    supportingKeywords: [
      "json error checker",
      "validate json online",
      "json parser test"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "json-minifier",
    cluster: "developer-tools",
    title: "JSON Minifier | Free Online Tool",
    description: "Compress and minify JSON files by removing whitespace and line breaks.",
    pillarKeyword: "json minifier",
    supportingKeywords: [
      "compress json",
      "json size reducer",
      "minify json online"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "xml-formatter",
    cluster: "developer-tools",
    title: "XML Formatter | Free Online Tool",
    description: "Format, beautify, and indent XML documents with custom spacing options.",
    pillarKeyword: "xml formatter",
    supportingKeywords: [
      "xml beautifier",
      "format xml online",
      "xml auto indent"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "xml-validator",
    cluster: "developer-tools",
    title: "XML Validator | Free Online Tool",
    description: "Validate XML document syntax and verify closing tag compliance.",
    pillarKeyword: "xml validator",
    supportingKeywords: [
      "xml error checker",
      "check xml syntax",
      "xml parser validator"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "xml-minifier",
    cluster: "developer-tools",
    title: "XML Minifier | Free Online Tool",
    description: "Minify XML payloads to reduce network transfer payload sizes.",
    pillarKeyword: "xml minifier",
    supportingKeywords: [
      "compress xml",
      "xml minifier online",
      "strip xml whitespace"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "yaml-formatter",
    cluster: "developer-tools",
    title: "YAML Formatter | Free Online Tool",
    description: "Format, lint, and indent YAML configuration files for Kubernetes and Docker.",
    pillarKeyword: "yaml formatter",
    supportingKeywords: [
      "yaml lint",
      "format yaml online",
      "yaml beautifier"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "yaml-validator",
    cluster: "developer-tools",
    title: "YAML Validator | Free Online Tool",
    description: "Validate YAML file syntax and indentation error detection.",
    pillarKeyword: "yaml validator",
    supportingKeywords: [
      "yaml error checker",
      "check yaml syntax",
      "validate yaml online"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "sql-formatter",
    cluster: "developer-tools",
    title: "SQL Formatter | Free Online Tool",
    description: "Format, beautify, and standardize SQL queries for MySQL, Postgres, and Oracle.",
    pillarKeyword: "sql formatter",
    supportingKeywords: [
      "sql beautifier",
      "format sql online",
      "sql query indent"
    ],
    toolComponent: "SqlFormatterValidator"
  },
  {
    slug: "sql-beautifier",
    cluster: "developer-tools",
    title: "SQL Beautifier | Free Online Tool",
    description: "Transform messy SQL code into clean, readable formatted query blocks.",
    pillarKeyword: "sql beautifier",
    supportingKeywords: [
      "beautify sql queries",
      "clean sql code",
      "pretty print sql"
    ],
    toolComponent: "SqlFormatterValidator"
  },
  {
    slug: "html-formatter",
    cluster: "developer-tools",
    title: "HTML Formatter | Free Online Tool",
    description: "Format and auto-indent raw HTML source code with clean nesting.",
    pillarKeyword: "html formatter",
    supportingKeywords: [
      "html beautifier",
      "format html code",
      "html indent tool"
    ],
    toolComponent: "MarkdownEditorPreview"
  },
  {
    slug: "html-minifier",
    cluster: "developer-tools",
    title: "HTML Minifier | Free Online Tool",
    description: "Minify HTML documents by stripping comments, spaces, and line breaks.",
    pillarKeyword: "html minifier",
    supportingKeywords: [
      "compress html",
      "html code minifier",
      "reduce html size"
    ],
    toolComponent: "MarkdownEditorPreview"
  },
  {
    slug: "css-formatter",
    cluster: "developer-tools",
    title: "CSS Formatter | Free Online Tool",
    description: "Format and expand compressed CSS stylesheets into structured rules.",
    pillarKeyword: "css formatter",
    supportingKeywords: [
      "css beautifier",
      "format css stylesheet",
      "pretty print css"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "css-minifier",
    cluster: "developer-tools",
    title: "CSS Minifier | Free Online Tool",
    description: "Compress CSS files to optimize page load speeds and bandwidth usage.",
    pillarKeyword: "css minifier",
    supportingKeywords: [
      "minify css code",
      "compress stylesheet",
      "css size optimizer"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "javascript-formatter",
    cluster: "developer-tools",
    title: "JavaScript Formatter | Free Online Tool",
    description: "Format, beautify, and un-minify obfuscated JavaScript code.",
    pillarKeyword: "javascript formatter",
    supportingKeywords: [
      "js beautifier",
      "format javascript code",
      "js auto indent"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "json-to-csv",
    cluster: "developer-tools",
    title: "JSON to CSV Converter | Free Online Tool",
    description: "Convert JSON arrays and nested API responses into structured CSV spreadsheets.",
    pillarKeyword: "json to csv",
    supportingKeywords: [
      "export json to excel",
      "json to table",
      "convert json csv"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "csv-to-json",
    cluster: "developer-tools",
    title: "CSV to JSON Converter | Free Online Tool",
    description: "Convert CSV spreadsheet files and tables into clean JSON object arrays.",
    pillarKeyword: "csv to json",
    supportingKeywords: [
      "excel to json",
      "csv array to json",
      "table to json converter"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "json-to-xml",
    cluster: "developer-tools",
    title: "JSON to XML Converter | Free Online Tool",
    description: "Transform JSON data payloads into well-formed XML documents.",
    pillarKeyword: "json to xml",
    supportingKeywords: [
      "convert json to xml",
      "json xml converter",
      "json tree to xml"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "xml-to-json",
    cluster: "developer-tools",
    title: "XML to JSON Converter | Free Online Tool",
    description: "Convert XML documents and RSS feeds into JSON object format.",
    pillarKeyword: "xml to json",
    supportingKeywords: [
      "convert xml to json",
      "xml parser to json",
      "rss to json"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "json-to-yaml",
    cluster: "developer-tools",
    title: "JSON to YAML Converter | Free Online Tool",
    description: "Convert JSON data into clean YAML config format for Docker and CI/CD.",
    pillarKeyword: "json to yaml",
    supportingKeywords: [
      "json to yaml online",
      "convert json yaml",
      "json to yml"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "yaml-to-json",
    cluster: "developer-tools",
    title: "YAML to JSON Converter | Free Online Tool",
    description: "Convert YAML config files into structured JSON payloads.",
    pillarKeyword: "yaml to json",
    supportingKeywords: [
      "yaml to json converter",
      "convert yml to json",
      "parse yaml json"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "json-to-toml",
    cluster: "developer-tools",
    title: "JSON to TOML Converter | Free Online Tool",
    description: "Convert JSON documents into TOML configuration format.",
    pillarKeyword: "json to toml",
    supportingKeywords: [
      "json to toml online",
      "convert json toml",
      "toml builder"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "csv-to-sql",
    cluster: "developer-tools",
    title: "CSV to SQL Converter | Free Online Tool",
    description: "Generate SQL INSERT INTO statements from CSV spreadsheet rows.",
    pillarKeyword: "csv to sql",
    supportingKeywords: [
      "csv to insert sql",
      "convert excel to sql",
      "csv to database"
    ],
    toolComponent: "SqlFormatterValidator"
  },
  {
    slug: "sql-to-csv",
    cluster: "developer-tools",
    title: "SQL to CSV Converter | Free Online Tool",
    description: "Convert SQL query results and dump files into downloadable CSV tables.",
    pillarKeyword: "sql to csv",
    supportingKeywords: [
      "export sql to excel",
      "sql dump to csv",
      "convert query csv"
    ],
    toolComponent: "SqlFormatterValidator"
  },
  {
    slug: "markdown-to-html",
    cluster: "developer-tools",
    title: "Markdown to HTML Converter | Free Online Tool",
    description: "Convert GFM Markdown text into formatted HTML markup.",
    pillarKeyword: "markdown to html",
    supportingKeywords: [
      "md to html converter",
      "render markdown html",
      "markdown compiler"
    ],
    toolComponent: "MarkdownEditorPreview"
  },
  {
    slug: "html-to-markdown",
    cluster: "developer-tools",
    title: "HTML to Markdown Converter | Free Online Tool",
    description: "Convert HTML pages and web snippets into clean Markdown code.",
    pillarKeyword: "html to markdown",
    supportingKeywords: [
      "html to md",
      "web page to markdown",
      "convert html md"
    ],
    toolComponent: "MarkdownEditorPreview"
  },
  {
    slug: "markdown-to-pdf",
    cluster: "developer-tools",
    title: "Markdown to PDF Converter | Free Online Tool",
    description: "Convert Markdown documentation files into styled PDF documents.",
    pillarKeyword: "markdown to pdf",
    supportingKeywords: [
      "md to pdf exporter",
      "export markdown pdf",
      "markdown document print"
    ],
    toolComponent: "MarkdownEditorPreview"
  },
  {
    slug: "html-to-pdf",
    cluster: "developer-tools",
    title: "HTML to PDF Converter | Free Online Tool",
    description: "Render raw HTML and CSS stylesheets into downloadable PDF pages.",
    pillarKeyword: "html to pdf",
    supportingKeywords: [
      "html web to pdf",
      "save html as pdf",
      "convert web page pdf"
    ],
    toolComponent: "MarkdownEditorPreview"
  },
  {
    slug: "ini-to-json",
    cluster: "developer-tools",
    title: "INI to JSON Converter | Free Online Tool",
    description: "Convert INI configuration files into structured JSON objects.",
    pillarKeyword: "ini to json",
    supportingKeywords: [
      "ini file to json",
      "parse ini to json",
      "convert ini config"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "properties-to-json",
    cluster: "developer-tools",
    title: "Properties to JSON Converter | Free Online Tool",
    description: "Convert Java .properties config files into nested JSON objects.",
    pillarKeyword: "properties to json",
    supportingKeywords: [
      "java properties to json",
      "convert properties file",
      "parse properties json"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "base64-encoder",
    cluster: "developer-tools",
    title: "Base64 Encoder | Free Online Tool",
    description: "Encode text, binary strings, or images into Base64 format.",
    pillarKeyword: "base64 encoder",
    supportingKeywords: [
      "encode base64 online",
      "text to base64",
      "base64 converter"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "base64-decoder",
    cluster: "developer-tools",
    title: "Base64 Decoder | Free Online Tool",
    description: "Decode Base64 encoded strings back into plain text or data files.",
    pillarKeyword: "base64 decoder",
    supportingKeywords: [
      "decode base64 online",
      "base64 to text",
      "base64 string decoder"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "url-encoder",
    cluster: "developer-tools",
    title: "URL Encoder | Free Online Tool",
    description: "Percent-encode special characters in query string parameter values.",
    pillarKeyword: "url encoder",
    supportingKeywords: [
      "percent encoder",
      "url string encode",
      "encode uri component"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "url-decoder",
    cluster: "developer-tools",
    title: "URL Decoder | Free Online Tool",
    description: "Decode percent-encoded URL query string parameters back to plain text.",
    pillarKeyword: "url decoder",
    supportingKeywords: [
      "percent decoder",
      "url string decode",
      "decode uri component"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "html-entity-encoder",
    cluster: "developer-tools",
    title: "HTML Entity Encoder | Free Online Tool",
    description: "Convert HTML characters like <, >, and & into safety encoded entities.",
    pillarKeyword: "html entity encoder",
    supportingKeywords: [
      "encode html entities",
      "escape html characters",
      "html entity maker"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "html-entity-decoder",
    cluster: "developer-tools",
    title: "HTML Entity Decoder | Free Online Tool",
    description: "Decode HTML entities like &lt; and &amp; back into readable characters.",
    pillarKeyword: "html entity decoder",
    supportingKeywords: [
      "decode html entities",
      "unescape html code",
      "html entity parser"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "md5-generator",
    cluster: "developer-tools",
    title: "MD5 Hash Generator | Free Online Tool",
    description: "Generate 128-bit MD5 checksum hashes for text or input verification.",
    pillarKeyword: "md5 generator",
    supportingKeywords: [
      "md5 checksum generator",
      "text to md5",
      "calculate md5 hash"
    ],
    toolComponent: "HashGenerator"
  },
  {
    slug: "sha1-generator",
    cluster: "developer-tools",
    title: "SHA-1 Hash Generator | Free Online Tool",
    description: "Calculate SHA-1 cryptographic hashes for text payloads.",
    pillarKeyword: "sha1 generator",
    supportingKeywords: [
      "sha1 checksum maker",
      "generate sha1 hash",
      "sha1 string encoder"
    ],
    toolComponent: "HashGenerator"
  },
  {
    slug: "sha256-generator",
    cluster: "developer-tools",
    title: "SHA-256 Hash Generator | Free Online Tool",
    description: "Generate secure SHA-256 hashes for data integrity verification.",
    pillarKeyword: "sha256 generator",
    supportingKeywords: [
      "sha256 hash maker",
      "text to sha256",
      "calculate sha256"
    ],
    toolComponent: "HashGenerator"
  },
  {
    slug: "sha512-generator",
    cluster: "developer-tools",
    title: "SHA-512 Hash Generator | Free Online Tool",
    description: "Generate high-security SHA-512 cryptographic hash digest strings.",
    pillarKeyword: "sha512 generator",
    supportingKeywords: [
      "sha512 checksum maker",
      "calculate sha512",
      "sha512 hash generator"
    ],
    toolComponent: "HashGenerator"
  },
  {
    slug: "bcrypt-generator",
    cluster: "developer-tools",
    title: "Bcrypt Hash Generator | Free Online Tool",
    description: "Generate secure salted Bcrypt password hashes with custom work factors.",
    pillarKeyword: "bcrypt generator",
    supportingKeywords: [
      "bcrypt hash maker",
      "password bcrypt generator",
      "bcrypt salt tool"
    ],
    toolComponent: "HashGenerator"
  },
  {
    slug: "argon2-generator",
    cluster: "developer-tools",
    title: "Argon2 Hash Generator | Free Online Tool",
    description: "Generate Argon2id secure password hashes for web auth systems.",
    pillarKeyword: "argon2 generator",
    supportingKeywords: [
      "argon2 password hash",
      "argon2id generator",
      "argon2 checksum"
    ],
    toolComponent: "HashGenerator"
  },
  {
    slug: "hmac-generator",
    cluster: "developer-tools",
    title: "HMAC Generator | Free Online Tool",
    description: "Calculate Hash-based Message Authentication Codes with secret keys.",
    pillarKeyword: "hmac generator",
    supportingKeywords: [
      "hmac sha256 generator",
      "calculate hmac code",
      "hmac signature maker"
    ],
    toolComponent: "HashGenerator"
  },
  {
    slug: "uuid-generator",
    cluster: "developer-tools",
    title: "UUID v4 Generator | Free Online Tool",
    description: "Generate bulk cryptographically secure v4 UUID unique identifiers.",
    pillarKeyword: "uuid generator",
    supportingKeywords: [
      "guid generator online",
      "create random uuid",
      "uuid v4 builder"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "ulid-generator",
    cluster: "developer-tools",
    title: "ULID Generator | Free Online Tool",
    description: "Generate Universally Unique Lexicographically Sortable Identifiers.",
    pillarKeyword: "ulid generator",
    supportingKeywords: [
      "ulid generator online",
      "sortable unique id",
      "ulid creator"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "nanoid-generator",
    cluster: "developer-tools",
    title: "NanoID Generator | Free Online Tool",
    description: "Generate tiny, secure, URL-friendly unique string IDs.",
    pillarKeyword: "nanoid generator",
    supportingKeywords: [
      "nanoid builder",
      "small unique id generator",
      "nanoid maker"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "cuid-generator",
    cluster: "developer-tools",
    title: "CUID Generator | Free Online Tool",
    description: "Generate collision-resistant IDs optimized for horizontal scaling.",
    pillarKeyword: "cuid generator",
    supportingKeywords: [
      "cuid generator online",
      "cuid2 maker",
      "database id generator"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "snowflake-id-generator",
    cluster: "developer-tools",
    title: "Snowflake ID Generator | Free Online Tool",
    description: "Generate 64-bit Twitter Snowflake time-sortable integer IDs.",
    pillarKeyword: "snowflake id generator",
    supportingKeywords: [
      "twitter snowflake generator",
      "64 bit integer id",
      "snowflake id maker"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "regex-tester",
    cluster: "developer-tools",
    title: "Regex Tester | Free Online Tool",
    description: "Test regular expressions with real-time match group highlighting.",
    pillarKeyword: "regex tester",
    supportingKeywords: [
      "regex pattern tester",
      "regex validator",
      "test regular expression"
    ],
    toolComponent: "RegexTesterExplainer"
  },
  {
    slug: "regex-generator-ai",
    cluster: "developer-tools",
    title: "AI Regex Generator | Free Online Tool",
    description: "Generate regular expression patterns from natural language prompts.",
    pillarKeyword: "regex generator",
    supportingKeywords: [
      "ai regex maker",
      "plain text to regex",
      "regex prompt builder"
    ],
    toolComponent: "AiRegexGenerator"
  },
  {
    slug: "regex-explainer",
    cluster: "developer-tools",
    title: "Regex Explainer | Free Online Tool",
    description: "Deconstruct complex regular expressions into human readable explanations.",
    pillarKeyword: "regex explainer",
    supportingKeywords: [
      "explain regex pattern",
      "regex syntax guide",
      "breakdown regex"
    ],
    toolComponent: "RegexTesterExplainer"
  },
  {
    slug: "xpath-tester",
    cluster: "developer-tools",
    title: "XPath Tester | Free Online Tool",
    description: "Test XPath query expressions against XML and HTML document trees.",
    pillarKeyword: "xpath tester",
    supportingKeywords: [
      "test xpath query",
      "xml xpath evaluator",
      "xpath expression test"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "jsonpath-tester",
    cluster: "developer-tools",
    title: "JSONPath Tester | Free Online Tool",
    description: "Evaluate JSONPath query expressions against JSON objects.",
    pillarKeyword: "jsonpath tester",
    supportingKeywords: [
      "test jsonpath query",
      "jsonpath evaluator",
      "query json payload"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "jwt-decoder",
    cluster: "developer-tools",
    title: "JWT Decoder | Free Online Tool",
    description: "Decode JSON Web Tokens and inspect header and payload claims.",
    pillarKeyword: "jwt decoder",
    supportingKeywords: [
      "decode jwt online",
      "jwt payload inspector",
      "parse json web token"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "jwt-debugger",
    cluster: "developer-tools",
    title: "JWT Debugger | Free Online Tool",
    description: "Debug and verify JWT signatures with secret keys or RSA public keys.",
    pillarKeyword: "jwt debugger",
    supportingKeywords: [
      "verify jwt signature",
      "debug jwt token",
      "jwt security inspector"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "curl-converter",
    cluster: "developer-tools",
    title: "cURL Converter | Free Online Tool",
    description: "Convert cURL commands into JavaScript fetch, Python requests, or Go code.",
    pillarKeyword: "curl converter",
    supportingKeywords: [
      "curl to fetch",
      "curl to python requests",
      "convert curl command"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "postman-to-code",
    cluster: "developer-tools",
    title: "Postman Collection Converter | Free Online Tool",
    description: "Convert Postman JSON collections into executable API client code.",
    pillarKeyword: "postman to code",
    supportingKeywords: [
      "postman to javascript",
      "convert postman collection",
      "postman client generator"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "har-analyzer",
    cluster: "developer-tools",
    title: "HAR File Analyzer | Free Online Tool",
    description: "Parse HTTP Archive (HAR) files to audit network request timings.",
    pillarKeyword: "har analyzer",
    supportingKeywords: [
      "parse har file",
      "har network log viewer",
      "analyze har performance"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "webhook-tester",
    cluster: "developer-tools",
    title: "Webhook Tester | Free Online Tool",
    description: "Inspect incoming HTTP POST requests, headers, and webhook payloads.",
    pillarKeyword: "webhook tester",
    supportingKeywords: [
      "test incoming webhook",
      "webhook payload debugger",
      "http request log"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "cors-tester",
    cluster: "developer-tools",
    title: "CORS Tester | Free Online Tool",
    description: "Test Cross-Origin Resource Sharing headers for target API endpoints.",
    pillarKeyword: "cors tester",
    supportingKeywords: [
      "check cors headers",
      "cors error debugger",
      "test access control allow origin"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "http-request-builder",
    cluster: "developer-tools",
    title: "HTTP Request Builder | Free Online Tool",
    description: "Build, test, and send custom HTTP REST requests from your browser.",
    pillarKeyword: "http request builder",
    supportingKeywords: [
      "rest api tester",
      "send http request online",
      "browser api client"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "graphql-query-builder",
    cluster: "developer-tools",
    title: "GraphQL Query Builder | Free Online Tool",
    description: "Compose, test, and format GraphQL queries and variables.",
    pillarKeyword: "graphql query builder",
    supportingKeywords: [
      "graphql query tester",
      "build graphql query",
      "format graphql"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "cron-generator",
    cluster: "developer-tools",
    title: "Cron Expression Generator | Free Online Tool",
    description: "Build 5-part crontab schedules with human readable schedule descriptions.",
    pillarKeyword: "cron generator",
    supportingKeywords: [
      "crontab builder",
      "create cron schedule",
      "cron expression maker"
    ],
    toolComponent: "CronExpressionGenerator"
  },
  {
    slug: "cron-explainer",
    cluster: "developer-tools",
    title: "Cron Expression Explainer | Free Online Tool",
    description: "Convert crontab schedule expressions into plain English schedules.",
    pillarKeyword: "cron explainer",
    supportingKeywords: [
      "explain cron schedule",
      "cron to human readable",
      "parse cron expression"
    ],
    toolComponent: "CronExpressionGenerator"
  },
  {
    slug: "timestamp-converter",
    cluster: "developer-tools",
    title: "Unix Timestamp Converter | Free Online Tool",
    description: "Convert Unix epoch timestamps to UTC and local human-readable datetime.",
    pillarKeyword: "timestamp converter",
    supportingKeywords: [
      "epoch to date",
      "date to epoch",
      "timestamp to readable date"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "epoch-to-date",
    cluster: "developer-tools",
    title: "Epoch to Date Converter | Free Online Tool",
    description: "Convert numeric epoch seconds or milliseconds to standard datetime strings.",
    pillarKeyword: "epoch to date",
    supportingKeywords: [
      "convert epoch seconds",
      "unix epoch to utc",
      "epoch time calculator"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "date-to-epoch",
    cluster: "developer-tools",
    title: "Date to Epoch Converter | Free Online Tool",
    description: "Convert human-readable calendar dates and times into Unix epoch timestamps.",
    pillarKeyword: "date to epoch",
    supportingKeywords: [
      "convert date to timestamp",
      "date to epoch seconds",
      "calendar to epoch"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "timezone-converter",
    cluster: "developer-tools",
    title: "Timezone Converter | Free Online Tool",
    description: "Convert meeting times and dates between global world timezones.",
    pillarKeyword: "timezone converter",
    supportingKeywords: [
      "convert timezones",
      "world time converter",
      "pst to est converter"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "date-difference-calculator",
    cluster: "developer-tools",
    title: "Date Difference Calculator | Free Online Tool",
    description: "Calculate exact days, hours, and minutes between two dates.",
    pillarKeyword: "date difference calculator",
    supportingKeywords: [
      "days between dates",
      "calculate date difference",
      "time duration between dates"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "business-days-calculator",
    cluster: "developer-tools",
    title: "Business Days Calculator | Free Online Tool",
    description: "Calculate work days and exclude weekends and holidays between dates.",
    pillarKeyword: "business days calculator",
    supportingKeywords: [
      "calculate working days",
      "business days count",
      "exclude weekends calculator"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "iso-8601-converter",
    cluster: "developer-tools",
    title: "ISO 8601 Date Converter | Free Online Tool",
    description: "Format and parse standard ISO 8601 timestamp strings.",
    pillarKeyword: "iso 8601 converter",
    supportingKeywords: [
      "format iso 8601",
      "iso date parser",
      "utc iso timestamp"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "rfc-3339-converter",
    cluster: "developer-tools",
    title: "RFC 3339 Converter | Free Online Tool",
    description: "Convert and validate RFC 3339 formatted Internet timestamps.",
    pillarKeyword: "rfc 3339 converter",
    supportingKeywords: [
      "format rfc 3339",
      "rfc date parser",
      "internet timestamp tool"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "password-generator",
    cluster: "developer-tools",
    title: "Password Generator | Free Online Tool",
    description: "Generate cryptographically secure random passwords with customizable parameters.",
    pillarKeyword: "password generator",
    supportingKeywords: [
      "secure password maker",
      "random password generator",
      "strong password builder"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "password-strength-checker",
    cluster: "developer-tools",
    title: "Password Strength Checker | Free Online Tool",
    description: "Evaluate password entropy bits and estimate brute-force cracking times.",
    pillarKeyword: "password strength checker",
    supportingKeywords: [
      "check password entropy",
      "test password security",
      "password vulnerability tool"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "random-number-generator",
    cluster: "developer-tools",
    title: "Random Number Generator | Free Online Tool",
    description: "Generate single or bulk random numbers within a min/max range.",
    pillarKeyword: "random number generator",
    supportingKeywords: [
      "rng tool",
      "random integer picker",
      "generate numbers"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "random-string-generator",
    cluster: "developer-tools",
    title: "Random String Generator | Free Online Tool",
    description: "Generate random alphanumeric strings for API keys and secrets.",
    pillarKeyword: "random string generator",
    supportingKeywords: [
      "random string maker",
      "generate secret token",
      "random alphanumeric string"
    ],
    toolComponent: "PasswordGenerator"
  },
  {
    slug: "random-word-generator",
    cluster: "developer-tools",
    title: "Random Word Generator | Free Online Tool",
    description: "Generate lists of random English words for brainstorming and testing.",
    pillarKeyword: "random word generator",
    supportingKeywords: [
      "random word picker",
      "generate words",
      "brainstorming word list"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "lorem-ipsum-generator",
    cluster: "developer-tools",
    title: "Lorem Ipsum Generator | Free Online Tool",
    description: "Generate placeholder dummy text paragraphs, sentences, or words.",
    pillarKeyword: "lorem ipsum generator",
    supportingKeywords: [
      "dummy text generator",
      "lorem ipsum text maker",
      "placeholder text"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "fake-data-generator",
    cluster: "developer-tools",
    title: "Fake Data Generator | Free Online Tool",
    description: "Generate mock names, emails, addresses, and phone numbers for test databases.",
    pillarKeyword: "fake data generator",
    supportingKeywords: [
      "mock database data",
      "synthetic user data",
      "generate test data"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "qr-code-generator",
    cluster: "developer-tools",
    title: "QR Code Generator | Free Online Tool",
    description: "Generate high-resolution vector QR codes for URLs, WiFi, and vCards.",
    pillarKeyword: "qr code generator",
    supportingKeywords: [
      "create qr code",
      "custom qr code maker",
      "vector qr code"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "barcode-generator",
    cluster: "developer-tools",
    title: "Barcode Generator | Free Online Tool",
    description: "Generate CODE128, EAN-13, and UPC barcodes for product packaging.",
    pillarKeyword: "barcode generator",
    supportingKeywords: [
      "create barcode online",
      "code128 generator",
      "ean barcode builder"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "favicon-generator",
    cluster: "developer-tools",
    title: "Favicon Generator | Free Online Tool",
    description: "Convert logos into ICO and PNG favicon bundles for web browsers.",
    pillarKeyword: "favicon generator",
    supportingKeywords: [
      "convert image to favicon",
      "create ico favicon",
      "web icon generator"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "chmod-calculator",
    cluster: "developer-tools",
    title: "Chmod Calculator | Free Online Tool",
    description: "Calculate Linux file permissions in octal (755, 644) and symbolic notation.",
    pillarKeyword: "chmod calculator",
    supportingKeywords: [
      "linux chmod calculator",
      "file permissions converter",
      "octal chmod tool"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "mime-type-lookup",
    cluster: "developer-tools",
    title: "MIME Type Lookup | Free Online Tool",
    description: "Find Content-Type MIME headers for file extensions.",
    pillarKeyword: "mime type lookup",
    supportingKeywords: [
      "mime type database",
      "file extension content type",
      "check mime header"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "http-status-codes",
    cluster: "developer-tools",
    title: "HTTP Status Reference | Free Online Tool",
    description: "Interactive quick reference for all 1xx, 2xx, 3xx, 4xx, and 5xx HTTP codes.",
    pillarKeyword: "http status codes",
    supportingKeywords: [
      "http status code list",
      "rest api error codes",
      "http response guide"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "user-agent-parser",
    cluster: "developer-tools",
    title: "User Agent Parser | Free Online Tool",
    description: "Parse User-Agent strings to extract browser version, OS, and device type.",
    pillarKeyword: "user-agent parser",
    supportingKeywords: [
      "decode user agent",
      "browser detection tool",
      "parse user agent string"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "git-command-generator",
    cluster: "developer-tools",
    title: "Git Command Generator | Free Online Tool",
    description: "Generate Git commands for branch merging, rebase, cherry-pick, and stash.",
    pillarKeyword: "git command generator",
    supportingKeywords: [
      "git helper tool",
      "create git commands",
      "git syntax generator"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "commit-message-generator",
    cluster: "developer-tools",
    title: "Git Commit Message Generator | Free Online Tool",
    description: "Format conventional commit messages (feat, fix, docs, chore).",
    pillarKeyword: "commit message generator",
    supportingKeywords: [
      "conventional commits maker",
      "format git commit",
      "commit message helper"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "css-gradient-generator",
    cluster: "developer-tools",
    title: "CSS Gradient Generator | Free Online Tool",
    description: "Create linear, radial, and conic CSS gradients with instant CSS code export.",
    pillarKeyword: "css gradient generator",
    supportingKeywords: [
      "css gradient background",
      "linear gradient maker",
      "css color gradient"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "box-shadow-generator",
    cluster: "developer-tools",
    title: "CSS Box Shadow Generator | Free Online Tool",
    description: "Design smooth CSS box-shadow effects with horizontal, vertical, blur, and spread controls.",
    pillarKeyword: "box shadow generator",
    supportingKeywords: [
      "css shadow generator",
      "custom box shadow maker",
      "drop shadow generator"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "text-shadow-generator",
    cluster: "developer-tools",
    title: "CSS Text Shadow Generator | Free Online Tool",
    description: "Create subtle text depth and glow effects with custom CSS text-shadow rules.",
    pillarKeyword: "text shadow generator",
    supportingKeywords: [
      "css text shadow maker",
      "text shadow generator",
      "css font glow"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "border-radius-generator",
    cluster: "developer-tools",
    title: "CSS Border Radius Generator | Free Online Tool",
    description: "Build rounded corners and custom organic shape CSS border-radius curves.",
    pillarKeyword: "border radius generator",
    supportingKeywords: [
      "css rounded corners",
      "fancy border radius",
      "border radius preview"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "css-filter-generator",
    cluster: "developer-tools",
    title: "CSS Filter Generator | Free Online Tool",
    description: "Apply blur, brightness, contrast, grayscale, and hue-rotate filters visually.",
    pillarKeyword: "css filter generator",
    supportingKeywords: [
      "css image filters",
      "css filter generator",
      "visual filter builder"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "flexbox-playground",
    cluster: "developer-tools",
    title: "CSS Flexbox Playground | Free Online Tool",
    description: "Interactive flex container playground to test flex-direction, justify-content, and align-items.",
    pillarKeyword: "flexbox playground",
    supportingKeywords: [
      "css flexbox visualizer",
      "flexbox alignment test",
      "learn flexbox css"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "css-grid-playground",
    cluster: "developer-tools",
    title: "CSS Grid Playground | Free Online Tool",
    description: "Visual grid generator to design responsive template columns, rows, and gap layouts.",
    pillarKeyword: "css grid playground",
    supportingKeywords: [
      "css grid layout builder",
      "visual css grid maker",
      "grid template columns"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "css-animation-generator",
    cluster: "developer-tools",
    title: "CSS Keyframe Animation Generator | Free Online Tool",
    description: "Design CSS keyframe animations with easing curves and keyframe steps.",
    pillarKeyword: "css animation generator",
    supportingKeywords: [
      "css keyframes generator",
      "animate css builder",
      "css transition maker"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "css-button-generator",
    cluster: "developer-tools",
    title: "CSS Button Generator | Free Online Tool",
    description: "Design call-to-action buttons with hover states, gradients, and borders.",
    pillarKeyword: "css button generator",
    supportingKeywords: [
      "css cta button maker",
      "custom button generator",
      "design css button"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "color-converter",
    cluster: "developer-tools",
    title: "Color Converter (HEX/RGB/HSL) | Free Online Tool",
    description: "Convert color codes between HEX, RGB, HSL, HSV, and CMYK color spaces.",
    pillarKeyword: "color converter",
    supportingKeywords: [
      "hex to rgb converter",
      "rgb to hsl converter",
      "color code converter"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "color-contrast-checker",
    cluster: "developer-tools",
    title: "Color Contrast Checker | Free Online Tool",
    description: "Verify WCAG 2.1 AA/AAA text color contrast ratios against background fills.",
    pillarKeyword: "color contrast checker",
    supportingKeywords: [
      "wcag contrast checker",
      "color accessibility test",
      "text contrast ratio"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "css-unit-converter",
    cluster: "developer-tools",
    title: "CSS Unit Converter (PX/REM/EM) | Free Online Tool",
    description: "Convert layout values between PX, REM, EM, VW, VH, and percentage units.",
    pillarKeyword: "css unit converter",
    supportingKeywords: [
      "px to rem converter",
      "rem to px calculator",
      "css font size converter"
    ],
    toolComponent: "ColorPaletteContrastChecker"
  },
  {
    slug: "ai-regex-generator",
    cluster: "ai-tools",
    title: "AI Regex Generator | Free Online Tool",
    description: "Generate regular expressions from plain language prompts using Gemini AI.",
    pillarKeyword: "ai regex generator",
    supportingKeywords: [
      "ai regex builder",
      "regex prompt to pattern",
      "generate regex ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-regex-explainer",
    cluster: "ai-tools",
    title: "AI Regex Explainer | Free Online Tool",
    description: "Explain complex regular expressions line-by-line using AI.",
    pillarKeyword: "ai regex explainer",
    supportingKeywords: [
      "explain regex ai",
      "regex breakdown ai",
      "deconstruct regex pattern"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-sql-generator",
    cluster: "ai-tools",
    title: "AI SQL Generator | Free Online Tool",
    description: "Convert plain English requests into optimized SQL database queries.",
    pillarKeyword: "ai sql generator",
    supportingKeywords: [
      "text to sql query ai",
      "ai sql builder",
      "generate database query"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-sql-error-explainer",
    cluster: "ai-tools",
    title: "AI SQL Error Explainer | Free Online Tool",
    description: "Debug database error logs and fix SQL syntax errors automatically.",
    pillarKeyword: "ai sql error explainer",
    supportingKeywords: [
      "fix sql error ai",
      "debug database query",
      "sql error assistant"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-code-generator",
    cluster: "ai-tools",
    title: "AI Code Generator | Free Online Tool",
    description: "Generate TypeScript, Python, or Go code snippets from natural text specifications.",
    pillarKeyword: "ai code generator",
    supportingKeywords: [
      "generate code ai",
      "text to code converter",
      "ai coding assistant"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-code-explainer",
    cluster: "ai-tools",
    title: "AI Code Explainer | Free Online Tool",
    description: "Explain complex functions and legacy codebases in plain English.",
    pillarKeyword: "ai code explainer",
    supportingKeywords: [
      "explain code ai",
      "understand code snippet",
      "ai code tutor"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-code-converter",
    cluster: "ai-tools",
    title: "AI Code Converter | Free Online Tool",
    description: "Translate code between programming languages (e.g. Python to TypeScript).",
    pillarKeyword: "ai code converter",
    supportingKeywords: [
      "convert code language",
      "translate code ai",
      "python to js converter"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-code-reviewer",
    cluster: "ai-tools",
    title: "AI Code Reviewer | Free Online Tool",
    description: "Review code snippets for security bugs, performance bottlenecks, and best practices.",
    pillarKeyword: "ai code reviewer",
    supportingKeywords: [
      "ai pull request review",
      "code quality audit",
      "ai code inspector"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-code-optimizer",
    cluster: "ai-tools",
    title: "AI Code Optimizer | Free Online Tool",
    description: "Refactor code to improve execution speed, memory efficiency, and readability.",
    pillarKeyword: "ai code optimizer",
    supportingKeywords: [
      "optimize code speed",
      "refactor code ai",
      "clean code optimizer"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-bug-detector",
    cluster: "ai-tools",
    title: "AI Bug Detector | Free Online Tool",
    description: "Detect runtime exceptions, logic errors, and memory leaks in source code.",
    pillarKeyword: "ai bug detector",
    supportingKeywords: [
      "find code bugs ai",
      "debug runtime error",
      "code vulnerability scan"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-test-case-generator",
    cluster: "ai-tools",
    title: "AI Test Case Generator | Free Online Tool",
    description: "Generate unit test cases and mock assertions for Jest, PyTest, or JUnit.",
    pillarKeyword: "ai test case generator",
    supportingKeywords: [
      "generate unit tests",
      "jest test case builder",
      "ai test generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-documentation-generator",
    cluster: "ai-tools",
    title: "AI Documentation Generator | Free Online Tool",
    description: "Generate comprehensive JSDoc, Docstrings, and Markdown docs from source code.",
    pillarKeyword: "ai documentation generator",
    supportingKeywords: [
      "create code docs",
      "jsdoc generator ai",
      "auto documentation maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-api-doc-generator",
    cluster: "ai-tools",
    title: "AI API Doc Generator | Free Online Tool",
    description: "Generate OpenAPI / Swagger documentation from raw REST JSON payloads.",
    pillarKeyword: "ai api doc generator",
    supportingKeywords: [
      "openapi generator ai",
      "swagger doc creator",
      "api reference maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-readme-generator",
    cluster: "ai-tools",
    title: "AI README Generator | Free Online Tool",
    description: "Create professional GitHub README.md files with installation steps and badges.",
    pillarKeyword: "ai readme generator",
    supportingKeywords: [
      "github readme builder",
      "markdown readme generator",
      "create repo readme"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-commit-message",
    cluster: "ai-tools",
    title: "AI Commit Message Generator | Free Online Tool",
    description: "Draft Conventional Commit messages from raw git diff outputs.",
    pillarKeyword: "ai commit message",
    supportingKeywords: [
      "generate commit message",
      "git diff to commit",
      "conventional commit ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-pr-description",
    cluster: "ai-tools",
    title: "AI PR Description Generator | Free Online Tool",
    description: "Generate Pull Request summary descriptions from commit histories.",
    pillarKeyword: "ai pr description",
    supportingKeywords: [
      "github pr generator",
      "pull request summary",
      "draft pr description"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-code-refactoring",
    cluster: "ai-tools",
    title: "AI Code Refactorer | Free Online Tool",
    description: "Refactor monolithic functions into clean, modular TypeScript patterns.",
    pillarKeyword: "ai code refactoring",
    supportingKeywords: [
      "refactor code ai",
      "modular code builder",
      "clean architecture refactor"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-function-name-generator",
    cluster: "ai-tools",
    title: "AI Function Name Generator | Free Online Tool",
    description: "Suggest clean, descriptive variable and function names based on code logic.",
    pillarKeyword: "ai function name generator",
    supportingKeywords: [
      "variable name generator",
      "clean code naming",
      "function naming helper"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-json-repair",
    cluster: "ai-tools",
    title: "AI JSON Repair Tool | Free Online Tool",
    description: "Repair truncated or malformed JSON payloads and trailing commas.",
    pillarKeyword: "ai json repair",
    supportingKeywords: [
      "fix broken json ai",
      "repair json syntax",
      "json sanitizer ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-xml-repair",
    cluster: "ai-tools",
    title: "AI XML Repair Tool | Free Online Tool",
    description: "Fix unclosed tags and invalid entity references in XML documents.",
    pillarKeyword: "ai xml repair",
    supportingKeywords: [
      "fix broken xml ai",
      "repair xml syntax",
      "xml sanitizer ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-csv-cleaner",
    cluster: "ai-tools",
    title: "AI CSV Cleaner | Free Online Tool",
    description: "Deduplicate, normalize, and fix malformed rows in CSV data spreadsheets.",
    pillarKeyword: "ai csv cleaner",
    supportingKeywords: [
      "clean csv data ai",
      "csv row sanitizer",
      "fix csv formatting"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-data-normalizer",
    cluster: "ai-tools",
    title: "AI Data Normalizer | Free Online Tool",
    description: "Standardize date formats, phone numbers, and addresses across datasets.",
    pillarKeyword: "ai data normalizer",
    supportingKeywords: [
      "normalize dataset ai",
      "format data fields",
      "data cleaning tool"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-schema-generator",
    cluster: "ai-tools",
    title: "AI Schema Generator | Free Online Tool",
    description: "Generate TypeScript interfaces, Zod schemas, or JSON Schema from data.",
    pillarKeyword: "ai schema generator",
    supportingKeywords: [
      "generate typescript interface",
      "zod schema builder",
      "json schema creator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-mock-data-generator",
    cluster: "ai-tools",
    title: "AI Mock Data Generator | Free Online Tool",
    description: "Generate realistic synthetic datasets for testing and database seeding.",
    pillarKeyword: "ai mock data generator",
    supportingKeywords: [
      "generate mock data",
      "fake dataset builder",
      "synthetic data creator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-api-response-generator",
    cluster: "ai-tools",
    title: "AI API Response Generator | Free Online Tool",
    description: "Generate realistic REST and GraphQL API mock responses.",
    pillarKeyword: "ai api response generator",
    supportingKeywords: [
      "mock api response",
      "fake REST json",
      "api endpoint mock"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-log-analyzer",
    cluster: "ai-tools",
    title: "AI Log Analyzer | Free Online Tool",
    description: "Analyze server error logs and stack traces to highlight root cause issues.",
    pillarKeyword: "ai log analyzer",
    supportingKeywords: [
      "parse error logs ai",
      "stack trace analyzer",
      "server log debugger"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-error-message-generator",
    cluster: "ai-tools",
    title: "AI Error Message Generator | Free Online Tool",
    description: "Draft user-friendly error messages and troubleshooting hints for software apps.",
    pillarKeyword: "ai error message generator",
    supportingKeywords: [
      "user friendly error text",
      "ui error message maker",
      "error hint generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-exception-handler",
    cluster: "ai-tools",
    title: "AI Exception Handler | Free Online Tool",
    description: "Generate robust try/catch exception handling code for async workflows.",
    pillarKeyword: "ai exception handler",
    supportingKeywords: [
      "try catch builder",
      "async error handling",
      "exception safety code"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-data-anonymizer",
    cluster: "ai-tools",
    title: "AI Data Anonymizer | Free Online Tool",
    description: "Mask and redact Personally Identifiable Information (PII) from logs and data.",
    pillarKeyword: "ai data anonymizer",
    supportingKeywords: [
      "pii redactor ai",
      "anonymize text data",
      "mask sensitive info"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-table-extractor",
    cluster: "ai-tools",
    title: "AI Table Extractor | Free Online Tool",
    description: "Extract tabular data from raw text or markdown into structured JSON/CSV.",
    pillarKeyword: "ai table extractor",
    supportingKeywords: [
      "extract text to table",
      "convert text to csv ai",
      "table parser ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-meta-optimizer",
    cluster: "ai-tools",
    title: "AI Meta Description Optimizer | Free Online Tool",
    description: "Optimize meta descriptions for target primary keywords and CTR.",
    pillarKeyword: "ai meta optimizer",
    supportingKeywords: [
      "optimize meta tags ai",
      "seo meta writer",
      "click-worthy description"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-title-optimizer",
    cluster: "ai-tools",
    title: "AI Title Tag Optimizer | Free Online Tool",
    description: "Generate high-CTR, keyword-dense page titles optimized for search engines.",
    pillarKeyword: "ai title optimizer",
    supportingKeywords: [
      "optimize title tags",
      "seo title writer",
      "headline optimizer ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-slug-generator",
    cluster: "ai-tools",
    title: "AI Slug Generator | Free Online Tool",
    description: "Create short, keyword-rich URL slugs for new blog posts and landing pages.",
    pillarKeyword: "ai slug generator",
    supportingKeywords: [
      "seo url slug maker",
      "generate blog slug",
      "clean URL creator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-keyword-cluster",
    cluster: "ai-tools",
    title: "AI Keyword Clusterer | Free Online Tool",
    description: "Cluster large keyword lists into topical content hubs automatically.",
    pillarKeyword: "ai keyword cluster",
    supportingKeywords: [
      "group keywords ai",
      "topical cluster builder",
      "keyword matrix maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-search-intent",
    cluster: "ai-tools",
    title: "AI Search Intent Classifier | Free Online Tool",
    description: "Determine user search intent and SERP content format requirements.",
    pillarKeyword: "ai search intent",
    supportingKeywords: [
      "classify search intent",
      "intent analyzer ai",
      "serp intent check"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-content-brief",
    cluster: "ai-tools",
    title: "AI Content Brief Generator | Free Online Tool",
    description: "Draft comprehensive content briefs with headings, target keywords, and word counts.",
    pillarKeyword: "ai content brief",
    supportingKeywords: [
      "create content brief",
      "seo outline brief",
      "blog brief generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-blog-outline",
    cluster: "ai-tools",
    title: "AI Blog Outline Generator | Free Online Tool",
    description: "Generate structured H2/H3 blog post outlines tailored for organic search ranking.",
    pillarKeyword: "ai blog outline",
    supportingKeywords: [
      "blog post outline ai",
      "article outline builder",
      "h2 h3 structure maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-blog-writer",
    cluster: "ai-tools",
    title: "AI Blog Post Writer | Free Online Tool",
    description: "Draft well-structured, engaging long-form blog articles on any topic.",
    pillarKeyword: "ai blog writer",
    supportingKeywords: [
      "write blog post ai",
      "article draft writer",
      "ai content creator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-article-rewriter",
    cluster: "ai-tools",
    title: "AI Article Rewriter | Free Online Tool",
    description: "Rewrite and refresh existing articles to improve clarity and tone.",
    pillarKeyword: "ai article rewriter",
    supportingKeywords: [
      "rewrite blog post",
      "article refresh tool",
      "paraphrase content ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-product-description",
    cluster: "ai-tools",
    title: "AI Product Description Generator | Free Online Tool",
    description: "Create persuasive product copy for e-commerce listings.",
    pillarKeyword: "ai product description",
    supportingKeywords: [
      "ecommerce product copy",
      "shopify description writer",
      "product benefits maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-ad-copy-generator",
    cluster: "ai-tools",
    title: "AI Ad Copy Generator | Free Online Tool",
    description: "Generate high-converting ad headlines and body copy for paid campaigns.",
    pillarKeyword: "ai ad copy generator",
    supportingKeywords: [
      "write ad copy ai",
      "ppc ad headline maker",
      "ad campaign copy"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-facebook-ad",
    cluster: "ai-tools",
    title: "AI Facebook Ad Generator | Free Online Tool",
    description: "Draft scroll-stopping primary text and headlines for Facebook ads.",
    pillarKeyword: "ai facebook ad",
    supportingKeywords: [
      "meta ad writer ai",
      "facebook campaign copy",
      "social ad generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-google-ad",
    cluster: "ai-tools",
    title: "AI Google Ad Generator | Free Online Tool",
    description: "Generate headlines and descriptions fitting Google Search Ad character limits.",
    pillarKeyword: "ai google ad",
    supportingKeywords: [
      "google search ad copy",
      "responsive search ads ai",
      "ppc text maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-instagram-caption",
    cluster: "ai-tools",
    title: "AI Instagram Caption Generator | Free Online Tool",
    description: "Draft engaging Instagram captions with line breaks and call-to-actions.",
    pillarKeyword: "ai instagram caption",
    supportingKeywords: [
      "write ig caption",
      "social post writer",
      "instagram copy generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-twitter-thread",
    cluster: "ai-tools",
    title: "AI Twitter Thread Generator | Free Online Tool",
    description: "Convert long articles into viral X/Twitter threads with strong hooks.",
    pillarKeyword: "ai twitter thread",
    supportingKeywords: [
      "create twitter thread",
      "article to thread converter",
      "x thread writer"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-linkedin-post",
    cluster: "ai-tools",
    title: "AI LinkedIn Post Generator | Free Online Tool",
    description: "Draft professional LinkedIn posts that drive high engagement and comments.",
    pillarKeyword: "ai linkedin post",
    supportingKeywords: [
      "write linkedin post",
      "b2b content generator",
      "thought leadership copy"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-youtube-script",
    cluster: "ai-tools",
    title: "AI YouTube Script Writer | Free Online Tool",
    description: "Create structured video scripts with video hooks, intro, body, and CTA.",
    pillarKeyword: "ai youtube script",
    supportingKeywords: [
      "write youtube video script",
      "video content outline",
      "youtube video script"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-tiktok-script",
    cluster: "ai-tools",
    title: "AI TikTok Script Generator | Free Online Tool",
    description: "Generate fast-paced 30-second TikTok video scripts with visual cues.",
    pillarKeyword: "ai tiktok script",
    supportingKeywords: [
      "tiktok script writer",
      "short form video script",
      "reels script generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-podcast-script",
    cluster: "ai-tools",
    title: "AI Podcast Script Generator | Free Online Tool",
    description: "Write podcast episode intros, segment outlines, and sponsor read scripts.",
    pillarKeyword: "ai podcast script",
    supportingKeywords: [
      "podcast outline writer",
      "audio script generator",
      "podcast intro maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-newsletter-writer",
    cluster: "ai-tools",
    title: "AI Newsletter Writer | Free Online Tool",
    description: "Draft catchy subject lines and engaging body copy for email newsletters.",
    pillarKeyword: "ai newsletter writer",
    supportingKeywords: [
      "write email newsletter",
      "newsletter copywriter",
      "email campaign draft"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-email-reply",
    cluster: "ai-tools",
    title: "AI Email Reply Generator | Free Online Tool",
    description: "Draft polite, professional email responses tailored to incoming message tone.",
    pillarKeyword: "ai email reply",
    supportingKeywords: [
      "reply to email ai",
      "quick email responder",
      "professional email reply"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-cold-email",
    cluster: "ai-tools",
    title: "AI Cold Email Generator | Free Online Tool",
    description: "Generate personalized, high-response B2B cold sales outreach emails.",
    pillarKeyword: "ai cold email",
    supportingKeywords: [
      "write cold email",
      "b2b sales outreach",
      "cold email template"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-follow-up-email",
    cluster: "ai-tools",
    title: "AI Follow-up Email Generator | Free Online Tool",
    description: "Write polite follow-up emails for unanswered proposals and sales pitches.",
    pillarKeyword: "ai follow up email",
    supportingKeywords: [
      "sales follow up email",
      "meeting follow up maker",
      "polite check in email"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-email-subject",
    cluster: "ai-tools",
    title: "AI Email Subject Line Generator | Free Online Tool",
    description: "Generate high-open-rate subject lines for email campaigns.",
    pillarKeyword: "ai email subject",
    supportingKeywords: [
      "email subject generator",
      "catchy subject lines",
      "open rate optimizer"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-meeting-summary",
    cluster: "ai-tools",
    title: "AI Meeting Summary Generator | Free Online Tool",
    description: "Summarize transcript notes into executive summaries and key decision points.",
    pillarKeyword: "ai meeting summary",
    supportingKeywords: [
      "meeting notes summary",
      "summarize transcript ai",
      "executive summary maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-meeting-agenda",
    cluster: "ai-tools",
    title: "AI Meeting Agenda Generator | Free Online Tool",
    description: "Draft structured meeting agendas with time allocations and discussion topics.",
    pillarKeyword: "ai meeting agenda",
    supportingKeywords: [
      "create meeting agenda",
      "team sync agenda",
      "meeting plan builder"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-action-items",
    cluster: "ai-tools",
    title: "AI Action Items Extractor | Free Online Tool",
    description: "Extract assigned tasks, owners, and deadlines from meeting notes.",
    pillarKeyword: "ai action items",
    supportingKeywords: [
      "extract task items",
      "meeting action items",
      "todo list from notes"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-resume-builder",
    cluster: "ai-tools",
    title: "AI Resume Bullet Generator | Free Online Tool",
    description: "Optimize resume bullet points using action verbs and measurable metrics.",
    pillarKeyword: "ai resume builder",
    supportingKeywords: [
      "resume bullet point maker",
      "cv bullet optimizer",
      "action verb resume"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-cover-letter",
    cluster: "ai-tools",
    title: "AI Cover Letter Generator | Free Online Tool",
    description: "Generate tailored job cover letters matching company role descriptions.",
    pillarKeyword: "ai cover letter",
    supportingKeywords: [
      "write cover letter ai",
      "tailored cover letter",
      "job application letter"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-linkedin-bio",
    cluster: "ai-tools",
    title: "AI LinkedIn Bio Generator | Free Online Tool",
    description: "Craft compelling LinkedIn headline and about section summaries.",
    pillarKeyword: "ai linkedin bio",
    supportingKeywords: [
      "linkedin headline maker",
      "professional bio generator",
      "linkedin summary ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-twitter-bio",
    cluster: "ai-tools",
    title: "AI Twitter Bio Generator | Free Online Tool",
    description: "Generate concise 160-character X/Twitter bio summaries.",
    pillarKeyword: "ai twitter bio",
    supportingKeywords: [
      "x bio generator",
      "twitter profile bio",
      "short bio maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-instagram-bio",
    cluster: "ai-tools",
    title: "AI Instagram Bio Generator | Free Online Tool",
    description: "Create creative Instagram profile bios with line breaks and emojis.",
    pillarKeyword: "ai instagram bio",
    supportingKeywords: [
      "ig bio creator",
      "instagram profile summary",
      "creative social bio"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-youtube-title",
    cluster: "ai-tools",
    title: "AI YouTube Title Generator | Free Online Tool",
    description: "Generate high-CTR YouTube video titles that drive clicks.",
    pillarKeyword: "ai youtube title",
    supportingKeywords: [
      "youtube clickbait titles",
      "video title generator",
      "high ctr video title"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-hook-generator",
    cluster: "ai-tools",
    title: "AI Hook Generator | Free Online Tool",
    description: "Draft powerful opening hooks for social posts, videos, and articles.",
    pillarKeyword: "ai hook generator",
    supportingKeywords: [
      "video opening hook",
      "social post hook maker",
      "attention grabber text"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-cta-generator",
    cluster: "ai-tools",
    title: "AI Call-to-Action Generator | Free Online Tool",
    description: "Create compelling call-to-action buttons and closing phrases.",
    pillarKeyword: "ai cta generator",
    supportingKeywords: [
      "cta generator ai",
      "conversion phrase builder",
      "call to action maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-headline-generator",
    cluster: "ai-tools",
    title: "AI Headline Generator | Free Online Tool",
    description: "Generate high-impact headlines based on proven copywriting formulas.",
    pillarKeyword: "ai headline generator",
    supportingKeywords: [
      "copywriting headline maker",
      "article title ideas",
      "attention headline maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-case-study",
    cluster: "ai-tools",
    title: "AI Case Study Writer | Free Online Tool",
    description: "Structure customer success stories into Problem, Solution, and Result formats.",
    pillarKeyword: "ai case study",
    supportingKeywords: [
      "write case study ai",
      "customer success story",
      "b2b case study maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-whitepaper",
    cluster: "ai-tools",
    title: "AI Whitepaper Writer | Free Online Tool",
    description: "Generate authoritative whitepaper outlines and executive summaries.",
    pillarKeyword: "ai whitepaper",
    supportingKeywords: [
      "write whitepaper ai",
      "b2b research report",
      "technical whitepaper maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-quiz-generator",
    cluster: "ai-tools",
    title: "AI Quiz Generator | Free Online Tool",
    description: "Convert study text into multiple-choice quiz questions and answers.",
    pillarKeyword: "ai quiz generator",
    supportingKeywords: [
      "create quiz from text",
      "ai test maker",
      "multiple choice generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-flashcard-generator",
    cluster: "ai-tools",
    title: "AI Flashcard Generator | Free Online Tool",
    description: "Generate front/back flashcard study pairs from notes and textbooks.",
    pillarKeyword: "ai flashcard generator",
    supportingKeywords: [
      "create flashcards ai",
      "anki flashcard generator",
      "study card maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-study-guide",
    cluster: "ai-tools",
    title: "AI Study Guide Generator | Free Online Tool",
    description: "Transform lecture notes and topics into organized study guides.",
    pillarKeyword: "ai study guide",
    supportingKeywords: [
      "create study guide ai",
      "exam prep notes",
      "lecture summary tool"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-lesson-plan",
    cluster: "ai-tools",
    title: "AI Lesson Plan Generator | Free Online Tool",
    description: "Design structured lesson plans with learning objectives and activities.",
    pillarKeyword: "ai lesson plan",
    supportingKeywords: [
      "teacher lesson planner",
      "curriculum plan builder",
      "class activity generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-course-outline",
    cluster: "ai-tools",
    title: "AI Course Outline Generator | Free Online Tool",
    description: "Generate comprehensive multi-module online course curricula.",
    pillarKeyword: "ai course outline",
    supportingKeywords: [
      "online course outline",
      "curriculum generator",
      "course syllabus builder"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-ebook-writer",
    cluster: "ai-tools",
    title: "AI Ebook Writer | Free Online Tool",
    description: "Generate multi-chapter ebook outlines and topic summaries.",
    pillarKeyword: "ai ebook writer",
    supportingKeywords: [
      "write ebook ai",
      "ebook outline generator",
      "digital book creator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-paper-summarizer",
    cluster: "ai-tools",
    title: "AI Research Paper Summarizer | Free Online Tool",
    description: "Summarize complex scientific and academic research papers.",
    pillarKeyword: "ai paper summarizer",
    supportingKeywords: [
      "summarize paper ai",
      "academic paper summary",
      "research TLDR maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-citation-generator",
    cluster: "ai-tools",
    title: "AI Citation Generator | Free Online Tool",
    description: "Format academic citations in APA, MLA, Chicago, and Harvard styles.",
    pillarKeyword: "ai citation generator",
    supportingKeywords: [
      "apa mla citation tool",
      "academic citation maker",
      "bibliography format"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-bibliography",
    cluster: "ai-tools",
    title: "AI Bibliography Generator | Free Online Tool",
    description: "Build organized bibliographies from reference source lists.",
    pillarKeyword: "ai bibliography",
    supportingKeywords: [
      "create bibliography ai",
      "reference list builder",
      "works cited generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-plagiarism-checker",
    cluster: "ai-tools",
    title: "AI Plagiarism Checker | Free Online Tool",
    description: "Detect duplicate text phrases and potential source matches.",
    pillarKeyword: "ai plagiarism checker",
    supportingKeywords: [
      "check plagiarism online",
      "originality scanner",
      "duplicate text detector"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-grammar-checker",
    cluster: "ai-tools",
    title: "AI Grammar Checker | Free Online Tool",
    description: "Fix grammatical errors, punctuation, and typos instantly.",
    pillarKeyword: "ai grammar checker",
    supportingKeywords: [
      "fix grammar online",
      "spelling grammar checker",
      "proofread text ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-paraphrasing-tool",
    cluster: "ai-tools",
    title: "AI Paraphrasing Tool | Free Online Tool",
    description: "Paraphrase sentences to improve flow, vocabulary, and conciseness.",
    pillarKeyword: "ai paraphrasing tool",
    supportingKeywords: [
      "paraphrase text online",
      "rewrite sentence ai",
      "reword text tool"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-tone-analyzer",
    cluster: "ai-tools",
    title: "AI Tone Analyzer | Free Online Tool",
    description: "Analyze document sentiment tone (e.g. professional, urgent, friendly).",
    pillarKeyword: "ai tone analyzer",
    supportingKeywords: [
      "check text tone",
      "sentiment analysis tool",
      "writing tone inspector"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-sentiment-analyzer",
    cluster: "ai-tools",
    title: "AI Sentiment Analyzer | Free Online Tool",
    description: "Evaluate customer reviews and feedback as Positive, Neutral, or Negative.",
    pillarKeyword: "ai sentiment analyzer",
    supportingKeywords: [
      "sentiment score tool",
      "review sentiment analysis",
      "customer feedback scan"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-alt-text-generator",
    cluster: "ai-tools",
    title: "AI Alt Text Generator | Free Online Tool",
    description: "Generate accessible image alt text descriptions for web accessibility and SEO.",
    pillarKeyword: "ai alt text generator",
    supportingKeywords: [
      "generate alt text ai",
      "image description maker",
      "wcag alt text tool"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-image-prompt",
    cluster: "ai-tools",
    title: "AI Image Prompt Generator | Free Online Tool",
    description: "Create detailed text prompts for Midjourney, DALL-E 3, and Stable Diffusion.",
    pillarKeyword: "ai image prompt",
    supportingKeywords: [
      "midjourney prompt builder",
      "dalle prompt maker",
      "image generation prompt"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-thumbnail-ideas",
    cluster: "ai-tools",
    title: "AI Thumbnail Idea Generator | Free Online Tool",
    description: "Brainstorm high-CTR visual thumbnail concepts for YouTube videos.",
    pillarKeyword: "ai thumbnail ideas",
    supportingKeywords: [
      "youtube thumbnail ideas",
      "video visual concepts",
      "thumbnail design ideas"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-meme-caption",
    cluster: "ai-tools",
    title: "AI Meme Caption Generator | Free Online Tool",
    description: "Generate funny meme captions for viral social media content.",
    pillarKeyword: "ai meme caption",
    supportingKeywords: [
      "funny meme generator",
      "meme caption maker",
      "viral joke generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-story-generator",
    cluster: "ai-tools",
    title: "AI Story Generator | Free Online Tool",
    description: "Write creative short stories and plot outlines across genres.",
    pillarKeyword: "ai story generator",
    supportingKeywords: [
      "creative story writer",
      "write fiction story",
      "plot generator ai"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-poem-generator",
    cluster: "ai-tools",
    title: "AI Poem Generator | Free Online Tool",
    description: "Generate rhyming or free-verse poetry on any prompt.",
    pillarKeyword: "ai poem generator",
    supportingKeywords: [
      "write poem ai",
      "rhyme generator ai",
      "poetic verse builder"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-song-lyrics",
    cluster: "ai-tools",
    title: "AI Song Lyric Generator | Free Online Tool",
    description: "Draft song lyrics with verse, chorus, and bridge structures.",
    pillarKeyword: "ai song lyrics",
    supportingKeywords: [
      "write song lyrics",
      "music lyric generator",
      "rhyming lyric maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-joke-generator",
    cluster: "ai-tools",
    title: "AI Joke Generator | Free Online Tool",
    description: "Generate clean jokes, puns, and one-liners.",
    pillarKeyword: "ai joke generator",
    supportingKeywords: [
      "tell a joke ai",
      "pun generator online",
      "funny one liners"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-name-generator",
    cluster: "ai-tools",
    title: "AI Name Generator | Free Online Tool",
    description: "Generate creative names for characters, places, or products.",
    pillarKeyword: "ai name generator",
    supportingKeywords: [
      "character name generator",
      "product name finder",
      "creative name maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-brand-name",
    cluster: "ai-tools",
    title: "AI Brand Name Generator | Free Online Tool",
    description: "Generate unique, memorable brand names for new startups.",
    pillarKeyword: "ai brand name",
    supportingKeywords: [
      "startup name generator",
      "business name finder",
      "brand name maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-domain-name",
    cluster: "ai-tools",
    title: "AI Domain Name Generator | Free Online Tool",
    description: "Suggest available domain name ideas with clean keyword variations.",
    pillarKeyword: "ai domain name",
    supportingKeywords: [
      "domain name finder",
      "available domain ideas",
      "website name generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-slogan-generator",
    cluster: "ai-tools",
    title: "AI Slogan Generator | Free Online Tool",
    description: "Draft catchy advertising slogans and brand catchphrases.",
    pillarKeyword: "ai slogan generator",
    supportingKeywords: [
      "business slogan maker",
      "catchphrase generator",
      "advertising tagline"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-tagline-generator",
    cluster: "ai-tools",
    title: "AI Tagline Generator | Free Online Tool",
    description: "Create punchy company taglines for landing page headers.",
    pillarKeyword: "ai tagline generator",
    supportingKeywords: [
      "company tagline maker",
      "brand tagline generator",
      "punchy header copy"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-persona-generator",
    cluster: "ai-tools",
    title: "AI Persona Generator | Free Online Tool",
    description: "Create detailed target customer buyer personas for marketing strategy.",
    pillarKeyword: "ai persona generator",
    supportingKeywords: [
      "buyer persona maker",
      "target user profile",
      "customer persona tool"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-user-story",
    cluster: "ai-tools",
    title: "AI User Story Generator | Free Online Tool",
    description: "Generate Agile user stories with acceptance criteria (Given/When/Then).",
    pillarKeyword: "ai user story",
    supportingKeywords: [
      "agile user story maker",
      "scrum user story ai",
      "acceptance criteria maker"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-job-description",
    cluster: "ai-tools",
    title: "AI Job Description Generator | Free Online Tool",
    description: "Draft clear job postings with responsibilities and requirements.",
    pillarKeyword: "ai job description",
    supportingKeywords: [
      "write job posting",
      "job description maker",
      "recruitment ad generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-interview-questions",
    cluster: "ai-tools",
    title: "AI Interview Question Generator | Free Online Tool",
    description: "Generate technical and behavioral interview questions for hiring roles.",
    pillarKeyword: "ai interview questions",
    supportingKeywords: [
      "technical interview questions",
      "candidate screening maker",
      "interview question generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "ai-swot-analysis",
    cluster: "ai-tools",
    title: "AI SWOT Analysis Generator | Free Online Tool",
    description: "Conduct strategic SWOT analysis (Strengths, Weaknesses, Opportunities, Threats).",
    pillarKeyword: "ai swot analysis",
    supportingKeywords: [
      "swot analysis builder",
      "business strategy tool",
      "swot matrix generator"
    ],
    toolComponent: "AiMicroTool"
  },
  {
    slug: "pdf-to-word",
    cluster: "converters",
    title: "PDF to Word Converter | Free Online Tool",
    description: "Convert PDF documents into editable Microsoft Word (.docx) files.",
    pillarKeyword: "pdf to word",
    supportingKeywords: [
      "convert pdf docx",
      "pdf to doc online",
      "editable pdf converter"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "word-to-pdf",
    cluster: "converters",
    title: "Word to PDF Converter | Free Online Tool",
    description: "Convert Word documents (.docx) into clean PDF files.",
    pillarKeyword: "word to pdf",
    supportingKeywords: [
      "docx to pdf converter",
      "save word as pdf",
      "convert doc to pdf"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "pdf-to-excel",
    cluster: "converters",
    title: "PDF to Excel Converter | Free Online Tool",
    description: "Extract tables from PDF documents into Excel (.xlsx) spreadsheets.",
    pillarKeyword: "pdf to excel",
    supportingKeywords: [
      "convert pdf to xlsx",
      "pdf table to excel",
      "pdf spreadsheet extractor"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "excel-to-pdf",
    cluster: "converters",
    title: "Excel to PDF Converter | Free Online Tool",
    description: "Convert Excel spreadsheets (.xlsx) into printable PDF documents.",
    pillarKeyword: "excel to pdf",
    supportingKeywords: [
      "xlsx to pdf converter",
      "save excel as pdf",
      "convert spreadsheet pdf"
    ],
    toolComponent: "JsonFormatterValidator"
  },
  {
    slug: "pdf-to-ppt",
    cluster: "converters",
    title: "PDF to PowerPoint Converter | Free Online Tool",
    description: "Convert PDF presentation slides into editable PPTX decks.",
    pillarKeyword: "pdf to ppt",
    supportingKeywords: [
      "pdf to pptx converter",
      "pdf slides to powerpoint",
      "convert pdf presentation"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "ppt-to-pdf",
    cluster: "converters",
    title: "PowerPoint to PDF Converter | Free Online Tool",
    description: "Convert PowerPoint slide decks (.pptx) into PDF documents.",
    pillarKeyword: "ppt to pdf",
    supportingKeywords: [
      "pptx to pdf converter",
      "save slides as pdf",
      "convert ppt to pdf"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "pdf-to-image",
    cluster: "converters",
    title: "PDF to Image Converter | Free Online Tool",
    description: "Render PDF pages into high-resolution JPG or PNG image files.",
    pillarKeyword: "pdf to image",
    supportingKeywords: [
      "pdf page to png",
      "convert pdf to picture",
      "pdf image extractor"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "image-to-pdf",
    cluster: "converters",
    title: "Image to PDF Converter | Free Online Tool",
    description: "Combine JPG, PNG, and WebP images into a single PDF document.",
    pillarKeyword: "image to pdf",
    supportingKeywords: [
      "convert jpg to pdf",
      "combine pictures to pdf",
      "photos to pdf maker"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "pdf-to-text",
    cluster: "converters",
    title: "PDF to Text Converter | Free Online Tool",
    description: "Extract raw text content from PDF documents.",
    pillarKeyword: "pdf to text",
    supportingKeywords: [
      "extract text from pdf",
      "pdf text scraper",
      "convert pdf to txt"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "text-to-pdf",
    cluster: "converters",
    title: "Text to PDF Converter | Free Online Tool",
    description: "Convert plain text files (.txt) into formatted PDF documents.",
    pillarKeyword: "text to pdf",
    supportingKeywords: [
      "txt to pdf converter",
      "save plain text pdf",
      "convert txt file"
    ],
    toolComponent: "MarkdownEditorPreview"
  },
  {
    slug: "pdf-merge",
    cluster: "converters",
    title: "PDF Merge Tool | Free Online Tool",
    description: "Combine multiple PDF files into a single unified PDF document.",
    pillarKeyword: "pdf merge",
    supportingKeywords: [
      "merge pdf files",
      "combine pdf online",
      "join pdf pages"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "pdf-split",
    cluster: "converters",
    title: "PDF Split Tool | Free Online Tool",
    description: "Extract specific pages or split PDF documents into separate files.",
    pillarKeyword: "pdf split",
    supportingKeywords: [
      "split pdf pages",
      "extract pdf pages",
      "separate pdf file"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "pdf-compressor",
    cluster: "converters",
    title: "PDF Compressor | Free Online Tool",
    description: "Reduce PDF file sizes while preserving visual text clarity.",
    pillarKeyword: "pdf compressor",
    supportingKeywords: [
      "compress pdf file",
      "reduce pdf size",
      "shrink pdf online"
    ],
    toolComponent: "TextDiffChecker"
  },
  {
    slug: "pdf-to-jpg",
    cluster: "converters",
    title: "PDF to JPG Converter | Free Online Tool",
    description: "Convert PDF pages into high quality JPG image files.",
    pillarKeyword: "pdf to jpg",
    supportingKeywords: [
      "pdf to jpg online",
      "extract jpg from pdf",
      "pdf page picture"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "jpg-to-pdf",
    cluster: "converters",
    title: "JPG to PDF Converter | Free Online Tool",
    description: "Convert JPG image files into printable PDF documents.",
    pillarKeyword: "jpg to pdf",
    supportingKeywords: [
      "jpg to pdf maker",
      "save jpg as pdf",
      "picture to pdf converter"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "png-to-pdf",
    cluster: "converters",
    title: "PNG to PDF Converter | Free Online Tool",
    description: "Convert transparent or opaque PNG image files into PDF format.",
    pillarKeyword: "png to pdf",
    supportingKeywords: [
      "png to pdf maker",
      "save png as pdf",
      "convert png document"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "pdf-to-svg",
    cluster: "converters",
    title: "PDF to SVG Converter | Free Online Tool",
    description: "Convert PDF page graphics into scalable vector SVG files.",
    pillarKeyword: "pdf to svg",
    supportingKeywords: [
      "pdf vector to svg",
      "convert pdf to vector",
      "pdf svg converter"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "svg-to-pdf",
    cluster: "converters",
    title: "SVG to PDF Converter | Free Online Tool",
    description: "Render scalable vector SVG graphics into print-ready PDF files.",
    pillarKeyword: "svg to pdf",
    supportingKeywords: [
      "svg graphic to pdf",
      "convert vector to pdf",
      "save svg pdf"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "png-to-jpg",
    cluster: "converters",
    title: "PNG to JPG Converter | Free Online Tool",
    description: "Convert PNG images to compressed JPG format with custom background fill.",
    pillarKeyword: "png to jpg",
    supportingKeywords: [
      "convert png to jpg",
      "png jpg image converter",
      "transparent png to jpg"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "jpg-to-png",
    cluster: "converters",
    title: "JPG to PNG Converter | Free Online Tool",
    description: "Convert JPG photos to PNG format.",
    pillarKeyword: "jpg to png",
    supportingKeywords: [
      "convert jpg to png",
      "jpg png image converter",
      "save jpg as png"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "png-to-webp",
    cluster: "converters",
    title: "PNG to WebP Converter | Free Online Tool",
    description: "Convert PNG images into lightweight WebP image files for faster page load.",
    pillarKeyword: "png to webp",
    supportingKeywords: [
      "convert png to webp",
      "webp image optimizer",
      "compress image webp"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "webp-to-png",
    cluster: "converters",
    title: "WebP to PNG Converter | Free Online Tool",
    description: "Convert modern WebP images back into widely compatible PNG files.",
    pillarKeyword: "webp to png",
    supportingKeywords: [
      "convert webp to png",
      "webp file decoder",
      "save webp as png"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "png-to-svg",
    cluster: "converters",
    title: "PNG to SVG Vector Converter | Free Online Tool",
    description: "Trace and convert PNG raster graphics into scalable SVG vector shapes.",
    pillarKeyword: "png to svg",
    supportingKeywords: [
      "raster to vector svg",
      "convert image to vector",
      "png vectorizer"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "svg-to-png",
    cluster: "converters",
    title: "SVG to PNG Converter | Free Online Tool",
    description: "Render SVG vector files into high-resolution PNG image rasters.",
    pillarKeyword: "svg to png",
    supportingKeywords: [
      "convert svg to png",
      "export svg picture",
      "svg rasterizer"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "jpg-to-webp",
    cluster: "converters",
    title: "JPG to WebP Converter | Free Online Tool",
    description: "Compress JPG photos into modern WebP web format.",
    pillarKeyword: "jpg to webp",
    supportingKeywords: [
      "convert jpg to webp",
      "optimize photos webp",
      "jpg webp converter"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "webp-to-jpg",
    cluster: "converters",
    title: "WebP to JPG Converter | Free Online Tool",
    description: "Convert WebP images to standard JPG image format.",
    pillarKeyword: "webp to jpg",
    supportingKeywords: [
      "convert webp to jpg",
      "webp image decoder",
      "save webp as jpg"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "heic-to-jpg",
    cluster: "converters",
    title: "HEIC to JPG Converter | Free Online Tool",
    description: "Convert iPhone HEIC photos into universally supported JPG images.",
    pillarKeyword: "heic to jpg",
    supportingKeywords: [
      "iphone photo converter",
      "convert heic picture",
      "heic to jpg online"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "jpg-to-heic",
    cluster: "converters",
    title: "JPG to HEIC Converter | Free Online Tool",
    description: "Convert JPG images into high-efficiency HEIC photos.",
    pillarKeyword: "jpg to heic",
    supportingKeywords: [
      "convert jpg to heic",
      "create heic file",
      "heic photo maker"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "avif-to-jpg",
    cluster: "converters",
    title: "AVIF to JPG Converter | Free Online Tool",
    description: "Convert modern AVIF image files into compatible JPG format.",
    pillarKeyword: "avif to jpg",
    supportingKeywords: [
      "convert avif to jpg",
      "avif image decoder",
      "save avif as jpg"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "jpg-to-avif",
    cluster: "converters",
    title: "JPG to AVIF Converter | Free Online Tool",
    description: "Convert JPG photos into ultra-compressed AVIF images.",
    pillarKeyword: "jpg to avif",
    supportingKeywords: [
      "convert jpg to avif",
      "avif image compressor",
      "optimize image avif"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "bmp-to-jpg",
    cluster: "converters",
    title: "BMP to JPG Converter | Free Online Tool",
    description: "Convert bitmap images (.bmp) into compressed JPG files.",
    pillarKeyword: "bmp to jpg",
    supportingKeywords: [
      "convert bmp to jpg",
      "bitmap image converter",
      "bmp compressed photo"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "jpg-to-bmp",
    cluster: "converters",
    title: "JPG to BMP Converter | Free Online Tool",
    description: "Convert JPG compressed photos into uncompressed BMP bitmaps.",
    pillarKeyword: "jpg to bmp",
    supportingKeywords: [
      "convert jpg to bmp",
      "create bitmap file",
      "save photo bmp"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "tiff-to-jpg",
    cluster: "converters",
    title: "TIFF to JPG Converter | Free Online Tool",
    description: "Convert multi-page or single TIFF images into standard JPG files.",
    pillarKeyword: "tiff to jpg",
    supportingKeywords: [
      "convert tiff to jpg",
      "tiff picture converter",
      "save tiff jpg"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "gif-to-png",
    cluster: "converters",
    title: "GIF to PNG Converter | Free Online Tool",
    description: "Extract frames or convert animated GIF images into static PNG files.",
    pillarKeyword: "gif to png",
    supportingKeywords: [
      "convert gif to png",
      "extract gif frame",
      "static png from gif"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "png-to-gif",
    cluster: "converters",
    title: "PNG to GIF Converter | Free Online Tool",
    description: "Convert PNG images into static or looping GIF files.",
    pillarKeyword: "png to gif",
    supportingKeywords: [
      "convert png to gif",
      "create gif from png",
      "png image gif"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "ico-to-png",
    cluster: "converters",
    title: "ICO to PNG Converter | Free Online Tool",
    description: "Convert Windows ICO favicon icons into high-res PNG pictures.",
    pillarKeyword: "ico to png",
    supportingKeywords: [
      "convert ico to png",
      "favicon to picture",
      "extract ico png"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "png-to-ico",
    cluster: "converters",
    title: "PNG to ICO Favicon Converter | Free Online Tool",
    description: "Convert PNG graphics into ICO favicon files for websites.",
    pillarKeyword: "png to ico",
    supportingKeywords: [
      "create ico favicon",
      "png to ico converter",
      "make website icon"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "eps-to-svg",
    cluster: "converters",
    title: "EPS to SVG Converter | Free Online Tool",
    description: "Convert PostScript EPS vector files into clean web SVG files.",
    pillarKeyword: "eps to svg",
    supportingKeywords: [
      "convert eps to svg",
      "vector eps converter",
      "eps graphic to svg"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "mp4-to-mp3",
    cluster: "converters",
    title: "MP4 to MP3 Audio Extractor | Free Online Tool",
    description: "Extract high quality MP3 audio tracks from MP4 video files.",
    pillarKeyword: "mp4 to mp3",
    supportingKeywords: [
      "extract audio from video",
      "convert mp4 audio",
      "mp4 sound extractor"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "mp3-to-wav",
    cluster: "converters",
    title: "MP3 to WAV Converter | Free Online Tool",
    description: "Convert compressed MP3 audio files into uncompressed WAV audio.",
    pillarKeyword: "mp3 to wav",
    supportingKeywords: [
      "convert mp3 to wav",
      "mp3 wav decoder",
      "save mp3 as wav"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "wav-to-mp3",
    cluster: "converters",
    title: "WAV to MP3 Converter | Free Online Tool",
    description: "Compress large WAV audio recordings into portable MP3 files.",
    pillarKeyword: "wav to mp3",
    supportingKeywords: [
      "compress wav file",
      "convert wav to mp3",
      "wav audio compressor"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "webm-to-mp4",
    cluster: "converters",
    title: "WebM to MP4 Converter | Free Online Tool",
    description: "Convert HTML5 WebM videos into universally supported MP4 files.",
    pillarKeyword: "webm to mp4",
    supportingKeywords: [
      "convert webm to mp4",
      "webm video decoder",
      "save webm as mp4"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "mp4-to-webm",
    cluster: "converters",
    title: "MP4 to WebM Converter | Free Online Tool",
    description: "Convert MP4 videos into HTML5 WebM format for web streaming.",
    pillarKeyword: "mp4 to webm",
    supportingKeywords: [
      "convert mp4 to webm",
      "web video compressor",
      "mp4 webm maker"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "mov-to-mp4",
    cluster: "converters",
    title: "MOV to MP4 Converter | Free Online Tool",
    description: "Convert QuickTime MOV videos into standard MP4 video format.",
    pillarKeyword: "mov to mp4",
    supportingKeywords: [
      "quicktime to mp4",
      "convert mov video",
      "iphone video to mp4"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "avi-to-mp4",
    cluster: "converters",
    title: "AVI to MP4 Converter | Free Online Tool",
    description: "Convert legacy AVI video files into modern compressed MP4 videos.",
    pillarKeyword: "avi to mp4",
    supportingKeywords: [
      "convert avi to mp4",
      "avi video converter",
      "save avi as mp4"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "mkv-to-mp4",
    cluster: "converters",
    title: "MKV to MP4 Converter | Free Online Tool",
    description: "Convert Matroska MKV video files into compatible MP4 format.",
    pillarKeyword: "mkv to mp4",
    supportingKeywords: [
      "convert mkv to mp4",
      "mkv video converter",
      "remux mkv to mp4"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "flv-to-mp4",
    cluster: "converters",
    title: "FLV to MP4 Converter | Free Online Tool",
    description: "Convert Flash Video FLV files into modern MP4 videos.",
    pillarKeyword: "flv to mp4",
    supportingKeywords: [
      "convert flv to mp4",
      "flash video converter",
      "save flv as mp4"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "ogg-to-mp3",
    cluster: "converters",
    title: "OGG to MP3 Converter | Free Online Tool",
    description: "Convert OGG Vorbis audio files into standard MP3 audio.",
    pillarKeyword: "ogg to mp3",
    supportingKeywords: [
      "convert ogg to mp3",
      "ogg audio decoder",
      "save ogg as mp3"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "flac-to-mp3",
    cluster: "converters",
    title: "FLAC to MP3 Converter | Free Online Tool",
    description: "Compress lossless FLAC audio files into compact MP3 tracks.",
    pillarKeyword: "flac to mp3",
    supportingKeywords: [
      "convert flac to mp3",
      "flac audio compressor",
      "save flac as mp3"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "aac-to-mp3",
    cluster: "converters",
    title: "AAC to MP3 Converter | Free Online Tool",
    description: "Convert AAC audio tracks into compatible MP3 files.",
    pillarKeyword: "aac to mp3",
    supportingKeywords: [
      "convert aac to mp3",
      "aac audio decoder",
      "save aac as mp3"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "m4a-to-mp3",
    cluster: "converters",
    title: "M4A to MP3 Converter | Free Online Tool",
    description: "Convert Apple M4A voice memos and audio into MP3 format.",
    pillarKeyword: "m4a to mp3",
    supportingKeywords: [
      "convert m4a to mp3",
      "apple audio converter",
      "m4a audio decoder"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "video-to-gif",
    cluster: "converters",
    title: "Video to GIF Converter | Free Online Tool",
    description: "Convert video clips into looping animated GIF images.",
    pillarKeyword: "video to gif",
    supportingKeywords: [
      "make gif from video",
      "mp4 to animated gif",
      "clip to gif maker"
    ],
    toolComponent: "QrCodeGenerator"
  },
  {
    slug: "length-converter",
    cluster: "converters",
    title: "Length Converter | Free Online Tool",
    description: "Convert length units across meters, feet, inches, kilometers, and miles.",
    pillarKeyword: "length converter",
    supportingKeywords: [
      "meters to feet",
      "inches to cm",
      "distance unit converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "weight-converter",
    cluster: "converters",
    title: "Weight & Mass Converter | Free Online Tool",
    description: "Convert mass units across kilograms, pounds, ounces, and grams.",
    pillarKeyword: "weight converter",
    supportingKeywords: [
      "kg to lbs",
      "lbs to kg",
      "mass unit converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "temperature-converter",
    cluster: "converters",
    title: "Temperature Converter | Free Online Tool",
    description: "Convert temperature values between Celsius, Fahrenheit, and Kelvin.",
    pillarKeyword: "temperature converter",
    supportingKeywords: [
      "celsius to fahrenheit",
      "fahrenheit to celsius",
      "temp scale converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "volume-converter",
    cluster: "converters",
    title: "Volume Converter | Free Online Tool",
    description: "Convert volume measures across liters, gallons, milliliters, and fluid ounces.",
    pillarKeyword: "volume converter",
    supportingKeywords: [
      "liters to gallons",
      "ml to oz",
      "liquid volume converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "area-converter",
    cluster: "converters",
    title: "Area Converter | Free Online Tool",
    description: "Convert square meters, square feet, acres, and hectares.",
    pillarKeyword: "area converter",
    supportingKeywords: [
      "sq ft to sq meters",
      "acres to hectares",
      "land area converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "speed-converter",
    cluster: "converters",
    title: "Speed Converter | Free Online Tool",
    description: "Convert speed values across km/h, mph, meters/sec, and knots.",
    pillarKeyword: "speed converter",
    supportingKeywords: [
      "kmh to mph",
      "mph to kmh",
      "velocity converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "time-converter",
    cluster: "converters",
    title: "Time Duration Converter | Free Online Tool",
    description: "Convert time units across seconds, minutes, hours, days, and weeks.",
    pillarKeyword: "time converter",
    supportingKeywords: [
      "hours to minutes",
      "seconds to hours",
      "time unit calculator"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "data-storage-converter",
    cluster: "converters",
    title: "Data Storage Converter | Free Online Tool",
    description: "Convert data storage units across Bytes, KB, MB, GB, TB, and PB.",
    pillarKeyword: "data storage converter",
    supportingKeywords: [
      "mb to gb converter",
      "bytes to megabytes",
      "digital storage calculator"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "energy-converter",
    cluster: "converters",
    title: "Energy Converter | Free Online Tool",
    description: "Convert energy units across Joules, Kilojoules, Calories, and Kilowatt-hours.",
    pillarKeyword: "energy converter",
    supportingKeywords: [
      "joules to calories",
      "kwh to joules",
      "energy unit tool"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "power-converter",
    cluster: "converters",
    title: "Power Converter | Free Online Tool",
    description: "Convert power units across Watts, Kilowatts, and Horsepower.",
    pillarKeyword: "power converter",
    supportingKeywords: [
      "watts to horsepower",
      "kw to hp",
      "power unit calculator"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "pressure-converter",
    cluster: "converters",
    title: "Pressure Converter | Free Online Tool",
    description: "Convert pressure units across PSI, Bar, Pascals, and Atmospheres.",
    pillarKeyword: "pressure converter",
    supportingKeywords: [
      "psi to bar",
      "pascals to psi",
      "pressure unit tool"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "force-converter",
    cluster: "converters",
    title: "Force Converter | Free Online Tool",
    description: "Convert force units across Newtons, Kilonewtons, and Pound-force.",
    pillarKeyword: "force converter",
    supportingKeywords: [
      "newtons to lbs force",
      "force unit calculator",
      "kn to newtons"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "torque-converter",
    cluster: "converters",
    title: "Torque Converter | Free Online Tool",
    description: "Convert torque units across Newton-meters and Foot-pounds.",
    pillarKeyword: "torque converter",
    supportingKeywords: [
      "nm to ft lbs",
      "torque unit calculator",
      "foot pounds to nm"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "angle-converter",
    cluster: "converters",
    title: "Angle Converter | Free Online Tool",
    description: "Convert angular units between Degrees, Radians, and Gradians.",
    pillarKeyword: "angle converter",
    supportingKeywords: [
      "degrees to radians",
      "radians to degrees",
      "angle unit tool"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "fuel-efficiency-converter",
    cluster: "converters",
    title: "Fuel Efficiency Converter | Free Online Tool",
    description: "Convert fuel economy values between MPG and L/100km.",
    pillarKeyword: "fuel efficiency converter",
    supportingKeywords: [
      "mpg to l 100km",
      "fuel consumption converter",
      "gas mileage calculator"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "frequency-converter",
    cluster: "converters",
    title: "Frequency Converter | Free Online Tool",
    description: "Convert frequency units across Hertz, Kilohertz, Megahertz, and Gigahertz.",
    pillarKeyword: "frequency converter",
    supportingKeywords: [
      "hz to khz",
      "mhz to ghz",
      "frequency unit tool"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "density-converter",
    cluster: "converters",
    title: "Density Converter | Free Online Tool",
    description: "Convert mass density values across kg/m\xB3, g/cm\xB3, and lbs/ft\xB3.",
    pillarKeyword: "density converter",
    supportingKeywords: [
      "kg m3 to g cm3",
      "density unit tool",
      "mass volume density"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "flow-rate-converter",
    cluster: "converters",
    title: "Flow Rate Converter | Free Online Tool",
    description: "Convert fluid flow rates across liters/sec, gallons/min, and m\xB3/hour.",
    pillarKeyword: "flow rate converter",
    supportingKeywords: [
      "gpm to lps",
      "fluid flow rate",
      "flow volume calculator"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "viscosity-converter",
    cluster: "converters",
    title: "Viscosity Converter | Free Online Tool",
    description: "Convert dynamic and kinematic viscosity values.",
    pillarKeyword: "viscosity converter",
    supportingKeywords: [
      "pascal seconds to poise",
      "viscosity unit converter",
      "fluid friction tool"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "cooking-converter",
    cluster: "converters",
    title: "Cooking Measurement Converter | Free Online Tool",
    description: "Convert kitchen recipe units across cups, tablespoons, teaspoons, and grams.",
    pillarKeyword: "cooking converter",
    supportingKeywords: [
      "cups to grams",
      "tbsp to tsp",
      "recipe unit converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "shoe-size-converter",
    cluster: "converters",
    title: "Shoe Size Converter | Free Online Tool",
    description: "Convert international shoe sizes across US, UK, EU, and CM measurements.",
    pillarKeyword: "shoe size converter",
    supportingKeywords: [
      "us to eu shoe size",
      "uk to us shoe size",
      "international shoe converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "clothing-size-converter",
    cluster: "converters",
    title: "Clothing Size Converter | Free Online Tool",
    description: "Convert apparel measurements across US, UK, EU, and Asian sizing scales.",
    pillarKeyword: "clothing size converter",
    supportingKeywords: [
      "us to eu clothes size",
      "international clothing size",
      "apparel size tool"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "currency-converter",
    cluster: "converters",
    title: "Currency Converter | Free Online Tool",
    description: "Convert foreign exchange rates across USD, EUR, GBP, JPY, and INR.",
    pillarKeyword: "currency converter",
    supportingKeywords: [
      "usd to eur converter",
      "foreign exchange rates",
      "currency calculator"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "number-to-words",
    cluster: "converters",
    title: "Number to Words Converter | Free Online Tool",
    description: "Convert numeric dollar and currency amounts into written English word sentences.",
    pillarKeyword: "number to words",
    supportingKeywords: [
      "number to words tool",
      "write check amount",
      "amount in words"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "words-to-number",
    cluster: "converters",
    title: "Words to Number Converter | Free Online Tool",
    description: "Convert written English number phrases back into numeric digit values.",
    pillarKeyword: "words to number",
    supportingKeywords: [
      "text to digits",
      "words to number tool",
      "parse written numbers"
    ],
    toolComponent: "WordCounter"
  },
  {
    slug: "roman-numeral-converter",
    cluster: "converters",
    title: "Roman Numeral Converter | Free Online Tool",
    description: "Convert numbers to Roman numerals (e.g. 2026 -> MMXXVI) and vice versa.",
    pillarKeyword: "roman numeral converter",
    supportingKeywords: [
      "number to roman numerals",
      "decode roman numerals",
      "roman numeral maker"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "binary-to-decimal",
    cluster: "converters",
    title: "Binary to Decimal Converter | Free Online Tool",
    description: "Convert binary base-2 strings into decimal base-10 integers.",
    pillarKeyword: "binary to decimal",
    supportingKeywords: [
      "binary base 2 to 10",
      "decode binary digits",
      "binary integer converter"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "decimal-to-binary",
    cluster: "converters",
    title: "Decimal to Binary Converter | Free Online Tool",
    description: "Convert decimal integers into binary 0s and 1s.",
    pillarKeyword: "decimal to binary",
    supportingKeywords: [
      "decimal to base 2",
      "convert number binary",
      "decimal binary tool"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "hex-to-decimal",
    cluster: "converters",
    title: "Hexadecimal to Decimal Converter | Free Online Tool",
    description: "Convert hexadecimal base-16 strings into decimal integers.",
    pillarKeyword: "hex to decimal",
    supportingKeywords: [
      "hex to base 10",
      "decode hex number",
      "hexadecimal converter"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "decimal-to-hex",
    cluster: "converters",
    title: "Decimal to Hexadecimal Converter | Free Online Tool",
    description: "Convert decimal numbers into hexadecimal strings.",
    pillarKeyword: "decimal to hex",
    supportingKeywords: [
      "decimal to base 16",
      "convert number hex",
      "decimal hex tool"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "octal-to-decimal",
    cluster: "converters",
    title: "Octal to Decimal Converter | Free Online Tool",
    description: "Convert octal base-8 numbers into decimal values.",
    pillarKeyword: "octal to decimal",
    supportingKeywords: [
      "octal to base 10",
      "decode octal number",
      "octal integer converter"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "decimal-to-octal",
    cluster: "converters",
    title: "Decimal to Octal Converter | Free Online Tool",
    description: "Convert decimal numbers into octal base-8 strings.",
    pillarKeyword: "decimal to octal",
    supportingKeywords: [
      "decimal to base 8",
      "convert number octal",
      "decimal octal tool"
    ],
    toolComponent: "Base64JwtDecoder"
  },
  {
    slug: "fraction-to-decimal",
    cluster: "converters",
    title: "Fraction to Decimal Converter | Free Online Tool",
    description: "Convert mathematical fractions (e.g., 3/4) into decimal values (0.75).",
    pillarKeyword: "fraction to decimal",
    supportingKeywords: [
      "fraction to decimal tool",
      "3 4 to decimal",
      "math fraction converter"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "decimal-to-fraction",
    cluster: "converters",
    title: "Decimal to Fraction Converter | Free Online Tool",
    description: "Convert decimal numbers into simplified fractions.",
    pillarKeyword: "decimal to fraction",
    supportingKeywords: [
      "decimal to fraction tool",
      "0.75 to fraction",
      "simplify decimal fraction"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "percentage-converter",
    cluster: "converters",
    title: "Percentage Calculator | Free Online Tool",
    description: "Calculate percentage increases, decreases, discounts, and margin ratios.",
    pillarKeyword: "percentage converter",
    supportingKeywords: [
      "percentage change tool",
      "discount percentage calculator",
      "percent ratio tool"
    ],
    toolComponent: "CaseConverter"
  },
  {
    slug: "timezone-converter",
    cluster: "converters",
    title: "Timezone Converter | Free Online Tool",
    description: "Convert dates and meeting times across global world timezones.",
    pillarKeyword: "timezone converter",
    supportingKeywords: [
      "world time converter",
      "pst to est converter",
      "gmt time tool"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "gps-coordinates-converter",
    cluster: "converters",
    title: "GPS Coordinates Converter | Free Online Tool",
    description: "Convert GPS coordinates between Decimal Degrees, DMS, and UTM.",
    pillarKeyword: "gps coordinates converter",
    supportingKeywords: [
      "gps coordinate tool",
      "latitude longitude format",
      "map coordinate converter"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "lat-long-converter",
    cluster: "converters",
    title: "Latitude Longitude Converter | Free Online Tool",
    description: "Convert address locations into latitude and longitude geographic coordinates.",
    pillarKeyword: "lat long converter",
    supportingKeywords: [
      "address to lat long",
      "find lat long coordinates",
      "geo location converter"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "dms-to-decimal",
    cluster: "converters",
    title: "DMS to Decimal Degrees Converter | Free Online Tool",
    description: "Convert Degrees, Minutes, and Seconds into decimal degree coordinates.",
    pillarKeyword: "dms to decimal",
    supportingKeywords: [
      "dms to lat long",
      "convert dms decimal",
      "degrees minutes seconds tool"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "decimal-to-dms",
    cluster: "converters",
    title: "Decimal Degrees to DMS Converter | Free Online Tool",
    description: "Convert decimal degree coordinates into Degrees, Minutes, and Seconds format.",
    pillarKeyword: "decimal to dms",
    supportingKeywords: [
      "decimal to dms tool",
      "convert lat long dms",
      "decimal degrees minutes"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "utm-converter",
    cluster: "converters",
    title: "UTM Coordinate Converter | Free Online Tool",
    description: "Convert Universal Transverse Mercator (UTM) coordinates to latitude/longitude.",
    pillarKeyword: "utm converter",
    supportingKeywords: [
      "utm to lat long",
      "utm zone converter",
      "map grid converter"
    ],
    toolComponent: "UrlSlugUtmBuilder"
  },
  {
    slug: "date-format-converter",
    cluster: "converters",
    title: "Date Format Converter | Free Online Tool",
    description: "Reformat dates across YYYY-MM-DD, MM/DD/YYYY, and custom date patterns.",
    pillarKeyword: "date format converter",
    supportingKeywords: [
      "reformat date string",
      "change date layout",
      "date string parser"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "calendar-converter",
    cluster: "converters",
    title: "Calendar System Converter | Free Online Tool",
    description: "Convert dates across Gregorian, Julian, Islamic, and Hebrew calendar systems.",
    pillarKeyword: "calendar converter",
    supportingKeywords: [
      "gregorian to hijri",
      "calendar converter tool",
      "julian to gregorian"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "julian-date-converter",
    cluster: "converters",
    title: "Julian Date Converter | Free Online Tool",
    description: "Convert standard calendar dates to Julian Day Numbers (JDN).",
    pillarKeyword: "julian date converter",
    supportingKeywords: [
      "calendar to julian day",
      "julian day number tool",
      "astronomy date tool"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "unix-time-converter",
    cluster: "converters",
    title: "Unix Time Converter | Free Online Tool",
    description: "Convert Unix timestamps to human readable dates.",
    pillarKeyword: "unix time converter",
    supportingKeywords: [
      "unix time to date",
      "convert timestamp date",
      "epoch time parser"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "excel-date-converter",
    cluster: "converters",
    title: "Excel Serial Date Converter | Free Online Tool",
    description: "Convert Excel serial date numbers (e.g. 45000) to ISO dates.",
    pillarKeyword: "excel date converter",
    supportingKeywords: [
      "excel serial date tool",
      "convert excel serial date",
      "excel date serial"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "leap-year-calculator",
    cluster: "converters",
    title: "Leap Year Calculator | Free Online Tool",
    description: "Determine whether any given year is a leap year with rule explanations.",
    pillarKeyword: "leap year calculator",
    supportingKeywords: [
      "check leap year",
      "is leap year",
      "leap year calendar tool"
    ],
    toolComponent: "UnixTimestampConverter"
  },
  {
    slug: "week-number-calculator",
    cluster: "converters",
    title: "ISO Week Number Calculator | Free Online Tool",
    description: "Determine ISO week numbers and day of the year for target calendar dates.",
    pillarKeyword: "week number calculator",
    supportingKeywords: [
      "find week number",
      "iso week number tool",
      "day of year calculator"
    ],
    toolComponent: "UnixTimestampConverter"
  }
];

// src/data/toolsRegistry.ts
var CATEGORIES = [
  {
    id: "seo-tools",
    label: "SEO & URL Tools",
    description: "Bulk extraction, XML sitemaps, Meta OpenGraph previews, Robots.txt, and Schema markup",
    icon: "Globe"
  },
  {
    id: "developer-tools",
    label: "Developer Tools",
    description: "Format, validate, diff, and convert JSON, XML, YAML, Regex, Cron, JWT, and SQL",
    icon: "Code2"
  },
  {
    id: "ai-tools",
    label: "Single-Purpose AI Tools",
    description: "Narrow, deterministic AI assistants for Regex, SQL, JSON Repair, SEO Meta, and Commit Messages",
    icon: "Sparkles"
  },
  {
    id: "text-tools",
    label: "Text & Diff Tools",
    description: "Text diffing, line sorting, word count, slugifier, and regex replacements",
    icon: "FileText"
  },
  {
    id: "converters",
    label: "Converters & Encoders",
    description: "Base64, URL encoding, Unix Timestamps, Color space conversion, and CSS units",
    icon: "ArrowLeftRight"
  },
  {
    id: "generators",
    label: "Generators",
    description: "UUID v4, Cron schedules, Hash generation (SHA-256/MD5), and UTM campaign links",
    icon: "Wand2"
  },
  {
    id: "validators",
    label: "Validators",
    description: "JSON, XML, Sitemap, Schema.org, and Robots.txt rule validators",
    icon: "CheckCircle2"
  }
];
function generate20Faqs(title, pillarKeyword, supportingKeywords = []) {
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
var CATEGORY_LABEL_MAP = {
  "seo-tools": "SEO & URL Tools",
  "developer-tools": "Developer Tools",
  "ai-tools": "Single-Purpose AI Tools",
  "text-tools": "Text & Diff Tools",
  "converters": "Converters & Encoders",
  "generators": "Generators",
  "validators": "Validators"
};
var CATEGORY_ICON_MAP = {
  "seo-tools": "Globe",
  "developer-tools": "Code2",
  "ai-tools": "Sparkles",
  "text-tools": "FileText",
  "converters": "ArrowLeftRight",
  "generators": "Wand2",
  "validators": "CheckCircle2"
};
var PROCESSED_SEED_TOOLS = tools_seed_default.map((seed) => {
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
    iconName,
    execution: isAi ? "ai" : "local",
    status: "draft",
    lastModified: "2026-03-15",
    isAi,
    toolComponent: seed.toolComponent,
    tags: [seed.pillarKeyword, ...seed.supportingKeywords || [], seed.cluster],
    exampleInput: seed.exampleInput || `Sample input data for ${seed.title}`,
    explanation: `Draft entry for ${seed.title} (${seed.pillarKeyword}). This tool is not implemented and its route returns 404 until the component is built.`,
    howToUse: [
      `Enter or paste your raw text into the input editor.`,
      `Select your desired options or filters.`,
      `Click 'Process Data' or view instant transformation.`,
      `Copy results or export to file.`
    ],
    privacyNotice: isAi ? "AI-powered tool. Input is sent to XFree.in and processed by Google Gemini. Do not submit confidential data." : "This tool runs entirely in your browser. Input is not sent to XFree.in servers.",
    faqs: generate20Faqs(seed.title, seed.pillarKeyword, seed.supportingKeywords),
    relatedToolIds: ["bulk-url-sitemap", "json-formatter", "regex-tester"]
  };
});
var HAND_CRAFTED_TOOLS = [
  {
    id: "bulk-url-sitemap",
    slug: "bulk-url-extractor",
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
    exampleInput: `Check out our site at https://example.com/blog/seo-guide and https://example.com/about!
https://example.com/products/view?id=123 and duplicate link https://example.com/about.`,
    explanation: "Parses raw text, HTML, or logs to isolate HTTP/HTTPS URLs, deduplicate them, filter by domain, and export Google-compliant XML Sitemaps.",
    howToUse: [
      "Paste any raw text or HTML snippet into the input area.",
      "Select domain filter, query parameter removal, and deduplication options.",
      "View real-time extracted URL stats.",
      "Download generated XML Sitemap file."
    ],
    privacyNotice: "Local processing: Processing happens entirely inside browser memory.",
    faqs: generate20Faqs("Bulk URL Extractor & Sitemap Generator", "bulk url extractor sitemap generator"),
    relatedToolIds: ["robots-txt-generator", "meta-tag-generator", "schema-markup-generator"]
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
    privacyNotice: "Local processing: All processing occurs locally.",
    faqs: generate20Faqs("XML Sitemap Generator", "xml sitemap generator"),
    relatedToolIds: ["bulk-url-sitemap", "robots-txt-generator"]
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
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
    privacyNotice: "Local processing: your JSON payload stays in the browser and is not sent to XFree.in servers.",
    // Six page-specific FAQs. Each answer corresponds to something the tool
    // actually does or a limit that actually applies. Deliberately not the
    // templated generate20Faqs output, which was scaled-content shape.
    faqs: [
      {
        question: "Does this validate strict JSON or JSON5?",
        answer: "Strict JSON per RFC 8259. Trailing commas, unquoted keys, single-quoted strings, and comments are all rejected. If your source is JSON5 or JSONC, use a JSON5-aware parser instead \u2014 this tool will flag those as errors."
      },
      {
        question: "What's the largest payload I can paste in?",
        answer: "The tool is tested up to about 10 MB of formatted JSON. Above that, browsers slow down noticeably and Chrome tabs can be killed by the OS for memory pressure. For anything larger, use jq on the command line."
      },
      {
        question: "Will large numeric IDs lose precision?",
        answer: "Yes. JSON numbers are IEEE 754 doubles, so integers larger than 2^53 (9,007,199,254,740,992) silently round. If you're inspecting 64-bit database IDs or Twitter snowflake IDs, send them as strings from your API \u2014 the tool shows them exactly as received."
      },
      {
        question: "Does it handle XML too?",
        answer: "Yes. The XML mode uses the browser's DOMParser. It formats and validates well-formed XML, but does not resolve external DTDs or validate against a schema. Encoding is assumed to be UTF-8."
      },
      {
        question: "Does my input leave the browser?",
        answer: "No. The formatter, validator, and diff all run in your browser tab. The site itself uses Google AdSense which sets advertising cookies (see the Privacy page), but the JSON you paste is never sent to XFree.in or to any AI backend."
      },
      {
        question: 'Why does my JSON error say "Unexpected token in JSON at position N"?',
        answer: "N is the byte offset from the start of the input. The three most common causes are trailing commas, smart quotes copy-pasted from a document, and unescaped newlines inside string values. Look at the exact byte and the character just before it."
      }
    ],
    relatedToolIds: ["regex-tester", "base64-encoder-decoder"]
  },
  {
    id: "regex-tester",
    slug: "regex-tester",
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
    privacyNotice: "Local processing: Regex execution runs locally.",
    faqs: generate20Faqs("Regex Tester", "regex tester"),
    relatedToolIds: ["json-formatter", "cron-expression-generator"]
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
    privacyNotice: "Local processing: Cron calculations run locally.",
    faqs: generate20Faqs("Cron Expression Generator", "cron expression generator"),
    relatedToolIds: ["regex-tester", "url-slug-utm-builder"]
  },
  {
    id: "meta-tag-generator",
    slug: "meta-tag-generator",
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
    privacyNotice: "Local processing: All previews render locally.",
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
    privacyNotice: "Local processing: Robots.txt rules execute locally.",
    faqs: generate20Faqs("Robots.txt Generator", "robots txt generator"),
    relatedToolIds: ["bulk-url-sitemap", "meta-tag-generator"]
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
    privacyNotice: "Local processing: Schema JSON-LD is generated locally.",
    faqs: generate20Faqs("Schema Markup Generator", "schema markup generator"),
    relatedToolIds: ["meta-tag-generator", "bulk-url-sitemap"]
  },
  {
    id: "base64-encoder-decoder",
    slug: "base64-encoder-decoder",
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
    privacyNotice: "Local processing: Tokens and strings are decoded locally in browser memory.",
    faqs: generate20Faqs("Base64 & JWT Decoder", "base64 jwt decoder"),
    relatedToolIds: ["json-formatter", "url-slug-utm-builder"]
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
    privacyNotice: "Local processing: All string operations run locally.",
    faqs: generate20Faqs("URL Slug Generator", "url slug generator"),
    relatedToolIds: ["bulk-url-sitemap", "base64-encoder-decoder"]
  }
];
var toolMap = /* @__PURE__ */ new Map();
PROCESSED_SEED_TOOLS.forEach((tool) => {
  toolMap.set(tool.id, tool);
});
HAND_CRAFTED_TOOLS.forEach((tool) => {
  toolMap.set(tool.id, tool);
});
var TOOLS_REGISTRY = Array.from(toolMap.values());
var INDEXABLE_TOOLS = TOOLS_REGISTRY.filter(
  (t) => t.status === "indexable"
);
var INDEXABLE_TOOL_SLUGS = new Set(INDEXABLE_TOOLS.map((t) => t.slug));

// src/data/guides.ts
var GUIDES = [
  {
    slug: "regex-cheat-sheet",
    title: "Regex Cheat Sheet: The Patterns You Actually Use",
    description: "A short regex cheat sheet covering the character classes, quantifiers, anchors, groups, and flags you'll use 90% of the time \u2014 with worked examples.",
    intro: "Regex references online tend to list every arcane feature ever added to the standard. This one lists the parts you actually reach for in a real workday: extracting things, redacting things, splitting things, validating things. Every example is runnable in a JavaScript regex engine (which is what your browser and Node.js use).",
    sections: [
      {
        heading: "Character classes",
        paragraphs: ["Match a set of characters at one position."],
        code: {
          language: "regex",
          body: "\\d        one digit (0\u20139)\n\\D        one non-digit\n\\w        one word char [A-Za-z0-9_]\n\\W        one non-word char\n\\s        one whitespace char (space, tab, newline)\n\\S        one non-whitespace char\n.         any char except newline (or any char with /s flag)\n[abc]     literally a, b, or c\n[^abc]    anything except a, b, or c\n[a-z]     range a through z"
        }
      },
      {
        heading: "Quantifiers",
        paragraphs: ["Repeat the previous atom. Add ? after any quantifier to make it lazy (match as little as possible)."],
        code: {
          language: "regex",
          body: "*         zero or more\n+         one or more\n?         zero or one\n{3}       exactly 3\n{3,}      3 or more\n{3,7}     between 3 and 7\n*?  +?    lazy variants \u2014 match as little as possible"
        }
      },
      {
        heading: "Anchors and boundaries",
        code: {
          language: "regex",
          body: "^         start of string (or start of line with /m flag)\n$         end of string (or end of line with /m flag)\n\\b        word boundary \u2014 between \\w and \\W\n\\B        NOT a word boundary"
        }
      },
      {
        heading: "Groups and captures",
        code: {
          language: "regex",
          body: "(abc)             capturing group; refer to it as $1 in replacements\n(?:abc)           non-capturing group \u2014 use when you only need to group for a quantifier\n(?<name>abc)      named capture; refer to as $<name>\n(?=abc)           positive lookahead \u2014 'followed by abc'\n(?!abc)           negative lookahead \u2014 'not followed by abc'\n(?<=abc)          positive lookbehind \u2014 'preceded by abc'\n(?<!abc)          negative lookbehind"
        }
      },
      {
        heading: "Flags",
        code: {
          language: "regex",
          body: "g   global \u2014 return ALL matches, not just the first\ni   case-insensitive\nm   multiline \u2014 ^ and $ match line boundaries, not just string boundaries\ns   dotall \u2014 . matches newlines too\nu   unicode \u2014 full Unicode support, enables \\u{...} and \\p{...}"
        }
      },
      {
        heading: "Patterns you'll actually use",
        code: {
          language: "regex",
          body: `// Extract URLs
https?://[^\\s"'<>]+

// Loose email extraction (not RFC 5321 validation)
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}

// ISO date parts
(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})

// Card-shaped number redaction (not PCI validation)
\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?(\\d{4})
// replacement: **** **** **** $1

// UUID v4-ish
[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}

// Trim leading/trailing whitespace
^\\s+|\\s+$    // with /gm`
        }
      },
      {
        heading: "Things that will burn you",
        bullets: [
          "Catastrophic backtracking. Nested quantifiers like (a+)+ or (.*)* can freeze the engine on adversarial input. Rewrite with atomic groups where the engine supports them, or restructure to avoid the ambiguity.",
          "JavaScript regex differs from PCRE, Python re, and Go regexp. Lookbehind and named-group syntax vary. Test in the target runtime before shipping.",
          "Parsing HTML with regex. Just don't \u2014 use a real parser.",
          "The dot (.) does not match newlines unless you use the s flag.",
          "Anchors ^ and $ are string boundaries by default, not line boundaries. Add the m flag for line-oriented matching."
        ]
      }
    ],
    relatedGuideSlugs: ["common-json-formatting-errors"],
    relatedToolSlugs: ["regex-tester"],
    lastReviewed: "2026-08-03"
  },
  {
    slug: "cron-expression-examples",
    title: "Cron Expression Examples: 20 Real Schedules Explained",
    description: "Ready-to-use cron expressions for common jobs \u2014 nightly builds, hourly polling, weekday-only reports \u2014 with what each field means and where cron will bite you.",
    intro: "Cron syntax is compact and unforgiving. This is a list of expressions people actually deploy, with the intent stated plainly and the fields broken down. If your scheduler uses a variant (AWS EventBridge, Quartz, k8s CronJob), the differences are noted at the bottom.",
    sections: [
      {
        heading: "The five fields",
        paragraphs: [
          "Standard Unix cron is five space-separated fields: minute, hour, day of month, month, day of week. Values can be a number, a comma-separated list (1,3,5), a range (9-17), a step (*/15), or the wildcard *."
        ],
        code: {
          language: "text",
          body: "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 minute       (0\u201359)\n\u2502 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 hour         (0\u201323)\n\u2502 \u2502 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 day of month (1\u201331)\n\u2502 \u2502 \u2502 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500 month        (1\u201312)\n\u2502 \u2502 \u2502 \u2502 \u250C\u2500\u2500\u2500\u2500\u2500 day of week  (0\u20136, Sunday=0)\n\u2502 \u2502 \u2502 \u2502 \u2502\n* * * * *  command"
        }
      },
      {
        heading: "Every N units",
        code: {
          language: "text",
          body: "* * * * *           every minute\n*/5 * * * *         every 5 minutes\n*/15 * * * *        every 15 minutes\n*/30 * * * *        every 30 minutes\n0 * * * *           every hour on the hour\n0 */2 * * *         every 2 hours (0, 2, 4, \u2026)\n0 */6 * * *         every 6 hours"
        }
      },
      {
        heading: "Daily",
        code: {
          language: "text",
          body: "0 0 * * *           midnight every day\n30 2 * * *          02:30 every day \u2014 a safe maintenance window\n0 9 * * *           9am every day\n0 18 * * *          6pm every day"
        }
      },
      {
        heading: "Business hours / weekdays",
        code: {
          language: "text",
          body: "*/15 9-17 * * 1-5   every 15 min, 9am\u20135pm, Mon\u2013Fri\n0 9 * * 1-5         9am on weekdays\n0 17 * * 1-5        5pm on weekdays\n0 9 * * 1           9am every Monday\n0 9 * * 6,0         9am on Saturday and Sunday"
        }
      },
      {
        heading: "Monthly and yearly",
        code: {
          language: "text",
          body: "0 0 1 * *           midnight on the 1st of every month\n0 0 1 1 *           midnight on Jan 1 (yearly)\n0 0 15 * *          midnight on the 15th of every month\n0 0 1 */3 *         midnight on the 1st every 3 months (quarterly)"
        }
      },
      {
        heading: "Things cron gets wrong that you have to design around",
        bullets: [
          "Cron doesn't retry missed runs. If the server was down at the scheduled time, the run is simply skipped. Use anacron or a job runner with persistence if you need catch-up.",
          "DST is a landmine. The 2am\u20133am hour either doesn't exist (spring forward) or exists twice (fall back) in observing timezones. Schedule at 1am or 4am, or run cron in UTC.",
          "Day-of-month AND day-of-week filters use OR logic in most cron implementations, not AND. `0 0 15 * 1` means 'midnight on the 15th OR on any Monday,' not 'midnight on the 15th if it's a Monday.'",
          "Sub-minute scheduling isn't possible in standard cron. If you need second-level precision, use a proper scheduler.",
          "Wall-clock exactness isn't guaranteed. There's typically a few seconds of drift, and jobs can queue if the previous run hasn't finished."
        ]
      },
      {
        heading: "Variants",
        bullets: [
          "AWS EventBridge and CloudWatch Events use a 6-field format with seconds, and ? in the day-of-week or day-of-month slot to mean 'no specific value.'",
          "Quartz (Java) uses 6 or 7 fields (seconds, minute, hour, day, month, day-of-week, optional year).",
          "Kubernetes CronJob and standard Unix cron use the 5-field format described above.",
          "GitHub Actions uses 5-field POSIX cron in UTC. There is no way to specify a local timezone."
        ]
      }
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["cron-expression-generator"],
    lastReviewed: "2026-08-03"
  },
  {
    slug: "common-json-formatting-errors",
    title: "Common JSON Errors and How to Fix Them",
    description: "Every JSON parse error you're going to hit \u2014 trailing commas, wrong quote marks, unescaped strings, precision loss \u2014 with the exact fix.",
    intro: "JSON has a small spec but a big habit of failing in confusing ways because most parsers stop at the first byte that violates the grammar and give you a cryptic offset. This guide walks through the failures people actually run into, what the error message really means, and how to fix each one.",
    sections: [
      {
        heading: "Trailing commas",
        paragraphs: [
          "JSON does not allow a comma before a closing } or ]. This is the number-one JSON error because JavaScript object literals DO allow trailing commas, and copy-pasting between the two lands you in trouble."
        ],
        code: {
          language: "json",
          body: '// broken\n{"a": 1, "b": 2,}\n\n// fixed\n{"a": 1, "b": 2}'
        }
      },
      {
        heading: "Single quotes instead of double quotes",
        paragraphs: [
          "JSON keys and string values must be double-quoted. Single quotes are JavaScript syntax. If your source is a JavaScript object literal from browser dev tools, you'll need to rewrite the quotes."
        ],
        code: {
          language: "json",
          body: `// broken
{'name': 'Ada'}

// fixed
{"name": "Ada"}`
        }
      },
      {
        heading: "Unquoted keys",
        paragraphs: [
          "Same JavaScript-vs-JSON trap. Keys must always be double-quoted strings in JSON."
        ],
        code: {
          language: "json",
          body: '// broken\n{name: "Ada"}\n\n// fixed\n{"name": "Ada"}'
        }
      },
      {
        heading: "Unescaped characters in strings",
        paragraphs: [
          'Inside a JSON string, you must escape: double quote (\\"), backslash (\\\\), newline (\\n), carriage return (\\r), tab (\\t), and forward slash (\\/, optional but sometimes needed).'
        ],
        code: {
          language: "json",
          body: '// broken \u2014 literal newline in the string\n{"note": "line one\nline two"}\n\n// fixed\n{"note": "line one\\nline two"}'
        }
      },
      {
        heading: "Smart quotes",
        paragraphs: [
          `Text pasted from Google Docs, Word, or macOS Notes may contain typographic quotes (\u201C\u201D) instead of straight quotes ("). JSON parsers don't recognize them. Sanitize with a find-and-replace before parsing.`
        ]
      },
      {
        heading: "Number precision",
        paragraphs: [
          "JSON numbers are IEEE 754 doubles. Integers larger than 2^53 (9,007,199,254,740,992) silently lose precision. This bites you with 64-bit database IDs, Twitter snowflake IDs, and financial values in cents.",
          "The fix is to send large numbers as strings from the server and parse them into a big-int on the client if you need arithmetic."
        ],
        code: {
          language: "json",
          body: '// silent precision loss on the client\n{"tweetId": 1234567890123456789}\n\n// safe\n{"tweetId": "1234567890123456789"}'
        }
      },
      {
        heading: '"Unexpected token in JSON at position N"',
        paragraphs: [
          "The N is a byte offset from the start of the input. Look at that exact byte. Usually one of: trailing comma, smart quote, unescaped newline in a string, or a stray BOM at position 0 (which happens when a UTF-8 file was saved with a byte-order mark)."
        ]
      },
      {
        heading: "NDJSON vs JSON",
        paragraphs: [
          "Some APIs return newline-delimited JSON (one JSON value per line, no wrapping array). A standard JSON.parse call on the whole payload will fail. Split on newlines and parse each line separately, or use a streaming parser."
        ]
      },
      {
        heading: "JSON5, JSONC, and other supersets",
        paragraphs: [
          "JSON5 (Mozilla's spec) and JSONC (VS Code's) allow comments, trailing commas, and single-quoted strings. They are NOT vanilla JSON \u2014 a standard JSON parser will reject them. If a colleague swears their JSON is valid but yours won't parse it, check whether they're using a superset."
        ]
      }
    ],
    relatedGuideSlugs: ["regex-cheat-sheet"],
    relatedToolSlugs: ["json-formatter"],
    lastReviewed: "2026-08-03"
  },
  {
    slug: "canonical-tag-vs-301-redirect",
    title: "Canonical Tag vs 301 Redirect: When to Use Which",
    description: "Canonical tags and 301 redirects both handle duplicate URLs but do different jobs. This is the practical rule for picking the right one.",
    intro: "Both tools consolidate signals from multiple URLs to a single preferred URL. The difference: a 301 redirect physically moves the user (and Googlebot) to the new URL; a canonical tag lets both URLs stay reachable while telling search engines which one is the master. Picking the wrong one loses traffic or loses control of your site.",
    sections: [
      {
        heading: "The one-line rule",
        paragraphs: [
          "If both URLs should keep serving content (session-tracking params, filter variants, mobile vs desktop with the same content), use a canonical tag. If the old URL is dead or moved for good (site migration, URL rewrite, brand rename), use a 301 redirect."
        ]
      },
      {
        heading: "301 redirect",
        paragraphs: [
          "A 301 is an HTTP response that says 'this URL moved permanently; go to the Location header instead.' The user's browser follows it, the URL bar updates, and Googlebot treats the new URL as the canonical one for ranking purposes.",
          "Use when: you renamed a page, restructured a site, consolidated two pages into one, migrated to a new domain, switched to HTTPS, or standardized on www vs apex."
        ],
        code: {
          language: "http",
          body: "GET /old-post HTTP/1.1\n\nHTTP/1.1 301 Moved Permanently\nLocation: https://example.com/new-post"
        }
      },
      {
        heading: "Canonical tag",
        paragraphs: [
          "A canonical tag is an HTML link element (or HTTP header) that says 'the preferred version of this page is over here.' The browser still shows the current URL; only search engines act on the hint.",
          "Use when: you have session or tracking parameters (?utm_source=\u2026), filter/sort variants of a list, printable versions of a page, syndicated content republished elsewhere, or paginated content where each page needs to stay reachable but you want signals to consolidate."
        ],
        code: {
          language: "html",
          body: '<link rel="canonical" href="https://example.com/post" />'
        }
      },
      {
        heading: "What NOT to do",
        bullets: [
          "Don't 301-redirect a page that users actually reach for a reason (like tracking-parameter URLs \u2014 you'd break the tracking).",
          "Don't canonical two pages to each other. Only ever canonical to a page that self-canonicals (i.e. points at itself).",
          "Don't canonical to a URL that redirects. Google follows one hop then gives up; you'll waste crawl budget and lose the signal.",
          "Don't canonical across different content. If page A and page B have substantially different content, Google may ignore the canonical hint entirely.",
          "Don't rely on canonical to keep low-quality pages out of the index \u2014 use noindex for that. Canonical is a consolidation hint, not a removal directive."
        ]
      },
      {
        heading: "Fixing a canonical/301 mismatch",
        paragraphs: [
          "The most common issue: your site canonicals point to xfree.in but the server 301-redirects xfree.in to www.xfree.in. Every crawl becomes: hit canonical URL (xfree.in) \u2192 301 \u2192 fetch www.xfree.in \u2192 notice canonical says xfree.in \u2192 back to start. Fix by making canonicals point to the redirect target (www.xfree.in) from the source of truth."
        ]
      }
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: [],
    lastReviewed: "2026-08-03"
  }
];

// src/utils/generateSitemap.ts
var DEFAULT_BASE_URL = "https://www.xfree.in";
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function getIsoDate() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function getRssDate() {
  return (/* @__PURE__ */ new Date()).toUTCString();
}
function generateSitemapXml(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const currentDate = getIsoDate().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"
`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;
  xml += `  <url>
`;
  xml += `    <loc>${escapeXml(`${cleanBase}/`)}</loc>
`;
  xml += `    <lastmod>${currentDate}</lastmod>
`;
  xml += `    <changefreq>daily</changefreq>
`;
  xml += `    <priority>1.0</priority>
`;
  xml += `  </url>
`;
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
    { path: "/guides", priority: "0.7", freq: "weekly" }
  ];
  for (const page of staticPages) {
    xml += `  <url>
`;
    xml += `    <loc>${escapeXml(`${cleanBase}${page.path}`)}</loc>
`;
    xml += `    <lastmod>${currentDate}</lastmod>
`;
    xml += `    <changefreq>${page.freq}</changefreq>
`;
    xml += `    <priority>${page.priority}</priority>
`;
    xml += `  </url>
`;
  }
  for (const cat of CATEGORIES) {
    xml += `  <url>
`;
    xml += `    <loc>${escapeXml(`${cleanBase}/category/${cat.id}`)}</loc>
`;
    xml += `    <lastmod>${currentDate}</lastmod>
`;
    xml += `    <changefreq>daily</changefreq>
`;
    xml += `    <priority>0.9</priority>
`;
    xml += `  </url>
`;
  }
  const seenSlugs = /* @__PURE__ */ new Set();
  for (const tool of INDEXABLE_TOOLS) {
    if (!tool.slug || seenSlugs.has(tool.slug)) continue;
    seenSlugs.add(tool.slug);
    const priority = tool.isFlagship ? "0.9" : "0.8";
    const lastmod = tool.lastModified || currentDate;
    xml += `  <url>
`;
    xml += `    <loc>${escapeXml(`${cleanBase}/tools/${tool.slug}`)}</loc>
`;
    xml += `    <lastmod>${lastmod}</lastmod>
`;
    xml += `    <changefreq>weekly</changefreq>
`;
    xml += `    <priority>${priority}</priority>
`;
    xml += `  </url>
`;
  }
  for (const g of GUIDES) {
    xml += `  <url>
`;
    xml += `    <loc>${escapeXml(`${cleanBase}/guides/${g.slug}`)}</loc>
`;
    xml += `    <lastmod>${g.lastReviewed}</lastmod>
`;
    xml += `    <changefreq>monthly</changefreq>
`;
    xml += `    <priority>0.7</priority>
`;
    xml += `  </url>
`;
  }
  xml += `</urlset>`;
  return xml;
}
function generateRssXml(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const buildDate = getRssDate();
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
`;
  rss += `  <channel>
`;
  rss += `    <title>XFree.in \u2014 Free Online Developer, SEO, AI &amp; Converter Micro-Tools</title>
`;
  rss += `    <link>${escapeXml(cleanBase)}</link>
`;
  rss += `    <description>100% Free client-side developer, SEO, AI, and converter micro-tools. Instant browser execution, no signup.</description>
`;
  rss += `    <language>en-us</language>
`;
  rss += `    <lastBuildDate>${buildDate}</lastBuildDate>
`;
  rss += `    <pubDate>${buildDate}</pubDate>
`;
  rss += `    <ttl>60</ttl>
`;
  rss += `    <atom:link href="${escapeXml(`${cleanBase}/rss.xml`)}" rel="self" type="application/rss+xml"/>
`;
  for (const tool of INDEXABLE_TOOLS) {
    const toolUrl = `${cleanBase}/tools/${tool.slug}`;
    const pubDate = buildDate;
    const categoryName = tool.categoryLabel || tool.category;
    rss += `    <item>
`;
    rss += `      <title>${escapeXml(tool.title)}</title>
`;
    rss += `      <link>${escapeXml(toolUrl)}</link>
`;
    rss += `      <guid isPermaLink="true">${escapeXml(toolUrl)}</guid>
`;
    rss += `      <pubDate>${pubDate}</pubDate>
`;
    rss += `      <category>${escapeXml(categoryName)}</category>
`;
    rss += `      <description>${escapeXml(`${tool.shortDescription} Pillar Keyword: ${tool.pillarKeyword}. 100% Free browser utility with instant execution.`)}</description>
`;
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
    rss += `]]></content:encoded>
`;
    rss += `    </item>
`;
  }
  rss += `  </channel>
`;
  rss += `</rss>`;
  return rss;
}
function generateLlmsTxt(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = baseUrl.replace(/\/$/, "");
  let text = `# XFree.in \u2014 Free Online Developer, SEO, AI & Converter Micro-Tools Suite

`;
  text += `> XFree.in provides free online, browser-based developer tools, technical SEO utilities, single-purpose AI assistants, code formatters, and data converters with browser-based execution for local tools.

`;
  text += `## Primary Sections & Hubs

`;
  text += `- [Home Page](${cleanBase}/): Complete registry search and grid view of indexable micro-tools.
`;
  text += `- [100 Keyword Clusters Hub](${cleanBase}/clusters): Programmatic SEO directory mapping 100 search intent clusters and supporting keywords.
`;
  text += `- [Gemini Deep Thinking Mode](${cleanBase}/api/ai/thinking): Server-side high-reasoning Gemini 3.1 Pro endpoint for complex SQL, Regex, and SEO architectural analysis.

`;
  text += `## Categories

`;
  for (const cat of CATEGORIES) {
    text += `- [${cat.label}](${cleanBase}/category/${cat.id}): ${cat.description}
`;
  }
  text += `
## Core API Endpoints for Developers & AI Agents

`;
  text += `- \`POST /api/ai\`: Single-purpose AI proxy (ai-regex, ai-json-repair, ai-meta-optimizer, ai-sql-generator, ai-search-intent, ai-code-explainer, ai-commit-generator, ai-schema-generator).
`;
  text += `- \`POST /api/ai/batch\`: Batch processing endpoint for bulk CSV/TXT items.
`;
  text += `- \`POST /api/ai/thinking\`: Deep reasoning endpoint powered by Google Gemini reasoning model (configurable via GEMINI_THINKING_MODEL) with high thinking budget.
`;
  text += `- \`POST /api/ai/chat\`: Multi-turn conversational developer AI assistant.

`;
  text += `## Complete Index of Indexable Micro-Tools

`;
  for (const tool of INDEXABLE_TOOLS) {
    text += `- [${tool.title}](${cleanBase}/tools/${tool.slug}): ${tool.shortDescription} (Pillar: ${tool.pillarKeyword})
`;
  }
  return text;
}
function generateLlmsFullTxt(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = baseUrl.replace(/\/$/, "");
  let text = `# XFree.in Full System Specification & Indexable Micro-Tools Knowledge Base

`;
  text += `This document provides full technical details, Pillar Keywords, explanations, FAQs, and usage rules for indexable production micro-tools on XFree.in.

`;
  for (const tool of INDEXABLE_TOOLS) {
    text += `--- 

`;
    text += `### ${tool.title}
`;
    text += `- **URL**: ${cleanBase}/tools/${tool.slug}
`;
    text += `- **Category**: ${tool.categoryLabel || tool.category}
`;
    text += `- **Pillar Keyword**: ${tool.pillarKeyword}
`;
    text += `- **Description**: ${tool.shortDescription}
`;
    text += `- **Explanation**: ${tool.explanation}
`;
    if (tool.howToUse && tool.howToUse.length > 0) {
      text += `- **How to Use**:
`;
      for (const step of tool.howToUse) {
        text += `  1. ${step}
`;
      }
    }
    if (tool.faqs && tool.faqs.length > 0) {
      text += `- **Top FAQs**:
`;
      for (const faq of tool.faqs.slice(0, 3)) {
        text += `  - **Q: ${faq.question}**
    A: ${faq.answer}
`;
      }
    }
    text += `
`;
  }
  return text;
}
function generateRobotsTxt(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = baseUrl.replace(/\/$/, "");
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

# --- AI citation / live-fetch bots (allowed \u2014 they cite you back) ---
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

// src/data/routes.ts
var STATIC_ROUTES = [
  "/",
  "/how-it-works",
  "/use-cases",
  "/docs",
  "/blog",
  "/faq",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/security",
  "/clusters",
  "/thinking",
  "/xfree-app",
  "/guides"
];
var CATEGORY_SLUGS = [
  "seo-tools",
  "developer-tools",
  "ai-tools",
  "text-tools",
  "converters",
  "generators",
  "validators"
];

// src/server/app.ts
async function createApp(opts = {}) {
  const app = express();
  app.set("trust proxy", config2.TRUST_PROXY);
  app.disable("x-powered-by");
  app.use((req, _res, next) => {
    req.requestId = crypto2.randomUUID();
    next();
  });
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "xfree.in", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/ready", (_req, res) => {
    const ready = Boolean(config2.GEMINI_API_KEY) || !isProduction;
    res.status(ready ? 200 : 503).json({
      ready,
      geminiConfigured: Boolean(config2.GEMINI_API_KEY),
      deliveryProvider: config2.RESEND_API_KEY ? "resend" : "log"
    });
  });
  const baseUrl = config2.PUBLIC_SITE_URL;
  app.get(["/sitemap.xml", "/sitemap-tools.xml", "/app/sitemap.xml"], (_req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(generateSitemapXml(baseUrl));
  });
  app.get("/rss.xml", (_req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(generateRssXml(baseUrl));
  });
  app.get("/llms.txt", (_req, res) => {
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(generateLlmsTxt(baseUrl));
  });
  app.get("/llms-full.txt", (_req, res) => {
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(generateLlmsFullTxt(baseUrl));
  });
  app.get("/robots.txt", (_req, res) => {
    res.header("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(generateRobotsTxt(baseUrl));
  });
  const aiPerMinute = rateLimit({ scope: "ai", limit: config2.AI_RATE_LIMIT_PER_MINUTE, windowMs: 6e4 });
  const aiPerDay = rateLimit({ scope: "ai-day", limit: config2.AI_RATE_LIMIT_PER_DAY, windowMs: 864e5 });
  const thinkingPerDay = rateLimit({ scope: "ai-thinking-day", limit: config2.AI_THINKING_LIMIT_PER_DAY, windowMs: 864e5 });
  const contactRateLimit = rateLimit({ scope: "contact", limit: 5, windowMs: 36e5 });
  const feedbackRateLimit = rateLimit({ scope: "feedback", limit: 10, windowMs: 36e5 });
  const leadRateLimit = rateLimit({ scope: "lead", limit: 3, windowMs: 36e5 });
  const globalCap = globalDailyGuard(config2.AI_GLOBAL_DAILY_LIMIT);
  app.post("/api/ai", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiRequestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { taskId, input } = parsed.data;
      if (!isValidTaskId(taskId)) return res.status(400).json({ error: "unknown_task" });
      const task = AI_TASKS[taskId];
      const ai = getGeminiClient();
      const response = await generateWithTimeout(
        async () => ai.models.generateContent({
          model: config2.GEMINI_DEFAULT_MODEL,
          contents: task.promptTemplate(input),
          config: {
            systemInstruction: task.systemInstruction,
            temperature: task.temperature,
            maxOutputTokens: config2.GEMINI_MAX_OUTPUT_TOKENS,
            ...task.jsonOutput ? { responseMimeType: "application/json" } : {}
          }
        })
      );
      const text = response.text ?? "";
      let data = text;
      if (task.jsonOutput) {
        try {
          data = JSON.parse(text || "{}");
        } catch {
          data = { result: text };
        }
      }
      return res.json({ success: true, provider: "Google Gemini", model: config2.GEMINI_DEFAULT_MODEL, data });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/ai/batch", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiBatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { taskId, items } = parsed.data;
      const cap = Math.min(items.length, config2.AI_BATCH_MAX_ITEMS);
      const trimmed = items.slice(0, cap);
      const task = AI_TASKS[taskId];
      const ai = getGeminiClient();
      const results = [];
      for (let i = 0; i < trimmed.length; i++) {
        try {
          const response = await generateWithTimeout(
            async () => ai.models.generateContent({
              model: config2.GEMINI_BATCH_MODEL,
              contents: task.promptTemplate(trimmed[i]),
              config: {
                systemInstruction: task.systemInstruction,
                temperature: task.temperature,
                maxOutputTokens: Math.min(config2.GEMINI_MAX_OUTPUT_TOKENS, 1024),
                ...task.jsonOutput ? { responseMimeType: "application/json" } : {}
              }
            })
          );
          const text = response.text ?? "";
          let data = text;
          if (task.jsonOutput) {
            try {
              data = JSON.parse(text || "{}");
            } catch {
              data = { result: text };
            }
          }
          results.push({ id: i + 1, success: true, data });
        } catch {
          results.push({ id: i + 1, success: false, error: "item_failed" });
        }
      }
      return res.json({ success: true, total: results.length, results });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/ai/thinking", aiPerMinute, thinkingPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiThinkingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { prompt } = parsed.data;
      const ai = getGeminiClient();
      const response = await generateWithTimeout(
        async () => ai.models.generateContent({
          model: config2.GEMINI_THINKING_MODEL,
          contents: prompt,
          config: {
            systemInstruction: THINKING_SYSTEM_INSTRUCTION,
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            maxOutputTokens: config2.GEMINI_MAX_OUTPUT_TOKENS
          }
        })
      );
      return res.json({ success: true, model: config2.GEMINI_THINKING_MODEL, answer: response.text ?? "" });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/ai/chat", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiChatSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { messages } = parsed.data;
      const ai = getGeminiClient();
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));
      const latest = messages[messages.length - 1].content;
      const chat = ai.chats.create({
        model: config2.GEMINI_DEFAULT_MODEL,
        config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION, maxOutputTokens: config2.GEMINI_MAX_OUTPUT_TOKENS },
        history
      });
      const response = await generateWithTimeout(async () => chat.sendMessage({ message: latest }));
      return res.json({ success: true, model: config2.GEMINI_DEFAULT_MODEL, reply: response.text ?? "" });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/contact", contactRateLimit, async (req, res, next) => {
    try {
      const parsed = ContactSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      if (parsed.data.website) return res.status(200).json({ success: true });
      const result = await deliverMessage("contact", {
        subject: "New contact form submission",
        text: `From: ${parsed.data.email || "anonymous"}

${parsed.data.message}`,
        meta: { requestId: req.requestId, ip: req.ip }
      });
      if (!result.ok) return res.status(502).json({ error: "delivery_failed" });
      return res.status(200).json({ success: true, provider: result.provider });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/feedback", feedbackRateLimit, async (req, res, next) => {
    try {
      const parsed = FeedbackSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      if (parsed.data.website) return res.status(200).json({ success: true });
      const result = await deliverMessage("feedback", {
        subject: `[${parsed.data.category}] ${parsed.data.toolTitle || "site"}`,
        text: parsed.data.message,
        meta: {
          contact: parsed.data.contact || null,
          toolId: parsed.data.toolId || null,
          path: parsed.data.path || null,
          requestId: req.requestId
        }
      });
      if (!result.ok) return res.status(502).json({ error: "delivery_failed" });
      return res.status(200).json({ success: true, provider: result.provider });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/lead", leadRateLimit, async (req, res, next) => {
    try {
      const parsed = LeadSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      if (parsed.data.website) return res.status(200).json({ success: true });
      const result = await deliverMessage("lead", {
        subject: `New lead \u2014 ${parsed.data.email}`,
        text: `Email: ${parsed.data.email}
Task: ${parsed.data.taskDescription}
Recommended: ${parsed.data.recommendedToolTitle || "n/a"} (${parsed.data.recommendedToolSlug || "n/a"})
Source: ${parsed.data.source}
Path: ${parsed.data.path || "n/a"}`,
        meta: { requestId: req.requestId, ip: req.ip }
      });
      if (!result.ok) return res.status(502).json({ error: "delivery_failed" });
      return res.status(200).json({ success: true, provider: result.provider });
    } catch (err) {
      next(err);
    }
  });
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  const staticRouteSet = new Set(STATIC_ROUTES);
  const categoryRouteSet = new Set(CATEGORY_SLUGS.map((s) => `/category/${s}`));
  const guideSlugSet = new Set(GUIDES.map((g) => g.slug));
  app._classifyPath = function classifyPath(pathname) {
    if (staticRouteSet.has(pathname)) return "known";
    if (categoryRouteSet.has(pathname)) return "known";
    const toolMatch = pathname.match(/^\/tools\/([^/]+)\/?$/);
    if (toolMatch && INDEXABLE_TOOL_SLUGS.has(toolMatch[1])) return "known";
    const guideMatch = pathname.match(/^\/guides\/([^/]+)\/?$/);
    if (guideMatch && guideSlugSet.has(guideMatch[1])) return "known";
    return "unknown";
  };
  if (opts.attachStatic) await opts.attachStatic(app);
  if (opts.attachSpaFallback) await opts.attachSpaFallback(app);
  app.use((err, req, res, _next) => {
    const requestId = req.requestId;
    console.error(`[${requestId}]`, err?.message || err);
    if (res.headersSent) return;
    if (err instanceof GeminiNotConfiguredError) {
      return res.status(503).json({ error: "ai_not_configured", requestId });
    }
    res.status(500).json({ error: "internal_error", requestId });
  });
  return app;
}
function serveMinimalFallback() {
  return async function attach(app) {
    const notFound = (_req, res) => {
      res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>404 \u2014 XFree.in</title><meta name="robots" content="noindex"></head><body style="font-family:system-ui;padding:2rem;text-align:center"><h1>404</h1><p>This URL does not map to a published tool or page.</p><p><a href="/">Back to home</a></p></body></html>`
      );
    };
    app.get("*", notFound);
    app.head("*", notFound);
  };
}

// api/_handler.ts
var handlerPromise = null;
async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      try {
        const app = await createApp({ attachSpaFallback: serveMinimalFallback() });
        return app;
      } catch (err) {
        const detail = err?.stack || err?.message || String(err);
        console.error("[api] boot error:", detail);
        return { bootError: detail };
      }
    })();
  }
  return handlerPromise;
}
async function vercelHandler(req, res) {
  const h = await getHandler();
  if ("bootError" in h) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(`function boot failed:
${h.bootError.slice(0, 4e3)}`);
    return;
  }
  return h(req, res);
}
export {
  vercelHandler as default
};
