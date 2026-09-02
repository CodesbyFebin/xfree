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
function selectModelForTask(taskType, availableModels) {
  const compatible = availableModels.filter((model) => model.chatCompatible);
  if (!compatible.length) return null;
  return compatible.reduce(
    (best, model) => scoreModel(model, taskType) > scoreModel(best, taskType) ? model : best
  );
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
async function nvidiaFetch(path, init = {}) {
  const { apiKey, baseUrl } = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config2.NVIDIA_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${baseUrl}${path}`, {
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
async function resolveNvidiaModel(requestedModel, taskType) {
  let models = (await listAvailableModels()).filter((model) => model.chatCompatible);
  if (!models.length) throw new NvidiaApiError("No NVIDIA chat models are available to this account", 503, "unavailable");
  const requested = requestedModel?.trim() || "auto";
  if (requested !== "auto") {
    let exact = models.find((model) => model.id === requested);
    if (!exact) {
      models = (await listAvailableModels({ forceRefresh: true })).filter((model) => model.chatCompatible);
      exact = models.find((model) => model.id === requested);
    }
    if (exact) return { requestedModel: requested, usedModel: exact.id, wasFallback: false };
  }
  const fallback = selectModelForTask(taskType, models);
  if (!fallback) throw new NvidiaApiError("No suitable NVIDIA model is available", 503, "unavailable");
  return {
    requestedModel: requested,
    usedModel: fallback.id,
    wasFallback: requested !== "auto",
    fallbackReason: requested === "auto" ? "auto_routing" : "selected_model_unavailable"
  };
}
async function createChatCompletion(payload) {
  let resolution = await resolveNvidiaModel(payload.requestedModel, payload.taskType);
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
  let response = await send(resolution.usedModel);
  if ((response.status === 400 || response.status === 404) && resolution.requestedModel !== "auto" && !resolution.wasFallback) {
    const refreshed = (await listAvailableModels({ forceRefresh: true })).filter((model) => model.chatCompatible);
    const fallback = selectModelForTask(
      payload.taskType,
      refreshed.filter((model) => model.id !== resolution.usedModel)
    );
    if (fallback) {
      resolution = {
        requestedModel: resolution.requestedModel,
        usedModel: fallback.id,
        wasFallback: true,
        fallbackReason: "selected_model_unavailable"
      };
      response = await send(fallback.id);
    }
  }
  if (response.status === 401 || response.status === 403) {
    throw new NvidiaApiError("NVIDIA credentials were rejected", 503, "unauthorized");
  }
  if (!response.ok) {
    throw new NvidiaApiError("NVIDIA could not complete the request", response.status >= 500 ? 502 : 400, "upstream_error");
  }
  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== "string") throw new NvidiaApiError("NVIDIA returned an invalid response", 502, "upstream_error");
  return { ...resolution, reply, usage: data.usage };
}

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
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co https://*.xethub.hf.co https://raw.githubusercontent.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://csi.gstatic.com https://fundingchoicesmessages.google.com",
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
    status: "published",
    indexable: true,
    lastModified: "2026-03-15",
    tags: ["robots.txt", "crawler rules", "allow disallow", "seo auditing"],
    exampleInput: "User-agent: *\nDisallow: /admin/\nSitemap: https://www.xfree.in/sitemap.xml",
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
    exampleInput: "Name: XFree\nURL: https://www.xfree.in",
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
  {
    id: "sip-emi-calculator",
    slug: "sip-emi-calculator",
    title: "SIP & EMI Calculator \u2014 Mutual Fund & Loan EMI",
    pillarKeyword: "SIP and EMI Calculator",
    shortDescription: "Calculate SIP mutual fund maturity value with a year-by-year growth breakdown, and EMI loan repayment with a full amortization schedule.",
    category: "generators",
    categoryLabel: "Generators",
    iconName: "Calculator",
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: "2026-08-29",
    tags: ["sip calculator", "emi calculator", "mutual fund calculator", "loan amortization", "home loan emi", "systematic investment plan"],
    exampleInput: "SIP: \u20B95,000/month at 12% expected annual return for 10 years. EMI: \u20B925,00,000 loan at 8.5% annual interest for 20 years.",
    explanation: "Computes SIP (Systematic Investment Plan) maturity value using the standard future-value-of-annuity-due formula banks and AMCs use, with a year-by-year invested-vs-value breakdown. Computes EMI using the standard reducing-balance formula, with a full month-by-month principal/interest amortization schedule.",
    howToUse: [
      "Switch between the SIP and EMI tabs.",
      "SIP: enter monthly investment, expected annual return rate, and investment duration in years.",
      "EMI: enter loan amount, annual interest rate, and loan tenure in years.",
      "Read the computed result and expand the year-by-year (SIP) or month-by-month (EMI) breakdown table."
    ],
    privacyNotice: "Local processing: all calculations run in your browser using plain arithmetic. No amount, rate, or tenure you enter is sent to XFree.in servers.",
    faqs: [
      { question: "What formula does the SIP calculator use?", answer: "The standard future value of an annuity due: M = P \xD7 [(((1+i)^n \u2212 1) / i) \xD7 (1+i)], where P is the monthly investment, i is the monthly rate (annual rate \xF7 12 \xF7 100), and n is the number of months. This is the same formula used by AMFI-registered mutual fund calculators and most bank SIP tools. It assumes a constant monthly return, which real markets don't deliver \u2014 actual returns will vary." },
      { question: "What formula does the EMI calculator use?", answer: "The standard reducing-balance EMI formula: EMI = P \xD7 r \xD7 (1+r)^n / ((1+r)^n \u2212 1), where P is the principal, r is the monthly interest rate, and n is the number of monthly installments. This matches how Indian banks and NBFCs calculate home, personal, and vehicle loan EMIs under the reducing-balance method." },
      { question: "Does the expected SIP return rate account for inflation or taxes?", answer: "No. The entered rate is a nominal annual return assumption you provide \u2014 the calculator doesn't adjust for inflation, expense ratios, exit loads, or capital gains tax (LTCG/STCG on equity mutual funds in India). Treat the output as a pre-tax, pre-inflation estimate, not a guaranteed maturity figure." },
      { question: "Does the EMI figure include processing fees or insurance?", answer: "No. It calculates principal and interest only, exactly as the reducing-balance formula defines. Banks often add a processing fee (typically 0.5\u20132% of the loan amount) and may bundle loan insurance \u2014 check your actual loan sanction letter for the all-in cost, not just the EMI." },
      { question: "Why does my bank's EMI differ slightly from this calculator?", answer: "Small differences usually come from day-count conventions (some lenders compute the first partial month differently), rounding rules, or a fractional rate your bank applies that wasn't entered here. For a formal repayment schedule, use your lender's official statement \u2014 this tool is for planning and comparison, not a substitute for your loan agreement." },
      { question: "Does my financial data leave the browser?", answer: "No. Every calculation \u2014 SIP maturity, EMI, and both breakdown tables \u2014 runs as plain JavaScript arithmetic in your browser tab. The site loads Google AdSense which sets advertising cookies (see the Privacy page), but the amounts, rates, and tenures you enter are never sent to XFree.in or any external service." }
    ],
    relatedToolIds: ["cron-expression-generator", "url-slug-utm-builder"]
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
var ROADMAP_TOOLS = TOOLS_REGISTRY.filter(
  (tool) => tool.status === "roadmap" || tool.status === "draft"
);

// src/data/publishedBatch1Tools.ts
var REVIEW_DATE = "2026-08-23";
function buildFaqs(spec) {
  return [
    {
      question: `What does the ${spec.title} do?`,
      answer: `${spec.description} ${spec.inputGuide} The transformation is deliberately narrow: it performs the named operation and returns the result without inventing extra fields or contacting an XFree processing API. This makes the tool useful for debugging, repeatable data cleanup, documentation examples, and small production-preparation tasks where you want to inspect exactly what changed before copying the output elsewhere.`
    },
    {
      question: `Does ${spec.title} upload my input?`,
      answer: `No. The core transformation for ${spec.title} is mapped to the XFree Studio local engine \u201C${spec.engineId}\u201D and runs in the browser. XFree may still load normal site assets and disclosed advertising resources, but the text you submit to this tool is not sent to an XFree tool-processing endpoint. For sensitive material, still review the page privacy notice and your browser extensions before pasting secrets.`
    },
    {
      question: `What input should I use with ${spec.title}?`,
      answer: `${spec.inputGuide} Start with a small representative sample when you are unsure of the source format, then compare the result against the original before processing a larger block. The tool does not silently repair unrelated syntax or infer missing business rules. If the input violates the engine's documented format, it returns an error so you can correct the source instead of receiving a misleading partial conversion.`
    },
    {
      question: `How should I verify output from ${spec.title}?`,
      answer: `${spec.outputGuide} After running the transformation, inspect delimiters, escaping, ordering, and any values that are significant to the target system. Copy or download only after the result matches your intended format. ${spec.caveat} XFree treats browser utilities as review aids, not as a substitute for target-system validation, automated tests, schema validation, or a production deployment check.`
    },
    {
      question: `What is an important limitation of ${spec.title}?`,
      answer: `${spec.caveat} The utility intentionally avoids network lookups and hidden server-side enrichment, so it cannot know requirements that exist only in an external API, database, style guide, locale, or application runtime. That constraint is useful for privacy and determinism, but it also means you should validate the generated result in the environment where it will actually be consumed.`
    }
  ];
}
function buildTool(spec) {
  const relatedToolIds = BATCH1_SPECS.filter((candidate) => candidate.engineId !== spec.engineId && candidate.category === spec.category).slice(0, 3).map((candidate) => candidate.engineId);
  return {
    id: spec.engineId,
    slug: spec.slug,
    title: spec.title,
    pillarKeyword: spec.title,
    shortDescription: spec.description,
    category: spec.category,
    categoryLabel: spec.categoryLabel,
    iconName: spec.iconName,
    execution: "local",
    status: "published",
    indexable: true,
    lastModified: REVIEW_DATE,
    toolComponent: `local-engine:${spec.engineId}`,
    tags: [spec.engineId, spec.title.toLowerCase(), spec.category, "browser tool", "local processing"],
    exampleInput: spec.exampleInput,
    explanation: `${spec.description} ${spec.inputGuide} ${spec.outputGuide} XFree exposes this operation as a focused browser utility rather than a remote service. The implementation reuses the same tested local engine available in XFree Agent Studio, so the standalone route and Studio workflow share one transformation contract. That reduces duplicated logic and makes failures easier to reproduce. The page is designed for developers, analysts, technical writers, and SEO practitioners who need a quick result they can inspect before moving it into another system. No account is required for the core operation, and the working input remains in browser memory during normal execution. ${spec.caveat} The safest workflow is to keep the original source, run a representative sample, inspect the transformed output, and then validate it against the rules of the application that will consume it.`,
    howToUse: [
      `Paste or type the source value into the input editor. ${spec.inputGuide}`,
      `Run the local \u201C${spec.engineId}\u201D engine. Processing happens in the current browser session and does not require an XFree tool API call.`,
      `${spec.outputGuide} Compare the result with the source and pay particular attention to escaping, separators, ordering, and data types that matter to your destination.`,
      `Use the copy button or Ctrl+Shift+C after reviewing the result. Keep the original input available until the transformed output has been tested in its real target environment.`
    ],
    keyFeatures: [
      `Uses the verified XFree Studio local engine: ${spec.engineId}.`,
      "Runs the core transformation in the browser with no tool-processing server round-trip.",
      "Provides deterministic text output and explicit errors instead of silently guessing malformed input.",
      "Includes copy support and a Ctrl+Shift+C shortcut once a result is available.",
      "Publishes a dedicated canonical route with visible documentation, FAQs, and related-tool links."
    ],
    benefits: [
      `Focused workflow: ${spec.description}`,
      "Local-first handling keeps working input out of an XFree processing endpoint during the transformation.",
      "Shared Studio engine logic reduces behavioral drift between standalone tools and chained Agent Studio workflows.",
      "Human-readable limitations encourage verification rather than presenting generated output as automatically production-safe."
    ],
    useCases: [
      "Debug a small payload before sending it to another application.",
      "Normalize or inspect text while preparing documentation, tests, fixtures, or configuration.",
      "Create a reproducible browser-side transformation for a larger local workflow."
    ],
    privacyNotice: "Local processing: the core transformation runs in your browser and the submitted working input is not sent to an XFree tool-processing endpoint.",
    faqs: buildFaqs(spec),
    relatedToolIds,
    limitations: [spec.caveat, "Practical input size depends on browser memory and the complexity of the transformation.", "External schemas, APIs, and target-system business rules are not fetched automatically."],
    securityReview: {
      passed: true,
      reviewedAt: REVIEW_DATE,
      notes: "Published only through an allow-listed XFree Studio local engine; no core network execution path."
    }
  };
}
var BATCH1_SPECS = [
  { engineId: "json-to-csv", slug: "json-to-csv-converter", title: "JSON to CSV Converter", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Convert JSON arrays or objects into consistently quoted CSV for spreadsheets, data review, imports, and local pipeline preparation.", inputGuide: "Paste a JSON array of objects or a single object; compatible field names produce the clearest tabular columns.", outputGuide: "The tool emits quoted CSV text with a header row derived from object keys.", caveat: "Nested objects are serialized rather than automatically flattened, so review nested values before importing the CSV.", exampleInput: '[{"name":"Ada","role":"Engineer"},{"name":"Linus","role":"Maintainer"}]' },
  { engineId: "csv-to-json", slug: "csv-to-json-converter", title: "CSV to JSON Converter", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Parse quoted CSV with a header row into structured JSON objects for APIs, fixtures, analysis, and browser-side data cleanup.", inputGuide: "Paste CSV whose first row contains column names; quoted fields and embedded commas are supported by the local parser.", outputGuide: "The result is a formatted JSON array whose object keys come from the CSV header cells.", caveat: "Malformed quoting or inconsistent row shapes can make tabular data ambiguous, so review every column before downstream use.", exampleInput: "name,role\nAda,Engineer\nLinus,Maintainer" },
  { engineId: "base64-encode", slug: "base64-text-encoder", title: "Base64 Text Encoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Encode Unicode text into standard Base64 using UTF-8 bytes for transport, test fixtures, configuration, and payload inspection.", inputGuide: "Paste ordinary text, code, configuration, or Unicode content that you need represented as Base64 text.", outputGuide: "The browser converts the UTF-8 bytes into a standard Base64 string.", caveat: "Base64 is an encoding rather than encryption, so anyone who receives the output can decode it.", exampleInput: "XFree \u2713 UTF-8" },
  { engineId: "base64-decode", slug: "base64-text-decoder", title: "Base64 Text Decoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Decode standard Base64 into UTF-8 text locally for inspecting payloads, configuration values, tokens, and encoded snippets.", inputGuide: "Paste a valid Base64 string produced from UTF-8 bytes and remove surrounding prose or unrelated prefixes first.", outputGuide: "The result is decoded UTF-8 text rendered directly in the browser.", caveat: "Invalid Base64 or bytes that are not meaningful UTF-8 can fail or produce unreadable text; decoding is not integrity verification.", exampleInput: "WEZyZWUuaW4=" },
  { engineId: "url-encode", slug: "url-component-encoder", title: "URL Component Encoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Percent-encode text as a URL component so reserved characters can safely appear inside query values, fragments, or generated links.", inputGuide: "Paste only the component you want encoded, such as a query value, rather than a complete URL unless that is intentional.", outputGuide: "The result uses browser-standard percent encoding appropriate for a single URL component.", caveat: "Encoding a full URL as one component also escapes separators such as colon and slash, which is usually not desired.", exampleInput: "hello world & xfree" },
  { engineId: "url-decode", slug: "url-component-decoder", title: "URL Component Decoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Decode percent-encoded URL component text to inspect human-readable query values, slugs, redirect parameters, and tracking data.", inputGuide: "Paste a percent-encoded component such as search%20term%3Dxfree with valid percent escape sequences.", outputGuide: "The result is the decoded Unicode text represented by the component.", caveat: "A decoded value can contain reserved characters and should be re-encoded before being inserted back into a URL component.", exampleInput: "search%20term%3Dxfree" },
  { engineId: "hex-encode", slug: "utf8-hex-encoder", title: "UTF-8 Hex Encoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Encode Unicode text into lowercase UTF-8 hexadecimal byte pairs for debugging protocol payloads, storage formats, and byte boundaries.", inputGuide: "Paste text containing ASCII or Unicode characters; the browser first encodes the string as UTF-8 bytes.", outputGuide: "The output is a compact hexadecimal representation of every UTF-8 byte in order.", caveat: "Hex output represents bytes rather than visible characters, so one Unicode character can require several byte pairs.", exampleInput: "\u0928\u092E\u0938\u094D\u0924\u0947 XFree" },
  { engineId: "hex-decode", slug: "utf8-hex-decoder", title: "UTF-8 Hex Decoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Decode hexadecimal byte pairs as strict UTF-8 text for inspecting encoded payloads, serialized values, and protocol samples.", inputGuide: "Paste an even-length sequence of hexadecimal byte pairs that represents UTF-8 data.", outputGuide: "The tool validates byte pairs and decodes them through the browser UTF-8 decoder.", caveat: "Arbitrary binary data is not necessarily valid UTF-8, so use a binary viewer when the bytes represent images or executables.", exampleInput: "58467265652e696e" },
  { engineId: "html-encode", slug: "html-entity-encoder", title: "HTML Entity Encoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Escape HTML-significant characters so text can be displayed literally instead of being interpreted as markup by an HTML parser.", inputGuide: "Paste text containing ampersands, angle brackets, quotes, or apostrophes that need to appear as literal HTML text.", outputGuide: "The output replaces core HTML-significant characters with their entity forms.", caveat: "Entity encoding is context-specific and does not automatically make arbitrary data safe in JavaScript, CSS, or URL contexts.", exampleInput: "<strong>XFree & tools</strong>" },
  { engineId: "html-decode", slug: "html-entity-decoder", title: "HTML Entity Decoder", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Decode common named and numeric HTML entities into readable Unicode text without evaluating the decoded result as executable markup.", inputGuide: "Paste entity-encoded text such as &amp; or numeric references; the utility treats the decoded result as text.", outputGuide: "The output is plain decoded Unicode text.", caveat: "Decoded text can contain angle brackets or script-like strings, so keep it as text unless it has been intentionally sanitized for HTML.", exampleInput: "XFree &amp; browser tools" },
  { engineId: "json-format", slug: "json-pretty-printer", title: "JSON Pretty Printer", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Parse valid JSON and pretty-print it with consistent indentation for debugging, code review, documentation, and version-control friendly diffs.", inputGuide: "Paste a complete valid JSON value including its outer object, array, string, number, boolean, or null.", outputGuide: "The browser returns normalized JSON with two-space indentation while preserving array order and value types.", caveat: "Formatting cannot recover invalid syntax and is not a byte-for-byte canonicalization scheme for cryptographic signing.", exampleInput: '{"name":"xfree","local":true,"count":50}' },
  { engineId: "json-minify", slug: "json-minifier", title: "JSON Minifier", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Remove insignificant JSON whitespace by parsing and reserializing valid JSON for compact transport, fixtures, and embedded configuration.", inputGuide: "Paste valid JSON that you have already reviewed; comments and trailing commas are not part of standard JSON.", outputGuide: "The result is a compact JSON serialization with no formatting whitespace between tokens.", caveat: "Minification changes formatting but is not compression and does not protect or encrypt sensitive values.", exampleInput: '{\n  "name": "xfree",\n  "local": true\n}' },
  { engineId: "json-sort-keys", slug: "json-key-sorter", title: "JSON Key Sorter", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Sort JSON object keys recursively while preserving array order to make configuration snapshots, reviews, and structural diffs easier to compare.", inputGuide: "Paste valid JSON containing objects whose key order you want normalized for human comparison.", outputGuide: "The output recursively sorts object keys and keeps array element order unchanged.", caveat: "Key sorting is a presentation convention and is not identical to a formal canonical JSON standard used for signing.", exampleInput: '{"z":1,"a":{"y":2,"b":3}}' },
  { engineId: "json-validate", slug: "json-syntax-validator", title: "JSON Syntax Validator", category: "validators", categoryLabel: "Validators", iconName: "CheckCircle2", description: "Validate whether input is syntactically correct JSON with an immediate browser-side pass result or parser error for malformed documents.", inputGuide: "Paste the exact JSON payload you want checked, including its outer object, array, or primitive value.", outputGuide: "Valid input returns a clear success result while invalid syntax surfaces the browser parser error.", caveat: "Syntax validity does not prove required business fields, JSON Schema constraints, or API-specific rules are satisfied.", exampleInput: '{"valid":true,"items":[1,2,3]}' },
  { engineId: "json-value-type", slug: "json-value-type-inspector", title: "JSON Value Type Inspector", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Identify the top-level JSON value type to distinguish objects, arrays, strings, numbers, booleans, and null during payload inspection.", inputGuide: "Paste one complete valid JSON value rather than JavaScript object syntax or an incomplete fragment.", outputGuide: "The result reports the top-level JSON type with arrays and null handled distinctly.", caveat: "Only the top level is reported; nested values can contain many different types that require separate inspection.", exampleInput: "[1,2,3]" },
  { engineId: "json-object-keys", slug: "json-object-key-extractor", title: "JSON Object Key Extractor", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "List the top-level keys of a JSON object for schema discovery, payload auditing, fixture review, and quick field inventory checks.", inputGuide: "Paste a valid JSON object at the top level; arrays and primitive values are rejected because they do not expose object keys.", outputGuide: "The output is a JSON array containing each own top-level key.", caveat: "Only top-level keys are returned; nested object keys require selecting the nested object first.", exampleInput: '{"id":1,"name":"XFree","local":true}' },
  { engineId: "json-array-length", slug: "json-array-length-counter", title: "JSON Array Length Counter", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Count entries in a top-level JSON array without manually scanning a collection or uploading the payload to a remote processing service.", inputGuide: "Paste a valid JSON array as the top-level value.", outputGuide: "The result is the exact number of top-level array elements including nulls and repeated values.", caveat: "Nested arrays count as one top-level element each; the tool does not recursively total every descendant.", exampleInput: '["a","b",null,{"x":1}]' },
  { engineId: "json-pointer-get", slug: "json-pointer-resolver", title: "JSON Pointer Resolver", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Resolve an RFC 6901-style JSON Pointer against a JSON document to inspect a precise nested value in the browser without server code.", inputGuide: "Put the JSON Pointer on the first line and the JSON document on the following lines.", outputGuide: "The selected value is returned as formatted JSON when the pointer exists.", caveat: "Pointer tokens use ~0 for a literal tilde and ~1 for a slash; missing segments produce an explicit error.", exampleInput: '/users/0/name\n{"users":[{"name":"Ada"}]}' },
  { engineId: "json-array-dedupe", slug: "json-array-deduplicator", title: "JSON Array Deduplicator", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Remove repeated values from a top-level JSON array by comparing their serialized representation for deterministic browser-side cleanup.", inputGuide: "Paste a valid JSON array containing strings, numbers, booleans, nulls, objects, or arrays that you want deduplicated.", outputGuide: "The result keeps the first serialized occurrence of each value and returns formatted JSON.", caveat: "Objects with the same fields in different key orders can serialize differently, so this is not deep semantic equivalence.", exampleInput: '[1,1,"1",{"a":1},{"a":1}]' },
  { engineId: "json-array-sort", slug: "json-array-sorter", title: "JSON Array Sorter", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Sort a homogeneous top-level JSON array of strings or numbers for predictable review, fixtures, comparisons, and local data preparation.", inputGuide: "Paste an array containing only strings or only finite numbers.", outputGuide: "The output is a sorted JSON array using numeric order for numbers and locale-aware order for strings.", caveat: "Mixed types are rejected because JavaScript coercion can create surprising and non-portable ordering.", exampleInput: "[9,3,12,1]" },
  { engineId: "json-string-escape", slug: "json-string-escaper", title: "JSON String Escaper", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Serialize arbitrary text as one valid JSON string literal with quotes, line breaks, controls, and backslashes escaped correctly.", inputGuide: "Paste the raw text that should become a JSON string value.", outputGuide: "The result is a complete JSON string literal that can be embedded inside a larger JSON document.", caveat: "The output includes surrounding quotes, so adding another pair will create an unintended nested string representation.", exampleInput: 'Line 1\n"quoted" \\ path' },
  { engineId: "json-string-unescape", slug: "json-string-unescaper", title: "JSON String Unescaper", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Parse one valid JSON string literal and recover the underlying Unicode text for debugging escaped API values and serialized configuration.", inputGuide: "Paste exactly one quoted JSON string literal including the outer double quotes.", outputGuide: "The tool parses escape sequences such as newline, Unicode escapes, quotes, and backslashes into text.", caveat: "An unquoted value is not a JSON string literal and will be rejected even if it looks like ordinary text.", exampleInput: '"XFree\\nlocal\\u0020tools"' },
  { engineId: "json-lines-to-array", slug: "jsonl-to-json-array", title: "JSON Lines to Array Converter", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Convert newline-delimited JSON records into one standard JSON array for APIs, analysis, fixtures, and spreadsheet conversion workflows.", inputGuide: "Paste one valid JSON value per non-empty line.", outputGuide: "The output parses each line independently and wraps the resulting values in a formatted JSON array.", caveat: "A single malformed line stops the conversion so you can fix the source instead of silently dropping data.", exampleInput: '{"id":1}\n{"id":2}' },
  { engineId: "json-array-to-lines", slug: "json-array-to-jsonl", title: "JSON Array to JSON Lines Converter", category: "converters", categoryLabel: "Converters & Encoders", iconName: "ArrowLeftRight", description: "Serialize each element of a top-level JSON array as one JSON Lines record for streaming, logs, import pipelines, and line-oriented tooling.", inputGuide: "Paste one valid top-level JSON array.", outputGuide: "The output emits one compact JSON value per line using the JSONL or NDJSON convention.", caveat: "JSON Lines MIME types and file extensions vary across ecosystems, so confirm the format expected by your destination.", exampleInput: '[{"id":1},{"id":2}]' },
  { engineId: "json-depth", slug: "json-nesting-depth-calculator", title: "JSON Nesting Depth Calculator", category: "developer-tools", categoryLabel: "Developer Tools", iconName: "Code2", description: "Calculate the nesting depth of JSON objects and arrays to spot deeply nested payloads that can be difficult to inspect, transform, or validate.", inputGuide: "Paste a complete valid JSON value.", outputGuide: "The result reports container nesting depth while primitive leaves contribute no additional container level.", caveat: "Depth alone is not a full complexity metric because very wide shallow objects can still be expensive to process.", exampleInput: '{"a":{"b":[{"c":1}]}}' },
  { engineId: "case-converter", slug: "text-case-converter", title: "Text Case Converter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Convert text to upper, lower, or title-style case and inspect basic word and character counts with one local browser utility.", inputGuide: "Paste the text to transform and choose the intended case operation from the tool controls.", outputGuide: "The result is transformed text or a concise count summary depending on the selected action.", caveat: "Title-case conventions vary by language and editorial style, so review proper nouns, acronyms, and small words manually.", exampleInput: "xFree local browser tools" },
  { engineId: "slugify", slug: "text-to-url-slug-generator", title: "Text to URL Slug Generator", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Turn titles and labels into lowercase ASCII hyphenated slugs for clean paths, filenames, anchors, and stable content identifiers.", inputGuide: "Paste a human-readable title or phrase.", outputGuide: "The tool normalizes casing, strips unsupported characters, collapses separators, and returns a hyphenated slug.", caveat: "Transliteration of non-Latin scripts is lossy, so choose a deliberate native-language or ASCII slug when meaning matters.", exampleInput: "Free Developer & SEO Tools 2026" },
  { engineId: "line-dedupe", slug: "duplicate-line-remover", title: "Duplicate Line Remover", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Remove exact duplicate lines while preserving first occurrence order for lists, exports, keyword sets, logs, and configuration fragments.", inputGuide: "Paste one logical item per line.", outputGuide: "The output keeps the first occurrence of every exact line and removes later duplicates.", caveat: "Comparison is exact, so differences in case or surrounding whitespace remain distinct unless you normalize them first.", exampleInput: "alpha\nbeta\nalpha\nBeta" },
  { engineId: "line-sort", slug: "alphabetical-line-sorter", title: "Alphabetical Line Sorter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Sort newline-separated text with the browser locale comparator for cleaner lists, reports, configuration files, and review workflows.", inputGuide: "Paste one item per line.", outputGuide: "The result reorders complete lines while leaving the characters inside each line unchanged.", caveat: "Locale-aware sorting can differ across browsers and languages, so use a specified collation rule when build output must be identical everywhere.", exampleInput: "zeta\nalpha\nGamma\nbeta" },
  { engineId: "whitespace-normalize", slug: "whitespace-normalizer", title: "Whitespace Normalizer", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Trim text and collapse runs of spaces, tabs, and line breaks into single spaces for compact comparison, cleanup, and normalization tasks.", inputGuide: "Paste text that contains inconsistent whitespace.", outputGuide: "The result is one normalized text stream with repeated whitespace collapsed.", caveat: "This intentionally removes paragraph and line-break structure, so use a line-specific tool when those boundaries carry meaning.", exampleInput: "XFree   tools\n\nrun	locally" },
  { engineId: "empty-line-remove", slug: "empty-line-remover", title: "Empty Line Remover", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Remove blank and whitespace-only lines while preserving the content and order of every non-empty line in the source text.", inputGuide: "Paste multiline text containing intentional content mixed with unwanted blank rows.", outputGuide: "The output retains only lines that contain non-whitespace characters.", caveat: "If blank lines separate semantic sections, removing them flattens that visual structure even though non-empty text remains.", exampleInput: "alpha\n\n \nbeta\n\ncharlie" },
  { engineId: "line-reverse", slug: "line-order-reverser", title: "Line Order Reverser", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Reverse the order of lines without reversing characters inside each line for lists, chronological notes, logs, and stack-like data.", inputGuide: "Paste one or more lines in their current order.", outputGuide: "The last input line becomes first while every line's internal text remains unchanged.", caveat: "This is not a character reverser; use the dedicated Unicode text reverser when characters inside a string must be reversed.", exampleInput: "first\nsecond\nthird" },
  { engineId: "character-count", slug: "unicode-character-counter", title: "Unicode Character Counter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Count UTF-16 code units and Unicode code points to understand how browsers and Unicode-aware systems measure a text string.", inputGuide: "Paste any Unicode text including emoji, symbols, combining characters, or ordinary prose.", outputGuide: "The result reports JavaScript UTF-16 length and iterated Unicode code-point count.", caveat: "Neither count equals user-perceived grapheme count for every emoji or combining sequence; use Grapheme Counter for that.", exampleInput: "A\u{1F600}\xE9" },
  { engineId: "code-point-count", slug: "unicode-code-point-counter", title: "Unicode Code Point Counter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Count Unicode code points without confusing supplementary characters with two UTF-16 code units during browser-side text inspection.", inputGuide: "Paste Unicode text containing letters, symbols, emoji, or combining marks.", outputGuide: "The output is the number of iterated Unicode code points in the string.", caveat: "A visible grapheme can contain multiple code points, including emoji sequences or a base letter plus combining marks.", exampleInput: "\u{1F469}\u200D\u{1F4BB} XFree" },
  { engineId: "grapheme-count", slug: "grapheme-cluster-counter", title: "Grapheme Cluster Counter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Count user-perceived grapheme clusters with Intl.Segmenter for realistic text limits involving international characters and emoji sequences.", inputGuide: "Paste text exactly as users see it, including emoji and combining marks.", outputGuide: "The browser segments the string into grapheme clusters and reports their count.", caveat: "Segmentation follows the browser's Unicode data and may differ on very old engines, so document browser support requirements.", exampleInput: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} caf\xE9" },
  { engineId: "word-count", slug: "unicode-word-counter", title: "Unicode Word Counter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Count practical Unicode word tokens for drafts, documentation, snippets, and content checks without uploading the working text.", inputGuide: "Paste the text whose word count you need.", outputGuide: "The result tokenizes common Unicode letters and numbers and returns the total count.", caveat: "Word boundaries differ across languages and editorial rules, so this is a practical counter rather than a linguistic parser.", exampleInput: "XFree builds privacy-first browser utilities." },
  { engineId: "sentence-count", slug: "sentence-counter", title: "Sentence Counter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Estimate sentence count from terminal punctuation for quick draft checks, documentation review, and lightweight readability workflows.", inputGuide: "Paste prose containing ordinary sentence punctuation.", outputGuide: "The tool estimates sentence boundaries using punctuation and whitespace patterns.", caveat: "Abbreviations, decimals, headings, and languages with different punctuation can make heuristic sentence counting imperfect.", exampleInput: "XFree is local-first. It runs in your browser! Ready?" },
  { engineId: "paragraph-count", slug: "paragraph-counter", title: "Paragraph Counter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Count text blocks separated by blank lines to inspect document structure, drafts, notes, and content without sending it to a server.", inputGuide: "Paste plain text where blank lines represent paragraph boundaries.", outputGuide: "The result counts non-empty blocks separated by one or more blank lines.", caveat: "Markdown lists or hard-wrapped prose can use blank lines differently, so interpret the number according to the source format.", exampleInput: "First paragraph.\n\nSecond paragraph.\nStill second." },
  { engineId: "character-frequency", slug: "character-frequency-analyzer", title: "Character Frequency Analyzer", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Count occurrences of each Unicode code point to inspect symbol distribution, separators, repeated characters, and unusual text patterns.", inputGuide: "Paste the text you want analyzed.", outputGuide: "The output is a JSON object mapping each Unicode code point to its occurrence count.", caveat: "Visually identical graphemes can have different Unicode normalization forms and therefore appear as different code-point keys.", exampleInput: "banana \u{1F34C}" },
  { engineId: "word-frequency", slug: "word-frequency-analyzer", title: "Word Frequency Analyzer", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Count normalized practical word tokens to reveal repeated terminology, dominant vocabulary, and simple text distribution patterns locally.", inputGuide: "Paste prose, notes, logs, documentation, or other word-oriented text.", outputGuide: "The output is a JSON object mapping lowercase word tokens to their counts.", caveat: "Frequency is not a measure of SEO quality or semantic importance and should not be used for keyword stuffing.", exampleInput: "XFree tools are free. XFree tools run locally." },
  { engineId: "reverse-text", slug: "unicode-text-reverser", title: "Unicode Text Reverser", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Reverse text by Unicode code point for transformation testing, puzzles, fixtures, and string-processing experiments in the browser.", inputGuide: "Paste the exact string you want reversed.", outputGuide: "The result reverses Unicode code-point order across the entire input.", caveat: "Complex grapheme clusters can still split because code-point reversal is not grapheme-aware; do not treat it as typography-safe.", exampleInput: "XFree \u{1F600}" },
  { engineId: "reverse-words", slug: "word-order-reverser", title: "Word Order Reverser", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Reverse whitespace-delimited word order while preserving characters inside each token for quick text transformation and test preparation.", inputGuide: "Paste words or prose separated by whitespace.", outputGuide: "The output places the final token first and joins all tokens with single spaces.", caveat: "Original spacing, line breaks, and punctuation attachment are not preserved because the engine operates on whitespace-delimited tokens.", exampleInput: "privacy first local tools" },
  { engineId: "trim-lines", slug: "line-whitespace-trimmer", title: "Line Whitespace Trimmer", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Remove leading and trailing whitespace from every line while preserving line order and internal spacing for controlled text cleanup.", inputGuide: "Paste multiline text whose line edges contain unwanted spaces or tabs.", outputGuide: "The output trims each line independently and keeps the same line order.", caveat: "Indentation can be meaningful in Python, YAML, Markdown, and configuration files, so do not trim code where leading spaces carry syntax.", exampleInput: "  alpha  \n	beta	\n gamma" },
  { engineId: "prefix-lines", slug: "line-prefix-adder", title: "Line Prefix Adder", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Add one shared prefix to every line for comments, bullets, log labels, generated configuration, and batch text preparation workflows.", inputGuide: "Put the desired prefix on the first line and the body text on all following lines.", outputGuide: "The tool prepends the prefix exactly to each body line.", caveat: "The first line is configuration rather than content, and existing prefixes are not detected or automatically deduplicated.", exampleInput: "- \nalpha\nbeta\ngamma" },
  { engineId: "suffix-lines", slug: "line-suffix-adder", title: "Line Suffix Adder", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Append one shared suffix to every line for delimiters, annotations, generated code fragments, and repetitive batch editing workflows.", inputGuide: "Put the desired suffix on the first line and the body text on following lines.", outputGuide: "The tool appends the suffix exactly to every body line.", caveat: "The first line configures the suffix and repeated runs can add the same suffix multiple times if you do not reset the input.", exampleInput: ";\nconst a = 1\nconst b = 2" },
  { engineId: "number-lines", slug: "line-numbering-tool", title: "Line Numbering Tool", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Prefix each line with a one-based number for reviews, checklists, snippets, transcripts, instructions, and manual reference workflows.", inputGuide: "Paste the lines in the order they should be numbered.", outputGuide: "The output adds 1., 2., 3. and subsequent one-based numbers before each line.", caveat: "Existing numbering is not removed automatically, so normalize a previously numbered list before applying fresh numbers.", exampleInput: "alpha\nbeta\ngamma" },
  { engineId: "filter-lines", slug: "line-include-filter", title: "Line Include Filter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Keep only lines containing an exact substring for quick log triage, keyword filtering, exports, lists, and configuration cleanup.", inputGuide: "Put the substring to match on the first line and the candidate lines underneath it.", outputGuide: "The output retains only body lines whose text includes the query exactly.", caveat: "Matching is case-sensitive and literal; use Regex Tester when you need case-insensitive, anchored, or pattern-based filtering.", exampleInput: "ERROR\nINFO started\nERROR timeout\nWARN retry" },
  { engineId: "remove-matching-lines", slug: "matching-line-remover", title: "Matching Line Remover", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Remove lines containing an exact substring while preserving every non-matching line in its original order for controlled cleanup.", inputGuide: "Put the substring to remove on the first line and the source lines underneath it.", outputGuide: "The result excludes matching body lines and keeps all other lines unchanged.", caveat: "Matching is literal and case-sensitive, so use a regex workflow when case variants or structured patterns must be removed.", exampleInput: "DEBUG\nINFO ready\nDEBUG cache miss\nERROR failed" },
  { engineId: "tabs-to-spaces", slug: "tabs-to-spaces-converter", title: "Tabs to Spaces Converter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Replace tab characters with a configurable number of spaces for code review, data cleanup, indentation checks, and formatting normalization.", inputGuide: "Put the desired tab width on the first line and the text to transform on following lines.", outputGuide: "Every tab character becomes the requested number of ordinary spaces.", caveat: "The engine uses fixed-width replacement rather than calculating visual tab stops from the current column position.", exampleInput: "4\n	const x = 1;\n		return x;" },
  { engineId: "spaces-to-tabs", slug: "leading-spaces-to-tabs", title: "Leading Spaces to Tabs Converter", category: "text-tools", categoryLabel: "Text & Diff Tools", iconName: "FileText", description: "Convert groups of leading spaces into tab characters using a chosen indentation width while leaving internal spacing untouched.", inputGuide: "Put the indentation width on the first line and the indented text on following lines.", outputGuide: "Leading groups that match the width are replaced by tab characters.", caveat: "Partial leading groups remain spaces and converting indentation can conflict with project style rules, linters, or language conventions.", exampleInput: "2\n  alpha\n    beta" }
];
var BATCH1_PUBLISHED_TOOLS = BATCH1_SPECS.map(buildTool);

// src/data/publicTools.ts
var BASE_PUBLISHED_TOOLS = TOOLS_REGISTRY.filter(
  (tool) => tool.status === "published" && tool.indexable === true
);
var BATCH1_PUBLIC_TOOLS = BATCH1_PUBLISHED_TOOLS.map((tool) => ({
  ...tool,
  id: `local-${tool.id}`
}));
var toolMap2 = /* @__PURE__ */ new Map();
for (const tool of [...BASE_PUBLISHED_TOOLS, ...BATCH1_PUBLIC_TOOLS]) {
  const key = tool.slug || tool.id;
  if (!toolMap2.has(key)) toolMap2.set(key, tool);
}
var PUBLIC_TOOLS = Array.from(toolMap2.values());
var PUBLIC_CATEGORY_DESCRIPTION_OVERRIDES = {
  validators: "Validate JSON, XML, sitemaps, Schema.org markup, robots.txt rules, and structured data with focused browser-based checks."
};
var PUBLIC_CATEGORIES = CATEGORIES.filter(
  (category) => PUBLIC_TOOLS.some((tool) => tool.category === category.id)
).map((category) => ({
  ...category,
  description: PUBLIC_CATEGORY_DESCRIPTION_OVERRIDES[category.id] || category.description
}));
var PUBLIC_TOOL_SLUGS = new Set(PUBLIC_TOOLS.map((tool) => tool.slug));
function getPublicToolBySlug(slug) {
  return PUBLIC_TOOLS.find((tool) => tool.slug === slug || tool.id === slug);
}

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
var GENERATED_PUBLISHED_CONTENT = {};

// src/data/siteConfig.ts
var CANONICAL_ORIGIN = "https://www.xfree.in";
var SITE_CONTENT_LASTMOD = "2026-08-23";

// src/data/masterBlueprint.ts
var PILLARS_50 = [
  { id: 1, name: "Frontend Development", slug: "frontend-development", icon: "\u{1F310}", description: "Modern UI engineering, DOM manipulation, client-side rendering, and responsive web toolsets." },
  { id: 2, name: "Backend Development", slug: "backend-development", icon: "\u26A1", description: "Server architectures, runtime environments, middleware processing, and API endpoints." },
  { id: 3, name: "DevOps & CI/CD", slug: "devops-cicd", icon: "\u{1F680}", description: "Continuous integration, automated pipelines, deployment workflows, and container runtimes." },
  { id: 4, name: "Cybersecurity & Privacy", slug: "cybersecurity-privacy", icon: "\u{1F512}", description: "Cryptographic operations, privacy enforcement, credential generation, and threat auditing." },
  { id: 5, name: "Technical SEO", slug: "technical-seo", icon: "\u{1F4C8}", description: "Search engine crawlability, schema validation, URL hygiene, and indexing diagnostics." },
  { id: 6, name: "Content & Copywriting", slug: "content-copywriting", icon: "\u270D\uFE0F", description: "Text analysis, readability scoring, word analytics, and editorial utilities." },
  { id: 7, name: "Data Engineering", slug: "data-engineering", icon: "\u{1F4CA}", description: "ETL pipelines, schema transformations, stream ingestion, and columnar formats." },
  { id: 8, name: "AI & Machine Learning", slug: "ai-machine-learning", icon: "\u{1F916}", description: "Token counting, prompt engineering, embedding math, and model orchestration." },
  { id: 9, name: "Database Management", slug: "database-management", icon: "\u{1F5C4}\uFE0F", description: "Query optimization, schema migration, relational mapping, and indexing strategies." },
  { id: 10, name: "API Development & Testing", slug: "api-development-testing", icon: "\u{1F50C}", description: "REST, GraphQL, gRPC payload inspection, mock endpoints, and latency testing." },
  { id: 11, name: "Cloud Infrastructure", slug: "cloud-infrastructure", icon: "\u2601\uFE0F", description: "Serverless configurations, cloud cost estimation, IAM rules, and edge routing." },
  { id: 12, name: "Mobile Development", slug: "mobile-development", icon: "\u{1F4F1}", description: "iOS, Android, React Native, and Flutter asset preparation and deep-link generation." },
  { id: 13, name: "UI/UX Design", slug: "ui-ux-design", icon: "\u{1F3A8}", description: "Design tokens, layout visualizers, spacing math, and component geometry." },
  { id: 14, name: "Web Accessibility (a11y)", slug: "web-accessibility", icon: "\u267F", description: "WCAG 2.2 auditing, contrast checking, screen reader semantics, and focus management." },
  { id: 15, name: "Performance Optimization", slug: "performance-optimization", icon: "\u26A1", description: "Core Web Vitals tuning, bundle size analysis, and asset minification." },
  { id: 16, name: "Blockchain & Web3", slug: "blockchain-web3", icon: "\u26D3\uFE0F", description: "Smart contract inspection, wallet signature generation, and EVM gas estimators." },
  { id: 17, name: "Game Development", slug: "game-development", icon: "\u{1F3AE}", description: "Sprite sheet packing, math coordinate converters, and frame delta timers." },
  { id: 18, name: "Network Engineering", slug: "network-engineering", icon: "\u{1F310}", description: "CIDR subnet calculation, DNS record formatting, and packet payload analyzers." },
  { id: 19, name: "System Administration", slug: "system-administration", icon: "\u{1F5A5}\uFE0F", description: "Cron expression generators, bash script linters, and Linux permission calculators." },
  { id: 20, name: "Version Control (Git)", slug: "version-control-git", icon: "\u{1F500}", description: "Commit convention helpers, gitignore generators, and branch strategy calculators." },
  { id: 21, name: "Code Quality & Refactoring", slug: "code-quality-refactoring", icon: "\u2728", description: "Complexity scoring, dead code detection, and syntax modernization." },
  { id: 22, name: "Documentation & Tech Writing", slug: "documentation-tech-writing", icon: "\u{1F4C4}", description: "API docs generation, markdown formatting, and changelog builders." },
  { id: 23, name: "Project Management", slug: "project-management", icon: "\u{1F4CB}", description: "Sprint capacity calculators, burn-down math, and task prioritization matrixes." },
  { id: 24, name: "Agile Workflows", slug: "agile-workflows", icon: "\u{1F504}", description: "Story point poker tools, velocity estimators, and retro template generators." },
  { id: 25, name: "E-commerce Development", slug: "ecommerce-development", icon: "\u{1F6D2}", description: "Product feed validators, SKU formatters, and discount rate calculators." },
  { id: 26, name: "Headless CMS", slug: "headless-cms", icon: "\u{1F9E9}", description: "Content model visualizers, GraphQL query generators, and webhook testing." },
  { id: 27, name: "Email Development", slug: "email-development", icon: "\u{1F4E7}", description: "HTML email inliners, MJML compilers, and inbox preview test harnesses." },
  { id: 28, name: "Video Processing", slug: "video-processing", icon: "\u{1F3A5}", description: "FFmpeg command builders, aspect ratio math, and bitrate calculators." },
  { id: 29, name: "Image Processing", slug: "image-processing", icon: "\u{1F5BC}\uFE0F", description: "Client-side WebP/AVIF compression, metadata stripping, and SVG cleaners." },
  { id: 30, name: "Typography & Web Fonts", slug: "typography-web-fonts", icon: "\u{1F524}", description: "Type scale calculators, variable font playground, and font format converters." },
  { id: 31, name: "Color Theory & Palettes", slug: "color-theory-palettes", icon: "\u{1F3A8}", description: "HEX/RGB/HSL converters, palette harmonic generators, and color delta E." },
  { id: 32, name: "Regular Expressions (Regex)", slug: "regular-expressions-regex", icon: "\u{1F50D}", description: "Regex testing, pattern visualizers, and escape string generators." },
  { id: 33, name: "Cryptography & Hashing", slug: "cryptography-hashing", icon: "\u{1F511}", description: "SHA-256/512 generators, HMAC calculators, and AES client encryptors." },
  { id: 34, name: "Unit & Integration Testing", slug: "unit-integration-testing", icon: "\u{1F9EA}", description: "Mock data generators, fixture builders, and assertion syntax helpers." },
  { id: 35, name: "Browser Extensions", slug: "browser-extensions", icon: "\u{1F9E9}", description: "Manifest V3 builders, icon pack generators, and permission checkers." },
  { id: 36, name: "WebAssembly (Wasm)", slug: "webassembly-wasm", icon: "\u2699\uFE0F", description: "Wasm binary inspectors, WAT text disassemblers, and runtime benchmarks." },
  { id: 37, name: "Serverless Computing", slug: "serverless-computing", icon: "\u26A1", description: "Cold-start calculators, Lambda payload testers, and edge function helpers." },
  { id: 38, name: "Containerization (Docker/K8s)", slug: "containerization-docker-k8s", icon: "\u{1F433}", description: "Dockerfile optimizers, Kubernetes YAML generators, and compose validators." },
  { id: 39, name: "Monitoring & Observability", slug: "monitoring-observability", icon: "\u{1F4E1}", description: "PromQL query builders, SLO/SLA error budget math, and log parsers." },
  { id: 40, name: "Logging & Analytics", slug: "logging-analytics", icon: "\u{1F4DD}", description: "Logstash pattern generators, JSON log formatters, and metric aggregators." },
  { id: 41, name: "Localization (i18n)", slug: "localization-i18n", icon: "\u{1F30D}", description: "Gettext PO/MO converters, ICU message formatters, and hreflang tag builders." },
  { id: 42, name: "File Format Conversion", slug: "file-format-conversion", icon: "\u{1F504}", description: "Client-side file conversions for JSON, CSV, XML, YAML, and PDF." },
  { id: 43, name: "Markdown & Text Processing", slug: "markdown-text-processing", icon: "\u{1F4DD}", description: "Markdown to HTML compilers, diff checkers, and text case converters." },
  { id: 44, name: "JSON, XML & YAML Utils", slug: "json-xml-yaml-utils", icon: "\u{1F4C4}", description: "Bi-directional serialization, schema validation, and path extractors." },
  { id: 45, name: "CSS Utilities", slug: "css-utilities", icon: "\u{1F4D0}", description: "Flexbox/Grid visualizers, box-shadow generators, and CSS minifiers." },
  { id: 46, name: "JavaScript & TypeScript Utils", slug: "javascript-typescript-utils", icon: "\u26A1", description: "TypeScript interface generators, AST viewers, and JS minifiers." },
  { id: 47, name: "Python Developer Utils", slug: "python-developer-utils", icon: "\u{1F40D}", description: "Pip requirements formatters, pyproject.toml builders, and docstring helpers." },
  { id: 48, name: "Rust & Systems Programming", slug: "rust-systems-programming", icon: "\u{1F980}", description: "Cargo.toml builders, unsafe audit checklists, and memory size calculators." },
  { id: 49, name: "Open Source Compliance", slug: "open-source-compliance", icon: "\u2696\uFE0F", description: "SPDX license pickers, notice generators, and dependency audits." },
  { id: 50, name: "Developer Productivity", slug: "developer-productivity", icon: "\u23F1\uFE0F", description: "Pomodoro timers, snippet managers, and quick scratchpads." }
];
var CLUSTERS_50 = [
  "Utilities",
  "Generators",
  "Converters",
  "Validators",
  "Analyzers",
  "Formatters",
  "Debuggers",
  "Optimizers",
  "Testers",
  "Builders",
  "Calculators",
  "Encoders/Decoders",
  "Visualizers",
  "Linters",
  "Simulators",
  "Playgrounds",
  "Extractors",
  "Mappers",
  "Transformers",
  "Compilers",
  "Snippets",
  "Templates",
  "Checkers",
  "Monitors",
  "Scanners",
  "Profilers",
  "Benchmarkers",
  "Migrators",
  "Synchronizers",
  "Packagers",
  "Bundlers",
  "Transpilers",
  "Polyfills",
  "Shims",
  "Mockers",
  "Stubs",
  "Fakers",
  "Data Generators",
  "Parsers",
  "Serializers",
  "Deserializers",
  "Query Builders",
  "Schema Designers",
  "Indexers",
  "Cachers",
  "Traffic Shapers",
  "Rate Limiters",
  "Webhook Testers",
  "CLI Builders",
  "SDK Generators"
];
var MODIFIERS_10 = [
  "Client-Side Minifier",
  "Instant Converter",
  "Privacy-First Validator",
  "Local Analyzer",
  "Browser-Based Formatter",
  "Offline Debugger",
  "WASM Optimizer",
  "Zero-Telemetry Tester",
  "Open-Source Builder",
  "Quick Calculator"
];
var ROADMAP_CONCEPT_COUNT = PILLARS_50.length * CLUSTERS_50.length * MODIFIERS_10.length;
var TOOL_PILLAR_MAP = {
  "bulk-url-extractor": "technical-seo",
  "xml-sitemap-generator": "technical-seo",
  "json-formatter": "json-xml-yaml-utils",
  "regex-tester": "regular-expressions-regex",
  "cron-expression-generator": "system-administration",
  "meta-tag-generator": "technical-seo",
  "robots-txt-generator": "technical-seo",
  "schema-markup-generator": "technical-seo",
  "base64-encoder-decoder": "cryptography-hashing",
  "url-slug-utm-builder": "technical-seo"
};

// src/data/pillarPublishing.ts
function getPublishedToolsForPillar(pillarSlug) {
  return PUBLIC_TOOLS.filter((tool) => TOOL_PILLAR_MAP[tool.slug] === pillarSlug);
}
var INDEXABLE_PILLARS = PILLARS_50.filter(
  (pillar) => getPublishedToolsForPillar(pillar.slug).length > 0
);
var INDEXABLE_PILLAR_SLUGS = new Set(INDEXABLE_PILLARS.map((pillar) => pillar.slug));

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
var STATIC_PAGE_ENTRIES = [
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
  { path: "/pillars", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/contribute", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/instaserver", lastmod: SITE_CONTENT_LASTMOD },
  { path: "/json-tools", lastmod: SITE_CONTENT_LASTMOD }
];
function getPageSitemapEntries() {
  return [
    ...STATIC_PAGE_ENTRIES,
    ...PUBLIC_CATEGORIES.map((category) => ({
      path: `/${category.id}`,
      lastmod: SITE_CONTENT_LASTMOD
    })),
    ...INDEXABLE_PILLARS.map((pillar) => ({
      path: `/pillar/${pillar.slug}`,
      lastmod: SITE_CONTENT_LASTMOD
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
    if (!artifact.slug || seen.has(artifact.slug)) continue;
    seen.add(artifact.slug);
    entries.push({
      path: `/tools/${artifact.slug}`,
      lastmod: normalizeDate(artifact.approval.reviewedAt)
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
function generatePagesSitemapXml(baseUrl = DEFAULT_BASE_URL) {
  return renderUrlset(getPageSitemapEntries(), baseUrl);
}
function generateToolsSitemapXml(baseUrl = DEFAULT_BASE_URL) {
  return renderUrlset(getToolSitemapEntries(), baseUrl);
}
function generateGuidesSitemapXml(baseUrl = DEFAULT_BASE_URL) {
  return renderUrlset(getGuideSitemapEntries(), baseUrl);
}
function generateSitemapIndexXml(baseUrl = DEFAULT_BASE_URL) {
  const cleanBase = cleanOrigin(baseUrl);
  const groups = [
    { path: "/sitemap-pages.xml", lastmod: maxLastmod(getPageSitemapEntries()) },
    { path: "/sitemap-tools.xml", lastmod: maxLastmod(getToolSitemapEntries()) },
    { path: "/sitemap-guides.xml", lastmod: maxLastmod(getGuideSitemapEntries()) }
  ];
  const rows = groups.map((group) => `  <sitemap>
    <loc>${escapeXml(`${cleanBase}${group.path}`)}</loc>
    <lastmod>${escapeXml(group.lastmod)}</lastmod>
  </sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</sitemapindex>`;
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
  text += `## Primary Sections

`;
  text += `- [Home](${cleanBase}/): Search and browse the published tool directory.
`;
  text += `- [Guides](${cleanBase}/guides): Reviewed documentation connected to published tools.
`;
  text += `- [How It Works](${cleanBase}/how-it-works): Processing modes, browser execution, and optional cloud handoffs.
`;
  text += `- [Pillars](${cleanBase}/pillars): 50 developer and SEO topic pillars; only pillars backed by published tools enter the sitemap.
`;
  text += `- [Roadmap](${cleanBase}/roadmap): ${ROADMAP_CONCEPT_COUNT.toLocaleString()} planned concepts on a noindex discovery page; this is not a count of live tools.
`;
  text += `- [Contribute](${cleanBase}/contribute): Open-source contribution workflow, publication gates, and safe good-first-issue process.
`;
  text += `- [InstaServer](${cleanBase}/instaserver): Free, open-source MCP server that deploys app containers on your own machine \u2014 no account, no rate limit.
`;
  text += `- [JSON Tools](${cleanBase}/json-tools): Hub of 18 free browser-based JSON tools \u2014 format, validate, minify, convert, sort, and inspect.
`;
  text += `- [OpenAPI](${cleanBase}/openapi.json): Machine-readable description of the public XFree API surface.

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
  for (const pillar of INDEXABLE_PILLARS) {
    text += `- [${pillar.name}](${cleanBase}/pillar/${pillar.slug}): ${pillar.description}
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
      tool.howToUse.forEach((step2, index) => {
        text += `  ${index + 1}. ${step2}
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
User-agent: *
Allow: /
Disallow: /api/

# Search and answer-engine crawlers
User-agent: Googlebot
Allow: /
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /api/

User-agent: ChatGPT-User
Allow: /
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /api/

# Canonical discovery entry point
Sitemap: ${cleanBase}/sitemap-index.xml
`;
}

// src/utils/generateStructuredData.ts
function generateCapabilitiesJson(baseUrl = "https://www.xfree.in") {
  const capabilitiesMap = /* @__PURE__ */ new Map();
  for (const tool of PUBLIC_TOOLS) {
    if (tool.capabilities) {
      for (const cap of tool.capabilities) {
        if (!capabilitiesMap.has(cap.id)) {
          capabilitiesMap.set(cap.id, []);
        }
        capabilitiesMap.get(cap.id).push({
          toolId: tool.id,
          toolTitle: tool.title,
          toolUrl: `${baseUrl}/tools/${tool.slug}`,
          fit: cap.description
        });
      }
    }
  }
  const capabilities = [];
  for (const [id, tools] of capabilitiesMap) {
    const primaryTool = tools[0];
    capabilities.push({
      id,
      name: primaryTool.toolTitle.split(" ")[0] || id,
      description: `Capability: ${id}`,
      tools,
      url: `${baseUrl}/capabilities/${encodeURIComponent(id)}`
    });
  }
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
      const tool = PUBLIC_TOOLS.find((t) => t.id === toolId || t.slug === toolId);
      if (tool) {
        matchingTools.push(tool);
      }
    }
  }
  const intentKeywords = INTENT_KEYWORDS[intent.intent] || [];
  for (const tool of PUBLIC_TOOLS) {
    if (intentKeywords.some((kw) => tool.tags.some((tag) => tag.toLowerCase().includes(kw.toLowerCase())))) {
      matchingTools.push(tool);
    }
  }
  for (const entity of intent.entities) {
    for (const tool of PUBLIC_TOOLS) {
      if (tool.tags.some((tag) => tag.toLowerCase().includes(entity)) || tool.title.toLowerCase().includes(entity.replace(/-/g, " "))) {
        matchingTools.push(tool);
      }
    }
  }
  const allMatched = Array.from(new Map(matchingTools.map((t) => [t.id, t])).values());
  if (allMatched.length === 0) {
    const queryTerms = intent.intent.toLowerCase().split(/[\s-_]+/).filter((t) => t.length > 3);
    for (const tool of PUBLIC_TOOLS) {
      const searchableText = `${tool.title} ${tool.shortDescription} ${tool.tags.join(" ")}`.toLowerCase();
      if (queryTerms.some((term) => searchableText.includes(term))) {
        allMatched.push(tool);
      }
    }
  }
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

// src/lib/execution-engine.ts
async function executeTool(request) {
  const startTime = Date.now();
  const traceId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  try {
    const tool = getPublicToolBySlug(request.toolId);
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
function executeLocalTool(tool, input) {
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
  for (const step2 of plan.steps) {
    const input = currentOutput || { problem, intent: intent.intent };
    const result = await executeTool({
      toolId: step2.toolId,
      input,
      context,
      options: { verify: step2.verify }
    });
    results.push(result);
    if (!result.success) {
      if (plan.fallbackToolIds && plan.fallbackToolIds.length > 0) {
        for (const fallbackId of plan.fallbackToolIds) {
          const fallbackResult = await executeTool({
            toolId: fallbackId,
            input,
            context,
            options: { verify: step2.verify }
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

// src/data/recipes.ts
var step = (id, engineId, label, options = {}) => ({ id, kind: "engine", engineId, label, ...options });
var transform = (id, transformId, label) => ({
  id,
  kind: "transform",
  transformId,
  label
});
var RECIPES = [
  {
    id: "recipe-url-cleanup-v1",
    slug: "url-cleanup-pipeline",
    version: 1,
    title: "URL Cleanup Pipeline",
    summary: "Extract HTTP(S) URLs, normalize each URL, remove duplicates, sort the list, and export a JSON array.",
    description: "Use this recipe when links are buried inside copied documents, logs, tickets, crawl output, or chat transcripts. The recipe first extracts HTTP and HTTPS candidates, then runs the audited URL normalizer independently across each line. It removes exact duplicates, sorts the surviving URLs, and serializes the final list as JSON. No LLM is required and no arbitrary JavaScript is accepted from the recipe payload.",
    inputLabel: "Mixed text containing URLs",
    inputHint: "Paste any text containing http:// or https:// links.",
    sampleInput: "Docs: https://www.xfree.in/docs#start\nHome: https://www.xfree.in/\nDuplicate: https://www.xfree.in/docs#start\nExternal: https://example.com:443/a#fragment",
    outputLabel: "Normalized URL JSON array",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["url", "dedupe", "normalize", "json", "seo"],
    steps: [
      step("extract", "http-url-extract", "Extract HTTP and HTTPS URLs"),
      step("normalize", "url-normalize", "Normalize each extracted URL", { config: { mapLines: true } }),
      step("dedupe", "line-dedupe", "Remove duplicate URLs"),
      step("sort", "line-sort", "Sort URLs"),
      transform("json", "lines-to-json-array", "Convert URL lines to a JSON array")
    ],
    notes: [
      "URL normalization removes fragments, lowercases hostnames, and removes default ports where the engine supports it.",
      "The workflow intentionally does not fetch remote URLs or test their HTTP status."
    ]
  },
  {
    id: "recipe-log-sanitizer-v1",
    slug: "log-sanitizer",
    version: 1,
    title: "Log Sanitizer",
    summary: "Trim log lines, keep ERROR lines, deduplicate repeated errors, sort them, and emit structured JSON.",
    description: "This recipe is a deterministic first-pass error triage workflow for pasted application or server logs. It trims leading and trailing whitespace, filters for the fixed repository-owned token ERROR, deduplicates repeated lines, sorts the remaining entries, and emits a JSON array. The filter token is part of the reviewed recipe definition rather than executable user code, so shared recipe URLs cannot redefine the filter implementation or inject scripts.",
    inputLabel: "Application or server log text",
    inputHint: "Paste logs. Version 1 keeps lines containing the exact text ERROR.",
    sampleInput: "INFO boot complete\n ERROR database timeout \nWARN retrying\nERROR database timeout\nERROR cache unavailable",
    outputLabel: "Deduplicated ERROR lines",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["logs", "errors", "cleanup", "dedupe", "json"],
    steps: [
      step("trim", "trim-lines", "Trim each log line"),
      step("errors", "filter-lines", "Keep lines containing ERROR", { config: { prependLine: "ERROR" } }),
      step("dedupe", "line-dedupe", "Remove repeated error lines"),
      step("sort", "line-sort", "Sort unique error lines"),
      transform("json", "lines-to-json-array", "Convert error lines to a JSON array")
    ],
    notes: [
      "Version 1 uses a literal ERROR filter. It does not infer severity or semantics with an LLM.",
      "Secrets already present in a log are not automatically redacted; review input before sharing output."
    ]
  },
  {
    id: "recipe-jwt-inspection-v1",
    slug: "jwt-inspection-workflow",
    version: 1,
    title: "JWT Inspection Workflow",
    summary: "Decode a JWT without verifying its signature, format the decoded JSON, and sort object keys for inspection.",
    description: "This workflow is designed for local inspection of JWT structure and claims. It uses the existing unverified JWT decoder, then formats the resulting JSON and sorts keys recursively to make comparison easier. The recipe does not claim that a token is authentic, valid, or trusted: decoding is not signature verification. Keep production secrets and live bearer tokens out of screenshots, issue reports, and public recipe examples.",
    inputLabel: "JWT token",
    inputHint: "Paste a three-part JWT. The signature is not verified.",
    sampleInput: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4ZnJlZS1kZW1vIiwicm9sZSI6ImRldmVsb3BlciJ9.",
    outputLabel: "Formatted decoded JWT",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["jwt", "security", "json", "decode"],
    steps: [
      step("decode", "jwt-decode", "Decode JWT sections without signature verification"),
      step("format", "json-format", "Format decoded JSON"),
      step("sort", "json-sort-keys", "Sort JSON keys for inspection")
    ],
    notes: [
      "Decoding a JWT does not establish authenticity or authorization.",
      "Do not paste sensitive production tokens into public bug reports or shared screenshots."
    ]
  },
  {
    id: "recipe-seo-url-audit-v1",
    slug: "seo-url-audit",
    version: 1,
    title: "SEO URL Audit",
    summary: "Extract and normalize links, deduplicate them, then classify URLs by the origin of the first extracted URL.",
    description: "Use this recipe for a quick local classification pass over URLs copied from crawl output, page source, reports, or content inventories. After extraction and normalization, the workflow removes duplicates and classifies each URL as internal or external. Version 1 deliberately uses the origin of the first extracted URL as the internal baseline so the shared recipe needs no arbitrary hostname expression or executable configuration. Put a representative site URL first when using this workflow.",
    inputLabel: "Text containing site and external links",
    inputHint: "Put a representative site URL first; its origin becomes the internal baseline.",
    sampleInput: "https://www.xfree.in/\nDocs https://www.xfree.in/docs#intro\nReference https://example.com/reference\nDuplicate https://www.xfree.in/docs#intro",
    outputLabel: "Internal/external URL classification",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["seo", "url", "internal links", "external links", "audit"],
    steps: [
      step("extract", "http-url-extract", "Extract HTTP and HTTPS URLs"),
      step("normalize", "url-normalize", "Normalize each URL", { config: { mapLines: true } }),
      step("dedupe", "line-dedupe", "Remove duplicate URLs"),
      transform("classify", "classify-urls-by-first-origin", "Classify URLs against the first URL origin")
    ],
    notes: [
      "The first extracted URL defines the internal origin in version 1.",
      "This is a structural classification pass; it does not crawl pages or measure indexability."
    ]
  },
  {
    id: "recipe-json-api-cleanup-v1",
    slug: "json-api-cleanup",
    version: 1,
    title: "JSON API Cleanup",
    summary: "Validate JSON, format it, and recursively sort object keys into a stable review-friendly representation.",
    description: "This recipe turns pasted API JSON into a deterministic, readable representation without sending the payload to a model. Validation runs first as a passthrough gate: if parsing fails, later steps never execute. Valid JSON is then pretty-formatted and object keys are sorted recursively while array order is preserved. The output is useful for code review, fixtures, diff preparation, and debugging where stable key order makes changes easier to inspect.",
    inputLabel: "JSON API payload",
    inputHint: "Paste a valid JSON object or array.",
    sampleInput: '{"z":3,"user":{"name":"Ada","id":7},"items":[2,1]}',
    outputLabel: "Validated, formatted, key-sorted JSON",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["json", "api", "validate", "format", "developer"],
    steps: [
      step("validate", "json-validate", "Validate JSON syntax", { passthrough: true }),
      step("format", "json-format", "Pretty-format JSON"),
      step("sort", "json-sort-keys", "Sort object keys recursively")
    ],
    notes: [
      "Array order is preserved; only object keys are sorted.",
      "Version 1 does not flatten nested JSON because no flatten engine is currently part of the allowlisted production engine set."
    ]
  },
  {
    id: "recipe-text-cleanup-v1",
    slug: "text-cleanup-pipeline",
    version: 1,
    title: "Text Cleanup Pipeline",
    summary: "Trim lines, remove blanks, deduplicate repeated lines, sort the result, and count words without changing final text.",
    description: "Use this recipe to clean pasted lists, notes, exported labels, or line-oriented text before reuse. It trims each line, removes empty lines, deduplicates exact repeats, and sorts the remaining content. A final word-count engine runs in passthrough mode so the execution trace records a useful metric while the recipe output remains the cleaned text rather than replacing it with the numeric count.",
    inputLabel: "Messy multiline text",
    inputHint: "Paste line-oriented text containing whitespace, blanks, or duplicates.",
    sampleInput: "  beta  \n\nalpha\nbeta\n gamma\nalpha ",
    outputLabel: "Cleaned sorted text",
    outputExtension: "txt",
    outputMimeType: "text/plain",
    mode: "local",
    llmRequired: false,
    tags: ["text", "cleanup", "dedupe", "sort", "count"],
    steps: [
      step("trim", "trim-lines", "Trim line whitespace"),
      step("blank", "empty-line-remove", "Remove blank lines"),
      step("dedupe", "line-dedupe", "Remove duplicate lines"),
      step("sort", "line-sort", "Sort cleaned lines"),
      step("count", "word-count", "Count words for the execution trace", { passthrough: true })
    ],
    notes: [
      "Deduplication is exact after trimming; it is not fuzzy or semantic.",
      "The word-count step is informational and does not replace the cleaned output."
    ]
  },
  {
    id: "recipe-csv-preparation-v1",
    slug: "csv-preparation",
    version: 1,
    title: "CSV Preparation",
    summary: "Parse CSV into structured JSON, then serialize it back into consistently quoted CSV for a deterministic cleanup pass.",
    description: "This recipe uses XFree's local CSV parser and serializer as a round-trip validation and normalization workflow. The CSV-to-JSON engine parses the header row and quoted fields; malformed quoted input fails instead of being silently guessed. The structured result is then sent to the JSON-to-CSV engine, which produces consistently quoted CSV output. It is useful before importing data into tools that are sensitive to inconsistent quoting or delimiter edge cases.",
    inputLabel: "CSV with a header row",
    inputHint: "Paste comma-delimited CSV. Quoted commas are supported by the production parser.",
    sampleInput: 'name,role\nAda,Engineer\n"Grace Hopper","Compiler, Navy"',
    outputLabel: "Normalized CSV",
    outputExtension: "csv",
    outputMimeType: "text/csv",
    mode: "local",
    llmRequired: false,
    tags: ["csv", "data", "normalize", "validate", "export"],
    steps: [
      step("parse", "csv-to-json", "Parse CSV into structured JSON"),
      step("serialize", "json-to-csv", "Serialize structured rows as normalized CSV")
    ],
    notes: [
      "Version 1 is comma-delimited and does not auto-detect arbitrary delimiter formats.",
      "Review inferred types after import: the CSV parser represents cells as text."
    ]
  },
  {
    id: "recipe-developer-clipboard-v1",
    slug: "developer-clipboard-cleanup",
    version: 1,
    title: "Developer Clipboard Cleanup",
    summary: "Pull URL-shaped values out of noisy terminal or CI output, deduplicate and sort them, then export JSON.",
    description: "Developer clipboard content often mixes prompts, timestamps, status messages, stack output, and useful URLs. Version 1 of this recipe intentionally solves one auditable slice of that problem: it extracts HTTP and HTTPS values, removes duplicates, sorts the list, and returns JSON. It does not use an LLM to decide what is important, so the behavior is predictable and reproducible across runs.",
    inputLabel: "Mixed terminal or CI output",
    inputHint: "Paste terminal output containing URLs you want to collect.",
    sampleInput: "$ deploy\nPreview: https://preview.example.dev/build/42\nDocs https://docs.example.dev/runbook\nRetrying...\nPreview: https://preview.example.dev/build/42",
    outputLabel: "Useful URL values as JSON",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["clipboard", "terminal", "urls", "developer", "json"],
    steps: [
      step("extract", "http-url-extract", "Extract URL-shaped values"),
      step("dedupe", "line-dedupe", "Remove duplicate values"),
      step("sort", "line-sort", "Sort useful values"),
      transform("json", "lines-to-json-array", "Convert values to a JSON array")
    ],
    notes: [
      "Version 1 extracts HTTP(S) URLs only; it does not infer arbitrary secret, hash, or identifier types.",
      "Do not publish clipboard output that contains private deployment URLs or credentials."
    ]
  }
];
var RECIPE_SLUGS = new Set(RECIPES.map((recipe) => recipe.slug));

// src/data/routes.ts
var BASE_STATIC_ROUTES = [
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
  "/xfree-app",
  "/studio",
  "/instaserver",
  "/json-tools",
  "/guides",
  "/recipes",
  "/pillars",
  "/roadmap",
  "/contribute"
];
var STATIC_ROUTES = [
  ...BASE_STATIC_ROUTES,
  ...RECIPES.map((recipe) => `/recipes/${recipe.slug}`)
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
  app.use((req, res, next) => {
    const host = (req.headers.host || "").split(":")[0].toLowerCase();
    if (isProduction && host === "xfree.in") {
      return res.redirect(308, `https://www.xfree.in${req.originalUrl}`);
    }
    if ((req.method === "GET" || req.method === "HEAD") && req.path.length > 1 && req.path.endsWith("/") && !req.path.startsWith("/api/")) {
      const query = req.originalUrl.slice(req.path.length);
      return res.redirect(308, `${req.path.replace(/\/+$/, "")}${query}`);
    }
    if ((req.method === "GET" || req.method === "HEAD") && req.path === "/clusters") {
      return res.redirect(308, "/pillars");
    }
    const legacyTool = req.path.match(/^\/tool\/([^/]+)$/);
    if ((req.method === "GET" || req.method === "HEAD") && legacyTool) {
      return res.redirect(308, `/tools/${legacyTool[1]}`);
    }
    next();
  });
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "xfree.in", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/ready", (_req, res) => {
    const ready = Boolean(config2.GEMINI_API_KEY || config2.NVIDIA_API_KEY) || !isProduction;
    res.status(ready ? 200 : 503).json({
      ready,
      geminiConfigured: Boolean(config2.GEMINI_API_KEY),
      nvidiaConfigured: Boolean(config2.NVIDIA_API_KEY),
      deliveryProvider: config2.RESEND_API_KEY ? "resend" : "log"
    });
  });
  const baseUrl = config2.PUBLIC_SITE_URL;
  app.get(["/sitemap.xml", "/app/sitemap.xml"], (_req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(generateSitemapXml(baseUrl));
  });
  app.get("/sitemap-index.xml", (_req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(generateSitemapIndexXml(baseUrl));
  });
  app.get("/sitemap-pages.xml", (_req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(generatePagesSitemapXml(baseUrl));
  });
  app.get("/sitemap-tools.xml", (_req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(generateToolsSitemapXml(baseUrl));
  });
  app.get("/sitemap-guides.xml", (_req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(generateGuidesSitemapXml(baseUrl));
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
  const nvidiaDiscoveryLimit = rateLimit({ scope: "nvidia-models", limit: 30, windowMs: 6e4 });
  app.get("/api/nvidia/models", nvidiaDiscoveryLimit, async (_req, res, next) => {
    try {
      const models = await listAvailableModels();
      return res.json({
        success: true,
        provider: "NVIDIA",
        label: "NVIDIA models available to this account",
        models,
        cachedForSeconds: 600
      });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/nvidia/validate", nvidiaDiscoveryLimit, async (req, res, next) => {
    try {
      const parsed = NvidiaValidateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const models = await listAvailableModels();
      const selected = models.find((model) => model.id === parsed.data.model);
      const valid = Boolean(selected);
      if (!selected?.chatCompatible) return res.json({ success: true, valid, chatCompatible: false, model: selected ?? null });
      const resolution = await resolveNvidiaModel(parsed.data.model, "general");
      return res.json({ success: true, valid, chatCompatible: true, ...resolution });
    } catch (err) {
      next(err);
    }
  });
  app.post("/api/nvidia/chat", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = NvidiaChatSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const result = await createChatCompletion({
        requestedModel: parsed.data.model,
        taskType: parsed.data.taskType,
        messages: parsed.data.messages.map((message) => ({
          role: message.role,
          content: message.content
        })),
        temperature: parsed.data.temperature,
        maxTokens: parsed.data.maxTokens
      });
      console.info("[nvidia] completion", {
        requestId: req.requestId,
        requestedModel: result.requestedModel,
        usedModel: result.usedModel,
        wasFallback: result.wasFallback,
        totalTokens: result.usage?.total_tokens
      });
      return res.json({ success: true, provider: "NVIDIA", ...result });
    } catch (err) {
      next(err);
    }
  });
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
  const solveRateLimit = rateLimit({ scope: "solve", limit: 10, windowMs: 6e4 });
  const executionRateLimit = rateLimit({ scope: "execution", limit: 20, windowMs: 6e4 });
  const workflowRateLimit = rateLimit({ scope: "workflow", limit: 5, windowMs: 6e4 });
  app.post("/api/v1/solve/:problem*", solveRateLimit, async (req, res, next) => {
    try {
      const problem = decodeURIComponent(req.params.problem || "");
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
      const toolId = req.params.toolId;
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
      const toolId = req.params.toolId;
      const tool = getPublicToolBySlug(toolId);
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
      const capabilitiesJson = generateCapabilitiesJson(CANONICAL_ORIGIN);
      res.header("Content-Type", "application/json");
      res.send(capabilitiesJson);
    } catch (err) {
      next(err);
    }
  });
  app.get("/api/v1/tools", (_req, res, next) => {
    try {
      const toolsJson = generateToolsJson(CANONICAL_ORIGIN);
      res.header("Content-Type", "application/json");
      res.send(toolsJson);
    } catch (err) {
      next(err);
    }
  });
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  const staticRouteSet = new Set(STATIC_ROUTES);
  const categoryRouteSet = new Set(CATEGORY_SLUGS.map((s) => `/${s}`));
  const guideSlugSet = new Set(GUIDES.map((g) => g.slug));
  const generatedToolSlugSet = new Set(Object.keys(GENERATED_PUBLISHED_CONTENT));
  const pillarSlugSet = new Set(PILLARS_50.map((pillar) => pillar.slug));
  app._classifyPath = function classifyPath(pathname) {
    if (staticRouteSet.has(pathname)) return "known";
    if (categoryRouteSet.has(pathname)) return "known";
    const toolMatch = pathname.match(/^\/tools\/([^/]+)\/?$/);
    if (toolMatch && (PUBLIC_TOOL_SLUGS.has(toolMatch[1]) || generatedToolSlugSet.has(toolMatch[1]))) return "known";
    const pillarMatch = pathname.match(/^\/pillar\/([^/]+)\/?$/);
    if (pillarMatch && pillarSlugSet.has(pillarMatch[1])) return "known";
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
    if (err instanceof NvidiaNotConfiguredError) {
      return res.status(503).json({ error: "nvidia_not_configured", requestId });
    }
    if (err instanceof NvidiaApiError) {
      return res.status(err.status).json({ error: err.code, message: err.message, requestId });
    }
    res.status(500).json({ error: "internal_error", requestId });
  });
  return app;
}
var DRAFT_TOOL_SLUGS = new Set(
  TOOLS_REGISTRY.filter((t) => !PUBLIC_TOOL_SLUGS.has(t.slug)).map((t) => t.slug)
);
function serveMinimalFallback() {
  return async function attach(app) {
    const respond = (req, res) => {
      const toolMatch = req.path.match(/^\/tools\/([^/]+)\/?$/);
      const isKnownDraft = toolMatch ? DRAFT_TOOL_SLUGS.has(toolMatch[1]) : false;
      const status = isKnownDraft ? 410 : 404;
      const heading = isKnownDraft ? "410 \u2014 Not published" : "404";
      const body = isKnownDraft ? "This tool concept is on the XFree roadmap but has not been implemented and published yet. It will not appear at this URL until it passes review \u2014 check back via the roadmap instead." : "This URL does not map to a published tool or page.";
      res.status(status).setHeader("Content-Type", "text/html; charset=utf-8").send(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${heading} \u2014 XFree.in</title><meta name="robots" content="noindex"></head><body style="font-family:system-ui;padding:2rem;text-align:center"><h1>${heading}</h1><p>${body}</p><p><a href="/roadmap">Browse the roadmap</a> \xB7 <a href="/">Back to home</a></p></body></html>`
      );
    };
    app.get("*", respond);
    app.head("*", respond);
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
