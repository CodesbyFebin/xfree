import { ToolDefinition, ToolCategory } from "../types";
import { TOOLS_REGISTRY, INDEXABLE_TOOLS } from "../data/toolsRegistry";

export interface IntentClassification {
  intent: string;
  entities: string[];
  constraints: IntentConstraints;
  capabilities: string[];
  preferredExecution: "local" | "ai" | "workflow" | "external";
  confidence: number;
  requiresVerification: boolean;
}

export interface IntentConstraints {
  privacy?: "local" | "private" | "cloud";
  budget?: "free" | "open-source" | "paid";
  urgency?: "instant" | "soon" | "flexible";
  expertise?: "beginner" | "intermediate" | "advanced";
  platform?: string[];
  region?: string;
  size?: "small" | "medium" | "large" | "unlimited";
}

export interface IntentRouteResult {
  toolIds: string[];
  confidence: number;
  reason: string;
  requiresUserPrompt?: boolean;
  fallback?: string[];
}

const INTENT_KEYWORDS: Record<string, string[]> = {
  "pdf-compression": ["compress pdf", "reduce pdf size", "pdf optimization", "smaller pdf", "compress pdf file"],
  "pdf-merge": ["merge pdf", "combine pdf", "pdf join", "pdf concatenation"],
  "pdf-split": ["split pdf", "extract pages from pdf", "divide pdf"],
  "image-compression": ["compress image", "reduce image size", "image optimization", "jpeg quality", "png compression"],
  "image-background-remove": ["remove background", "background remover", "extract subject", "cutout"],
  "csv-clean": ["clean csv", "remove duplicates csv", "csv validation", "csv format", "csv normalize"],
  "csv-transform": ["transform csv", "csv merge", "csv columns", "csv reformat"],
  "json-format": ["format json", "minify json", "json beautify", "validate json", "json repair"],
  "xml-format": ["format xml", "xml tidy", "validate xml"],
  "url-shorten": ["shorten url", "url shrink", "bitly", "tinyurl"],
  "url-utm-builder": ["utm builder", "campaign url", "trackable link", "utm parameters"],
  "sitemap-generate": ["sitemap", "xml sitemap", "sitemap generator", "google sitemap"],
  "seo-meta": ["meta tag", "open graph", "social card", "seo title", "meta description"],
  "schema-markup": ["schema markup", "json-ld", "structured data", "rich snippet"],
  "robots-txt": ["robots.txt", "crawler rules", "index rules"],
  "cron-schedule": ["cron", "schedule", "job scheduler", "timing expression"],
  "base64-encode": ["base64 encode", "base64 decode", "jwt decode", "token decode"],
  "regex-test": ["regex tester", "regular expression", "pattern match"],
  "text-diff": ["diff text", "compare files", "text comparison"],
  "uuid-generate": ["uuid", "generate id", "unique identifier"],
  "hash-generate": ["hash generator", "sha256", "md5", "checksum"],
  "validator-json": ["json validator", "validate json"],
  "validator-xml": ["xml validator", "validate xml"],
  "validator-sitemap": ["sitemap validator", "validate sitemap"],
  "code-format": ["format code", "beautify code", "code formatter"],
  "api-test": ["test api", "rest client", "http request"],
  "file-convert": ["convert file", "file transformation", "file format change"],
  "data-extract": ["extract data", "scrape", "parse"],
  "web-scraper": ["web scrape", "scraper", "harvest data"],
  "email-find": ["find email", "email extractor", "email finder"],
  "phone-find": ["find phone", "phone number extractor", "phone finder"],
  "address-parse": ["parse address", "address validation", "geocode"],
  "qr-generate": ["qr code", "qr generator", "barcode"],
  "password-generator": ["generate password", "password creator"],
  "calculator": ["calculator", "math", "compute", "calculate"],
  "color-converter": ["color code", "hex rgb", "color converter"],
  "timestamp-convert": ["timestamp", "unix time", "date time convert"],
  "word-count": ["word count", "char count", "text statistics"],
  "slugify": ["slug generator", "url slug", "clean url"],
};

