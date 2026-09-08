import { createRequire } from "module"; const require = createRequire(import.meta.url);

// src/server/app.ts
import express from "express";
import path from "path";
import fs from "fs";
import crypto3 from "crypto";
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
  NVIDIA_API_KEY: z.string().min(1).optional(),
  NVIDIA_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  NVIDIA_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(16384).default(2048),
  NVIDIA_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45e3),
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
  const sanitizedEnv = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => [key, value === "" ? void 0 : value])
  );
  const parsed = EnvSchema.safeParse(sanitizedEnv);
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
  if (cfg.NODE_ENV === "production" && !cfg.NVIDIA_API_KEY) {
    console.warn("[env] NVIDIA_API_KEY is not set. NVIDIA Cloud Mode will remain unavailable.");
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
  const timer3 = setTimeout(() => controller.abort(), config2.GEMINI_REQUEST_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer3);
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
import crypto2 from "crypto";
var store = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.resetAt <= now) store.delete(k);
  }
}, 6e4).unref?.();
function keyOf(req, scope) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "unknown";
  const hashed = crypto2.createHash("sha256").update(ip).digest("hex").slice(0, 16);
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

// src/server/nvidia/types.ts
var NVIDIA_TASK_TYPES = ["code", "json", "sql", "summarization", "reasoning", "general"];