const CATEGORY_PATTERNS: Record<ToolCategory, string[]> = {
  "seo-tools": ["seo", "sitemap", "meta tag", "schema", "robots.txt", "url", "crawl", "google", "bing"],
  "developer-tools": ["json", "xml", "yaml", "regex", "cron", "base64", "jwt", "developer", "api", "format", "validate"],
  "ai-tools": ["ai", "chat", "gpt", "claude", "gemini", "llm", "assistant", "generate", "explain", "rewrite"],
  "text-tools": ["text", "string", "diff", "compare", "transform", "replace", "edit", "word count"],
  "converters": ["convert", "encode", "decode", "transform", "compress", "decompress", "format"],
  "generators": ["generate", "create", "build", "make", "uuid", "hash", "random", "nonce"],
  "validators": ["validate", "check", "verify", "test", "is valid", "syntax check"],
};

const PRIVACY_KEYWORDS = ["local", "private", "browser", "offline", "client-side", "no send"];
const FREE_KEYWORDS = ["free", "without cost", "gratis", "open source"];
const URGENCY_IMMEDIATE = ["instant", "right now", "now", "immediately", "fast", "quick"];

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/[^\w\s-]/g, " ");
}

function extractEntities(query: string): string[] {
  const entities: string[] = [];
  const lowerQuery = query.toLowerCase();

  const entityPatterns = [
    { pattern: /\bsitemap\b/i, entity: "sitemap" },
    { pattern: /\bjson\b/i, entity: "json" },
    { pattern: /\bxml\b/i, entity: "xml" },
    { pattern: /\bcsv\b/i, entity: "csv" },
    { pattern: /\bpdf\b/i, entity: "pdf" },
    { pattern: /\bimage\b|\bpng\b|\bjpeg\b|\bjpg\b/i, entity: "image" },
    { pattern: /\bqr code\b/i, entity: "qr-code" },
    { pattern: /\bbase64\b/i, entity: "base64" },
    { pattern: /\bjwt\b/i, entity: "jwt" },
    { pattern: /\bcron\b/i, entity: "cron" },
    { pattern: /\bregex\b/i, entity: "regex" },
    { pattern: /\butm\b/i, entity: "utm" },
    { pattern: /\bmeta tag\b/i, entity: "meta-tag" },
    { pattern: /\bschema\b/i, entity: "schema" },
    { pattern: /\brobots\.txt\b/i, entity: "robots-txt" },
    { pattern: /\bpassword\b/i, entity: "password" },
    { pattern: /\bqr\b/i, entity: "qr-code" },
    { pattern: /\burl\b/i, entity: "url" },
  ];

  for (const { pattern, entity } of entityPatterns) {
    if (pattern.test(query)) {
      entities.push(entity);
    }
  }

  return Array.from(new Set(entities));
}

function extractConstraints(query: string): IntentConstraints {
  const constraints: IntentConstraints = {};
  const lowerQuery = query.toLowerCase();

  if (PRIVACY_KEYWORDS.some(k => lowerQuery.includes(k))) {
    constraints.privacy = "local";
  }

  if (FREE_KEYWORDS.some(k => lowerQuery.includes(k))) {
    constraints.budget = "free";
  }

  if (URGENCY_IMMEDIATE.some(k => lowerQuery.includes(k))) {
    constraints.urgency = "instant";
  }

  const platformMatch = lowerQuery.match(/\b(on|for|platform|browser):?\s*(\w+)/i);
  if (platformMatch) {
    constraints.platform = [platformMatch[2].toLowerCase()];
  }

  return constraints;
}