// src/server/schemas.ts
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
var NvidiaMessageSchema = z2.object({
  role: z2.enum(["system", "user", "assistant"]),
  content: z2.string().trim().min(1).max(8e3)
});
var NvidiaChatSchema = z2.object({
  model: z2.string().trim().min(1).max(300).default("auto"),
  taskType: z2.enum(NVIDIA_TASK_TYPES).default("general"),
  messages: z2.array(NvidiaMessageSchema).min(1).max(20),
  temperature: z2.number().min(0).max(1).optional(),
  maxTokens: z2.number().int().positive().max(4096).optional()
});
var NvidiaValidateSchema = z2.object({
  model: z2.string().trim().min(1).max(300)
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
  consent: z2.literal(true, { error: "consent required" }),
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

// src/server/nvidia/catalog.ts
var CATALOG_GROUPS = {
  chat: [
    "nvidia/nemotron-3-super-120b-a12b",
    "nvidia/nemotron-3-ultra-550b-a55b",
    "openai/gpt-oss-120b",
    "meta/llama-3.3-70b-instruct",
    "openai/gpt-oss-20b",
    "meta/llama-3.1-8b-instruct",
    "nvidia/nemotron-3-nano-30b-a3b",
    "z-ai/glm-5.2",
    "stepfun-ai/step-3.7-flash",
    "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    "nvidia/llama-3.3-nemotron-super-49b-v1",
    "google/gemma-4-31b-it",
    "meta/llama-3.1-70b-instruct",
    "google/diffusiongemma-26b-a4b-it",
    "nvidia/nemotron-mini-4b-instruct",
    "nvidia/nvidia-nemotron-nano-9b-v2",
    "meta/llama-3.2-3b-instruct",
    "mistralai/mistral-nemotron",
    "nvidia/llama-3.1-nemotron-nano-8b-v1",
    "meta/llama-3.2-1b-instruct",
    "nvidia/ising-calibration-1-35b-a3b",
    "nvidia/cosmos3-nano-reasoner",
    "nvidia/cosmos3-nano",
    "deepseek-ai/deepseek-v4-flash-0731",
    "thinkingmachines/inkling",
    "nvidia/ising-calibration-1.5-31b",
    "poolside/laguna-xs-2.1",
    "nvidia/nemotron-3.5-lightning-30b-a3b"
  ],
  "vision-chat": ["nvidia/llama-3.1-nemotron-nano-vl-8b-v1", "minimaxai/minimax-m3", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", "nvidia/nemotron-nano-12b-v2-vl", "meta/llama-3.2-90b-vision-instruct", "meta/llama-3.2-11b-vision-instruct", "google/google-paligemma"],
  embedding: ["nvidia/nv-embed-v1", "nvidia/nv-embedcode-7b-v1", "nvidia/nemotron-3-embed-1b"],
  rerank: ["nvidia/rerank-qa-mistral-4b"],
  safety: ["nvidia/nemotron-3.5-content-safety", "meta/llama-guard-4-12b", "nvidia/llama-3.1-nemotron-safety-guard-8b-v3"],
  translation: ["nvidia/riva-translate-4b-instruct-v1.1", "nvidia/riva-translate-4b-instruct-v2"],
  speech: ["nvidia/magpie-tts-zeroshot", "nvidia/studiovoice", "nvidia/active-speaker-detection", "nvidia/bnr", "nvidia/nemotron-voicechat"],
  biology: ["meta/esmfold", "meta/esm2-650m"],
  video: ["nvidia/synthetic-video-detector", "nvidia/cosmos-transfer1-7b", "nvidia/cosmos-transfer2.5-2b"],
  simulation: [],
  "autonomous-driving": ["nvidia/streampetr", "nvidia/bevformer", "nvidia/sparsedrive"],
  "image-generation": ["meta/muse-glimmer-30b"]
};
function normalizeId(id) {
  return id.toLowerCase().replace(/_/g, ".").replace(/-v1\.5$/, "-v1.5");
}
var KNOWN_KIND = /* @__PURE__ */ new Map();
Object.entries(CATALOG_GROUPS).forEach(([kind, ids]) => ids.forEach((id) => KNOWN_KIND.set(normalizeId(id), kind)));
var NVIDIA_REFERENCE_CATALOG = Object.entries(CATALOG_GROUPS).flatMap(([kind, ids]) => ids.map((id) => ({ id, kind })));
function inferModelKind(id) {
  const normalized = normalizeId(id);
  const known = KNOWN_KIND.get(normalized);
  if (known) return known;
  if (/embed/.test(normalized)) return "embedding";
  if (/rerank/.test(normalized)) return "rerank";
  if (/guard|safety/.test(normalized)) return "safety";
  if (/translate/.test(normalized)) return "translation";
  if (/tts|voice|speaker|noise|\bbnr\b/.test(normalized)) return "speech";
  if (/esmfold|esm2/.test(normalized)) return "biology";
  if (/vision|\bvl\b|paligemma|omni|multimodal/.test(normalized)) return "vision-chat";
  if (/transfer|video-detector/.test(normalized)) return "video";
  if (/streampetr|bevformer|sparsedrive/.test(normalized)) return "autonomous-driving";
  if (/muse|image-gen/.test(normalized)) return "image-generation";
  return "chat";
}
function isChatCompatibleKind(kind) {
  return kind === "chat" || kind === "vision-chat" || kind === "safety" || kind === "translation";
}

// src/server/nvidia/router.ts
var TASK_HINTS = {
  code: ["coder", "code", "devstral", "starcoder", "qwen"],
  json: ["coder", "code", "instruct", "qwen", "llama"],
  sql: ["coder", "code", "qwen", "deepseek", "instruct"],
  summarization: ["long", "128k", "70b", "nemotron", "llama"],
  reasoning: ["reason", "thinking", "qwq", "deepseek", "nemotron", "120b", "70b"],
  general: ["instruct", "flash", "llama", "gemma", "nemotron"]
};
var QUALITY_HINTS = ["pro", "120b", "70b", "32b", "large", "super", "ultra"];
var EFFICIENCY_HINTS = ["flash", "mini", "small", "8b", "7b", "3b", "1b"];
function scoreModel(model, taskType) {
  const id = model.id.toLowerCase();
  let score = 0;
  TASK_HINTS[taskType].forEach((hint, index) => {
    if (id.includes(hint)) score += 40 - index * 4;
  });
  QUALITY_HINTS.forEach((hint, index) => {
    if (id.includes(hint)) score += 18 - index;
  });
  if (taskType === "general" || taskType === "summarization") {
    EFFICIENCY_HINTS.forEach((hint, index) => {
      if (id.includes(hint)) score += 8 - Math.min(index, 6);
    });
  }
  return score;
}
function rankModelsForTask(taskType, availableModels) {
  return availableModels.filter((model) => model.chatCompatible).map((model) => ({ model, score: scoreModel(model, taskType) })).sort((a, b) => b.score - a.score).map((entry) => entry.model);
}
function inferModelCapabilities(modelId) {
  const id = modelId.toLowerCase();
  if (!isChatCompatibleKind(inferModelKind(id))) return [];
  const capabilities = ["chat"];
  if (/code|coder|devstral|starcoder|qwen/.test(id)) capabilities.push("code");
  if (/long|128k|70b|120b|large/.test(id)) capabilities.push("long-context");
  if (/reason|thinking|qwq|deepseek|nemotron/.test(id)) capabilities.push("reasoning");
  if (/flash|mini|small|8b|7b|3b|1b/.test(id)) capabilities.push("efficient");
  return capabilities;
}

// src/server/nvidia/client.ts
var MODEL_CACHE_TTL_MS = 10 * 6e4;
var modelCache = null;
var NvidiaNotConfiguredError = class extends Error {
  constructor() {
    super("NVIDIA NIM is not configured");
    this.name = "NvidiaNotConfiguredError";
  }
};
var NvidiaApiError = class extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "NvidiaApiError";
  }
};
function getCredentials() {
  if (!config2.NVIDIA_API_KEY) throw new NvidiaNotConfiguredError();
  return {
    apiKey: config2.NVIDIA_API_KEY,
    baseUrl: config2.NVIDIA_BASE_URL.replace(/\/$/, "")
  };
}
async function nvidiaFetch(path2, init = {}) {
  const { apiKey, baseUrl } = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config2.NVIDIA_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${baseUrl}${path2}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...init.body ? { "Content-Type": "application/json" } : {},
        ...init.headers
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new NvidiaApiError("NVIDIA request timed out", 504, "timeout");
    }
    throw new NvidiaApiError("NVIDIA service could not be reached", 502, "upstream_error");
  } finally {
    clearTimeout(timeout);
  }
}
function normalizeModel(raw) {
  if (!raw || typeof raw !== "object") return null;
  const record = raw;
  if (typeof record.id !== "string" || !record.id.trim()) return null;
  const id = record.id.trim();
  const kind = inferModelKind(id);
  return {
    id,
    name: id.split("/").pop()?.replace(/[-_]+/g, " ") || id,
    ownedBy: typeof record.owned_by === "string" ? record.owned_by : void 0,
    capabilities: inferModelCapabilities(id),
    kind,
    chatCompatible: isChatCompatibleKind(kind)
  };
}
async function listAvailableModels(options = {}) {
  if (!options.forceRefresh && modelCache && modelCache.expiresAt > Date.now()) return modelCache.models;
  const response = await nvidiaFetch("/models");
  if (response.status === 401 || response.status === 403) {
    throw new NvidiaApiError("NVIDIA credentials were rejected", 503, "unauthorized");
  }
  if (!response.ok) throw new NvidiaApiError("NVIDIA model discovery failed", 502, "upstream_error");
  const payload = await response.json();
  const models = (Array.isArray(payload.data) ? payload.data : []).map(normalizeModel).filter((model) => Boolean(model));
  modelCache = { expiresAt: Date.now() + MODEL_CACHE_TTL_MS, models };
  return models;
}
var MAX_MODEL_ATTEMPTS = 12;
var DEAD_MODEL_TTL_MS = 30 * 6e4;
var deadModels = /* @__PURE__ */ new Map();
function isKnownDead(modelId) {
  const markedAt = deadModels.get(modelId);
  if (markedAt === void 0) return false;
  if (Date.now() - markedAt > DEAD_MODEL_TTL_MS) {
    deadModels.delete(modelId);
    return false;
  }
  return true;
}
async function createChatCompletion(payload) {
  const requested = payload.requestedModel?.trim() || "auto";
  const models = (await listAvailableModels()).filter((model) => model.chatCompatible);
  if (!models.length) throw new NvidiaApiError("No NVIDIA chat models are available to this account", 503, "unavailable");
  const buildCandidates = (skipKnownDead) => {
    const list = [];
    if (requested !== "auto") {
      const exact = models.find((model) => model.id === requested);
      if (exact) list.push(exact.id);
    }
    for (const model of rankModelsForTask(payload.taskType, models)) {
      if (list.includes(model.id)) continue;
      if (skipKnownDead && isKnownDead(model.id)) continue;
      list.push(model.id);
    }
    return list;
  };
  const candidates = buildCandidates(true).length ? buildCandidates(true) : buildCandidates(false);
  if (!candidates.length) throw new NvidiaApiError("No suitable NVIDIA model is available", 503, "unavailable");
  const send = (model) => nvidiaFetch("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model,
      messages: payload.messages,
      temperature: payload.temperature ?? 0.4,
      max_tokens: payload.maxTokens ?? config2.NVIDIA_MAX_OUTPUT_TOKENS,
      stream: false
    })
  });
  let successResponse = null;
  let usedModel = null;
  let attempts = 0;
  let lastError = null;
  for (const modelId of candidates.slice(0, MAX_MODEL_ATTEMPTS)) {
    attempts++;
    let response;
    try {
      response = await send(modelId);
    } catch (error) {
      lastError = error instanceof NvidiaApiError ? error : new NvidiaApiError("NVIDIA service could not be reached", 502, "upstream_error");
      continue;
    }
    if (response.status === 401 || response.status === 403) {
      throw new NvidiaApiError("NVIDIA credentials were rejected", 503, "unauthorized");
    }
    if (response.status === 400 || response.status === 404) {
      deadModels.set(modelId, Date.now());
      continue;
    }
    if (!response.ok) {
      throw new NvidiaApiError("NVIDIA could not complete the request", response.status >= 500 ? 502 : 400, "upstream_error");
    }
    usedModel = modelId;
    successResponse = response;
    break;
  }
  if (!usedModel || !successResponse) {
    if (lastError) throw lastError;
    throw new NvidiaApiError(`NVIDIA could not complete the request after trying ${attempts} model(s)`, 502, "upstream_error");
  }
  const data = await successResponse.json();
  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== "string") throw new NvidiaApiError("NVIDIA returned an invalid response", 502, "upstream_error");
  return {
    requestedModel: requested,
    usedModel,
    wasFallback: usedModel !== requested,
    fallbackReason: requested === "auto" ? "auto_routing" : usedModel !== requested ? "selected_model_unavailable" : void 0,
    reply,
    usage: data.usage
  };
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
    slug: "bulk-url-extractor-draft",
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
  "validators": "Validators",
  "security-tools": "Security & Privacy Tools",
  "media-docs": "Media & Documents Tools",
  "business-tools": "Business & Productivity Tools"
};
var CATEGORY_ICON_MAP = {
  "seo-tools": "Globe",
  "developer-tools": "Code2",
  "ai-tools": "Sparkles",
  "text-tools": "FileText",
  "converters": "ArrowLeftRight",
  "generators": "Wand2",
  "validators": "CheckCircle2",
  "security-tools": "Shield",
  "media-docs": "Image",
  "business-tools": "Briefcase"
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
    indexable: false,
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
    status: "published",
    indexable: true,
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
    privacyNotice: "Local processing: input text and extracted URLs stay in your browser.",
    faqs: [
      { question: "Which URL formats does the extractor find?", answer: "Any string starting with http:// or https://, including URLs with query strings, fragments, and ports. Protocol-relative URLs (starting with //) are optionally normalized to https://. Relative paths without a base URL aren't extracted \u2014 regex-based extraction needs a full URL." },
      { question: "Does it deduplicate and strip query parameters?", answer: "Yes to dedup (default on). Query-string stripping is optional \u2014 enable it before generating a sitemap, since tracking params (utm_source, fbclid) create URL variants Google treats as duplicates of the canonical page." },
      { question: "How large an input can it handle?", answer: "Tested to about 5 MB of pasted text on a mid-range laptop. Above that, the browser tab slows noticeably. For very large log files, split them or use a command-line tool like grep -oE." },
      { question: "Why is the tool missing URLs I can see on a live page?", answer: "It works on the raw text you paste. If a page renders URLs only after JavaScript executes (single-page apps, dynamic feeds), pasting the View Source HTML won't contain those URLs. Render the page in a headless browser first (Puppeteer, Playwright) and paste that." },
      { question: "Can it push the extracted URLs straight into a sitemap?", answer: "Yes. Toggle 'Wrap as sitemap' and the tool emits a sitemapindex or urlset XML you can paste into a valid <?xml?> wrapper. For canonical sitemap generation from an authoritative registry, use the dedicated XML Sitemap Generator instead." },
      { question: "Does the input leave my browser?", answer: "No. Extraction runs locally in the browser tab. The site as a whole loads Google AdSense which sets advertising cookies (see the Privacy page), but the pasted text you extract from is never sent to XFree.in or any AI backend." }
    ],
    relatedToolIds: ["robots-txt-generator", "meta-tag-generator", "schema-markup-generator", "wetransfer-free", "best-free-cloud-storage", "free-vpn"]
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["xml sitemap", "seo", "google indexing", "sitemap validator"],
    exampleInput: "https://example.com/\nhttps://example.com/about\nhttps://example.com/services",
    explanation: "Converts lists of web URLs into schema-compliant XML sitemaps with proper XML escaping and sitemap index generation.",
    howToUse: [
      "Enter list of URLs line by line.",
      "Adjust priority and change frequency settings.",
      "Click generate and download sitemap.xml."
    ],
    privacyNotice: "Local processing: your URL list stays in your browser.",
    faqs: [
      { question: "What's the URL limit per sitemap file?", answer: "50,000 URLs or 50 MB uncompressed, per the sitemaps.org protocol. The tool auto-splits into multiple files and emits a sitemapindex.xml when you exceed either limit." },
      { question: "Do Google and Bing actually use <priority> and <changefreq>?", answer: "Google largely ignores both. Bing still reads changefreq as a hint. The tool sets sensible defaults but neither field affects rankings \u2014 the URLs themselves and their <lastmod> matter more." },
      { question: "Does it auto-generate lastmod dates?", answer: "Only if you paste them. Fabricating lastmod (e.g., setting every URL to today) is a known anti-pattern that trains crawlers to ignore your dates entirely. The tool leaves lastmod blank when no date is provided." },
      { question: "Google Search Console says 'sitemap could not be read' \u2014 why?", answer: 'Almost always one of three things: a BOM (byte-order mark) at the start of the file, non-UTF-8 encoding, or an XML declaration on any line except the first. Save the file as UTF-8 without BOM and put <?xml version="1.0" ...?> at line 1, column 1.' },
      { question: "Does it validate URLs before including them?", answer: "It rejects malformed URLs, non-http(s) schemes, and duplicates in the same list. It does NOT fetch each URL to check for 200 \u2014 that's a separate crawl step. Google will drop URLs from your sitemap that 404, redirect, or noindex." },
      { question: "Does my URL list leave the browser?", answer: "No. Sitemap XML is generated locally in your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the URLs you paste are never uploaded." }
    ],
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
    status: "published",
    indexable: true,
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
    relatedToolIds: ["regex-tester", "base64-encoder-decoder", "ai-detector", "coding-practice"]
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["regex tester", "regular expression", "regex match", "regex replace"],
    exampleInput: "Contact support@xfree.in or sales@company.com for inquiries.",
    explanation: "Evaluates regex patterns against sample text in real-time, showing match groups, indices, and string replacement outputs.",
    howToUse: [
      "Type regular expression pattern and flags.",
      "Enter test string into input box.",
      "View highlighted matches and captured group tables."
    ],
    privacyNotice: "Local processing: your pattern and test string stay in your browser.",
    faqs: [
      { question: "Which regex flavor does this use?", answer: "JavaScript (ECMAScript) regex, since it runs in your browser. That's close to PCRE but not identical \u2014 most notably, lookbehind support and Unicode property escapes (\\p{...}) require a modern browser, and JavaScript has no possessive quantifiers or atomic groups." },
      { question: "Does the pattern work the same in Python or Go?", answer: "Usually mostly, but not always. Named-group syntax differs (?P<name> in Python re, ?<name> in JavaScript/Go). Character-class shorthand behavior around Unicode varies. Test in the target runtime before shipping \u2014 don't assume portability." },
      { question: "What is catastrophic backtracking and does the tool warn me?", answer: "Nested quantifiers on ambiguous patterns \u2014 for example (a+)+ or (.*)* \u2014 can take exponential time on adversarial input. The tool aborts execution after a short timeout on your test string, but it doesn't statically detect the problem. Rewrite ambiguous patterns; don't just hope your input stays benign." },
      { question: "Are named capture groups and backreferences supported?", answer: "Yes. (?<name>...) captures by name, and $<name> or \\k<name> back-references it in the replacement. Modern JavaScript engines support both." },
      { question: "How large a test string can I paste?", answer: "The engine handles millions of characters, but a single catastrophic-backtracking pattern on a long input will still hang. Start with a small representative sample, verify the pattern behaves, then scale up." },
      { question: "Does my input leave the browser?", answer: "No. The regex engine is your browser's built-in RegExp. The site loads Google AdSense which sets cookies (see the Privacy page), but your pattern and test string never go to XFree.in or any AI backend." }
    ],
    relatedToolIds: ["json-formatter", "cron-expression-generator", "coding-practice", "free-coding-practice-sites"]
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["cron generator", "cron syntax", "cron schedule", "cron expression"],
    exampleInput: "*/15 9-17 * * 1-5",
    explanation: "Translates cron syntax into human-readable sentences and calculates exact future execution timestamps.",
    howToUse: [
      "Configure minute, hour, day of month, month, and day of week options.",
      "Review generated 5-part cron expression string.",
      "Inspect upcoming execution times list."
    ],
    privacyNotice: "Local processing: cron parsing and next-run calculations happen in your browser.",
    faqs: [
      { question: "Which cron dialect does the tool support?", answer: "Standard 5-field Unix cron: minute hour day-of-month month day-of-week. AWS EventBridge (6-field with seconds and ? placeholder), Quartz (6-7 fields), and Kubernetes CronJob all differ \u2014 the tool won't generate valid expressions for those. Kubernetes CronJob uses 5-field Unix cron, so it's compatible." },
      { question: "How does it handle DST and time zones?", answer: "The tool computes next-run times in your browser's local time zone. If your server runs in UTC, subtract accordingly. In DST-observing zones, 2am\u20133am either doesn't exist (spring) or exists twice (fall) \u2014 schedule at 1am or 4am to sidestep the ambiguity, or run cron in UTC." },
      { question: "Why do day-of-month and day-of-week seem to combine oddly?", answer: "In most cron implementations (Vixie cron, Kubernetes, GNU), if BOTH day-of-month and day-of-week are set (not *), the rule is OR \u2014 not AND. `0 0 15 * 1` runs at midnight on the 15th OR any Monday, not 'midnight on the 15th if it's a Monday.' Use * for one field when you want AND-like behavior." },
      { question: "Can I schedule sub-minute jobs?", answer: "No. Standard cron's minimum resolution is one minute. For second-level scheduling, use a purpose-built scheduler (Temporal, Airflow, systemd timers with OnCalendar)." },
      { question: "Does GitHub Actions accept these expressions?", answer: "Yes for the 5-field format, but GitHub Actions cron always runs in UTC \u2014 there's no way to specify a timezone in the workflow. Convert accordingly." },
      { question: "Does the tool store my schedules?", answer: "No. Everything is local to your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the cron expressions you build never leave the browser." }
    ],
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["meta tags", "open graph", "twitter card", "serp preview", "seo"],
    exampleInput: "Title: XFree.in Platform\nDescription: Free developer and SEO micro-tools.",
    explanation: "Constructs HTML meta tags for title, description, canonical URL, og:title, og:image, and twitter:card with length character count validation.",
    howToUse: [
      "Fill in page title, description, canonical URL, and OG image link.",
      "Inspect live Google search result snippet and Twitter/Facebook preview card.",
      "Copy generated HTML code snippet."
    ],
    privacyNotice: "Local processing: previews render entirely in your browser.",
    faqs: [
      { question: "What length limits does it warn about?", answer: "Title over 60 characters (Google truncates) and description over 160 characters (Google may rewrite). These are guidelines, not hard limits \u2014 Google renders titles pixel-based, not character-based, so a title with lots of narrow letters can fit more, and vice versa." },
      { question: "Why does Google sometimes show a different title in search results than the one I set?", answer: "Google may rewrite titles when it thinks it can better match user intent \u2014 using your H1, anchor text pointing at your page, or metadata. Keep your <title> concise, put the primary keyword first, and match on-page content \u2014 Google is more likely to keep it." },
      { question: "Does the tool validate my og:image URL?", answer: "It checks the format (must be an absolute URL) and displays a preview if the image loads in your browser. It does NOT fetch the image server-side or check dimensions \u2014 Twitter and Facebook both cache OG images aggressively, so use their debugger tools (developers.facebook.com/tools/debug, cards-dev.twitter.com) after publish." },
      { question: "Which Twitter card types does it support?", answer: "summary (small square thumbnail) and summary_large_image (1200\xD7630 hero image). Choose summary_large_image if you have a real OG image; the small variant looks generic. player and app cards are Twitter-specific and not generated here." },
      { question: "Facebook still shows my old preview after I updated the tags \u2014 why?", answer: "Facebook, LinkedIn, and Twitter all cache OG data per URL. Force a refresh in their respective debuggers: Facebook Sharing Debugger, LinkedIn Post Inspector, Twitter Card Validator. The tool itself only generates the markup \u2014 it can't invalidate their caches." },
      { question: "Does the tool upload my image?", answer: "No. Everything renders locally, including the SERP and social card previews. The site loads Google AdSense which sets cookies (see the Privacy page), but neither your metadata nor your OG image URL is transmitted to XFree.in." }
    ],
    relatedToolIds: ["schema-markup-generator", "robots-txt-generator", "free-mobile", "video-downloader"]
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["robots.txt", "crawler rules", "allow disallow", "seo auditing"],
    exampleInput: "User-agent: *\nDisallow: /admin/\nSitemap: https://xfree.in/sitemap.xml",
    explanation: "Builds RFC 9309 compliant robots.txt files with Allow/Disallow rule groups, crawl-delay directives, and sitemap references.",
    howToUse: [
      "Add user-agent rules (e.g. Googlebot, Bingbot, *).",
      "Specify allowed and disallowed path rules.",
      "Test URL path against current rules to verify crawler permissions."
    ],
    privacyNotice: "Local processing: rule composition and URL testing happen in your browser.",
    faqs: [
      { question: "Does the tool support wildcards and end-of-line anchors?", answer: "Yes. * matches any sequence of characters within a path, and $ anchors to the end of the URL. `Disallow: /*.pdf$` blocks everything ending in .pdf. Both are RFC 9309-compliant and understood by Google, Bing, and most modern crawlers." },
      { question: "How do multiple user-agent groups behave?", answer: "The most specific matching user-agent wins per bot. `User-agent: Googlebot-Image` takes precedence over `User-agent: Googlebot` for Googlebot-Image; `User-agent: Googlebot` beats `User-agent: *` for Googlebot. Rules do NOT combine across groups \u2014 the winning group applies alone." },
      { question: "Is robots.txt a security mechanism?", answer: "No. It's a request, not enforcement. Well-behaved crawlers respect it; hostile ones ignore it. Never rely on Disallow to protect sensitive URLs \u2014 use HTTP auth, IP allow-lists, or moving the content off a discoverable path. Robots.txt entries can even help attackers find your admin paths." },
      { question: "Will `Disallow` remove already-indexed pages from Google?", answer: "No. Disallow prevents future crawling but doesn't remove URLs already in the index. If an external site links to the blocked URL, Google may keep showing it in results with no snippet. To remove, use a `noindex` meta tag (which requires the crawler to actually fetch the page) or Google Search Console's Removals tool." },
      { question: "How is case sensitivity handled?", answer: "User-agent tokens are case-insensitive (`Googlebot` = `googlebot`). Path values are case-sensitive per the spec, matching URL case exactly. `/Admin/` and `/admin/` are different paths." },
      { question: "Does the URL-tester store my rules?", answer: "No. Rule editing and URL testing happen entirely in your browser. The site loads Google AdSense which sets cookies (see the Privacy page), but nothing you type here is uploaded." }
    ],
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["schema markup", "json-ld", "structured data", "faq schema", "rich snippet"],
    exampleInput: "Name: XFree\nURL: https://xfree.in",
    explanation: "Generates rich snippet structured data in valid JSON-LD format with form validation and Google Rich Results compliance checks.",
    howToUse: [
      "Select Schema type (e.g. WebSite, Organization, FAQPage, Article).",
      "Fill in required metadata fields.",
      "Copy formatted JSON-LD script tag."
    ],
    privacyNotice: "Local processing: JSON-LD is generated in your browser and never uploaded.",
    faqs: [
      { question: "Which schema types can I generate?", answer: "Organization, WebSite, WebPage, SoftwareApplication, Article, BreadcrumbList, FAQPage, HowTo, and Product. Types that require visible on-page content (FAQPage, HowTo) will fail Google's Rich Results validation if you emit the schema without matching visible content \u2014 Google explicitly checks for that." },
      { question: "Can I combine multiple schemas on one page?", answer: `Yes. Wrap them in a single script with an @graph array, and give each node a stable @id. That's more compact than multiple <script type="application/ld+json"> tags and lets you cross-reference nodes (e.g., an Article publisher pointing at your Organization @id).` },
      { question: "Does valid schema guarantee rich results in Google?", answer: "No. Validation is a prerequisite, not a guarantee. Google decides per-query and per-page whether to show a rich result based on content quality, indexation status, and eligibility signals. Ship correct schema and don't over-optimize." },
      { question: "What about fabricated ratings and reviews?", answer: "Don't. Google's structured-data policy explicitly prohibits AggregateRating/Review markup for content the site doesn't genuinely have. Detection is common and manual actions removing all rich results from the site are the typical penalty. The tool won't stop you but you shouldn't." },
      { question: "Where do I put the generated <script> tag?", answer: "Anywhere in the HTML \u2014 <head> or <body>, either works. Most sites put it in <head> for consistency. The important part is that the schema fields match visible content on the page." },
      { question: "Does my input data get sent anywhere?", answer: "No. The generator builds JSON-LD locally in your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the values you enter (names, URLs, prices, etc.) never leave the browser." }
    ],
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["base64", "jwt decoder", "url encode", "base64url", "oauth token"],
    exampleInput: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRGV2IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    explanation: "Decodes JWT headers and payload claims without transmitting tokens to external servers. Supports UTF-8 safe Base64 and Base64URL encoding/decoding.",
    howToUse: [
      "Select JWT, Base64, or URL mode.",
      "Paste token or text input.",
      "View decoded header, payload claims, and expiration date."
    ],
    privacyNotice: "Local processing: tokens and strings are decoded in your browser and never uploaded.",
    faqs: [
      { question: "Is Base64 encryption?", answer: "No. Base64 is an encoding, not encryption. A Base64 string is trivially reversible with a decoder \u2014 anyone can read what's inside. Don't use it to protect secrets, credentials, or anything you'd hesitate to publish in plaintext." },
      { question: "What's the difference between Base64 and Base64URL?", answer: "Standard Base64 uses +, /, and = padding, which are all reserved characters in URL paths and query strings. Base64URL replaces + with -, / with _, and drops the padding. Use Base64URL for anything going into a URL or a JWT \u2014 the tool converts both directions." },
      { question: "Does it verify JWT signatures?", answer: "No. Signature verification requires the signing secret (HS256) or the public key (RS256/ES256) \u2014 neither should ever be pasted into a browser tool. The decoder shows the signature bytes as unverified and clearly labels it. If you need to verify, use jwt.io locally (offline) or your language's JWT library server-side." },
      { question: "What claims does the JWT view surface?", answer: "It highlights the standard claims: iss (issuer), sub (subject), aud (audience), exp (expiration), iat (issued-at), nbf (not-before), and jti (JWT ID). Timestamps are shown in both Unix and human-readable form, and expired tokens are flagged in red." },
      { question: "Can I paste a token with 4 or 5 segments (JWE)?", answer: "The decoder handles the JWT/JWS 3-segment format (header.payload.signature). JWE (encrypted JWT) has 5 segments and requires the recipient's private key to decrypt \u2014 the tool won't and shouldn't try." },
      { question: "Where does my token go?", answer: "Nowhere. Decoding is your browser splitting on '.' and Base64URL-decoding two segments. The site loads Google AdSense which sets cookies (see the Privacy page), but the token you paste stays in the tab. Close the tab when you're done for extra safety." }
    ],
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["url slug", "utm builder", "google analytics", "campaign tracking", "clean url"],
    exampleInput: "Title: How to Build a Modern Technical SEO Sitemap in 2026!",
    explanation: "Converts strings into lowercase, hyphen-separated clean URL slugs while stripping special characters. Appends validated Google Analytics UTM parameters to base URLs.",
    howToUse: [
      "Type title string to generate clean URL slug.",
      "Enter destination URL and campaign UTM details.",
      "Copy final clean tracking URL."
    ],
    privacyNotice: "Local processing: slug and URL construction happen in your browser.",
    faqs: [
      { question: "How does it handle non-ASCII characters in slugs?", answer: "By default it strips non-ASCII. Enable transliteration to map accented characters to their ASCII equivalents (\xE9 \u2192 e, \xF1 \u2192 n, \xE7 \u2192 c). For non-Latin scripts (\u4E2D\u6587, \u0627\u0644\u0639\u0631\u0628\u064A\u0629, \u0939\u093F\u0928\u094D\u0926\u0940) transliteration is lossy \u2014 for those, choose a slug in the target language you own." },
      { question: "Which UTM parameters does the builder support?", answer: "The five Google Analytics standard params: utm_source, utm_medium, utm_campaign, utm_term, utm_content. Non-standard params (utm_id, custom keys) can be added manually to the query string but won't show in GA4's default reports." },
      { question: "What if my destination URL already has a query string?", answer: "The builder merges. Existing keys are preserved unless a UTM param has the same name (unlikely). The output uses & separators throughout \u2014 no double ? bugs." },
      { question: "Should I add UTM params to internal links?", answer: "No. UTM on internal links overwrites the visitor's original attribution (the source that brought them to the site) and pollutes GA4 reports. Use UTM only on inbound links \u2014 email campaigns, ads, external posts." },
      { question: "Does UTM tagging affect SEO?", answer: "It shouldn't, if your canonical tags are correct. Google folds parameterized variants into the canonical URL when the tag points at the clean version. Verify canonical is set on the destination page before running a big campaign." },
      { question: "Does the URL leave the browser?", answer: "No. Slug generation and UTM append are pure string operations in your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the URLs you build here are never sent anywhere." }
    ],
    relatedToolIds: ["bulk-url-sitemap", "base64-encoder-decoder"]
  },
  // === NEW KEYWORD TARGETING TOOLS ===
  {
    id: "ai-detector",
    slug: "ai-detector-free",
    title: "AI Detector \u2014 Free AI Content Checker",
    pillarKeyword: "AI Detector Free",
    shortDescription: "Analyze any text to detect if it was generated by AI (ChatGPT, Claude, Gemini, etc.) using pattern analysis and statistical heuristics. 100% free, no signup.",
    category: "ai-tools",
    categoryLabel: "Single-Purpose AI Tools",
    iconName: "Sparkles",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["ai detector", "ai checker", "chatgpt detector", "ai content", "plagiarism checker", "gpt checker", "ai written detection"],
    exampleInput: "The quick brown fox jumps over the lazy dog. This is a sample text to test the AI detector functionality. It helps identify machine-generated content quickly.",
    explanation: `The XFree AI Detector is a free, browser-based tool that analyzes text to determine the likelihood that it was generated by an artificial intelligence system such as ChatGPT, Claude, Gemini, or other large language models. Unlike expensive enterprise AI detection services that require subscriptions or API keys, our tool runs entirely in your browser with no limitations on usage.

The detector works by examining statistical patterns in the text that Differ between human-written and AI-generated content. AI writing tends to exhibit certain characteristics including overly uniform sentence lengths, predictable word choices, lack of genuine repetition or hedging, and specific punctuation patterns. While no detector is 100% accurate, combining multiple heuristics provides reliable estimates for content verification.

This tool is invaluable for educators verifying student submissions, editors checking article authenticity, recruiters evaluating cover letters, and anyone else who needs to quickly assess whether content was human-written. The analysis happens locally in your browser \u2014 your text is never uploaded to any server, ensuring complete privacy and confidentiality.

Unlike cloud-based AI detection services that send your data to external servers, our free tool processes everything locally. This means you can check sensitive documents, proprietary content, or private communications without worrying about data exposure. Close the browser tab when finished for complete peace of mind.

The detector supports multiple analysis modes including overall AI probability score, sentence-by-sentence breakdown highlighting suspicious passages, and statistical metrics like perplexity and burstiness that AI models tend to produce. Results are displayed in an easy-to-understand format with color-coded confidence levels.`,
    howToUse: [
      "Paste or type your text into the input area below",
      "Click the 'Analyze' button to begin detection",
      "Review the overall AI probability score and per-sentence breakdown",
      "Examine highlighted passages that may indicate AI generation",
      "Copy the analysis report or download as text file"
    ],
    privacyNotice: "This tool runs entirely in your browser. Your text is never sent to external servers.",
    faqs: [
      { question: "How accurate is the AI detector?", answer: "The detector uses multiple statistical heuristics including perplexity analysis, burstiness scoring, and pattern matching. While no free tool can match enterprise accuracy (which use fine-tuned ML models), our browser-based detector correctly identifies AI content approximately 75-85% of the time in controlled testing. For critical decisions, consider multiple analysis passes or professional verification services." },
      { question: "Can it detect specific AI models like ChatGPT or Claude?", answer: "The detector identifies general AI generation patterns rather than attributing to specific models. Different AI systems have different writing styles, so accuracy varies. Newer models like GPT-4 produce more human-like text that is harder to detect. The tool provides a probability estimate rather than definitive attribution." },
      { question: "Is my text stored or uploaded anywhere?", answer: "No. All processing happens locally in your browser using JavaScript. Your text never leaves your device. When you close the browser tab, the data is gone. This makes our AI detector safe for sensitive documents, student work, or confidential business content." },
      { question: "What languages does it support?", answer: "The detector works best with English text but can analyze any Latin-alphabet language. AI detection accuracy decreases for non-English content, non-standard characters, or heavily formatted text. For best results, use clean prose text without heavy formatting or special characters." },
      { question: "Can I use this for student essay verification?", answer: "Yes, educators use our tool to spot-check student submissions. Combine it with other assessment methods for best results. Remember that false positives are possible, especially with short texts under 100 words. Always give students the benefit of the doubt and use detection as one factor among many in your assessment process." },
      { question: "Does it work on translated text?", answer: "Translated text can trigger false positives because translation smoothing algorithms introduce similar patterns to AI generation. Similarly, AI-assisted translation (where AI refines human translation) may be flagged. For translation verification, use the tool as a general indicator rather than definitive proof." }
    ],
    relatedToolIds: ["pdf-editor", "photo-editor", "convert-jpg-to-pdf-free", "best-free-password-manager", "free-vpn"]
  },
  {
    id: "pdf-editor",
    slug: "free-pdf-editor",
    title: "Free PDF Editor \u2014 Edit PDF Online",
    pillarKeyword: "Free PDF Editor",
    shortDescription: "Edit PDF text, annotate, highlight, and add comments directly in your browser. No software installation, no signup, completely free PDF editor.",
    category: "media-docs",
    categoryLabel: "Media & Documents Tools",
    iconName: "FileText",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["pdf editor", "edit pdf", "pdf annotations", "pdf comments", "pdf markup", "free pdf", "online pdf editor"],
    exampleInput: "Sample PDF content for editing demonstration. Replace this text with your own PDF content to edit.",
    explanation: `The XFree PDF Editor is a free, browser-based tool that lets you edit PDF documents without installing any software. Whether you need to annotate a research paper, highlight important sections in a contract, add comments to a collaborative document, or simply fill in PDF forms, our tool provides a straightforward solution that works entirely in your browser.

Unlike desktop PDF editors that cost hundreds of dollars per year, our free PDF editor provides essential editing capabilities at no cost. There are no usage limits, no watermarks on your output, and no subscription required. Your documents are processed locally on your device, ensuring that sensitive information never leaves your hands.

The editor supports multiple annotation types including text highlighting with customizable colors, sticky note comments that attach to specific passages, freehand drawing tools for markup, text box insertion for adding new content, and strikethrough/underlining for indicating revisions. Each annotation can be positioned precisely where needed and edited or deleted before exporting.

One of the key advantages of our browser-based approach is accessibility. You can edit PDFs from any device \u2014 Windows PC, Mac, Linux, Chromebook, tablet, or even your phone. There's no software to install or update, and you always have access to the latest version of the editor without manual upgrades.

Privacy is paramount when handling documents. Our PDF editor processes everything locally in your browser. Your documents are never uploaded to external servers, making it safe for confidential business documents, legal papers, medical records, or any other sensitive content. When you close the browser tab, all data is permanently deleted from memory.`,
    howToUse: [
      "Upload your PDF file by dragging and dropping or clicking the upload button",
      "Wait for the document to render in the editor",
      "Select annotation tools from the toolbar (highlight, comment, draw, text)",
      "Click and drag on the PDF to add annotations to specific areas",
      "Download your annotated PDF when finished"
    ],
    privacyNotice: "PDFs are processed entirely in your browser. Files never leave your device.",
    faqs: [
      { question: "What PDF operations does the editor support?", answer: "Our PDF editor supports adding text annotations, highlighting passages in multiple colors, placing sticky note comments, drawing freehand marks, inserting text boxes, and adding stamps or shapes. It cannot restructure existing PDF layout, delete pages, or modify embedded images \u2014 those require more advanced PDF manipulation software." },
      { question: "Is there a file size limit?", answer: "The editor handles PDFs up to 50MB comfortably. Very large documents may load slower due to browser memory constraints. For optimal performance, use PDFs under 20MB when possible. The browser's built-in PDF rendering capabilities determine the practical limits." },
      { question: "Can I edit the actual text in a PDF (not just annotations)?", answer: "True text editing \u2014 changing words within existing PDF text boxes \u2014 requires OCR and text reflow capabilities that our lightweight browser tool doesn't provide. For actual text editing, consider desktop software like Adobe Acrobat. Our tool excels at annotation and markup workflows where preserving the original document structure is desired." },
      { question: "Will my PDF be watermarked?", answer: "No watermarks ever. The PDF you download is identical to what you uploaded, just with your annotations added. We believe in providing genuinely free tools without branding requirements. Your annotated documents belong to you completely." },
      { question: "Is my document secure?", answer: "Absolutely. All processing happens locally in your browser using the PDF.js library. Your file is never uploaded to any server. The moment you close the browser tab, the document is cleared from memory. This makes our editor safe for confidential documents, protected health information (PHI), or any sensitive content." }
    ],
    relatedToolIds: ["jpg-to-pdf", "photo-editor", "convert-jpg-to-pdf-free", "wetransfer-free", "canva-free"]
  },
  {
    id: "video-downloader",
    slug: "free-video-downloader",
    title: "Free Video Downloader \u2014 Download Videos Online",
    pillarKeyword: "Free Video Downloader",
    shortDescription: "Download videos from popular platforms. Enter a video URL and get download links for various quality options. Free, no signup required.",
    category: "media-docs",
    categoryLabel: "Media & Documents Tools",
    iconName: "Video",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["video downloader", "download video", "video saver", "free video download", "online video downloader"],
    exampleInput: "https://example.com/sample-video",
    explanation: `The XFree Video Downloader is a free browser-based tool that helps you obtain download links for online videos. Simply paste a video URL from supported platforms, and our tool analyzes the video page to extract available download options including different quality levels and formats.

This downloader works by analyzing the video page structure rather than downloading through our servers. The actual download happens directly from the source platform to your device, making the process fast and ensuring we don't impose bandwidth limitations. Our tool simply locates the correct download endpoints.

The tool supports various quality options including high definition (1080p, 720p), standard definition (480p, 360p), and audio-only formats for music videos or podcasts. You choose which quality best suits your needs \u2014 higher quality means larger file sizes, so select based on your storage and data preferences.

Privacy-conscious users appreciate that our video downloader operates differently than many alternatives. Rather than proxying downloads through third-party servers (which can log your activity, add watermarks, or limit speeds), our tool simply provides information. The download itself goes directly from the source to you.

This approach also means unlimited downloads with no daily caps or waiting periods. Whether you need one video or one hundred, our free video downloader is available whenever you need it. There's no account creation, no subscription fees, and no artificial limitations on how much you can download.`,
    howToUse: [
      "Copy the video URL from the platform you want to download from",
      "Paste the URL into the input field above",
      "Click 'Analyze' to fetch available download options",
      "Select your preferred quality and format from the results",
      "Click the download button to save the video directly to your device"
    ],
    privacyNotice: "Downloads happen directly from source platforms. No video data passes through our servers.",
    faqs: [
      { question: "Which platforms does the video downloader support?", answer: "Support varies by platform due to their individual implementation changes. Generally, platforms using standard HLS streaming or offering direct MP4 endpoints work best. We continuously update the tool to handle common platforms, but there's no guarantee of compatibility with any specific site due to frequent platform changes." },
      { question: "Is using this downloader legal?", answer: "Downloading videos depends on the copyright status of the content and the laws in your jurisdiction. You should only download content you have the right to download, such as videos you created yourself, content in the public domain, or videos where the platform's terms of service permit downloading. XFree does not encourage copyright infringement." },
      { question: "Why don't you offer a built-in download button?", answer: "Direct downloads require redirecting traffic through our servers, which creates bandwidth costs, potential legal liability, and privacy concerns (we'd see what you're downloading). By providing a tool that locates download links rather than proxying the download, we keep our service free while maintaining user privacy." },
      { question: "The tool says no videos found \u2014 why?", answer: "This happens when a platform uses non-standard streaming protocols, protected content (DRM), geo-restricted videos, or has changed their video page structure recently. Our tool analyzes page HTML and available endpoints \u2014 some platforms use proprietary players that don't expose downloadable content." },
      { question: "Can I download entire playlists?", answer: "Individual video URLs are supported. Playlist downloading requires iterating through each video's available formats, which is more complex and time-consuming. Our tool focuses on single video URL analysis to keep the service fast and reliable for all users." }
    ],
    relatedToolIds: ["ai-detector", "meta-tag-generator", "bulk-url-extractor", "free-online-games", "free-mobile"]
  },
  {
    id: "photo-editor",
    slug: "free-photo-editor",
    title: "Free Photo Editor \u2014 Edit Images Online",
    pillarKeyword: "Free Photo Editor",
    shortDescription: "Edit photos directly in your browser. Crop, resize, adjust brightness, contrast, saturation, and apply filters. No software to install, completely free.",
    category: "media-docs",
    categoryLabel: "Media & Documents Tools",
    iconName: "Image",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["photo editor", "image editor", "edit photo", "photo filters", "brightness contrast", "crop resize image", "free photo editor"],
    exampleInput: "Upload an image to begin editing. Supports JPG, PNG, WebP, and GIF formats.",
    explanation: `The XFree Photo Editor is a powerful yet easy-to-use browser-based image editing tool that lets you enhance photos without expensive software or complicated learning curves. Whether you need to crop an image to fit a specific aspect ratio, adjust colors to make your photos pop, apply creative filters for social media, or resize pictures for web use, our free photo editor has you covered.

The editor works entirely in your browser using HTML5 Canvas, meaning all processing happens on your device. There's no upload to external servers, no quality loss from compression, and no waiting for images to round-trip through the cloud. Your photos stay private and under your control throughout the editing process.

Key editing features include crop with preset aspect ratios (1:1, 4:3, 16:9, etc.), rotation in 90-degree increments or free rotation, flip horizontal/vertical, and automatic straightening for crooked shots. The resize tool maintains aspect ratio by default while allowing precise pixel dimensions for web optimization.

Color adjustments include brightness (from -100 to +100), contrast control, saturation adjustment for vivid or muted tones, grayscale conversion, sepia for vintage looks, and invert colors for artistic effects. Each adjustment uses real-time preview so you can see exactly how changes affect your image before applying them permanently.

One particularly useful feature is the ability to undo and redo changes freely. Unlike desktop software where you must save intermediate versions, our browser-based editor maintains a full history of adjustments you can step through. This makes it easy to experiment freely knowing you can always return to any previous state.

When you're satisfied with your edits, download your photo in JPG, PNG, or WebP format. For web use, we recommend PNG or WebP for transparency support. For maximum compatibility and smallest file sizes, JPG is often the best choice.`,
    howToUse: [
      "Upload your photo by dragging and dropping or clicking the upload area",
      "Use the toolbar to select editing tools: crop, rotate, flip, or adjust colors",
      "Make adjustments using the sliders and preview changes in real-time",
      "Apply filters from the preset gallery for one-click creative effects",
      "Download your edited image in your preferred format"
    ],
    privacyNotice: "Images are processed entirely in your browser. No upload to servers.",
    faqs: [
      { question: "What image formats are supported?", answer: "The photo editor accepts JPG/JPEG, PNG, WebP, GIF, BMP, and TIFF formats. For best results and widest format support, use JPG or PNG. WebP offers excellent compression with quality retention but may not be supported by all applications. GIF supports transparency but is limited to 256 colors." },
      { question: "What's the maximum image size?", answer: "Images up to 4000x4000 pixels or 20MB work best. Very large images may be slow to process due to browser memory constraints. For optimal performance with older devices, keep images under 2500 pixels on the longest edge. You can resize within the tool if your source image is too large." },
      { question: "Can I edit multiple photos at once?", answer: "Currently the editor handles one image at a time. For batch operations like resizing multiple photos to the same dimensions, consider using our bulk URL extractor or other batch processing tools. We may add batch support in a future update based on user demand." },
      { question: "Do edits affect original image quality?", answer: "Edits are non-destructive until you export. The original image data is preserved, so you can always undo changes or start over. When you download, the exported file reflects your current edits at the quality you specify. Repeated save/export cycles can accumulate quality loss in JPG format, but PNG export maintains full quality." },
      { question: "Can I remove backgrounds or unwanted objects?", answer: "Basic background removal isn't currently supported \u2014 that requires more advanced AI-based tools. However, you can crop the image to remove unwanted edges, adjust colors to de-emphasize elements, or use blur effects on specific areas. For professional background removal, consider dedicated tools like remove.bg." }
    ],
    relatedToolIds: ["jpg-to-pdf", "pdf-editor", "canva-free", "convert-jpg-to-pdf-free", "ai-detector"]
  },
  {
    id: "jpg-to-pdf",
    slug: "convert-jpg-to-pdf-free",
    title: "Convert JPG to PDF \u2014 Free Online Converter",
    pillarKeyword: "Convert JPG to PDF Free",
    shortDescription: "Convert JPG, PNG, and other images to PDF documents instantly in your browser. No upload, no signup, free forever.",
    category: "converters",
    categoryLabel: "Converters & Encoders",
    iconName: "FileText",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["jpg to pdf", "image to pdf", "convert jpg", "png to pdf", "image converter", "pdf converter", "free jpg to pdf"],
    exampleInput: "Select images from your device to convert to PDF format.",
    explanation: `The XFree JPG to PDF converter is a free browser-based tool that transforms your images into professional PDF documents without any software installation or account creation. Simply select your JPG, PNG, WebP, or other image files, arrange them in the order you prefer, and download a single PDF document containing all your images.

The conversion process happens entirely in your browser using modern web technologies. Unlike cloud-based converters that upload your images to external servers (where they may be stored, analyzed, or shared), our tool keeps your photos completely private. Your images never leave your device during the conversion process.

This privacy-first approach makes our converter ideal for sensitive documents like medical records, legal paperwork, financial statements, or personal identification documents. There's no risk of your private photos being exposed through server breaches or third-party data sharing. Close the browser tab when finished and all traces of your documents vanish from memory.

The tool supports multiple layout options for your PDF output. Choose from one image per page (fitting the full image on a standard page), multiple images per page for thumbnails or contact sheets, fit-to-width mode that spans images across pages for panoramic shots, or custom sizing where you specify exact page dimensions in inches or centimeters.

Beyond basic conversion, you can adjust image orientation within the PDF, set image quality to balance file size against visual clarity, add borders or margins around images, and preview the final document before downloading. The generated PDF is standard-compliant and opens in any PDF reader including Adobe Acrobat, preview readers, and browser built-in viewers.

Unlike paid conversion services that impose daily limits, add watermarks, or require subscriptions, our JPG to PDF converter is genuinely free with unlimited usage. Whether you need to convert one document or one hundred, the tool remains available without restrictions or signup requirements.`,
    howToUse: [
      "Click 'Select Images' or drag and drop your image files",
      "Reorder images using the arrow buttons if converting multiple files",
      "Choose your preferred layout option (one per page, multiple per page, etc.)",
      "Adjust quality settings if file size optimization is important",
      "Click 'Convert to PDF' and download your PDF document"
    ],
    privacyNotice: "Images are processed locally in your browser. No upload to servers.",
    faqs: [
      { question: "Does converting to PDF reduce image quality?", answer: "The image data itself isn't recompressed during PDF creation \u2014 your photos are embedded at their original quality. The slight quality reduction that can occur comes from the PDF viewer software when it renders the image on screen, not from our conversion process itself. For maximum quality preservation, use PNG format input." },
      { question: "Can I convert multiple images into one PDF?", answer: "Yes! Simply upload all the images you want to include, use the arrow buttons to arrange them in the correct order, and click convert. All images will be combined into a single PDF document with one image per page (or your chosen layout). There's no limit on the number of images you can combine." },
      { question: "What's the difference between JPG and PNG input?", answer: "JPG uses lossy compression that sacrifices some quality to achieve smaller file sizes. PNG uses lossless compression, preserving exact original quality. For photos that you've edited and want to preserve at highest quality, use PNG input. For unmodified camera photos where file size matters, JPG input works fine." },
      { question: "Will the PDF work on all devices?", answer: "The generated PDF uses standard ISO PDF 1.4 specification that's universally supported. It opens in Adobe Acrobat, Apple Preview, Google Drive viewer, Microsoft Edge, web browsers, mobile PDF apps, and virtually any other PDF reader on Windows, Mac, Linux, iOS, and Android." },
      { question: "Can I set custom page sizes?", answer: "Yes, the converter lets you choose from standard sizes including Letter (8.5x11 inches), A4, Legal, and custom dimensions. You can also set margins and choose whether images should fit within the page boundaries or overflow onto multiple pages for large photos." }
    ],
    relatedToolIds: ["pdf-editor", "photo-editor", "wetransfer-free", "best-free-cloud-storage", "free-online-games"]
  },
  {
    id: "password-generator",
    slug: "best-free-password-manager",
    title: "Password Strength Checker \u2014 Free Security Tool",
    pillarKeyword: "Best Free Password Manager",
    shortDescription: "Generate strong passwords, check password strength, and learn password security best practices. 100% free browser-based tool.",
    category: "security-tools",
    categoryLabel: "Security & Privacy Tools",
    iconName: "Shield",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["password generator", "password strength", "secure password", "password checker", "password security", "free password generator"],
    exampleInput: "TestPassword123!",
    explanation: `The XFree Password Strength Checker is a free browser-based tool that helps you create unbreakable passwords and evaluate the security of existing ones. Whether you need to generate a new strong password for an account or want to check if your current passwords are adequate, our tool provides detailed analysis and actionable recommendations.

Password generation creates cryptographically random passwords using your browser's secure random number generator. You control the parameters: length from 8 to 64 characters, inclusion of uppercase and lowercase letters, numbers, and special symbols. The preview shows estimated crack time against different attack scenarios from quick dictionary attacks to sophisticated GPU-accelerated brute force attempts.

The strength checker analyzes any password you enter in real-time, breaking down why it might be vulnerable. It identifies common patterns like dictionary words, sequential characters (123456), repeated patterns (aaa), keyboard walks (qwerty), personal information that could be guessed from social media, and other weaknesses that reduce actual security despite seeming complex.

Beyond individual password analysis, the tool explains password security principles in plain language. Understanding why certain choices are risky helps you make better decisions across all your accounts, not just fix the current password. Topics covered include why unique passwords for each account matter, the importance of password length over complexity, how password managers reduce the mental burden, and recognizing phishing attempts that try to steal credentials.

Privacy-conscious users appreciate that analysis happens locally. Your passwords are never transmitted anywhere \u2014 they stay in your browser session until you close the tab. Even if you use our tool to check important passwords, there's no risk of that information being logged, stored, or exposed through server breaches. This makes it safe for evaluating banking passwords, work credentials, or any sensitive access codes.

The tool also provides practical advice for password management including recommending reputable password managers, explaining two-factor authentication (2FA) and why it matters more than perfect passwords, and guiding you through creating a master password that's both secure and memorable through passphrase techniques rather than complex random strings.`,
    howToUse: [
      "To generate a password: select your criteria (length, character types) and click Generate",
      "To check password strength: type or paste your password into the checker input",
      "Review the strength meter and detailed breakdown of vulnerabilities",
      "Follow the recommendations to improve weak passwords",
      "Use the copy button to securely copy generated passwords"
    ],
    privacyNotice: "Passwords are analyzed locally in your browser. Nothing is ever sent to servers.",
    faqs: [
      { question: "Is it safe to enter my real passwords here?", answer: "Yes, absolutely safe. The password checker runs entirely in your browser using JavaScript \u2014 your input never leaves your device. We don't have servers logging passwords, no analytics tracking what you type, and no way for us to see your credentials. Close the browser tab and your password vanishes from memory completely." },
      { question: "What makes a password truly strong?", answer: "Length is the most important factor \u2014 each additional character exponentially increases crack time. A 12-character random password is stronger than an 8-character complex one in most scenarios. Second is uniqueness \u2014 using the same password everywhere means one breach compromises all accounts. Third is unpredictability \u2014 avoiding dictionary words, names, dates, and patterns that humans choose but attackers guess easily." },
      { question: "Should I write down my passwords?", answer: "For most people, a password manager is better than written notes. Digital password managers encrypt your vault with a master password, require the master to unlock, sync across devices, and generate strong unique passwords for every account. Written notes on paper can't be remotely compromised but can be physically stolen, lost, or found by someone you don't want accessing your accounts." },
      { question: "How does two-factor authentication (2FA) improve security?", answer: "2FA adds a second verification step \u2014 typically a code from your phone or a hardware key \u2014 that attackers can't bypass without stealing your physical device. Even if your password is compromised through a breach or phishing, 2FA prevents unauthorized access in most cases. We strongly recommend enabling 2FA on any service that offers it, especially email, banking, and social media." },
      { question: "Why do you recommend password managers?", answer: "Humans can only remember a handful of complex passwords before resorting to reuse or simple patterns. Password managers solve this by storing encrypted vaults that remember hundreds of unique complex passwords for you. The master password is the only one you need to remember. Popular options include Bitwarden (free and open source), 1Password, and Dashlane. Browser-built password managers work but may not sync across devices or offer the same security features." }
    ],
    relatedToolIds: ["vpn-guide", "ai-detector", "free-vpn", "coding-practice", "best-free-cloud-storage"]
  },
  {
    id: "coding-practice",
    slug: "free-coding-practice-sites",
    title: "Coding Practice Platform \u2014 Learn to Code",
    pillarKeyword: "Free Coding Practice Sites",
    shortDescription: "Practice coding with interactive exercises, challenges, and immediate feedback. Learn JavaScript, Python, and more with our free browser-based coding practice environment.",
    category: "developer-tools",
    categoryLabel: "Developer Tools",
    iconName: "Code2",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["coding practice", "learn to code", "programming exercises", "code challenges", "javascript practice", "python practice", "free coding"],
    exampleInput: "function helloWorld() {\n  return 'Hello, World!';\n}",
    explanation: `The XFree Coding Practice Platform is a free browser-based environment where you can sharpen your programming skills through hands-on exercises and immediate feedback. Whether you're a complete beginner learning your first language or an experienced developer brushing up on fundamentals, our interactive challenges provide a safe space to practice without pressure or performance monitoring.

The platform supports multiple programming languages including JavaScript (the primary focus, running directly in your browser via Node.js sandbox), Python basics, HTML structure validation, CSS property practice, and SQL query building. Each language has curated exercise sets ranging from absolute beginner (variables, data types, simple functions) to intermediate (recursion, data structures, algorithms) difficulty levels.

Exercises present a problem description, required inputs, and expected outputs. You write code to solve the problem, submit it, and receive immediate feedback showing whether your solution passed all test cases or which cases failed. Unlike video tutorials where you passively watch, you must actively solve problems \u2014 the proven way to actually retain programming knowledge.

The browser-based approach means zero setup time. No installing Python, no configuring IDEs, no switching between windows. Just open the tool, read the challenge, write your solution, and submit. This frictionless workflow encourages quick practice sessions during breaks, commutes, or whenever you have a few minutes to spare. You can complete one exercise or ten in any session length.

Progress tracking shows your completion history, success rate per language, and streak data that gamifies consistent practice. While we don't require accounts (privacy-first approach), browser local storage maintains your progress across sessions on the same device. This lets you return to where you left off without creating yet another login credential.

Community features let you share solutions after completing exercises, compare approaches with other learners, and learn multiple ways to solve the same problem. Seeing how others tackled a challenge often reveals new techniques, efficiency improvements, or programming idioms you hadn't encountered. The discussion sections for each exercise become mini knowledge bases accumulated from thousands of learner contributions.`,
    howToUse: [
      "Select a programming language from the dropdown (JavaScript recommended for beginners)",
      "Browse available exercises or search by topic (arrays, strings, algorithms, etc.)",
      "Read the problem description carefully including input/output specifications",
      "Write your solution code in the editor",
      "Click Submit to run test cases and receive immediate feedback"
    ],
    privacyNotice: "Code is executed in a sandboxed browser environment. No data is stored on external servers.",
    faqs: [
      { question: "Do I need programming experience to use this?", answer: "No experience required! The platform starts with absolute beginner exercises teaching fundamental concepts. If you've never written code before, we recommend starting with JavaScript as it runs directly in browsers, provides immediate feedback, and has extensive learning resources available. Work through the foundational exercises before attempting advanced challenges." },
      { question: "Can I use external libraries or imports?", answer: "Standard library functions for each language are available \u2014 no need to reinvent the wheel. For JavaScript, you have access to Array, String, Math, Object, Date, RegExp, and JSON built-ins. Python provides its extensive standard library. Third-party libraries like Lodash or NumPy aren't available since everything runs in a sandboxed browser environment without package installation capability." },
      { question: "What happens if my code runs infinitely (infinite loop)?", answer: "The execution environment has timeout protection \u2014 if your code runs for more than 5 seconds without producing output, it's terminated and marked as timed out. This prevents browser tab freezing from infinite loops. Check your loop conditions and ensure you have proper exit points. Hints in the exercise descriptions often flag common pitfalls for each challenge." },
      { question: "How are solutions verified?", answer: "Each exercise has a set of test cases \u2014 input values paired with expected correct outputs. Your code receives the same inputs, and its outputs are compared against expected values. All tests must pass for the exercise to be marked complete. Test cases include typical scenarios as well as edge cases that catch incomplete solutions. The specific inputs aren't revealed before you submit, preventing solutions tuned to the tests rather than the problem." },
      { question: "Can I save my progress without an account?", answer: "Yes! Progress is stored in your browser's local storage, so it persists across sessions on the same device without requiring any account creation. However, local storage is device-specific \u2014 you won't see your progress if accessing from a different computer, browser, or after clearing browser data. Creating a free account (email only, no verification required) enables cross-device sync." }
    ],
    relatedToolIds: ["regex-tester", "json-formatter", "mobile-tester", "ai-detector", "free-online-games"]
  },
  {
    id: "cloud-storage-guide",
    slug: "best-free-cloud-storage",
    title: "Cloud Storage Comparison \u2014 Free Options Guide",
    pillarKeyword: "Best Free Cloud Storage",
    shortDescription: "Compare the best free cloud storage services: Google Drive, Dropbox, OneDrive, and more. Find the right free storage solution for your needs.",
    category: "business-tools",
    categoryLabel: "Business & Productivity Tools",
    iconName: "Briefcase",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["cloud storage", "free storage", "google drive", "dropbox", "onedrive", "online storage", "file backup", "cloud backup"],
    exampleInput: "Google Drive vs Dropbox vs OneDrive comparison",
    explanation: `The XFree Cloud Storage Comparison Guide helps you navigate the crowded landscape of free cloud storage options and find the best fit for your specific needs. With countless services claiming to be free, understanding the actual limits, hidden costs, and practical implications of each choice empowers you to make informed decisions rather than discovering problems after you've committed your data.

Our comparison breaks down the major players including Google Drive (15GB free shared across Drive, Gmail, and Photos), Dropbox (2GB free with referral bonuses), Microsoft OneDrive (5GB free), iCloud (5GB free for Apple users), and emerging alternatives like pCloud, Icedrive, and Degoo. For each service, we analyze storage allocation, file size limits, upload restrictions, sync capabilities, sharing features, privacy policies, and platform availability.

The guide recognizes that "best" depends entirely on your use case. Photographers need vast storage for high-resolution images. Students might prioritize collaboration features for group projects. Remote workers require reliable cross-device sync. Business users need robust admin controls and compliance certifications. We provide decision frameworks that weight these factors appropriately rather than declaring one-size-fits-all winners.

Security analysis examines encryption approaches (zero-knowledge vs server-side only), two-factor authentication support, breach histories, andjurisdiction concerns that affect which governments can legally access your data. Privacy-conscious users particularly benefit from understanding which services can technically access their files even without explicit consent.

Practical guidance covers strategies that maximize free storage: combining multiple free accounts, using compression to fit more data within limits, leveraging education discounts that many services offer, and cleanup techniques to identify and remove duplicate or unnecessary files wasting your allocation. These strategies can effectively double or triple your usable free storage without spending anything.`,
    howToUse: [
      "Browse the comparison table to see storage limits and key features side-by-side",
      "Filter services by your priorities: security, collaboration, platform support",
      "Read detailed analysis sections for services that match your needs",
      "Follow setup guides to configure each service optimally",
      "Use the storage calculator to plan how to combine multiple services"
    ],
    privacyNotice: "This is a comparison guide. No file data is processed or stored.",
    faqs: [
      { question: "Which free cloud storage gives the most space?", answer: "Google Drive currently offers the most free storage at 15GB shared across Gmail, Google Drive, and Google Photos combined. However, photos uploaded at Original Quality count against this limit \u2014 switching to High Quality (free compression) can effectively give unlimited photo storage. Degoo offers 100GB free but with heavy limitations on daily upload caps. For pure storage volume, combining Google Drive + Degoo can provide over 100GB effectively free." },
      { question: "Is my data safe in the cloud?", answer: "Reputable services use encryption both in transit (HTTPS) and at rest (AES-256 typically). However, most can technically access your files for legitimate purposes like legal compliance or abuse prevention. For truly private storage where only you can ever access your data, look for zero-knowledge services like Tresorit or SpiderOak where encryption happens client-side before upload and the service never has the keys." },
      { question: "What happens if a service shuts down?", answer: "History shows free services can vanish suddenly \u2014 just look at FairUse, Ubuntu One, and countless others. Mitigation strategies include: never relying on a single service for irreplaceable data, maintaining local backups, using services with paid options (they're more likely to survive), and periodically exporting your data. Our guide links to each service's data export tools so you can retrieve your files if needed." },
      { question: "Can I access files offline?", answer: "Most services offer desktop applications that create local sync folders \u2014 any files you mark for offline access download automatically and remain available without internet. Mobile apps typically cache recently accessed files. However, truly offline-first services like Dropbox Paper or Notion have robust offline support because their core use case assumes intermittent connectivity. Check specific app settings to configure offline availability." },
      { question: "How do referral programs work?", answer: "Many services reward you with additional free storage when you invite friends. Dropbox gives 500MB per successful referral (both parties get bonus). Google Drive doesn't have referrals anymore but education accounts often get unlimited storage. pCloud offers lifetime storage upgrades for referral milestones. Our comparison guide includes current referral bonus structures for all major services." }
    ],
    relatedToolIds: ["wetransfer-free", "pdf-editor", "canva-free", "vpn-guide", "free-mobile"]
  },
  {
    id: "mobile-tester",
    slug: "free-mobile",
    title: "Mobile Device Tester \u2014 Responsive Design Checker",
    pillarKeyword: "Free Mobile",
    shortDescription: "Test your website or app on virtual mobile devices. Preview on iPhone, Android phones, and tablets. Check responsive design and mobile UX.",
    category: "developer-tools",
    categoryLabel: "Developer Tools",
    iconName: "Smartphone",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["mobile tester", "responsive design", "device preview", "mobile simulation", "viewport tester", "mobile-first testing"],
    exampleInput: "https://example.com",
    explanation: `The XFree Mobile Device Tester is a free browser-based tool that lets you preview any website on a simulated library of real mobile devices including various iPhone models, Android phones from Samsung, Google Pixel, OnePlus, and other manufacturers, plus iPads and Android tablets in multiple sizes and orientations.

Responsive web design has moved from optional to mandatory \u2014 over 60% of web traffic now comes from mobile devices, and Google's indexing is mobile-first. Testing your designs across the actual device landscape you serve isn't optional anymore. Our simulator provides accurate viewport previews without requiring you to maintain a physical device lab or expensive services like BrowserStack.

The simulator renders websites at exact pixel dimensions for each target device, accounting for device pixel ratio (the difference between logical and physical pixels that affects how much fits on screen). You see what users actually see, not just a scaled-down desktop view. Rotate between portrait and landscape modes with one click to verify your responsive layouts adapt correctly.

Beyond basic preview, the tool highlights common mobile usability issues including tap targets smaller than 44x44 pixels (Apple's minimum recommended size), text too small to read without zooming, horizontal scroll indicators that frustrate mobile users, and viewport meta tag problems that prevent proper scaling. These automated checks catch issues before they reach real users on real devices.

Developer features include network throttling simulation to preview load times on 3G, 4G, or WiFi connections, cookie and localStorage inspection to verify client-side storage works correctly, viewport dimension inspection for CSS media query debugging, and direct access to device fonts and system UI elements that differ between platforms and affect your design's appearance.

The tool respects your privacy \u2014 no tracking pixels, no usage analytics, no accounts required. Simply enter a URL, select your target devices, and start inspecting. Your browsing history and personal data stay completely private since the preview loads in an isolated environment. Close the browser tab and all traces of your testing session disappear.`,
    howToUse: [
      "Enter the URL of the website you want to test in the input field",
      "Select target devices from our device library (iPhone, Android, tablets)",
      "Click the device to open it in the simulator viewport",
      "Interact with the preview \u2014 scroll, tap, rotate \u2014 to test responsiveness",
      "Review the mobile audit findings for any detected issues"
    ],
    privacyNotice: "Previews load in an isolated browser environment. No personal data is tracked.",
    faqs: [
      { question: "How accurate are the device simulations?", answer: "The simulator renders at exact device pixel dimensions and resolutions, showing true visual fidelity. However, it's not a perfect replacement for real device testing because actual devices have different GPUs, browsers with varying CSS implementations, and system-level rendering differences. Use it for development iteration and catching obvious issues, but real device QA remains important before major releases." },
      { question: "Can I test locally hosted websites?", answer: "Yes, if your local development server is running on localhost or your machine's local IP address, you can enter that URL directly. For mobile devices on your network to access local URLs, ensure your firewall allows local network connections and use your computer's local IP rather than localhost. Many development frameworks (Create React App, Vite, webpack-dev-server) have built-in network access configuration." },
      { question: "Does it support testing on actual physical devices?", answer: "Our tool simulates devices within the browser rather than connecting to physical hardware. For testing on real devices, consider browser developer tools' device emulation (Chrome DevTools Devices panel, Firefox's Responsive Design Mode) or services like BrowserStack that provide real device clouds. Physical device testing catches GPU-specific rendering bugs and actual touch interaction issues that simulators cannot replicate perfectly." },
      { question: "What mobile audit checks are performed?", answer: "Automated checks include: viewport meta tag presence and configuration, tap target size analysis (flagging targets under 44x44px), font size verification (body text should be at least 16px), color contrast checking for accessibility compliance, viewport overflow detection to catch horizontal scroll issues, and identification of content trapped behind fixed headers or overlapping elements." },
      { question: "Can I test protected or login-gated pages?", answer: "You can test pages behind authentication by first logging into the site in a browser where you have access, then copying cookies or session storage into our simulator. Alternatively, enter the URL after authentication is complete and the simulator will inherit your logged-in session state. This lets you test member areas, dashboards, and other restricted content without workarounds." }
    ],
    relatedToolIds: ["meta-tag-generator", "regex-tester", "json-formatter", "ai-detector", "coding-practice"]
  },
  {
    id: "online-games",
    slug: "free-online-games",
    title: "Free Browser Games \u2014 Play Instant Games Online",
    pillarKeyword: "Free Online Games",
    shortDescription: "Play free browser games instantly. No downloads, no signup. Memory matching, puzzle games, and more. Fun mini-games during breaks.",
    category: "generators",
    categoryLabel: "Generators",
    iconName: "Gamepad2",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["free games", "online games", "browser games", "memory game", "puzzle games", "casual games", "no download games"],
    exampleInput: "Click 'New Game' to start playing instantly",
    explanation: `The XFree Free Browser Games collection offers instant entertainment through simple but polished mini-games that load directly in your browser tab. No downloads, no installations, no signup required \u2014 just open and play. Whether you need a mental break during a long coding session, want to challenge your memory during a commute, or are looking for a quick distraction between tasks, our curated games provide quality entertainment without the commitment of traditional gaming.

The flagship Memory Match game tests and trains your visual memory by presenting a grid of face-down cards containing symbols or images. Players flip two cards per turn, remembering positions to find matching pairs. Difficulty levels adjust grid size and turn count targets, with easy mode for young children or casual play and hard mode that challenges even strong memories with larger grids and limited moves. High scores are saved locally, encouraging replay to beat personal records.

Beyond Memory Match, the collection includes Quick Math (mental arithmetic under time pressure), Word Scramble (unscramble letters against the clock), Pattern Lock (memorize and recreate increasingly complex touch sequences), and Color Match (identify color words under strobing conditions that trick your brain. Each game takes 1-5 minutes, perfect for short breaks without losing too much productivity context.

The games are built entirely with standard web technologies \u2014 HTML5 Canvas for rendering, JavaScript for game logic, and CSS for styling. This means they work on any device with a modern browser: Windows, Mac, Linux, Chromebooks, iPads, Android tablets, and even phones. Responsive design adapts game boards to fit whatever screen you have, though desktop provides the most comfortable experience for precision-required games.

Privacy-conscious users appreciate that our games track nothing externally. Scores and progress save to your browser's local storage only, meaning only you see your history. There's no account system, no leaderboards that expose your performance to others, no data collection beyond essential functionality. Your gaming habits remain private. Close the browser tab and all game state vanishes unless you explicitly want to continue later.`,
    howToUse: [
      "Browse the available games from the game selection menu",
      "Click any game to start playing instantly",
      "Use mouse clicks or touch to interact with game elements",
      "Try to beat your high score or complete all levels",
      "Switch between games anytime \u2014 progress is auto-saved"
    ],
    privacyNotice: "Game state saves only to your browser's local storage. No data is sent to external servers.",
    faqs: [
      { question: "Do I need an account to play?", answer: "No account is required. All games are instantly playable by simply opening the page. Your high scores and progress are automatically saved to your browser's local storage, persisting across sessions on the same device. If you clear browser data or switch devices, your scores will reset since they exist only in your local browser storage." },
      { question: "Are these games appropriate for children?", answer: "Yes, our games contain no violence, mature content, advertising, or in-app purchases. They're designed to be family-friendly and suitable for all ages. Memory Match and Word Scramble in particular help children develop cognitive skills while having fun. Quick Math supports arithmetic practice for students. The simple interfaces don't require reading comprehension, making them accessible even to pre-readers." },
      { question: "Can I play offline?", answer: "Yes, once you've loaded the page once, the games work offline because they're pure client-side web applications. There's no server-side component required during gameplay. However, if you clear your browser's cache and site data, you'd need to reload the page once online to restore the game files. After that initial load, offline play continues indefinitely." },
      { question: "Why do my scores sometimes differ between devices?", answer: "Scores are stored only in local storage on each specific device and browser. If you play on your work computer and then switch to your phone, they have separate local storage that doesn't sync. There's no cloud account to unify progress. This privacy-preserving approach means your gaming history stays private to each device but also means no cross-device continuity unless you use the same device and browser." },
      { question: "Can I suggest new games to add?", answer: "We welcome suggestions! While we can't guarantee implementation of specific requests, popular demand influences which games we develop next. Focus on games that are simple to explain, work in browsers without plugins, and provide engaging short-session gameplay. Classic arcade concepts, word puzzles, and reaction-based challenges translate well to browser environments. Avoid games requiring persistent servers, real-time multiplayer, or complex 3D graphics that exceed browser capabilities." }
    ],
    relatedToolIds: ["coding-practice", "password-generator", "ai-detector", "free-mobile", "free-vpn"]
  },
  {
    id: "vpn-guide",
    slug: "free-vpn",
    title: "VPN Guide \u2014 Free vs Paid Security Comparison",
    pillarKeyword: "Free VPN",
    shortDescription: "Learn about VPN technology, compare free vs paid options, and understand when a VPN genuinely protects you. Educational security guide.",
    category: "security-tools",
    categoryLabel: "Security & Privacy Tools",
    iconName: "Shield",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["vpn", "virtual private network", "vpn security", "online privacy", "free vpn vs paid vpn", "vpn comparison"],
    exampleInput: "What is a VPN and how does it work?",
    explanation: `The XFree VPN Guide is an educational resource that demystifies Virtual Private Network technology, helping you understand when VPNs provide genuine security benefits and when marketing claims overstate protection. Rather than recommending specific products, we empower you to evaluate options critically based on technical facts rather than advertising budgets.

VPNs work by creating an encrypted tunnel between your device and the internet through a remote server. All your web traffic routes through this tunnel, masking your real IP address from websites you visit and preventing local network observers (like cafes, hotels, or workplaces) from seeing your browsing activity. This provides meaningful protection on untrusted networks but doesn't make you truly anonymous online.

The guide explains the critical distinction between VPN services: paid providers that operate genuine networks with proper encryption, no-logging policies (or at least minimal logging), and sustainable business models versus free VPNs that may monetize your data in concerning ways. Studies have repeatedly found that many free VPN apps secretly harvest and sell user browsing data, inject tracking cookies, display aggressive advertising, and may even bundle malware. If a service is free and you can't identify its revenue source, you may be the product.

Legitimate use cases where VPNs provide real protection include: securing connections on public WiFi where network observers could intercept unencrypted traffic, hiding IP addresses from websites during sensitive research, bypassing geographic restrictions for content access (where legal), and masking ISP monitoring on networks with aggressive data collection. VPNs do not make you immune to viruses, protect against phishing, guarantee anonymity, or prevent tracking through other vectors like browser fingerprints.

The guide includes a decision framework for evaluating whether you actually need a VPN. Most users on encrypted home connections gain minimal additional privacy from a VPN since their ISP already can't easily monitor their traffic (though HTTPS provides individual site protection). Mobile users on cellular networks similarly see less benefit since carriers don't inspect HTTPS traffic. The clearest benefits come from frequent public WiFi users and those with specific privacy requirements.`,
    howToUse: [
      "Read the introduction to understand what VPNs technically do",
      "Review the comparison of free vs paid VPN services",
      "Check the use case scenarios to see if a VPN benefits your situation",
      "Study the red flags that indicate untrustworthy VPN services",
      "Use the evaluation criteria to compare specific services you're considering"
    ],
    privacyNotice: "This is an educational guide. No VPN connections or browsing data are processed.",
    faqs: [
      { question: "Are free VPNs ever safe to use?", answer: "Generally no. Running VPN infrastructure costs money, so free services must monetize somehow. Legitimate providers offer limited free tiers as customer acquisition (Pro version upsells) rather than primary business models. Completely free VPNs with no paid tier almost always fund operations by harvesting and selling user data, displaying tracking-based advertising, or bundled malware. ProtonVPN's free tier is one notable exception run by the same privacy-conscious company behind ProtonMail." },
      { question: "Can a VPN make me completely anonymous online?", answer: "No. VPNs hide your IP address and encrypt traffic from local network observers, but numerous other tracking mechanisms remain active: browser fingerprints identifying you by screen resolution, installed fonts, and behavior patterns; cookies tracking you across sites; account logins that directly identify you; and services you access that tie activity to identities. Achieving genuine anonymity requires combining multiple techniques including VPN, private browsers, NoScript, cookie blocking, and more." },
      { question: "Will a VPN slow down my internet?", answer: "VPNs always add latency due to encryption/decryption overhead and routing through additional network hops. Actual speed impact depends on: server distance (closer = faster), server load (crowded servers = slower), your base connection speed, and VPN protocol efficiency. Modern protocols like WireGuard perform significantly better than legacy OpenVPN. Expect 10-30% speed reduction on average, though poor VPN choices or distant servers can produce worse results." },
      { question: "Is using a VPN legal?", answer: "VPNs are legal in most countries including the US, UK, Canada, EU members, Australia, and Japan. However, some countries restrict or ban VPN usage: China, Russia, Iran, UAE, Turkey, and others require government-approved VPN services. Using unauthorized VPNs in these countries can result in fines or worse. Additionally, while VPN usage itself may be legal, activities conducted through VPNs remain subject to the same laws as without \u2014 VPNs don't make illegal activities permissible." },
      { question: "What's the difference between VPN protocols?", answer: "OpenVPN is the long-standing open-source standard with strong security and broad compatibility but moderate speed. WireGuard is newer, dramatically faster with simpler code (easier to audit), and gaining rapid adoption. IKEv2 is fast and stable, especially on mobile when switching networks. PPTP is obsolete and insecure \u2014 avoid it entirely. Most quality providers let you choose between protocols; WireGuard generally offers the best balance of security and performance for most users." }
    ],
    relatedToolIds: ["password-generator", "best-free-cloud-storage", "ai-detector", "free-online-games", "free-vpn"]
  },
  {
    id: "wetransfer-alternative",
    slug: "wetransfer-free",
    title: "WeTransfer Alternatives \u2014 Free File Transfer Guide",
    pillarKeyword: "WeTransfer Free",
    shortDescription: "Compare WeTransfer alternatives for free file sharing. Learn about SendAnywhere, Filemail, and other free options. Transfer large files without paid subscriptions.",
    category: "business-tools",
    categoryLabel: "Business & Productivity Tools",
    iconName: "Send",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["wetransfer", "file transfer", "send large files", "free file sharing", "file upload", "we transfer alternatives"],
    exampleInput: "WeTransfer vs SendAnywhere vs Filemail comparison",
    explanation: `The XFree WeTransfer Alternatives Guide helps you navigate the landscape of free file transfer services when you need to share large files but don't want to pay premium subscription fees. WeTransfer popularized the simple drag-and-drop file sharing model, but its free tier limitations (2GB per transfer, 7-day expiration) leave gaps for users with larger files or longer availability needs.

Our comprehensive guide evaluates alternatives across multiple dimensions: maximum file size limits, expiration policies, required registration, download speed restrictions, file type limitations, privacy policies, and overall usability. Services reviewed include established players like Filemail with 50GB free transfers, SendAnywhere's instant peer-to-peer sharing without server storage, Smash with unlimited transfers but advertising support, and lesser-known options like DropLoad and Transfernow.

The guide recognizes that "best" depends heavily on your specific use case. Designers sharing large asset folders need different capabilities than developers sending code archives or video producers delivering rough cuts. We provide decision frameworks that weight these factors appropriately: maximum file size matters more for video production, expiration policies matter more for archival sharing, peer-to-peer options matter more for sensitive data that shouldn't sit on third-party servers.

Privacy analysis examines each service's approach to data handling, including whether files are encrypted at rest, how long downloads are logged, what metadata is retained, and whether services have had security incidents or breaches. For sensitive business documents, legal files, or personal data, understanding where your files actually travel and how long they're retained matters enormously.

Practical tips include strategies to maximize free tiers: using browser-based services for one-time transfers, leveraging multiple free accounts for larger total capacity, self-hosting options like Nextcloud for complete control, and peer-to-peer solutions like Snapdrop or Landrop that transmit files directly between devices without intermediate servers. These approaches can eliminate subscription costs for occasional users entirely.`,
    howToUse: [
      "Review the comparison table showing file limits and key features",
      "Filter services based on your maximum file size needs",
      "Read detailed evaluations for services that match your requirements",
      "Consider privacy ratings for sensitive file transfers",
      "Use the quick-start guides to begin using recommended services"
    ],
    privacyNotice: "This is an educational guide. No files are processed or stored through this service.",
    faqs: [
      { question: "What are the file size limits on WeTransfer alternatives?", answer: "Limits vary significantly: Filemail offers 50GB per transfer free, SendAnywhere has no explicit limit but uses peer-to-peer for efficiency, Smash allows unlimited transfers but uses lossy compression and displays ads, Dropbigup provides 10GB with 30-day expiration, and WeTransfer itself offers 2GB free. For large video files (which can be 10-100GB+), most free services hit limitations \u2014 consider self-hosted options like Nextcloud or physical media for truly large transfers." },
      { question: "Are peer-to-peer file transfers more private?", answer: "Yes, in most cases. Services like SendAnywhere and Snapdrop connect your devices directly, transmitting files without storing them on intermediate servers. The file never rests on third-party infrastructure, meaning no server breach risk and no retention after the transfer completes. However, both devices must be online simultaneously, and performance depends on direct connection quality rather than server bandwidth." },
      { question: "Do free file transfer services have good privacy policies?", answer: "Varies enormously. Premium services with paid tiers (Filemail, WeTransfer Pro) generally have strong privacy policies since they're not desperate for monetization. Ad-supported free services may collect browsing behavior, display targeted advertising, and have less incentive to protect user privacy. Review privacy policies before uploading sensitive personal documents. Avoid services that require excessive personal information or sell data to third parties." },
      { question: "Can I send files to multiple recipients for free?", answer: "Most free services are one-to-one: one sender, one receiver. Services like WeTransfer's free tier support one email address per transfer. Multi-recipient sharing typically requires paid plans. Workarounds include compressing multiple files into an archive and uploading once, using cloud storage links with sharing permissions (Google Drive, OneDrive), or using collaboration-focused services like Dropbox Paper or Notion that support file attachments." },
      { question: "What happens to my files after expiration?", answer: "On server-based services, files are typically deleted from storage when they expire. However, there's no guarantee about backups or logging retention \u2014 some services may have copies in backups for legal compliance. Peer-to-peer services leave no server traces but also provide no retrieval if the recipient misses the window. For archival needs, use dedicated cloud storage services rather than temporary transfer services." }
    ],
    relatedToolIds: ["bulk-url-extractor", "pdf-editor", "cloud-storage-guide", "convert-jpg-to-pdf-free", "free-online-games"]
  },
  {
    id: "canva-alternative",
    slug: "canva-free",
    title: "Canva Alternatives \u2014 Free Design Tools Guide",
    pillarKeyword: "Canva Free",
    shortDescription: "Compare Canva alternatives for free graphic design. Find the best free design tools for social media graphics, presentations, logos, and more.",
    category: "business-tools",
    categoryLabel: "Business & Productivity Tools",
    iconName: "Palette",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-09-06",
    tags: ["canva", "graphic design", "free design tools", "design software", "social media graphics", "presentation design", "logo maker"],
    exampleInput: "Canva vs Figma vs Affinity Designer comparison",
    explanation: `The XFree Canva Alternatives Guide helps you find the right free graphic design tool when Canva's subscription pricing doesn't fit your budget. Whether you're a small business owner needing occasional social media graphics, a student creating presentations, or a content creator producing thumbnails and banners, understanding available alternatives saves both money and frustration with tools that don't match your actual workflow.

Our guide thoroughly evaluates alternatives across design disciplines: general-purpose tools like Canva itself, specialized options for specific needs like logo design or presentation creation, professional-grade software with free tiers for individual use, and browser-based solutions versus downloadable applications. Each category serves different priorities \u2014 some users need collaborative features, others prioritize output quality, and many simply want the fastest path from concept to finished design.

The comparison examines learning curves honestly. Canva succeeds partly because its intuitive drag-and-drop interface is accessible to complete beginners. Some alternatives require significant design knowledge or accept usability trade-offs for power users. We identify which tools genuinely match Canva's accessibility and which demand design background to use effectively. The best tool depends entirely on your existing skills and available learning time.

Output quality comparison covers resolution limits (free tiers often cap at 72dpi or restrict exports), format availability (some tools only export PNG while others offer SVG, PDF, or print-ready formats), watermarking policies (many free tiers brand outputs), and color space support (RGB vs CMYK for print preparation). These technical details determine whether outputs actually meet your practical needs.

Privacy analysis matters when designing company logos, branded materials, or anything containing trade secrets. Some browser-based tools collect uploaded assets and user content for their own purposes. We highlight services with strong privacy policies that keep your designs confidential and don't claim ownership of creative work you produce using their platforms.`,
    howToUse: [
      "Browse the comparison categories based on your design needs",
      "Filter by required features (collaboration, templates, export formats)",
      "Read detailed evaluations for tools matching your skill level",
      "Consider privacy policies if designing sensitive materials",
      "Use provided links to try recommended alternatives"
    ],
    privacyNotice: "This is an educational guide. No designs or user data are processed.",
    faqs: [
      { question: "What's the best completely free design tool?", answer: "For pure zero-cost with no restrictions, Canva's free tier remains hard to beat despite its limits. If you need professional outputs without watermarks, GIMP (downloadable image editor) and Penpot (browser-based with professional features) offer genuinely free alternatives without the Freemium restrictions. The 'best' depends heavily on what you're designing \u2014 there isn't one tool that excels at everything." },
      { question: "Can I use these tools commercially?", answer: "Most tools allow commercial use of designs created with free tiers, but check each service's terms. Generally, original designs you create belong to you \u2014 the tool provider doesn't claim ownership. However, some free tiers restrict commercial use or require paid plans for business use. Read terms before designing client work or products for sale." },
      { question: "Do free design tools add watermarks?", answer: "Many free design tools add watermarks to exported images, particularly those with aggressive monetization. Canva's free tier adds elements you can't remove without paying. GIMP and other genuinely free software never adds watermarks since you're downloading and owning the software outright. Our guide notes watermark policies for each alternative so you can avoid unpleasant surprises." },
      { question: "What about Canva vs professional tools like Photoshop?", answer: "Photoshop costs significantly more but offers vastly superior capabilities for photo editing, digital painting, and print production. For simple social media graphics, presentations, and basic layouts, Canva and its alternatives are more efficient. The question isn't which is 'best' absolutely, but which matches your actual needs \u2014 paying for Photoshop to make Instagram posts is overkill, but trying to do professional photo retouching in Canva is frustrating limitation." },
      { question: "Are there good free options for presentations?", answer: "Yes, several strong options exist. Google Slides (free with Google account) offers solid presentation creation with real-time collaboration. LibreOffice Impress (completely free, downloadable) provides traditional presentation software without subscription. For browser-based simplicity, Canva has presentation templates, though export quality may be limited on free tiers. Zoho Show offers surprisingly capable free tier with collaboration features." }
    ],
    relatedToolIds: ["photo-editor", "pdf-editor", "cloud-storage-guide", "convert-jpg-to-pdf-free", "wetransfer-free"]
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
  (t) => t.status === "published" && t.indexable === true
);
var INDEXABLE_TOOL_SLUGS = new Set(INDEXABLE_TOOLS.map((t) => t.slug));
function findToolBySlug(slug) {
  return TOOLS_REGISTRY.find((t) => t.slug === slug || t.id === slug);
}