const PROBLEM_TO_TOOL_MAP: Record<string, string[]> = {
  "compress pdf": ["pdf-compression-tool", "bulk-url-extractor-sitemap"],
  "remove background": ["remove-background-tool", "image-compression-tool"],
  "convert file to pdf": ["file-converter-tool", "pdf-merge-tool"],
  "clean csv": ["csv-cleaner-tool", "json-formatter"],
  "generate sitemap": ["bulk-url-sitemap", "xml-sitemap-generator"],
  "format json": ["json-formatter", "json-repair-tool"],
  "validate sitemap": ["sitemap-validator-tool", "xml-sitemap-generator"],
  "remove image background": ["background-remover-tool", "image-compressor-tool"],
  "compress image": ["image-compressor-tool", "bulk-url-sitemap"],
  "extract urls": ["bulk-url-sitemap", "url-extractor-tool"],
  "generate meta tags": ["meta-tag-generator", "schema-markup-generator"],
  "generate schema markup": ["schema-markup-generator", "meta-tag-generator"],
  "edit code": ["code-editor-tool", "regex-tester"],
  "test regex": ["regex-tester", "regex-debugger-tool"],
  "generate uuid": ["uuid-generator-tool", "random-id-tool"],
  "calculate": ["calculator-tool", "math-tool"],
};

export function classifyIntent(query: string): IntentClassification {
  const normalized = normalizeQuery(query);
  const entities = extractEntities(query);
  const constraints = extractConstraints(query);

  let matchedIntent = "general";
  let confidence = 0.3;
  let capabilities: string[] = [];

  for (const [intentPattern, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matches = keywords.some(k => k.includes(normalized) || normalized.includes(k.split(" ").slice(0, 2).join(" ")));
    if (matches) {
      matchedIntent = intentPattern;
      confidence = 0.85;
      break;
    }
  }

  for (const [problem, tools] of Object.entries(PROBLEM_TO_TOOL_MAP)) {
    if (problem.split(" ").every(w => normalized.includes(w) || problem.split(" ").some(pw => normalized.includes(pw)))) {
      matchedIntent = problem;
      confidence = 0.9;
      capabilities = tools;
      break;
    }
  }

  if (matchedIntent === "general" && entities.length > 0) {
    matchedIntent = entities[0];
    confidence = 0.4;
  }

  return {
    intent: matchedIntent,
    entities,
    constraints,
    capabilities,
    preferredExecution: determineExecutionMode(query, constraints),
    confidence,
    requiresVerification: confidence < 0.7,
  };
}

function determineExecutionMode(query: string, constraints: IntentConstraints): "local" | "ai" | "workflow" | "external" {
  const lowerQuery = query.toLowerCase();

  if (constraints.privacy === "local" || PRIVACY_KEYWORDS.some(k => lowerQuery.includes(k))) {
    return "local";
  }

  if (FREE_KEYWORDS.some(k => lowerQuery.includes(k))) {
    return "local";
  }

  if (lowerQuery.includes("workflow") || lowerQuery.includes("automat")) {
    return "workflow";
  }

  if (lowerQuery.includes("compare") || lowerQuery.includes("versus") || lowerQuery.includes("vs")) {
    return "workflow";
  }

  const hasAiIndicators = ["ai", "gpt", "claude", "gemini", "llm", "generated", "write", "create"].some(k => lowerQuery.includes(k));
  if (hasAiIndicators) {
    return "ai";
  }

  return "local";
}

export function routeIntentToCapabilities(intent: IntentClassification): IntentRouteResult {
  const results: IntentRouteResult = {
    toolIds: [],
    confidence: 0,
    reason: "",
  };

  const matchingTools: ToolDefinition[] = [];

  if (intent.capabilities && intent.capabilities.length > 0) {
    for (const toolId of intent.capabilities) {
      const tool = TOOLS_REGISTRY.find(t => t.id === toolId || t.slug === toolId);
      if (tool) {
        matchingTools.push(tool);
      }
    }
  }

  const queryLower = intent.intent.toLowerCase();
  const categorizedTools = INDEXABLE_TOOLS.filter(tool => {
    for (const keyword of INTENT_KEYWORDS[intent.intent as keyof typeof INTENT_KEYWORDS] || []) {
      if (keyword.split(" ").some(w => queryLower.includes(w))) {
        return true;
      }
    }
    return tool.tags.some(tag => queryLower.includes(tag.toLowerCase()));
  });

  if (categorizedTools.length > 0) {
    matchingTools.push(...categorizedTools);
  }

  const allMatched = [...matchingTools, ...categorizedTools.filter(t => !matchingTools.map(m => m.id).includes(t.id))];
  const deduplicated = Array.from(new Map(allMatched.map(t => [t.id, t])).values());

  if (deduplicated.length === 0) {
    return {
      toolIds: [],
      confidence: 0.1,
      reason: "No matching tools found",
    };
  }

  const primaryTool = deduplicated[0];
  const secondaryTools = deduplicated.slice(1, 4);

  results.toolIds = [primaryTool.id, ...secondaryTools.map(t => t.id)];
  results.confidence = Math.min(0.95, primaryTool.isFlagship ? 0.9 : 0.75);
  results.reason = `Matched ${primaryTool.title} as primary solution based on intent classification.`;

  if (intent.requiresVerification && secondaryTools.length > 0) {
    results.fallback = secondaryTools.map(t => t.id);
  }

  return results;
}

export function buildExecutionPlan(intent: IntentClassification): ExecutionPlan {
  const route = routeIntentToCapabilities(intent);

  return {
    steps: route.toolIds.map((toolId, index) => ({
      step: index + 1,
      action: "execute",
      toolId,
      expectedOutput: `Result from ${toolId}`,
      verify: index === route.toolIds.length - 1,
    })),
    primaryToolId: route.toolIds[0],
    fallbackToolIds: route.fallback || [],
    constraints: intent.constraints,
    confidence: route.confidence,
  };
}

export interface ExecutionStep {
  step: number;
  action: "execute" | "ai" | "wait" | "verify" | "prompt";
  toolId: string;
  expectedOutput?: string;
  verify?: boolean;
  prompt?: string;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  primaryToolId: string;
  fallbackToolIds?: string[];
  constraints: IntentConstraints;
  confidence: number;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  verification?: VerificationResult;
  executionTimeMs: number;
  toolExecuted?: string;
}

export interface VerificationResult {
  valid: boolean;
  issues: string[];
  checksPerformed: string[];
  confidence: number;
}

export function extractProblemFromQuery(query: string): string {
  const problemPatterns = [
    /^\s*(i need to|find me|i want to|help me with|solve)\s+/i,
    /compress|convert|clean|generate|format|validate|remove|merge|split|extract|optimize/i,
    /\b(pdfs?|images?|csv|json|xml|text|urls?)\b.*?\b(compr?ess|convert|clean|generat?e|format|validat?e)|/i,
  ];

  for (const pattern of problemPatterns) {
    const match = query.match(pattern);
    if (match && match[0]) {
      return match[0].replace(/^(i need to|find me|i want to|help me with|solve)\s+/i, "").trim();
    }
  }

  return query.trim();
}

export function detectIntent(query: string): {
  baseIntent: string;
  action: string;
  target: string;
  modifiers: string[];
} {
  const normalized = normalizeQuery(query);

  const actions = ["compress", "convert", "clean", "generate", "format", "validate", "remove", "merge", "split", "extract", "optimize", "compare", "find"];
  const targets = ["pdf", "json", "xml", "csv", "image", "url", "sitemap", "meta", "schema", "background", "password", "qr", "uuid", "cron", "regex"];

  let baseIntent = "general";
  let action = "use";
  let target = "";
  const modifiers: string[] = [];

  for (const act of actions) {
    if (normalized.includes(act)) {
      action = act;
      break;
    }
  }

  for (const tgt of targets) {
    if (normalized.includes(tgt)) {
      target = tgt;
      break;
    }
  }

  if (target && action !== "use") {
    baseIntent = `${action}-${target}`;
  } else if (target) {
    baseIntent = target;
  }

  if (normalized.includes("free") || normalized.includes("no cost")) {
    modifiers.push("free");
  }
  if (normalized.includes("secure") || normalized.includes("private")) {
    modifiers.push("secure");
  }
  if (normalized.includes("bulk") || normalized.includes("multiple")) {
    modifiers.push("bulk");
  }

  return { baseIntent, action, target, modifiers };
}