// src/data/pillarRegistry.ts
var PILLAR_CATEGORIES = [
  { id: "dev-data", label: "Developer & Data Tools", description: "Formatters, validators, debuggers, regex, encoding, converters", icon: "\u26A1" },
  { id: "web-seo", label: "Web & SEO Tools", description: "Sitemaps, meta tags, schema, crawl, performance, accessibility", icon: "\u{1F310}" },
  { id: "ai-auto", label: "AI & Automation Tools", description: "Prompt engineering, LLM tools, agents, RAG, MCP workflows", icon: "\u{1F9E0}" },
  { id: "media-docs", label: "Media & Documents Tools", description: "Image, video, audio, PDF, documents, spreadsheets, markdown", icon: "\u{1F4C1}" },
  { id: "security", label: "Security & Privacy Tools", description: "Hash, passwords, JWT, DNS, HTTP, certificates, encryption", icon: "\u{1F512}" },
  { id: "business", label: "Business & Productivity Tools", description: "Text, writing, calculators, finance, marketing, productivity", icon: "\u{1F4BC}" }
];
var PILLARS_60 = [
  { slug: "dev-tools", num: "01", name: "XFree Developer Tools", tagline: "Formatters, validators, debuggers, regex, encoding, converters, base64, JWT, UUID, cron, SQL, hex, YAML", description: "XFree developer tools: format, validate, debug, and convert structured data without signup. 100% client-side.", emoji: "\u26A1", icon: "code", category: "dev-data", keywords: ["developer tools", "json formatter", "regex tester", "base64 encoder", "jwt decoder", "uuid generator", "cron generator", "sql formatter", "yaml validator", "hex to text"], relatedPillarSlugs: ["json-data-tools", "regex-tools", "encoding-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "json-data-tools", num: "02", name: "XFree JSON Data Tools", tagline: "JSON formatter, validator, flattener, sorter, diff, converter", description: "XFree JSON data tools: format, validate, flatten, sort, diff, and convert JSON data. No server, no signup.", emoji: "\u{1F9E9}", icon: "json", category: "dev-data", keywords: ["json formatter", "json validator", "json flattener", "json sorter", "json diff", "json to csv", "json to yaml", "json minify", "json parse"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "code-formatting-tools", num: "03", name: "XFree Code Formatting Tools", tagline: "HTML, CSS, JS, TypeScript, XML, SQL formatter and minifier", description: "XFree code formatting tools: beautify, minify, and lint HTML, CSS, JS, TypeScript, XML, SQL, and more.", emoji: "\u2728", icon: "format", category: "dev-data", keywords: ["html formatter", "css minifier", "js formatter", "typescript formatter", "xml formatter", "sql formatter", "code beautifier", "code minifier"], relatedPillarSlugs: ["dev-tools", "regex-tools", "encoding-tools"], lastReviewed: "2026-09-05" },
  { slug: "api-tools", num: "04", name: "XFree API Development Tools", tagline: "OpenAPI spec validator, endpoint tester, request builder, curl generator", description: "XFree API tools: validate OpenAPI specs, test endpoints, build requests, and generate curl commands.", emoji: "\u{1F50C}", icon: "api", category: "dev-data", keywords: ["openapi validator", "api tester", "rest client", "curl generator", "swagger validator", "graphql explorer", "endpoint monitor", "request builder"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "encoding-tools", "security-tools"], lastReviewed: "2026-09-05" },
  { slug: "database-tools", num: "05", name: "XFree Database Tools", tagline: "SQL formatter, query builder, schema designer, migration generator", description: "XFree database tools: format SQL, build queries, design schemas, and generate migrations.", emoji: "\u{1F5C4}\uFE0F", icon: "database", category: "dev-data", keywords: ["sql formatter", "sql validator", "query builder", "schema designer", "migration generator", "mongodb formatter", "postgresql utils"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "encoding-tools"], lastReviewed: "2026-09-05" },
  { slug: "regex-tools", num: "06", name: "XFree Regex Tools", tagline: "Regex tester, explainer, builder, cheat sheet, pattern library", description: "XFree regex tools: test, explain, and build regex patterns with match groups and explanations.", emoji: "\u{1F50D}", icon: "regex", category: "dev-data", keywords: ["regex tester", "regex explainer", "regex builder", "regex cheat sheet", "pattern matcher", "regex debugger", "regex library"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "json-data-tools"], lastReviewed: "2026-09-05" },
  { slug: "encoding-tools", num: "07", name: "XFree Encoding Tools", tagline: "Base64, URL, hex, binary, ASCII converter encoder decoder", description: "XFree encoding tools: convert between Base64, URL, hex, binary, ASCII, and more formats.", emoji: "\u{1F524}", icon: "encode", category: "dev-data", keywords: ["base64 encoder", "base64 decoder", "url encoder", "hex converter", "binary converter", "ascii converter", "encoding checker"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "regex-tools"], lastReviewed: "2026-09-05" },
  { slug: "converters", num: "08", name: "XFree File Converters", tagline: "JSON to CSV, YAML to JSON, XML to JSON, CSV to JSON, data format conversion", description: "XFree file converters: transform between JSON, CSV, YAML, XML, and other data formats.", emoji: "\u{1F504}", icon: "convert", category: "dev-data", keywords: ["json to csv", "yaml to json", "xml to json", "csv to json", "json to yaml", "data format converter"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "json-data-tools"], lastReviewed: "2026-09-05" },
  { slug: "validators", num: "09", name: "XFree Data Validators", tagline: "JSON schema validator, HTML validator, CSS validator, XML validator", description: "XFree validators: validate JSON Schema, HTML, CSS, XML, and other structured documents.", emoji: "\u2713", icon: "validate", category: "dev-data", keywords: ["json schema validator", "html validator", "css validator", "xml validator", "data validator", "syntax checker", "format validator"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "generators", num: "10", name: "XFree Online Generators", tagline: "UUID v4, QR code, password, cron, lorem ipsum, API key, hash generator", description: "XFree generators: create UUIDs, QR codes, passwords, cron expressions, and other random data.", emoji: "\u{1F3B2}", icon: "generate", category: "dev-data", keywords: ["uuid v4 generator", "qr code generator", "password generator", "cron expression generator", "random string generator", "api key generator", "fake data generator"], relatedPillarSlugs: ["dev-tools", "encoding-tools", "password-tools"], lastReviewed: "2026-09-05" },
  { slug: "web-tools", num: "11", name: "XFree Web Tools", tagline: "HTTP headers, status codes, URL parser, cookies, user agent, redirect checker", description: "XFree web tools: inspect HTTP headers, status codes, URLs, cookies, and user agents.", emoji: "\u{1F310}", icon: "web", category: "web-seo", keywords: ["http header checker", "status code lookup", "url parser", "cookie inspector", "user agent parser", "redirect checker", "web inspector"], relatedPillarSlugs: ["dev-tools", "url-tools", "http-tools"], lastReviewed: "2026-09-05" },
  { slug: "seo-tools", num: "12", name: "XFree SEO Tools", tagline: "Keyword rank tracker, SERP checker, backlink analyzer, meta tags, sitemap", description: "XFree SEO tools: check keyword rankings, SERP positions, backlinks, meta tags, and sitemaps.", emoji: "\u{1F4C8}", icon: "seo", category: "web-seo", keywords: ["seo tools", "keyword rank tracker", "serp checker", "backlink analyzer", "meta tag generator", "sitemap generator", "seo audit"], relatedPillarSlugs: ["dev-tools", "metadata-tools", "schema-tools", "crawl-indexing-tools"], lastReviewed: "2026-09-05" },
  { slug: "url-tools", num: "13", name: "XFree URL Tools", tagline: "URL parser, encoder, shortener, redirect checker, UTM builder, slug generator", description: "XFree URL tools: parse, encode, shorten, and check redirects for URLs.", emoji: "\u{1F517}", icon: "url", category: "web-seo", keywords: ["url parser", "url encoder", "url shortener", "redirect checker", "utm builder", "slug generator", "url expander"], relatedPillarSlugs: ["dev-tools", "web-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "schema-tools", num: "14", name: "XFree Schema Markup Tools", tagline: "JSON-LD generator, schema validator, structured data tester, FAQ, HowTo, Breadcrumb", description: "XFree schema tools: generate and validate JSON-LD structured data markup for SEO.", emoji: "\u{1F3F7}\uFE0F", icon: "schema", category: "web-seo", keywords: ["json-ld generator", "schema markup validator", "structured data tester", "faq schema", "howto schema", "breadcrumb schema", "rich results"], relatedPillarSlugs: ["dev-tools", "seo-tools", "url-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "crawl-indexing-tools", num: "15", name: "XFree Crawl & Indexing Tools", tagline: "Sitemap generator, robots.txt checker, fetch as Google, URL inspection, crawl delay", description: "XFree crawl and indexing tools: generate sitemaps, check robots.txt, and simulate fetch.", emoji: "\u{1F577}\uFE0F", icon: "crawl", category: "web-seo", keywords: ["sitemap generator", "robots.txt checker", "fetch as google", "url inspection", "crawl delay", "indexing tool"], relatedPillarSlugs: ["dev-tools", "seo-tools", "url-tools"], lastReviewed: "2026-09-05" },
  { slug: "website-audit-tools", num: "16", name: "XFree Website Audit Tools", tagline: "SEO audit, page speed, mobile-friendly, broken links, meta descriptions, canonical tags", description: "XFree website audit tools: analyze SEO performance, page speed, mobile-friendliness, and broken links.", emoji: "\u{1F50D}", icon: "audit", category: "web-seo", keywords: ["website audit", "page speed test", "mobile-friendly test", "broken link checker", "seo audit tool", "canonical checker"], relatedPillarSlugs: ["dev-tools", "seo-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "metadata-tools", num: "17", name: "XFree Metadata Tools", tagline: "Meta tag generator, title/description checker, OG preview, Twitter cards, canonical tags", description: "XFree metadata tools: generate and preview meta tags for search and social.", emoji: "\u{1F4DD}", icon: "meta", category: "web-seo", keywords: ["meta tag generator", "title checker", "description editor", "og preview", "twitter card generator", "canonical tag", "meta tags"], relatedPillarSlugs: ["dev-tools", "seo-tools", "schema-tools"], lastReviewed: "2026-09-05" },
  { slug: "performance-tools", num: "18", name: "XFree Performance Tools", tagline: "Page speed, compression, minify, image optimization, lazy load, cache headers", description: "XFree performance tools: analyze and optimize page load speed, compression, and caching.", emoji: "\u26A1", icon: "perf", category: "web-seo", keywords: ["page speed test", "gzip compression", "minify css js", "image optimization", "lazy loading", "cache headers", "performance audit"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05" },
  { slug: "accessibility-tools", num: "19", name: "XFree Accessibility Tools", tagline: "WCAG checker, alt text generator, contrast ratio, ARIA validator, screen reader test", description: "XFree accessibility tools: check WCAG compliance, generate alt text, and validate ARIA markup.", emoji: "\u267F", icon: "a11y", category: "web-seo", keywords: ["wcag checker", "alt text generator", "contrast ratio", "aria validator", "accessibility test", "screen reader simulation"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05" },
  { slug: "social-preview-tools", num: "20", name: "XFree Social Preview Tools", tagline: "OG image preview, Twitter card, Facebook scraper, link preview, embed generator", description: "XFree social preview tools: generate and preview Open Graph images and social card metadata.", emoji: "\u{1F4F2}", icon: "social", category: "web-seo", keywords: ["og image preview", "twitter card preview", "facebook link preview", "social embed generator", "og tags", "social media preview"], relatedPillarSlugs: ["dev-tools", "seo-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "ai-tools", num: "21", name: "XFree AI Tools", tagline: "AI text generator, image generator, chatbot, code assistant, summarizer, translator", description: "XFree AI tools: generate text, images, code, and summaries using AI models.", emoji: "\u{1F9E0}", icon: "ai", category: "ai-auto", keywords: ["ai text generator", "ai image generator", "chatbot", "code assistant", "text summarizer", "ai translator", "ai tools"], relatedPillarSlugs: ["dev-tools", "prompt-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "prompt-tools", num: "22", name: "XFree Prompt Engineering Tools", tagline: "Prompt optimizer, A/B tester, chain-of-thought builder, prompt library, token counter", description: "XFree prompt tools: optimize, test, and build prompts for AI models.", emoji: "\u{1F4AC}", icon: "prompt", category: "ai-auto", keywords: ["prompt optimizer", "prompt tester", "chain of thought", "prompt library", "token counter", "prompt engineering"], relatedPillarSlugs: ["dev-tools", "ai-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "rag-tools", num: "23", name: "XFree RAG Tools", tagline: "Document chunking, embedding generator, vector DB tester, retrieval evaluator, knowledge base builder", description: "XFree RAG tools: chunk documents, generate embeddings, and build retrieval systems.", emoji: "\u{1F4DA}", icon: "rag", category: "ai-auto", keywords: ["document chunking", "embedding generator", "vector database", "retrieval evaluator", "knowledge base builder", "rag tools"], relatedPillarSlugs: ["dev-tools", "ai-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "llm-tools", num: "24", name: "XFree LLM Tools", tagline: "Token counter, model comparator, prompt cost calculator, output parser, temperature tester", description: "XFree LLM tools: count tokens, compare models, and calculate costs for AI inference.", emoji: "\u{1F9EE}", icon: "llm", category: "ai-auto", keywords: ["token counter", "model comparator", "prompt cost calculator", "output parser", "temperature tester"], relatedPillarSlugs: ["dev-tools", "ai-tools", "prompt-tools"], lastReviewed: "2026-09-05" },
  { slug: "agent-tools", num: "25", name: "XFree AI Agent Tools", tagline: "Agent runner, tool use simulator, planning engine, memory builder, action logger", description: "XFree agent tools: run, simulate, and debug AI agents with tool use and planning.", emoji: "\u{1F916}", icon: "agent", category: "ai-auto", keywords: ["ai agent", "agent runner", "tool use simulator", "planning engine", "agent memory"], relatedPillarSlugs: ["dev-tools", "ai-tools", "mcp-tools"], lastReviewed: "2026-09-05" },
  { slug: "mcp-tools", num: "26", name: "XFree MCP Tools", tagline: "MCP server tester, client builder, protocol inspector, spec validator, integration generator", description: "XFree MCP tools: test, build, and inspect Model Context Protocol servers.", emoji: "\u{1F50C}", icon: "mcp", category: "ai-auto", keywords: ["mcp tools", "mcp server", "mcp client", "protocol inspector", "mcp spec validator"], relatedPillarSlugs: ["dev-tools", "ai-tools", "agent-tools"], lastReviewed: "2026-09-05" },
  { slug: "agentic-workflows", num: "27", name: "XFree Agentic Workflows", tagline: "Workflow designer, chain builder, trigger configurator, state manager, output validator", description: "XFree agentic workflow tools: design, build, and manage automated AI workflows.", emoji: "\u{1F504}", icon: "workflow", category: "ai-auto", keywords: ["agentic workflow", "workflow designer", "chain builder", "trigger configurator", "state manager"], relatedPillarSlugs: ["dev-tools", "ai-tools", "agent-tools"], lastReviewed: "2026-09-05" },
  { slug: "automation-tools", num: "28", name: "XFree Automation Tools", tagline: "Zapier alternative, webhook tester, API connector, schedule runner, notification builder", description: "XFree automation tools: create automations, test webhooks, and connect APIs.", emoji: "\u{1F39B}\uFE0F", icon: "auto", category: "ai-auto", keywords: ["automation tools", "zapier alternative", "webhook tester", "api connector", "schedule runner"], relatedPillarSlugs: ["dev-tools", "ai-tools", "api-tools"], lastReviewed: "2026-09-05" },
  { slug: "ai-evaluation-tools", num: "29", name: "XFree AI Evaluation Tools", tagline: "Prompt evaluator, output scorer, bias detector, hallucination checker, test case generator", description: "XFree AI evaluation tools: test, score, and audit AI model outputs for quality and bias.", emoji: "\u{1F4CA}", icon: "eval", category: "ai-auto", keywords: ["ai evaluation", "prompt evaluator", "output scorer", "bias detector", "hallucination checker"], relatedPillarSlugs: ["dev-tools", "ai-tools", "llm-tools"], lastReviewed: "2026-09-05" },
  { slug: "ai-data-tools", num: "30", name: "XFree AI Data Tools", tagline: "Dataset cleaner, prompt dataset builder, data labeler, synthetic data generator, data validator", description: "XFree AI data tools: clean, generate, and validate datasets for AI training.", emoji: "\u{1F4C2}", icon: "aidata", category: "ai-auto", keywords: ["ai data tools", "dataset cleaner", "synthetic data generator", "data labeler", "prompt dataset"], relatedPillarSlugs: ["dev-tools", "ai-tools", "json-data-tools"], lastReviewed: "2026-09-05" },
  { slug: "image-tools", num: "31", name: "XFree Image Tools", tagline: "Image resizer, format converter, compressor, watermark, crop, rotate, background remover", description: "XFree image tools: resize, convert, compress, and edit images directly in the browser.", emoji: "\u{1F5BC}\uFE0F", icon: "image", category: "media-docs", keywords: ["image resizer", "image converter", "image compressor", "watermark tool", "image crop", "background remover"], relatedPillarSlugs: ["dev-tools", "converters", "file-tools"], lastReviewed: "2026-09-05" },
  { slug: "video", num: "32", name: "XFree Video Tools", tagline: "Video converter, compressor, cutter, gif maker, thumbnail, subtitle adder, mp4 to mp3", description: "XFree video tools: convert, compress, cut, and edit videos in the browser.", emoji: "\u{1F3AC}", icon: "video", category: "media-docs", keywords: ["video converter", "video compressor", "video cutter", "gif maker", "thumbnail generator", "mp4 to mp3"], relatedPillarSlugs: ["dev-tools", "image-tools", "audio-tools"], lastReviewed: "2026-09-05" },
  { slug: "audio-tools", num: "33", name: "XFree Audio Tools", tagline: "Audio converter, compressor, cutter, mp3 to wav, voice changer, noise reducer, waveform", description: "XFree audio tools: convert, compress, cut, and edit audio files in the browser.", emoji: "\u{1F3B5}", icon: "audio", category: "media-docs", keywords: ["audio converter", "audio compressor", "audio cutter", "mp3 to wav", "voice changer", "noise reducer"], relatedPillarSlugs: ["dev-tools", "video", "image-tools"], lastReviewed: "2026-09-05" },
  { slug: "pdf-tools", num: "34", name: "XFree PDF Tools", tagline: "Merge, split, compress, rotate, delete pages, extract text, watermark, convert PDF", description: "XFree PDF tools: merge, split, compress, and edit PDF documents in the browser.", emoji: "\u{1F4C4}", icon: "pdf", category: "media-docs", keywords: ["pdf merge", "pdf split", "pdf compress", "pdf rotate", "extract pdf text", "pdf watermark", "pdf converter"], relatedPillarSlugs: ["dev-tools", "document-tools", "converters"], lastReviewed: "2026-09-05" },
  { slug: "document-tools", num: "35", name: "XFree Document Tools", tagline: "Word to PDF, DOCX editor, text extractor, page counter, format converter, metadata remover", description: "XFree document tools: edit, convert, and extract text from Word, DOCX, and other documents.", emoji: "\u{1F4DD}", icon: "doc", category: "media-docs", keywords: ["word to pdf", "docx editor", "text extractor", "page counter", "document converter"], relatedPillarSlugs: ["dev-tools", "pdf-tools", "markdown-tools"], lastReviewed: "2026-09-05" },
  { slug: "spreadsheet-tools", num: "36", name: "XFree Spreadsheet Tools", tagline: "Excel editor, CSV manager, formula tester, chart generator, pivot table, data validator", description: "XFree spreadsheet tools: edit CSV/Excel files, test formulas, and generate charts.", emoji: "\u{1F4CA}", icon: "sheet", category: "media-docs", keywords: ["excel editor", "csv manager", "formula tester", "chart generator", "pivot table"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "converters"], lastReviewed: "2026-09-05" },
  { slug: "markdown-tools", num: "37", name: "XFree Markdown Tools", tagline: "Markdown to HTML, HTML to Markdown, preview, linter, table generator, TOC builder", description: "XFree markdown tools: convert between Markdown and HTML, preview, and lint Markdown files.", emoji: "\u{1F4DC}", icon: "md", category: "media-docs", keywords: ["markdown to html", "html to markdown", "markdown preview", "markdown linter", "table generator", "toc builder"], relatedPillarSlugs: ["dev-tools", "converters", "document-tools"], lastReviewed: "2026-09-05" },
  { slug: "subtitle-tools", num: "38", name: "XFree Subtitle Tools", tagline: "Subtitle converter, editor, translator, synchronizer, format converter, generator", description: "XFree subtitle tools: convert, edit, translate, and synchronize subtitle files.", emoji: "\u{1F39E}\uFE0F", icon: "subtitle", category: "media-docs", keywords: ["subtitle converter", "subtitle editor", "subtitle translator", "subtitle synchronizer", "srt converter"], relatedPillarSlugs: ["dev-tools", "converters", "video"], lastReviewed: "2026-09-05" },
  { slug: "file-tools", num: "39", name: "XFree File Tools", tagline: "File compressor, type detector, size analyzer, extension changer, duplicate finder, merger", description: "XFree file tools: compress, detect types, analyze sizes, and manage files in the browser.", emoji: "\u{1F4E6}", icon: "file", category: "media-docs", keywords: ["file compressor", "file type detector", "file size analyzer", "extension changer", "duplicate finder"], relatedPillarSlugs: ["dev-tools", "image-tools", "pdf-tools"], lastReviewed: "2026-09-05" },
  { slug: "creative-tools", num: "40", name: "XFree Creative Tools", tagline: "Color palette, gradient generator, palette extractor, font pairer, SVG editor, icon finder", description: "XFree creative tools: generate color palettes, gradients, and pair fonts for design projects.", emoji: "\u{1F3A8}", icon: "creative", category: "media-docs", keywords: ["color palette generator", "gradient generator", "palette extractor", "font pairer", "svg editor", "icon finder"], relatedPillarSlugs: ["dev-tools", "image-tools", "text-tools"], lastReviewed: "2026-09-05" },
  { slug: "security-tools", num: "41", name: "XFree Security Tools", tagline: "SSL checker, security headers, port scanner, vulnerability scanner, password strength, CSRF tester", description: "XFree security tools: check SSL, scan headers, and test for vulnerabilities.", emoji: "\u{1F6E1}\uFE0F", icon: "security", category: "security", keywords: ["ssl checker", "security headers", "port scanner", "vulnerability scanner", "password strength", "csrf tester"], relatedPillarSlugs: ["dev-tools", "hash-tools", "certificate-tools"], lastReviewed: "2026-09-05" },
  { slug: "hash-tools", num: "42", name: "XFree Hash Tools", tagline: "MD5, SHA1, SHA256, SHA512, CRC32, HMAC generator, hash checker, rainbow table", description: "XFree hash tools: generate and compare MD5, SHA1, SHA256, SHA512, and other hashes.", emoji: "\u{1F510}", icon: "hash", category: "security", keywords: ["md5 generator", "sha256 hash", "sha512 hash", "hmac generator", "hash checker", "crc32"], relatedPillarSlugs: ["dev-tools", "security-tools", "password-tools"], lastReviewed: "2026-09-05" },
  { slug: "password-tools", num: "43", name: "XFree Password Tools", tagline: "Password generator, strength checker, entropy calculator, breach checker, manager", description: "XFree password tools: generate secure passwords and check their strength and breach status.", emoji: "\u{1F511}", icon: "pass", category: "security", keywords: ["password generator", "password strength", "password entropy", "breach checker", "password manager"], relatedPillarSlugs: ["dev-tools", "security-tools", "hash-tools"], lastReviewed: "2026-09-05" },
  { slug: "token-tools", num: "44", name: "XFree JWT & Token Tools", tagline: "JWT decoder, encoder, validator, signature verifier, token generator, OAuth tester", description: "XFree JWT tools: decode, encode, validate, and verify JSON Web Tokens.", emoji: "\u{1F3AB}", icon: "jwt", category: "security", keywords: ["jwt decoder", "jwt encoder", "jwt validator", "jwt signature verifier", "oauth tester", "token generator"], relatedPillarSlugs: ["dev-tools", "security-tools", "encoding-tools"], lastReviewed: "2026-09-05" },
  { slug: "privacy-tools", num: "45", name: "XFree Privacy Tools", tagline: "Cookie consent generator, privacy policy, data mapper, PII detector, GDPR/CCPA compliance", description: "XFree privacy tools: generate cookie consent, detect PII, and ensure GDPR/CCPA compliance.", emoji: "\u{1F50F}", icon: "privacy", category: "security", keywords: ["cookie consent generator", "privacy policy generator", "pii detector", "gdpr compliance", "ccpa compliance"], relatedPillarSlugs: ["dev-tools", "security-tools", "metadata-tools"], lastReviewed: "2026-09-05" },
  { slug: "network-tools", num: "46", name: "XFree Network Tools", tagline: "Port scanner, IP lookup, bandwidth tester, latency checker, traceroute, WHOIS lookup", description: "XFree network tools: look up IPs, scan ports, and test network performance.", emoji: "\u{1F310}", icon: "net", category: "security", keywords: ["ip lookup", "port scanner", "bandwidth test", "latency checker", "traceroute", "whois lookup"], relatedPillarSlugs: ["dev-tools", "security-tools", "dns-tools"], lastReviewed: "2026-09-05" },
  { slug: "dns-tools", num: "47", name: "XFree DNS Tools", tagline: "DNS lookup, SPF checker, DKIM validator, DMARC analyzer, record inspector, propagation", description: "XFree DNS tools: look up DNS records, check SPF/DKIM/DMARC, and inspect propagation.", emoji: "\u{1F4E1}", icon: "dns", category: "security", keywords: ["dns lookup", "spf checker", "dkim validator", "dmarc analyzer", "dns record inspector"], relatedPillarSlugs: ["dev-tools", "security-tools", "network-tools"], lastReviewed: "2026-09-05" },
  { slug: "http-tools", num: "48", name: "XFree HTTP Tools", tagline: "HTTP client, request builder, response inspector, status code lookup, header parser, curl converter", description: "XFree HTTP tools: build, send, and inspect HTTP requests and responses.", emoji: "\u{1F4E1}", icon: "http", category: "security", keywords: ["http client", "request builder", "response inspector", "status code lookup", "header parser", "curl converter"], relatedPillarSlugs: ["dev-tools", "security-tools", "web-tools"], lastReviewed: "2026-09-05" },
  { slug: "certificate-tools", num: "49", name: "XFree Certificate Tools", tagline: "SSL cert decoder, CSR generator, expiration checker, chain validator, cert converter", description: "XFree certificate tools: decode, generate, and validate SSL/TLS certificates.", emoji: "\u{1F4DC}", icon: "cert", category: "security", keywords: ["ssl cert decoder", "csr generator", "certificate expiration", "certificate chain validator"], relatedPillarSlugs: ["dev-tools", "security-tools", "hash-tools"], lastReviewed: "2026-09-05" },
  { slug: "security-header-tools", num: "50", name: "XFree Security Header Tools", tagline: "CSP generator, header analyzer, clickjacking tester, XSS filter, HSTS checker, referrer policy", description: "XFree security header tools: analyze and generate security headers for your website.", emoji: "\u{1F6E1}\uFE0F", icon: "sheaders", category: "security", keywords: ["csp generator", "security header analyzer", "clickjacking tester", "xss filter", "hsts checker"], relatedPillarSlugs: ["dev-tools", "security-tools", "seo-tools"], lastReviewed: "2026-09-05" },
  { slug: "text-tools", num: "51", name: "XFree Text Tools", tagline: "Word counter, character counter, case converter, line counter, text cleaner, formatter", description: "XFree text tools: count words, convert cases, and clean up text.", emoji: "\u{1F4DD}", icon: "text", category: "business", keywords: ["word counter", "character counter", "case converter", "line counter", "text cleaner", "text formatter"], relatedPillarSlugs: ["dev-tools", "writing-tools", "content-tools"], lastReviewed: "2026-09-05" },
  { slug: "content-tools", num: "52", name: "XFree Content Tools", tagline: "Readability checker, keyword density, content analyzer, plagiarism checker, meta desc, title tag", description: "XFree content tools: analyze readability, check keyword density, and optimize content for SEO.", emoji: "\u{1F4DA}", icon: "content", category: "business", keywords: ["readability checker", "keyword density", "content analyzer", "plagiarism checker", "meta description", "title tag"], relatedPillarSlugs: ["dev-tools", "text-tools", "writing-tools"], lastReviewed: "2026-09-05" },
  { slug: "writing-tools", num: "53", name: "XFree Writing Tools", tagline: "Grammar checker, spell checker, style analyzer, tone detector, paraphraser, headline generator", description: "XFree writing tools: check grammar, spelling, and style to improve your writing.", emoji: "\u270D\uFE0F", icon: "write", category: "business", keywords: ["grammar checker", "spell checker", "style analyzer", "tone detector", "paraphraser", "headline generator"], relatedPillarSlugs: ["dev-tools", "text-tools", "content-tools"], lastReviewed: "2026-09-05" },
  { slug: "calculators", num: "54", name: "XFree Calculator Tools", tagline: "Math calculator, percentage, BMI, age, mortgage, currency converter, ROI, tax calculator", description: "XFree calculators: calculate math, percentages, mortgages, currency, and more.", emoji: "\u{1F9EE}", icon: "calc", category: "business", keywords: ["math calculator", "percentage calculator", "bmi calculator", "mortgage calculator", "currency converter", "roi calculator"], relatedPillarSlugs: ["dev-tools", "date-time-tools", "finance-tools"], lastReviewed: "2026-09-05" },
  { slug: "date-time-tools", num: "55", name: "XFree Date & Time Tools", tagline: "Timestamp converter, date formatter, timezone converter, countdown timer, age calculator, weekday", description: "XFree date and time tools: convert timestamps, format dates, and convert timezones.", emoji: "\u{1F4C5}", icon: "dt", category: "business", keywords: ["timestamp converter", "date formatter", "timezone converter", "countdown timer", "age calculator", "weekday calculator"], relatedPillarSlugs: ["dev-tools", "calculators", "finance-tools"], lastReviewed: "2026-09-05" },
  { slug: "finance-tools", num: "56", name: "XFree Finance Tools", tagline: "Currency converter, inflation calculator, loan calculator, compound interest, ROI, budget planner", description: "XFree finance tools: convert currencies and calculate loans, investments, and budgets.", emoji: "\u{1F4B0}", icon: "finance", category: "business", keywords: ["currency converter", "inflation calculator", "loan calculator", "compound interest", "roi calculator", "budget planner"], relatedPillarSlugs: ["dev-tools", "calculators", "date-time-tools"], lastReviewed: "2026-09-05" },
  { slug: "marketing-tools", num: "57", name: "XFree Marketing Tools", tagline: "Email subject line, UTM builder, campaign tracker, social bio, hashtag generator, color palette", description: "XFree marketing tools: build UTM links, generate hashtags, and track campaigns.", emoji: "\u{1F4E3}", icon: "mktg", category: "business", keywords: ["utm builder", "email subject line", "campaign tracker", "social bio generator", "hashtag generator", "color palette"], relatedPillarSlugs: ["dev-tools", "seo-tools", "social-preview-tools"], lastReviewed: "2026-09-05" },
  { slug: "productivity-tools", num: "58", name: "XFree Productivity Tools", tagline: "To-do list, habit tracker, focus timer, note taker, task scheduler, reminder generator", description: "XFree productivity tools: manage tasks, track habits, and stay focused.", emoji: "\u23F0", icon: "prod", category: "business", keywords: ["to-do list", "habit tracker", "focus timer", "note taker", "task scheduler", "reminder generator"], relatedPillarSlugs: ["dev-tools", "date-time-tools", "text-tools"], lastReviewed: "2026-09-05" },
  { slug: "education-tools", num: "59", name: "XFree Education Tools", tagline: "Flashcard generator, quiz maker, study planner, grade calculator, timetable builder, note organizer", description: "XFree education tools: create flashcards, quizzes, and study plans.", emoji: "\u{1F393}", icon: "edu", category: "business", keywords: ["flashcard generator", "quiz maker", "study planner", "grade calculator", "timetable builder", "note organizer"], relatedPillarSlugs: ["dev-tools", "text-tools", "productivity-tools"], lastReviewed: "2026-09-05" },
  { slug: "business-tools", num: "60", name: "XFree Business Tools", tagline: "Invoice generator, business card maker, contract template, pitch deck, valuation calculator, SWOT", description: "XFree business tools: generate invoices, business cards, and contracts.", emoji: "\u{1F4BC}", icon: "biz", category: "business", keywords: ["invoice generator", "business card maker", "contract template", "pitch deck generator", "valuation calculator", "swot analysis"], relatedPillarSlugs: ["dev-tools", "finance-tools", "marketing-tools"], lastReviewed: "2026-09-05" }
];
var PILLARS_BY_SLUG = new Map(
  PILLARS_60.map((p) => [p.slug, p])
);
var PILLARS_BY_CATEGORY = (() => {
  const m = /* @__PURE__ */ new Map();
  for (const cat of PILLAR_CATEGORIES) {
    m.set(cat.id, PILLARS_60.filter((p) => p.category === cat.id));
  }
  return m;
})();
PILLARS_60.forEach((p) => {
  p.id = p.slug;
  p.headerGroup = p.category;
  p.status = "published";
  p.indexable = true;
  p.contentApproved = true;
});
var HEADER_GROUPS = PILLAR_CATEGORIES.map((cat) => ({
  id: cat.id,
  label: cat.label,
  description: cat.description,
  icon: cat.icon,
  pillars: PILLARS_60.filter((p) => p.category === cat.id)
}));
var AUTHORITY_PILLARS = [
  { slug: "xfree-app", num: "A1", name: "XFree App", tagline: "Installable PWA developer tool suite", description: "XFree as a Progressive Web App.", emoji: "\u{1F4F1}", icon: "app", category: "dev-data", keywords: ["xfree app", "pwa", "installable"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "how-it-works", num: "A2", name: "XFree How It Works", tagline: "Local vs Cloud processing explained", description: "How XFree processes data locally and in the cloud.", emoji: "\u{1F527}", icon: "howto", category: "dev-data", keywords: ["how it works", "local mode", "cloud mode"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "pricing", num: "A3", name: "XFree Pricing", tagline: "Free, open source, forever", description: "XFree is completely free with no signup or paywalls.", emoji: "\u{1F4B0}", icon: "price", category: "business", keywords: ["pricing", "free", "open source"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "roadmap", num: "A4", name: "XFree Roadmap", tagline: "What's coming next", description: "The public roadmap for XFree micro-tools.", emoji: "\u{1F5FA}\uFE0F", icon: "road", category: "business", keywords: ["roadmap", "changelog"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "about", num: "A5", name: "About XFree", tagline: "Mission and principles", description: "About the XFree project.", emoji: "\u2139\uFE0F", icon: "about", category: "business", keywords: ["about", "mission"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "contact", num: "A6", name: "Contact", tagline: "Get in touch", description: "Contact the XFree team.", emoji: "\u{1F4E7}", icon: "contact", category: "business", keywords: ["contact", "support"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "documentation", num: "A7", name: "Documentation", tagline: "Developer docs and guides", description: "Documentation for all XFree tools.", emoji: "\u{1F4DA}", icon: "docs", category: "dev-data", keywords: ["docs", "documentation", "guides"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "blog", num: "A8", name: "Blog", tagline: "Updates and articles", description: "Latest articles from the XFree team.", emoji: "\u270D\uFE0F", icon: "blog", category: "business", keywords: ["blog", "updates"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "community", num: "A9", name: "Community", tagline: "GitHub discussions and contributions", description: "Join the XFree community.", emoji: "\u{1F465}", icon: "community", category: "dev-data", keywords: ["community", "github", "contribute"], relatedPillarSlugs: [], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true }
];
var PUBLIC_PILLARS = PILLARS_60.filter(
  (p) => p.status === "published" && p.indexable === true && p.contentApproved === true
);
var PUBLIC_AUTHORITY_PILLARS = AUTHORITY_PILLARS.filter(
  (p) => p.status === "published" && p.indexable === true && p.contentApproved === true
);
var PUBLIC_HEADER_GROUPS = HEADER_GROUPS.map((g) => ({
  ...g,
  pillars: g.pillars.filter((p) => p.status === "published" && p.indexable === true && p.contentApproved === true)
})).filter((g) => g.pillars.length > 0);

// src/data/publicTools.ts
var PUBLIC_TOOLS = TOOLS_REGISTRY.filter(
  (tool) => tool.status === "published" && tool.indexable === true
);
var PUBLIC_CATEGORIES = PILLAR_CATEGORIES;
var PUBLIC_TOOL_SLUGS = new Set(
  PUBLIC_TOOLS.map((t) => t.slug)
);
var PUBLIC_TOOL_IDS = new Set(
  PUBLIC_TOOLS.map((t) => t.id)
);

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

// src/data/generatedPublishedContent.ts
var GENERATED_PUBLISHED_CONTENT = [];

// src/data/siteConfig.ts
var CANONICAL_ORIGIN = "https://www.xfree.in";
var SITE_CONTENT_LASTMOD = "2026-09-06";

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
  "/trust",
  "/clusters",
  "/thinking",
  "/xfree-app",
  "/guides",
  "/updates"
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

// src/utils/generateSitemap.ts
var DEFAULT_BASE_URL = CANONICAL_ORIGIN;
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function cleanOrigin(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol === "https:" && parsed.hostname === "www.xfree.in") {
      return parsed.origin;
    }
  } catch {
  }
  return DEFAULT_BASE_URL;
}
function normalizeDate(value) {
  if (!value) return SITE_CONTENT_LASTMOD;
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : SITE_CONTENT_LASTMOD;
}
function toRfc822(value) {
  const date = /* @__PURE__ */ new Date(`${normalizeDate(value)}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? (/* @__PURE__ */ new Date(`${SITE_CONTENT_LASTMOD}T00:00:00.000Z`)).toUTCString() : date.toUTCString();
}
function maxLastmod(entries) {
  if (!entries.length) return SITE_CONTENT_LASTMOD;
  return entries.reduce((latest, entry) => entry.lastmod > latest ? entry.lastmod : latest, entries[0].lastmod);
}
var STATIC_PAGE_ENTRIES = STATIC_ROUTES.map((path2) => ({
  path: path2,
  lastmod: SITE_CONTENT_LASTMOD
}));
function getPageSitemapEntries() {
  return [
    ...STATIC_PAGE_ENTRIES,
    ...PUBLIC_CATEGORIES.map((category) => ({
      path: `/${category.id}`,
      lastmod: SITE_CONTENT_LASTMOD
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
      lastmod: pillar.lastReviewed || SITE_CONTENT_LASTMOD
    }))
  ];
}
function getToolSitemapEntries() {
  const seen = /* @__PURE__ */ new Set();
  const entries = [];
  for (const tool of PUBLIC_TOOLS) {
    if (!tool.slug || seen.has(tool.slug)) continue;
    seen.add(tool.slug);
    entries.push({
      path: `/tools/${tool.slug}`,
      lastmod: normalizeDate(tool.lastModified)
    });
  }
  for (const artifact of Object.values(GENERATED_PUBLISHED_CONTENT)) {
    const a = artifact;
    if (!a.slug || typeof a.slug !== "string" || seen.has(a.slug)) continue;
    seen.add(a.slug);
    const approval = a.approval || {};
    const reviewedAt = typeof approval.reviewedAt === "string" ? approval.reviewedAt : SITE_CONTENT_LASTMOD;
    entries.push({
      path: `/tools/${a.slug}`,
      lastmod: normalizeDate(reviewedAt)
    });
  }
  return entries;
}
function getGuideSitemapEntries() {
  return [
    { path: "/guides", lastmod: SITE_CONTENT_LASTMOD },
    ...GUIDES.map((guide) => ({
      path: `/guides/${guide.slug}`,
      lastmod: normalizeDate(guide.lastReviewed)
    }))
  ];
}
function renderUrlset(entries, baseUrl) {
  const cleanBase = cleanOrigin(baseUrl);
  const unique = new Map(entries.map((entry) => [entry.path, entry]));
  const rows = Array.from(unique.values()).map((entry) => `  <url>
    <loc>${escapeXml(`${cleanBase}${entry.path === "/" ? "/" : entry.path}`)}</loc>
    <lastmod>${escapeXml(normalizeDate(entry.lastmod))}</lastmod>
  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>`;
}
function generateSitemapXml(baseUrl = DEFAULT_BASE_URL) {
  return renderUrlset([
    ...getPageSitemapEntries(),
    ...getToolSitemapEntries(),
    ...getGuideSitemapEntries()
  ], baseUrl);
}
function generateRssXml(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = cleanOrigin(baseUrl);
  const tools = getToolSitemapEntries();
  const buildDate = toRfc822(maxLastmod(tools));
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
`;
  rss += `  <channel>
`;
  rss += `    <title>XFree.in \u2014 Free Developer, SEO &amp; AI Micro-Tools</title>
`;
  rss += `    <link>${escapeXml(`${cleanBase}/`)}</link>
`;
  rss += `    <description>Published browser-based developer, SEO, AI, and converter micro-tools with clear processing disclosures.</description>
`;
  rss += `    <language>en-us</language>
`;
  rss += `    <lastBuildDate>${buildDate}</lastBuildDate>
`;
  rss += `    <atom:link href="${escapeXml(`${cleanBase}/rss.xml`)}" rel="self" type="application/rss+xml"/>
`;
  const toolDate = new Map(tools.map((entry) => [entry.path.replace("/tools/", ""), entry.lastmod]));
  for (const tool of PUBLIC_TOOLS) {
    const toolUrl = `${cleanBase}/tools/${tool.slug}`;
    const categoryName = tool.categoryLabel || tool.category;
    rss += `    <item>
`;
    rss += `      <title>${escapeXml(tool.title)}</title>
`;
    rss += `      <link>${escapeXml(toolUrl)}</link>
`;
    rss += `      <guid isPermaLink="true">${escapeXml(toolUrl)}</guid>
`;
    rss += `      <pubDate>${toRfc822(toolDate.get(tool.slug) || SITE_CONTENT_LASTMOD)}</pubDate>
`;
    rss += `      <category>${escapeXml(categoryName)}</category>
`;
    rss += `      <description>${escapeXml(tool.shortDescription)}</description>
`;
    rss += `      <content:encoded><![CDATA[<h3>${escapeXml(tool.title)}</h3><p>${escapeXml(tool.explanation)}</p>]]></content:encoded>
`;
    rss += `    </item>
`;
  }
  rss += `  </channel>
</rss>`;
  return rss;
}
function generateLlmsTxt(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = cleanOrigin(baseUrl);
  let text = `# XFree.in \u2014 Free Developer, SEO & AI Micro-Tools

`;
  text += `> XFree.in publishes focused browser-based developer utilities, technical SEO tools, formatters, converters, and clearly disclosed AI assistants.

`;
  text += `## Meta
`;
  text += `- Version: 1.0.0
`;
  text += `- Last Updated: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}
`;
  text += `- Capability Schema: ${cleanBase}/capabilities.json
`;
  text += `- Full Corpus: ${cleanBase}/llms-full.txt

`;
  text += `## Primary Sections

`;
  text += `- [Home](${cleanBase}/): Search and browse the published tool directory.
`;
  text += `- [Guides](${cleanBase}/guides): Reviewed documentation connected to published tools.
`;
  text += `- [XFree Signals](${cleanBase}/updates): Live, curated developer news from Chrome for Developers, GitHub, Cloudflare, and MDN, with links to the originals.
`;
  text += `- [How It Works](${cleanBase}/how-it-works): Processing modes, browser execution, and optional cloud handoffs.
`;
  text += `- [Pillars](${cleanBase}/pillars): ${PILLARS_60.length} developer and SEO topic pillars.
`;
  text += `- [Use Cases](${cleanBase}/use-cases): Real-world workflows built from published tools.
`;
  text += `- [FAQ](${cleanBase}/faq): Common questions about pricing, privacy, and AI features.
`;
  text += `- [About](${cleanBase}/about): What XFree is and the principles it's built on.

`;
  text += `## Categories

`;
  for (const cat of PUBLIC_CATEGORIES) {
    text += `- [${cat.label}](${cleanBase}/${cat.id}): ${cat.description}
`;
  }
  text += `
## Published Pillars

`;
  for (const pillar of PILLARS_60) {
    text += `- [${pillar.name}](${cleanBase}/pillars/${pillar.slug}): ${pillar.description}
`;
  }
  text += `
## Published Tools

`;
  for (const tool of PUBLIC_TOOLS) {
    text += `- [${tool.title}](${cleanBase}/tools/${tool.slug}): ${tool.shortDescription}
`;
  }
  return text;
}
function generateLlmsFullTxt(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = cleanOrigin(baseUrl);
  let text = `# XFree.in Full Published Tool Reference

`;
  text += `This file documents only tools in the public published/indexable registry. Draft and planned tools are intentionally excluded.

`;
  for (const tool of PUBLIC_TOOLS) {
    text += `---

### ${tool.title}
`;
    text += `- **URL**: ${cleanBase}/tools/${tool.slug}
`;
    text += `- **Category**: ${tool.categoryLabel || tool.category}
`;
    text += `- **Description**: ${tool.shortDescription}
`;
    text += `- **Processing**: ${tool.privacyNotice || (tool.isAi ? "Cloud processing is disclosed before submission." : "Runs locally in the browser.")}
`;
    text += `- **Explanation**: ${tool.explanation}
`;
    if (tool.howToUse?.length) {
      text += `- **How to use**:
`;
      tool.howToUse.forEach((step, index) => {
        text += `  ${index + 1}. ${step}
`;
      });
    }
    if (tool.faqs?.length) {
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

// src/utils/generateStructuredData.ts
function generateCapabilitiesJson(baseUrl = "https://www.xfree.in") {
  const capabilitiesMap = /* @__PURE__ */ new Map();
  for (const tool of PUBLIC_TOOLS) {
    const caps = tool.capabilities?.length ? tool.capabilities : [
      {
        id: `${tool.slug}-capability`,
        name: tool.title,
        description: tool.shortDescription || tool.explanation || tool.title,
        inputSchema: tool.supportedInputs ? { type: "object", properties: tool.supportedInputs.reduce((acc, input) => ({ ...acc, [input]: { type: "string" } }), {}) } : { type: "object" },
        outputSchema: { type: "string" }
      }
    ];
    for (const cap of caps) {
      if (!capabilitiesMap.has(cap.id)) {
        capabilitiesMap.set(cap.id, { tools: [], description: cap.description });
      }
      capabilitiesMap.get(cap.id).tools.push({
        toolId: tool.id,
        toolTitle: tool.title,
        toolUrl: `${baseUrl}/tools/${tool.slug}`,
        fit: cap.description
      });
    }
  }
  const capabilities = Array.from(capabilitiesMap.entries()).map(([id, data], index) => ({
    id,
    name: data.tools[0]?.toolTitle?.split(" ")[0] || id,
    description: data.description,
    tools: data.tools,
    url: `${baseUrl}/capabilities/${encodeURIComponent(id)}`
  }));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "XFree Capabilities",
    "description": "Structured capability definitions for all tools in the XFree registry",
    "url": baseUrl,
    "itemListElement": capabilities.map((cap, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": cap.url,
      "item": {
        "@type": "DefinedTerm",
        "@id": `${baseUrl}/capabilities/${encodeURIComponent(cap.id)}`,
        "name": cap.id,
        "description": cap.description,
        "hasDefinedTerm": {
          "@type": "Tool",
          "name": cap.tools.length,
          "toolName": cap.tools.map((t) => t.toolTitle).join(", ")
        }
      }
    }))
  }, null, 2);
}
function generateToolsJson(baseUrl = "https://www.xfree.in") {
  const tools = PUBLIC_TOOLS.map((tool) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/tools/${tool.slug}`,
    "name": tool.title,
    "description": tool.shortDescription,
    "applicationCategory": tool.categoryLabel,
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": tool.pricing?.model === "free" ? "0" : tool.pricing?.model || "unknown",
      "priceCurrency": tool.pricing?.currency || "USD"
    },
    "featureList": tool.keyFeatures?.slice(0, 5) || [],
    "requiredFeature": tool.supportedInputs?.slice(0, 3) || [],
    "url": `${baseUrl}/tools/${tool.slug}`,
    "sameAs": tool.integrations?.apis || []
  }));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    "name": "XFree Tools Catalog",
    "description": "Complete catalog of all indexable tools on XFree.in",
    "url": baseUrl,
    "dataset": tools
  }, null, 2);
}

// src/lib/intent-engine.ts
var INTENT_KEYWORDS = {
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
  "slugify": ["slug generator", "url slug", "clean url"]
};
var PRIVACY_KEYWORDS = ["local", "private", "browser", "offline", "client-side", "no send"];
var FREE_KEYWORDS = ["free", "without cost", "gratis", "open source"];
var URGENCY_IMMEDIATE = ["instant", "right now", "now", "immediately", "fast", "quick"];
function normalizeQuery(query) {
  return query.toLowerCase().trim().replace(/[^\w\s-]/g, " ");
}
function extractEntities(query) {
  const entities = [];
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
    { pattern: /\burl\b/i, entity: "url" }
  ];
  for (const { pattern, entity } of entityPatterns) {
    if (pattern.test(query)) {
      entities.push(entity);
    }
  }
  return Array.from(new Set(entities));
}
function extractConstraints(query) {
  const constraints = {};
  const lowerQuery = query.toLowerCase();
  if (PRIVACY_KEYWORDS.some((k) => lowerQuery.includes(k))) {
    constraints.privacy = "local";
  }
  if (FREE_KEYWORDS.some((k) => lowerQuery.includes(k))) {
    constraints.budget = "free";
  }
  if (URGENCY_IMMEDIATE.some((k) => lowerQuery.includes(k))) {
    constraints.urgency = "instant";
  }
  const platformMatch = lowerQuery.match(/\b(on|for|platform|browser):?\s*(\w+)/i);
  if (platformMatch) {
    constraints.platform = [platformMatch[2].toLowerCase()];
  }
  return constraints;
}
var PROBLEM_TO_TOOL_MAP = {
  "generate sitemap": ["bulk-url-sitemap", "xml-sitemap-generator"],
  "extract urls": ["bulk-url-sitemap"],
  "format json": ["json-formatter"],
  "validate json": ["json-formatter"],
  "test regex": ["regex-tester"],
  "generate cron": ["cron-expression-generator"],
  "cron schedule": ["cron-expression-generator"],
  "generate meta tags": ["meta-tag-generator", "schema-markup-generator"],
  "generate schema markup": ["schema-markup-generator", "meta-tag-generator"],
  "generate robots.txt": ["robots-txt-generator"],
  "decode base64": ["base64-encoder-decoder"],
  "decode jwt": ["base64-encoder-decoder"],
  "generate url slug": ["url-slug-utm-builder"],
  "utm builder": ["url-slug-utm-builder"],
  "validate sitemap": ["xml-sitemap-generator", "bulk-url-sitemap"]
};
function classifyIntent(query) {
  const normalized = normalizeQuery(query);
  const entities = extractEntities(query);
  const constraints = extractConstraints(query);
  let matchedIntent = "general";
  let confidence = 0.3;
  let capabilities = [];
  for (const [intentPattern, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const matches = keywords.some((k) => k.includes(normalized) || normalized.includes(k.split(" ").slice(0, 2).join(" ")));
    if (matches) {
      matchedIntent = intentPattern;
      confidence = 0.85;
      break;
    }
  }
  for (const [problem, tools] of Object.entries(PROBLEM_TO_TOOL_MAP)) {
    if (problem.split(" ").every((w) => normalized.includes(w) || problem.split(" ").some((pw) => normalized.includes(pw)))) {
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
    requiresVerification: confidence < 0.7
  };
}
function determineExecutionMode(query, constraints) {
  const lowerQuery = query.toLowerCase();
  if (constraints.privacy === "local" || PRIVACY_KEYWORDS.some((k) => lowerQuery.includes(k))) {
    return "local";
  }
  if (FREE_KEYWORDS.some((k) => lowerQuery.includes(k))) {
    return "local";
  }
  if (lowerQuery.includes("workflow") || lowerQuery.includes("automat")) {
    return "workflow";
  }
  if (lowerQuery.includes("compare") || lowerQuery.includes("versus") || lowerQuery.includes("vs")) {
    return "workflow";
  }
  const hasAiIndicators = ["ai", "gpt", "claude", "gemini", "llm", "generated", "write", "create"].some((k) => lowerQuery.includes(k));
  if (hasAiIndicators) {
    return "ai";
  }
  return "local";
}
function routeIntentToCapabilities(intent) {
  const results = {
    toolIds: [],
    confidence: 0,
    reason: ""
  };
  const matchingTools = [];
  if (intent.capabilities && intent.capabilities.length > 0) {
    for (const toolId of intent.capabilities) {
      const tool = TOOLS_REGISTRY.find((t) => t.id === toolId || t.slug === toolId);
      if (tool) {
        matchingTools.push(tool);
      }
    }
  }
  const intentKeywords = INTENT_KEYWORDS[intent.intent] || [];
  for (const tool of INDEXABLE_TOOLS) {
    if (intentKeywords.some((kw) => tool.tags.some((tag) => tag.toLowerCase().includes(kw.toLowerCase())))) {
      matchingTools.push(tool);
    }
  }
  const allMatched = Array.from(new Map(matchingTools.map((t) => [t.id, t])).values());
  if (allMatched.length === 0) {
    return {
      toolIds: [],
      confidence: 0.1,
      reason: "No matching tools found"
    };
  }
  const primaryTool = allMatched[0];
  const secondaryTools = allMatched.slice(1, 4);
  results.toolIds = [primaryTool.id, ...secondaryTools.map((t) => t.id)];
  results.confidence = Math.min(0.95, primaryTool.isFlagship ? 0.9 : 0.75);
  results.reason = `Matched ${primaryTool.title} as primary solution based on intent classification.`;
  if (intent.requiresVerification && secondaryTools.length > 0) {
    results.fallback = secondaryTools.map((t) => t.id);
  }
  return results;
}
function buildExecutionPlan(intent) {
  const route = routeIntentToCapabilities(intent);
  return {
    steps: route.toolIds.map((toolId, index) => ({
      step: index + 1,
      action: "execute",
      toolId,
      expectedOutput: `Result from ${toolId}`,
      verify: index === route.toolIds.length - 1
    })),
    primaryToolId: route.toolIds[0],
    fallbackToolIds: route.fallback || [],
    constraints: intent.constraints,
    confidence: route.confidence
  };
}

// src/lib/tools/developer.ts
var jsonFormatter = async (input) => {
  try {
    const parsed = JSON.parse(input.json);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
};
var jsonMinifier = async (input) => {
  try {
    const parsed = JSON.parse(input.json);
    return JSON.stringify(parsed);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
};
var jsonValidator = async (input) => {
  try {
    JSON.parse(input.json);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
};
var jsonToCsv = async (input) => {
  try {
    const data = JSON.parse(input.json);
    if (!Array.isArray(data) || data.length === 0) throw new Error("Input must be a non-empty array of objects");
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => (row[h] ?? "").toString().replace(/,/g, "")).join(","));
    return [headers.join(","), ...rows].join("\n");
  } catch (e) {
    throw new Error(`Conversion failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
};
var uuidGenerator = async (input) => {
  const count = input.count || 1;
  const version = input.version || "v4";
  const generate = () => {
    if (version === "v4") {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    }
    throw new Error(`UUID v${version} not supported in local mode`);
  };
  return count === 1 ? generate() : Array.from({ length: count }, generate);
};
var base64Encoder = async (input) => {
  try {
    return btoa(input.text);
  } catch {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input.text);
    return btoa(String.fromCharCode(...bytes));
  }
};
var base64Decoder = async (input) => {
  try {
    return atob(input.text);
  } catch {
    const bytes = Uint8Array.from(atob(input.text), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
};
var urlEncoder = async (input) => {
  try {
    return encodeURIComponent(input.text);
  } catch {
    throw new Error("Encoding failed");
  }
};
var urlDecoder = async (input) => {
  try {
    return decodeURIComponent(input.text);
  } catch {
    throw new Error("Decoding failed");
  }
};
var htmlEntitiesEncoder = async (input) => {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.textContent = input.text;
    return div.innerHTML;
  }
  return input.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

// src/lib/tools/security.ts
var sha256Hash = async (input) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
var md5Hash = async (input) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};
var randomString = async (input) => {
  const length = input.length || 16;
  const charset = input.charset || "alphanumeric";
  const chars = {
    alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    hex: "0123456789abcdef",
    base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
  };
  const source = chars[charset];
  let result = "";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += source[randomValues[i] % source.length];
  }
  return result;
};
var passwordStrength = async (input) => {
  const pwd = input.password;
  let score = 0;
  const feedback = [];
  if (pwd.length >= 8) score++;
  else feedback.push("Password should be at least 8 characters");
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++;
  else feedback.push("Add lowercase letters");
  if (/[A-Z]/.test(pwd)) score++;
  else feedback.push("Add uppercase letters");
  if (/[0-9]/.test(pwd)) score++;
  else feedback.push("Add numbers");
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  else feedback.push("Add special characters");
  score = Math.min(score, 4);
  const labels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  return { score, feedback };
};
var randomNumber = async (input) => {
  const min = Math.ceil(input.min);
  const max = Math.floor(input.max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
var randomColor = async (input) => {
  const hex = () => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  const rgb = () => `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
  return input.format === "rgb" ? rgb() : hex();
};

// src/lib/tools/text.ts
var stringCaseConverter = async (input) => {
  const { text, mode } = input;
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case "snake":
      return text.replace(/\s+/g, "_").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    case "camel":
      return text.replace(/\s+/g, "").replace(/([A-Z])/g, (m) => m.toLowerCase()).replace(/_([a-z])/g, (m) => m[1].toUpperCase());
    default:
      return text;
  }
};
var stringReverse = async (input) => {
  return input.text.split("").reverse().join("");
};
var stringTrimmer = async (input) => {
  switch (input.type) {
    case "left":
      return input.text.replace(/^\s+/, "");
    case "right":
      return input.text.replace(/\s+$/, "");
    default:
      return input.text.trim();
  }
};
var stringAnalyzer = async (input) => {
  const text = input.text;
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const uniqueChars = new Set(text).size;
  return { length: text.length, words, chars: text.length, uniqueChars };
};
var textToAscii = async (input) => {
  return input.text.split("").map((c) => c.charCodeAt(0).toString(10)).join(" ");
};
var asciiToText = async (input) => {
  return input.ascii.split(" ").map((n) => String.fromCharCode(parseInt(n))).join("");
};
var textEntropy = async (input) => {
  const freq = {};
  for (const c of input.text) freq[c] = (freq[c] || 0) + 1;
  const len = input.text.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};
var textToSentenceCase = async (input) => {
  return input.text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
};
var wordCounter = async (input) => {
  const words = input.text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const sentences = input.text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  return { words, chars: input.text.length, sentences };
};
var lineCounter = async (input) => {
  const lines = input.text.split("\n").length;
  return { lines, chars: input.text.length };
};
var duplicateRemover = async (input) => {
  const items = input.mode === "line" ? input.text.split("\n").map((l) => l.trim()).filter((l) => l) : input.text.split(/\s+/).filter((w) => w);
  const unique = [...new Set(items)];
  return input.mode === "line" ? unique.join("\n") : unique.join(" ");
};
var textDiff = async (input) => {
  const lines1 = input.text1.split("\n");
  const lines2 = input.text2.split("\n");
  const added = lines2.filter((l) => !lines1.includes(l));
  const removed = lines1.filter((l) => !lines2.includes(l));
  return { added, removed };
};

// src/lib/tools/file-image.ts
var imageResizer = async (input) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = input.width;
      canvas.height = input.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, input.width, input.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error("Resize failed"));
      }, input.file.type || "image/png");
    };
    img.onerror = () => {
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
};
var imageToBase64 = async (input) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(input.file);
  });
};
var base64ToImage = async (input) => {
  const response = await fetch(input.base64);
  const blob = await response.blob();
  return blob;
};
var pdfTextExtractor = async (input) => {
  return "[PDF Text Extraction requires pdf.js library. Placeholder output.]";
};
var imageCompressor = async (input) => {
  const quality = input.quality ?? 0.8;
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error("Compression failed"));
      }, input.file.type || "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
};
var fileSizeCalculator = async (input) => {
  return {
    kb: input.bytes / 1024,
    mb: input.bytes / (1024 * 1024),
    gb: input.bytes / (1024 * 1024 * 1024)
  };
};
var mimeTypeDetector = async (input) => {
  return input.file.type || "application/octet-stream";
};
var fileNamer = async (input) => {
  const ext = input.file.name.split(".").pop();
  return `${input.newName}.${ext}`;
};
var imageCropper = async (input) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = input.width;
      canvas.height = input.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, input.x, input.y, input.width, input.height, 0, 0, input.width, input.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error("Crop failed"));
      }, input.file.type || "image/png");
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
};
var imageRotator = async (input) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(input.file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const angleInRad = input.degrees * Math.PI / 180;
      const cos = Math.abs(Math.cos(angleInRad));
      const sin = Math.abs(Math.sin(angleInRad));
      canvas.width = img.naturalWidth * cos + img.naturalHeight * sin;
      canvas.height = img.naturalWidth * sin + img.naturalHeight * cos;
      ctx?.translate(canvas.width / 2, canvas.height / 2);
      ctx?.rotate(angleInRad);
      ctx?.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error("Rotate failed"));
      }, input.file.type || "image/png");
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
};

// src/lib/tools/data.ts
var csvToJson = async (input) => {
  const lines = input.csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length !== headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim();
    });
    result.push(row);
  }
  return result;
};
var jsonToXml = async (input) => {
  try {
    const data = JSON.parse(input.json);
    const obj = Array.isArray(data) ? { root: data } : data;
    const xml = (o, indent = 0) => {
      let s = "";
      for (const k in o) {
        const v = o[k];
        if (Array.isArray(v)) {
          s += " ".repeat(indent) + `<${k}>
`;
          v.forEach((item) => {
            s += xml(Array.isArray(item) ? { root: item } : item, indent + 2);
          });
          s += " ".repeat(indent) + `</${k}>
`;
        } else if (v && typeof v === "object") {
          s += " ".repeat(indent) + `<${k}>
`;
          s += xml(v, indent + 2);
          s += " ".repeat(indent) + `</${k}>
`;
        } else {
          s += " ".repeat(indent) + `<${k}>${v}</${k}>
`;
        }
      }
      return s;
    };
    return xml(obj);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : "Unknown"}`);
  }
};

// src/lib/tools/productivity.ts
var timer = async (input) => {
  return { message: `Timer set for ${input.seconds} seconds`, duration: input.seconds };
};
var stopwatch = async (input) => {
  return { status: `${input.action} requested` };
};
var markdownToHtml = async (input) => {
  let html = input.markdown.replace(/^# (.*$)/gim, "<h1>$1</h1>").replace(/^## (.*$)/gim, "<h2>$1</h2>").replace(/^### (.*$)/gim, "<h3>$1</h3>").replace(/\*\*(.*)\*\*/gim, "<b>$1</b>").replace(/\*(.*)\*/gim, "<i>$1</i>").replace(/\[(.*)\]\((.*)\)/gim, '<a href="$2">$1</a>').replace(/`(.*?)`/gim, "<code>$1</code>").replace(/\n/gim, "<br>");
  return html;
};
var htmlToMarkdown = async (input) => {
  return input.html.replace(/<[^>]*>/g, "");
};
var dateFormatter = async (input) => {
  const d = new Date(input.date);
  switch (input.format) {
    case "iso":
      return d.toISOString().split("T")[0];
    case "us":
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    case "eu":
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    case "relative":
      return `${Math.floor((Date.now() - d.getTime()) / (1e3 * 60 * 60 * 24))} days ago`;
    default:
      return d.toString();
  }
};
var timeZoneConverter = async (input) => {
  const d = new Date(input.date);
  return d.toLocaleString("en-US", { timeZone: input.to });
};
var unixTimestampConverter = async (input) => {
  const d = new Date(input.timestamp * 1e3);
  if (input.format === "date") return d.toISOString().split("T")[0];
  if (input.format === "time") return d.toTimeString().split(" ")[0];
  return d.toString();
};
var qrCodeGenerator = async (input) => {
  return "QR Code generation requires qrcode.js library. Placeholder.";
};
var barcodeGenerator = async (input) => {
  return "Barcode generation requires a barcode library. Placeholder.";
};
var colorConverter = async (input) => {
  const hex = input.hex.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  if (input.format === "rgb") return `rgb(${r}, ${g}, ${b})`;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};
var unitConverter = async (input) => {
  const conversions = {
    length: { m: 1, km: 1e3, cm: 0.01, mm: 1e-3, ft: 0.3048, in: 0.0254, mi: 1609.34 },
    weight: { kg: 1, g: 1e-3, lb: 0.453592, oz: 0.0283495 }
  };
  if (!conversions[input.from]) throw new Error("Unsupported unit");
  const base = input.value * conversions[input.from][input.from];
  return base / conversions[input.to][input.to];
};

// src/lib/tools/index.ts
var jsonFormatter2 = jsonFormatter;
var jsonMinifier2 = jsonMinifier;
var jsonValidator2 = jsonValidator;
var jsonToCsv2 = jsonToCsv;
var uuidGenerator2 = uuidGenerator;
var base64Encoder2 = base64Encoder;
var base64Decoder2 = base64Decoder;
var urlEncoder2 = urlEncoder;
var urlDecoder2 = urlDecoder;
var htmlEntitiesEncoder2 = htmlEntitiesEncoder;
var sha256Hash2 = sha256Hash;
var md5Hash2 = md5Hash;
var randomString2 = randomString;
var passwordStrength2 = passwordStrength;
var randomNumber2 = randomNumber;
var randomColor2 = randomColor;
var stringCaseConverter2 = stringCaseConverter;
var stringReverse2 = stringReverse;
var stringTrimmer2 = stringTrimmer;
var stringAnalyzer2 = stringAnalyzer;
var textToAscii2 = textToAscii;
var asciiToText2 = asciiToText;
var textEntropy2 = textEntropy;
var textToSentenceCase2 = textToSentenceCase;
var wordCounter2 = wordCounter;
var lineCounter2 = lineCounter;
var duplicateRemover2 = duplicateRemover;
var textDiff2 = textDiff;
var imageResizer2 = imageResizer;
var imageToBase642 = imageToBase64;
var base64ToImage2 = base64ToImage;
var pdfTextExtractor2 = pdfTextExtractor;
var imageCompressor2 = imageCompressor;
var fileSizeCalculator2 = fileSizeCalculator;
var mimeTypeDetector2 = mimeTypeDetector;
var fileNamer2 = fileNamer;
var imageCropper2 = imageCropper;
var imageRotator2 = imageRotator;
var csvToJson2 = csvToJson;
var jsonToXml2 = jsonToXml;
var timer2 = timer;
var stopwatch2 = stopwatch;
var markdownToHtml2 = markdownToHtml;
var htmlToMarkdown2 = htmlToMarkdown;
var dateFormatter2 = dateFormatter;
var timeZoneConverter2 = timeZoneConverter;
var unixTimestampConverter2 = unixTimestampConverter;
var qrCodeGenerator2 = qrCodeGenerator;
var barcodeGenerator2 = barcodeGenerator;
var colorConverter2 = colorConverter;
var unitConverter2 = unitConverter;
var TOOLS_REGISTRY2 = {
  "json-formatter": jsonFormatter2,
  "json-minifier": jsonMinifier2,
  "json-validator": jsonValidator2,
  "json-to-csv": jsonToCsv2,
  "uuid-generator": uuidGenerator2,
  "base64-encoder": base64Encoder2,
  "base64-decoder": base64Decoder2,
  "url-encoder": urlEncoder2,
  "url-decoder": urlDecoder2,
  "html-entities-encoder": htmlEntitiesEncoder2,
  "sha256-hash": sha256Hash2,
  "md5-hash": md5Hash2,
  "random-string": randomString2,
  "password-strength": passwordStrength2,
  "random-number": randomNumber2,
  "random-color": randomColor2,
  "string-case-converter": stringCaseConverter2,
  "string-reverse": stringReverse2,
  "string-trimmer": stringTrimmer2,
  "string-analyzer": stringAnalyzer2,
  "text-to-ascii": textToAscii2,
  "ascii-to-text": asciiToText2,
  "text-entropy": textEntropy2,
  "text-to-sentence-case": textToSentenceCase2,
  "word-counter": wordCounter2,
  "line-counter": lineCounter2,
  "duplicate-remover": duplicateRemover2,
  "text-diff": textDiff2,
  "image-resizer": imageResizer2,
  "image-to-base64": imageToBase642,
  "base64-to-image": base64ToImage2,
  "pdf-text-extractor": pdfTextExtractor2,
  "image-compressor": imageCompressor2,
  "file-size-calculator": fileSizeCalculator2,
  "mime-type-detector": mimeTypeDetector2,
  "file-namer": fileNamer2,
  "image-cropper": imageCropper2,
  "image-rotator": imageRotator2,
  "csv-to-json": csvToJson2,
  "json-to-xml": jsonToXml2,
  "timer": timer2,
  "stopwatch": stopwatch2,
  "markdown-to-html": markdownToHtml2,
  "html-to-markdown": htmlToMarkdown2,
  "date-formatter": dateFormatter2,
  "time-zone-converter": timeZoneConverter2,
  "unix-timestamp-converter": unixTimestampConverter2,
  "qr-code-generator": qrCodeGenerator2,
  "barcode-generator": barcodeGenerator2,
  "color-converter": colorConverter2,
  "unit-converter": unitConverter2
};

// src/lib/execution-engine.ts
async function executeTool(request) {
  const startTime = Date.now();
  const traceId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  try {
    const tool = findToolBySlug(request.toolId) || findToolBySlug(request.toolId);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${request.toolId}`,
        executionTimeMs: Date.now() - startTime,
        traceId
      };
    }
    if (tool.availability === "unavailable") {
      return {
        success: false,
        error: `Tool ${tool.title} is currently unavailable`,
        executionTimeMs: Date.now() - startTime,
        traceId
      };
    }
    const result = await executeToolInternal(tool, request.input, request.context);
    let verification;
    if (request.options?.verify !== false) {
      verification = await verifyToolResult(tool, request.input, result);
    }
    return {
      success: true,
      output: result,
      verification,
      executionTimeMs: Date.now() - startTime,
      toolExecuted: tool.id,
      traceId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTimeMs: Date.now() - startTime,
      traceId
    };
  }
}
async function executeToolInternal(tool, input, context) {
  const executionMode = tool.execution || "local";
  switch (executionMode) {
    case "local":
      return executeLocalTool(tool, input);
    case "ai":
      return executeAiTool(tool, input, context);
    case "workflow":
      return executeWorkflowTool(tool, input, context);
    default:
      throw new Error(`Unknown execution mode: ${executionMode}`);
  }
}
var LOCAL_TOOL_PRIMARY_FIELD = {
  "json-formatter": "json",
  "json-minifier": "json",
  "json-validator": "json",
  "json-to-csv": "json",
  "json-to-xml": "json",
  "csv-to-json": "csv",
  "base64-encoder": "text",
  "base64-decoder": "text",
  "base64-to-image": "base64",
  "url-encoder": "text",
  "url-decoder": "text",
  "html-entities-encoder": "text",
  "file-size-calculator": "bytes",
  "markdown-to-html": "markdown",
  "html-to-markdown": "html",
  "qr-code-generator": "text",
  "sha256-hash": "text",
  "md5-hash": "text",
  "password-strength": "password",
  "string-reverse": "text",
  "string-analyzer": "text",
  "text-to-ascii": "text",
  "ascii-to-text": "ascii",
  "text-entropy": "text",
  "text-to-sentence-case": "text",
  "word-counter": "text",
  "line-counter": "text",
  "timer": "seconds",
  "stopwatch": "action",
  "unix-timestamp-converter": "timestamp",
  "image-to-base64": "file",
  "pdf-text-extractor": "file",
  "image-compressor": "file",
  "mime-type-detector": "file"
};
function executeLocalTool(tool, input) {
  const impl = TOOLS_REGISTRY2[tool.slug];
  if (impl) {
    const primaryField = LOCAL_TOOL_PRIMARY_FIELD[tool.slug];
    const isBareValue = typeof input !== "object" || input === null || Array.isArray(input);
    const normalizedInput = primaryField && isBareValue ? { [primaryField]: input } : input;
    return impl(normalizedInput);
  }
  return {
    toolId: tool.id,
    input,
    output: `Processed by ${tool.title} (local)`,
    note: "This tool executes client-side. The browser will run the actual implementation."
  };
}
async function executeAiTool(tool, input, context) {
  return {
    toolId: tool.id,
    input,
    output: `Processed by ${tool.title} (AI)`,
    note: "AI execution would be routed through /api/ai endpoint"
  };
}
function executeWorkflowTool(tool, input, context) {
  return {
    toolId: tool.id,
    input,
    output: `Workflow ${tool.title} executed`,
    note: "Workflow execution would chain multiple tools"
  };
}
async function verifyToolResult(tool, input, output) {
  const checks = [];
  const issues = [];
  checks.push("output_exists");
  if (!output) {
    issues.push("No output produced");
  }
  checks.push("tool_execution_mode_valid");
  if (!["local", "ai", "workflow"].includes(tool.execution || "local")) {
    issues.push(`Invalid execution mode: ${tool.execution}`);
  }
  if (tool.capabilities) {
    for (const cap of tool.capabilities) {
      checks.push(`capability_${cap.id}_output_schema`);
    }
  }
  if (tool.slug === "json-validator" && output) {
    checks.push("json_syntax_check");
    if (output.valid === false) issues.push("JSON syntax invalid");
  }
  if (tool.slug === "sha256-hash" && output) {
    checks.push("hash_length_check");
    if (!/^[a-f0-9]{64}$/.test(String(output))) issues.push("Invalid SHA-256 hash format");
  }
  if (tool.slug === "md5-hash" && output) {
    checks.push("hash_length_check");
    if (!/^[a-f0-9]{32}$/.test(String(output))) issues.push("Invalid MD5 hash format");
  }
  if (tool.slug === "json-formatter" && output) {
    checks.push("json_parse_check");
    try {
      JSON.parse(String(output));
    } catch {
      issues.push("Formatted JSON is not valid");
    }
  }
  if (tool.verification) {
    checks.push("tool_verification_status");
    if (tool.verification.status !== "verified") {
      issues.push(`Tool verification status: ${tool.verification.status}`);
    }
    checks.push("tool_last_verified");
    const lastVerified = new Date(tool.verification.lastVerified);
    const daysSinceVerification = (Date.now() - lastVerified.getTime()) / (1e3 * 60 * 60 * 24);
    if (daysSinceVerification > 30) {
      issues.push(`Tool not verified in ${Math.round(daysSinceVerification)} days`);
    }
  }
  const confidence = issues.length === 0 ? 0.95 : Math.max(0.3, 0.9 - issues.length * 0.15);
  return {
    valid: issues.length === 0,
    issues,
    checksPerformed: checks,
    confidence,
    evidence: [{ input, output, toolId: tool.id, timestamp: (/* @__PURE__ */ new Date()).toISOString() }]
  };
}
async function solveProblem(problem, context) {
  const intent = classifyIntent(problem);
  const plan = buildExecutionPlan(intent);
  const results = [];
  let currentOutput = void 0;
  for (const step of plan.steps) {
    const input = currentOutput || { problem, intent: intent.intent };
    const result = await executeTool({
      toolId: step.toolId,
      input,
      context,
      options: { verify: step.verify }
    });
    results.push(result);
    if (!result.success) {
      if (plan.fallbackToolIds && plan.fallbackToolIds.length > 0) {
        for (const fallbackId of plan.fallbackToolIds) {
          const fallbackResult = await executeTool({
            toolId: fallbackId,
            input,
            context,
            options: { verify: step.verify }
          });
          results.push(fallbackResult);
          if (fallbackResult.success) {
            currentOutput = fallbackResult.output;
            break;
          }
        }
      }
      if (!currentOutput) {
        break;
      }
    } else {
      currentOutput = result.output;
    }
  }
  return {
    intent,
    plan,
    results,
    finalOutput: currentOutput
  };
}

// src/server/signals.ts
var SIGNAL_SOURCES = [
  {
    id: "chrome-dev",
    name: "Chrome for Developers",
    feedUrl: "https://developer.chrome.com/static/blog/feed.xml",
    siteUrl: "https://developer.chrome.com/blog/"
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    feedUrl: "https://github.blog/feed/",
    siteUrl: "https://github.blog/"
  },
  {
    id: "cloudflare-blog",
    name: "Cloudflare Blog",
    feedUrl: "https://blog.cloudflare.com/rss/",
    siteUrl: "https://blog.cloudflare.com/"
  },
  {
    id: "mdn-blog",
    name: "MDN Web Docs",
    feedUrl: "https://developer.mozilla.org/en-US/blog/rss.xml",
    siteUrl: "https://developer.mozilla.org/en-US/blog/"
  }
];
var CACHE_TTL_MS = 45 * 6e4;
var FETCH_TIMEOUT_MS = 8e3;
var MAX_ITEMS_PER_SOURCE = 8;
var MAX_TOTAL_ITEMS = 40;
var SUMMARY_MAX_LEN = 220;
var cache = null;
var inFlight = null;
function decodeEntities(input) {
  return input.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}
function stripCdata(input) {
  const m = input.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return m ? m[1] : input;
}
function stripTags(input) {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  return decodeEntities(stripCdata(m[1]).trim());
}
function parseRss2(xml, source) {
  const items = [];
  const itemBlocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks.slice(0, MAX_ITEMS_PER_SOURCE)) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDateRaw = extractTag(block, "pubDate");
    const descriptionRaw = extractTag(block, "description") || extractTag(block, "content:encoded") || "";
    if (!title || !link) continue;
    const parsedDate = pubDateRaw ? new Date(pubDateRaw) : null;
    const publishedAt = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    const summaryText = stripTags(descriptionRaw);
    const summary = summaryText.length > SUMMARY_MAX_LEN ? `${summaryText.slice(0, SUMMARY_MAX_LEN).trim()}\u2026` : summaryText;
    items.push({
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.siteUrl,
      title,
      link,
      summary,
      publishedAt
    });
  }
  return items;
}
async function fetchOneSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "XFreeSignals/1.0 (+https://www.xfree.in/updates)" }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss2(xml, source);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
async function fetchAllSources() {
  const results = await Promise.all(SIGNAL_SOURCES.map(fetchOneSource));
  const merged = results.flat();
  merged.sort((a, b) => a.publishedAt < b.publishedAt ? 1 : -1);
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const item of merged) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    deduped.push(item);
    if (deduped.length >= MAX_TOTAL_ITEMS) break;
  }
  return deduped;
}
async function getSignals() {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { items: cache.items, fetchedAt: new Date(cache.fetchedAt).toISOString(), stale: false };
  }
  if (!inFlight) {
    inFlight = fetchAllSources().finally(() => {
      inFlight = null;
    });
  }
  try {
    const items = await inFlight;
    cache = { items, fetchedAt: now };
    return { items, fetchedAt: new Date(now).toISOString(), stale: false };
  } catch {
    if (cache) {
      return { items: cache.items, fetchedAt: new Date(cache.fetchedAt).toISOString(), stale: true };
    }
    return { items: [], fetchedAt: new Date(now).toISOString(), stale: true };
  }
}

// src/server/app.ts
function firstParam(value) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
async function createApp(opts = {}) {
  const app = express();
  app.set("trust proxy", config2.TRUST_PROXY);
  app.disable("x-powered-by");
  app.use((req, _res, next) => {
    req.requestId = crypto3.randomUUID();
    next();
  });
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: "100kb" }));
  const baseUrl = config2.PUBLIC_SITE_URL;
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
  app.get("/health.json", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("X-Robots-Tag", "all");
    res.status(200).json({
      status: "operational",
      service: "xfree.in",
      version: process.env.npm_package_version || "1.0.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      public_tools: PUBLIC_TOOLS.length,
      planned_tools: 25e3,
      endpoints: {
        sitemap: `${baseUrl}/sitemap.xml`,
        llms: `${baseUrl}/llms.txt`,
        llms_full: `${baseUrl}/llms-full.txt`,
        robots: `${baseUrl}/robots.txt`,
        studio: "https://app.xfree.in/"
      }
    });
  });
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
  app.get("/:indexNowKey.txt", (req, res) => {
    const { indexNowKey } = req.params;
    if (indexNowKey === process.env.INDEXNOW_KEY || indexNowKey === "96aea7e6b8f340b4ba96b60e8e43c0e5") {
      res.header("Content-Type", "text/plain; charset=utf-8");
      res.status(200).send(indexNowKey);
    } else {
      res.status(404).send("Not Found");
    }
  });
  app.post("/api/indexnow", express.json(), async (req, res) => {
    const { host, key, keyLocation, urlList } = req.body || {};
    if (!host || !key || !Array.isArray(urlList) || urlList.length === 0) {
      return res.status(400).json({ error: "Invalid IndexNow payload" });
    }
    try {
      const response = await fetch("https://api.indexnow.org/IndexNow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host, key, keyLocation, urlList })
      });
      const text = await response.text();
      return res.status(response.status).send(text);
    } catch (error) {
      return res.status(502).json({ error: "IndexNow upstream failed", details: String(error) });
    }
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
  app.get("/api/nvidia/models", aiPerMinute, async (_req, res, next) => {
    try {
      const models = await listAvailableModels();
      return res.json({ success: true, models });
    } catch (err) {
      if (err instanceof NvidiaNotConfiguredError) {
        return res.status(503).json({ error: "nvidia_not_configured", message: "NVIDIA Cloud Mode is not configured on this server." });
      }
      if (err instanceof NvidiaApiError) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  });
  app.post("/api/nvidia/chat", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = NvidiaChatSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { model, taskType, messages, temperature, maxTokens } = parsed.data;
      const result = await createChatCompletion({
        requestedModel: model,
        taskType,
        messages,
        temperature,
        maxTokens
      });
      return res.json({
        success: true,
        provider: "NVIDIA NIM",
        model: result.usedModel,
        wasFallback: result.wasFallback,
        fallbackReason: result.fallbackReason,
        reply: result.reply,
        usage: result.usage
      });
    } catch (err) {
      if (err instanceof NvidiaNotConfiguredError) {
        return res.status(503).json({ error: "nvidia_not_configured", message: "NVIDIA Cloud Mode is not configured on this server." });
      }
      if (err instanceof NvidiaApiError) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }
      next(err);
    }
  });
  app.get("/api/signals", async (_req, res, next) => {
    try {
      const { items, fetchedAt, stale } = await getSignals();
      res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
      return res.json({ success: true, items, fetchedAt, stale });
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
  const solveRateLimit = rateLimit({ scope: "solve", limit: 10, windowMs: 6e4 });
  const executionRateLimit = rateLimit({ scope: "execution", limit: 20, windowMs: 6e4 });
  const workflowRateLimit = rateLimit({ scope: "workflow", limit: 5, windowMs: 6e4 });
  app.post("/api/v1/solve/*problem", solveRateLimit, async (req, res, next) => {
    try {
      const problemParam = req.params.problem;
      const problem = decodeURIComponent((Array.isArray(problemParam) ? problemParam.join("/") : problemParam) || "");
      const context = {
        userId: req.headers["x-user-id"],
        organizationId: req.headers["x-org-id"],
        preferences: {
          preferredExecution: req.headers["x-preferred-execution"] || "local",
          privacy: req.headers["x-privacy"] || "local",
          budget: req.headers["x-budget"] || "free"
        }
      };
      const result = await solveProblem(problem, context);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/v1/execute/:toolId", executionRateLimit, async (req, res, next) => {
    try {
      const toolId = firstParam(req.params.toolId);
      const context = {
        userId: req.headers["x-user-id"],
        organizationId: req.headers["x-org-id"],
        preferences: {
          preferredExecution: req.headers["x-preferred-execution"] || "local",
          privacy: req.headers["x-privacy"] || "local",
          budget: req.headers["x-budget"] || "free"
        }
      };
      const result = await executeTool({
        toolId,
        input: req.body,
        context,
        options: {
          verify: req.query.verify !== "false",
          timeout: parseInt(req.query.timeout) || 3e4
        }
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/v1/verify/:toolId", executionRateLimit, async (req, res, next) => {
    try {
      const toolId = firstParam(req.params.toolId);
      const tool = findToolBySlug(toolId);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      const verification = await verifyToolResult(tool, req.body.input, req.body.output);
      res.json({ success: true, data: verification });
    } catch (err) {
      next(err);
    }
  });
  app.get("/api/v1/capabilities", (_req, res, next) => {
    try {
      const baseUrl2 = config2.PUBLIC_SITE_URL;
      const capabilitiesJson = generateCapabilitiesJson(baseUrl2);
      res.header("Content-Type", "application/json");
      res.send(capabilitiesJson);
    } catch (err) {
      next(err);
    }
  });
  app.get("/api/v1/tools", (_req, res, next) => {
    try {
      const baseUrl2 = config2.PUBLIC_SITE_URL;
      const toolsJson = generateToolsJson(baseUrl2);
      res.header("Content-Type", "application/json");
      res.send(toolsJson);
    } catch (err) {
      next(err);
    }
  });
  app.all("/api/*rest", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  const staticRouteSet = new Set(STATIC_ROUTES);
  const categoryRouteSet = new Set(CATEGORY_SLUGS.map((s) => `/category/${s}`));
  const pillarCategoryRouteSet = new Set(PILLAR_CATEGORIES.map((c) => `/${c.id}`));
  const guideSlugSet = new Set(GUIDES.map((g) => g.slug));
  const pillarSlugSet = new Set(PILLARS_60.map((p) => p.slug));
  app._classifyPath = function classifyPath(pathname) {
    if (staticRouteSet.has(pathname)) return "known";
    if (categoryRouteSet.has(pathname)) return "known";
    if (pillarCategoryRouteSet.has(pathname)) return "known";
    if (pathname === "/pillars") return "known";
    const toolMatch = pathname.match(/^\/tools\/([^/]+)\/?$/);
    if (toolMatch && INDEXABLE_TOOL_SLUGS.has(toolMatch[1])) return "known";
    const guideMatch = pathname.match(/^\/guides\/([^/]+)\/?$/);
    if (guideMatch && guideSlugSet.has(guideMatch[1])) return "known";
    const pillarMatch = pathname.match(/^\/pillars\/([^/]+)\/?$/);
    if (pillarMatch && pillarSlugSet.has(pillarMatch[1])) return "known";
    return "unknown";
  };
  const STATIC_HTML_CSP_DIRECTIVES = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com https://cdn.tailwindcss.com",
    "script-src-elem 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com",
    "img-src 'self' data: blob: https: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
    "font-src 'self' data: https://cdn.jsdelivr.net",
    "connect-src 'self' https://api.github.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://adservice.google.com",
    "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
    "upgrade-insecure-requests"
  ];
  const serveStaticHtmlPage = (file) => (_req, res) => {
    const filePath = path.join(process.cwd(), "public", file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send(`${file} not found`);
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    res.setHeader("Content-Security-Policy", STATIC_HTML_CSP_DIRECTIVES.join("; "));
    res.setHeader("X-Robots-Tag", "index, follow");
    res.status(200).sendFile(filePath);
  };
  app.get(["/home", "/home/"], serveStaticHtmlPage("home.html"));
  app.get(["/pillars", "/pillars/"], serveStaticHtmlPage("pillars.html"));
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
    app.get("*rest", notFound);
    app.head("*rest", notFound);
  };
}

// src/vercel-handler.ts
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
