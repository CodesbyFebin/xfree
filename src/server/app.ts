import express, { type Request, type Response, type NextFunction, type Express } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { ThinkingLevel } from "@google/genai";

import { config, isProduction } from "./env";
import { getGeminiClient, generateWithTimeout, GeminiNotConfiguredError } from "./gemini";
import { AI_TASKS, CHAT_SYSTEM_INSTRUCTION, THINKING_SYSTEM_INSTRUCTION, isValidTaskId } from "./tasks";
import { rateLimit, globalDailyGuard } from "./rate-limit";
import {
  AiRequestSchema,
  AiBatchSchema,
  AiChatSchema,
  AiThinkingSchema,
  NvidiaChatSchema,
  NvidiaValidateSchema,
  ContactSchema,
  FeedbackSchema,
  LeadSchema,
} from "./schemas";
import {
  createChatCompletion as createNvidiaChatCompletion,
  listAvailableModels as listNvidiaModels,
  NvidiaApiError,
  NvidiaNotConfiguredError,
  resolveNvidiaModel,
} from "./nvidia/client";
import { deliverMessage } from "./delivery";
import { securityHeadersMiddleware } from "../middleware/security-headers";
import {
  generateSitemapXml,
  generateSitemapIndexXml,
  generatePagesSitemapXml,
  generateToolsSitemapXml,
  generateGuidesSitemapXml,
  generateRssXml,
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateRobotsTxt,
} from "../utils/generateSitemap";
import {
  generateCapabilitiesJson,
  generateToolsJson,
} from "../utils/generateStructuredData";
import { executeTool, solveProblem, verifyToolResult } from "../lib/execution-engine";
import { getPublicToolBySlug, PUBLIC_TOOL_SLUGS } from "../data/publicTools";
import { TOOLS_REGISTRY } from "../data/toolsRegistry";
import { GENERATED_PUBLISHED_CONTENT } from "../data/generatedPublishedContent";
import { PILLARS_50 } from "../data/masterBlueprint";
import { STATIC_ROUTES, CATEGORY_SLUGS } from "../data/routes";
import { CANONICAL_ORIGIN } from "../data/siteConfig";
import { GUIDES } from "../data/guides";

export interface AppOptions {
  attachStatic?: (app: Express) => void | Promise<void>;
  attachSpaFallback?: (app: Express) => void | Promise<void>;
}

export async function createApp(opts: AppOptions = {}): Promise<Express> {
  const app = express();

  app.set("trust proxy", config.TRUST_PROXY);
  app.disable("x-powered-by");

  app.use((req, _res, next) => {
    (req as any).requestId = crypto.randomUUID();
    next();
  });

  // Canonical URL enforcement. Keep preview hosts usable, but permanently
  // consolidate the public apex host and duplicate trailing-slash variants.
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
    res.json({ status: "ok", service: "xfree.in", timestamp: new Date().toISOString() });
  });

  app.get("/api/ready", (_req, res) => {
    const ready = Boolean(config.GEMINI_API_KEY || config.NVIDIA_API_KEY) || !isProduction;
    res.status(ready ? 200 : 503).json({
      ready,
      geminiConfigured: Boolean(config.GEMINI_API_KEY),
      nvidiaConfigured: Boolean(config.NVIDIA_API_KEY),
      deliveryProvider: config.RESEND_API_KEY ? "resend" : "log",
    });
  });

  const baseUrl = config.PUBLIC_SITE_URL;

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

  const aiPerMinute = rateLimit({ scope: "ai", limit: config.AI_RATE_LIMIT_PER_MINUTE, windowMs: 60_000 });
  const aiPerDay = rateLimit({ scope: "ai-day", limit: config.AI_RATE_LIMIT_PER_DAY, windowMs: 86_400_000 });
  const thinkingPerDay = rateLimit({ scope: "ai-thinking-day", limit: config.AI_THINKING_LIMIT_PER_DAY, windowMs: 86_400_000 });
  const contactRateLimit = rateLimit({ scope: "contact", limit: 5, windowMs: 3_600_000 });
  const feedbackRateLimit = rateLimit({ scope: "feedback", limit: 10, windowMs: 3_600_000 });
  const leadRateLimit = rateLimit({ scope: "lead", limit: 3, windowMs: 3_600_000 });
  const globalCap = globalDailyGuard(config.AI_GLOBAL_DAILY_LIMIT);
  const nvidiaDiscoveryLimit = rateLimit({ scope: "nvidia-models", limit: 30, windowMs: 60_000 });

  app.get("/api/nvidia/models", nvidiaDiscoveryLimit, async (_req, res, next) => {
    try {
      const models = await listNvidiaModels();
      return res.json({
        success: true,
        provider: "NVIDIA",
        label: "NVIDIA models available to this account",
        models,
        cachedForSeconds: 600,
      });
    } catch (err) { next(err); }
  });

  app.post("/api/nvidia/validate", nvidiaDiscoveryLimit, async (req, res, next) => {
    try {
      const parsed = NvidiaValidateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const models = await listNvidiaModels();
      const selected = models.find((model) => model.id === parsed.data.model);
      const valid = Boolean(selected);
      if (!selected?.chatCompatible) return res.json({ success: true, valid, chatCompatible: false, model: selected ?? null });
      const resolution = await resolveNvidiaModel(parsed.data.model, "general");
      return res.json({ success: true, valid, chatCompatible: true, ...resolution });
    } catch (err) { next(err); }
  });

  app.post("/api/nvidia/chat", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = NvidiaChatSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const result = await createNvidiaChatCompletion({
        requestedModel: parsed.data.model,
        taskType: parsed.data.taskType,
        messages: parsed.data.messages.map((message) => ({
          role: message.role as "system" | "user" | "assistant",
          content: message.content as string,
        })),
        temperature: parsed.data.temperature,
        maxTokens: parsed.data.maxTokens,
      });
      console.info("[nvidia] completion", {
        requestId: (req as any).requestId,
        requestedModel: result.requestedModel,
        usedModel: result.usedModel,
        wasFallback: result.wasFallback,
        totalTokens: result.usage?.total_tokens,
      });
      return res.json({ success: true, provider: "NVIDIA", ...result });
    } catch (err) { next(err); }
  });

  app.post("/api/ai", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiRequestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { taskId, input } = parsed.data;
      if (!isValidTaskId(taskId)) return res.status(400).json({ error: "unknown_task" });

      const task = AI_TASKS[taskId];
      const ai = getGeminiClient();
      const response = await generateWithTimeout(async () =>
        ai.models.generateContent({
          model: config.GEMINI_DEFAULT_MODEL,
          contents: task.promptTemplate(input),
          config: {
            systemInstruction: task.systemInstruction,
            temperature: task.temperature,
            maxOutputTokens: config.GEMINI_MAX_OUTPUT_TOKENS,
            ...(task.jsonOutput ? { responseMimeType: "application/json" } : {}),
          },
        }),
      );
      const text = response.text ?? "";
      let data: any = text;
      if (task.jsonOutput) {
        try { data = JSON.parse(text || "{}"); } catch { data = { result: text }; }
      }
      return res.json({ success: true, provider: "Google Gemini", model: config.GEMINI_DEFAULT_MODEL, data });
    } catch (err) { next(err); }
  });

  app.post("/api/ai/batch", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiBatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { taskId, items } = parsed.data;
      if (!isValidTaskId(taskId)) return res.status(400).json({ error: "invalid_task" });
      const cap = Math.min(items.length, config.AI_BATCH_MAX_ITEMS);
      const trimmed = items.slice(0, cap);
      const task = AI_TASKS[taskId];
      const ai = getGeminiClient();

      const results: Array<{ id: number; success: boolean; data?: any; error?: string }> = [];
      for (let i = 0; i < trimmed.length; i++) {
        try {
          const response = await generateWithTimeout(async () =>
            ai.models.generateContent({
              model: config.GEMINI_BATCH_MODEL,
              contents: task.promptTemplate(trimmed[i]),
              config: {
                systemInstruction: task.systemInstruction,
                temperature: task.temperature,
                maxOutputTokens: Math.min(config.GEMINI_MAX_OUTPUT_TOKENS, 1024),
                ...(task.jsonOutput ? { responseMimeType: "application/json" } : {}),
              },
            }),
          );
          const text = response.text ?? "";
          let data: any = text;
          if (task.jsonOutput) {
            try { data = JSON.parse(text || "{}"); } catch { data = { result: text }; }
          }
          results.push({ id: i + 1, success: true, data });
        } catch { results.push({ id: i + 1, success: false, error: "item_failed" }); }
      }
      return res.json({ success: true, total: results.length, results });
    } catch (err) { next(err); }
  });

  app.post("/api/ai/thinking", aiPerMinute, thinkingPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiThinkingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { prompt } = parsed.data;
      const ai = getGeminiClient();
      const response = await generateWithTimeout(async () =>
        ai.models.generateContent({
          model: config.GEMINI_THINKING_MODEL,
          contents: prompt,
          config: {
            systemInstruction: THINKING_SYSTEM_INSTRUCTION,
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            maxOutputTokens: config.GEMINI_MAX_OUTPUT_TOKENS,
          },
        }),
      );
      return res.json({ success: true, model: config.GEMINI_THINKING_MODEL, answer: response.text ?? "" });
    } catch (err) { next(err); }
  });

  app.post("/api/ai/chat", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiChatSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { messages } = parsed.data;
      const ai = getGeminiClient();
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));
      const latest = messages[messages.length - 1].content;
      const chat = ai.chats.create({
        model: config.GEMINI_DEFAULT_MODEL,
        config: { systemInstruction: CHAT_SYSTEM_INSTRUCTION, maxOutputTokens: config.GEMINI_MAX_OUTPUT_TOKENS },
        history,
      });
      const response = await generateWithTimeout(async () => chat.sendMessage({ message: latest }));
      return res.json({ success: true, model: config.GEMINI_DEFAULT_MODEL, reply: response.text ?? "" });
    } catch (err) { next(err); }
  });

  app.post("/api/contact", contactRateLimit, async (req, res, next) => {
    try {
      const parsed = ContactSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      if (parsed.data.website) return res.status(200).json({ success: true });
      const result = await deliverMessage("contact", {
        subject: "New contact form submission",
        text: `From: ${parsed.data.email || "anonymous"}\n\n${parsed.data.message}`,
        meta: { requestId: (req as any).requestId, ip: req.ip },
      });
      if (!result.ok) return res.status(502).json({ error: "delivery_failed" });
      return res.status(200).json({ success: true, provider: result.provider });
    } catch (err) { next(err); }
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
          requestId: (req as any).requestId,
        },
      });
      if (!result.ok) return res.status(502).json({ error: "delivery_failed" });
      return res.status(200).json({ success: true, provider: result.provider });
    } catch (err) { next(err); }
  });

app.post("/api/lead", leadRateLimit, async (req, res, next) => {
      try {
        const parsed = LeadSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
        if (parsed.data.website) return res.status(200).json({ success: true });
        const result = await deliverMessage("lead", {
          subject: `New lead — ${parsed.data.email}`,
          text: `Email: ${parsed.data.email}\nTask: ${parsed.data.taskDescription}\nRecommended: ${parsed.data.recommendedToolTitle || "n/a"} (${parsed.data.recommendedToolSlug || "n/a"})\nSource: ${parsed.data.source}\nPath: ${parsed.data.path || "n/a"}`,
          meta: { requestId: (req as any).requestId, ip: req.ip },
        });
        if (!result.ok) return res.status(502).json({ error: "delivery_failed" });
        return res.status(200).json({ success: true, provider: result.provider });
      } catch (err) { next(err); }
    });

    // === EXECUTION ENGINE API ENDPOINTS ===
    const solveRateLimit = rateLimit({ scope: "solve", limit: 10, windowMs: 60_000 });
    const executionRateLimit = rateLimit({ scope: "execution", limit: 20, windowMs: 60_000 });
    const workflowRateLimit = rateLimit({ scope: "workflow", limit: 5, windowMs: 60_000 });

    app.post("/api/v1/solve/:problem*", solveRateLimit, async (req, res, next) => {
      try {
        const problem = decodeURIComponent(req.params.problem || "");
        const context = {
          userId: req.headers["x-user-id"] as string,
          organizationId: req.headers["x-org-id"] as string,
          preferences: {
            preferredExecution: (req.headers["x-preferred-execution"] as any) || "local",
            privacy: (req.headers["x-privacy"] as any) || "local",
            budget: (req.headers["x-budget"] as any) || "free",
          }
        };
        
        const result = await solveProblem(problem, context);
        res.json({ success: true, data: result });
      } catch (err) { next(err); }
    });

    app.post("/api/v1/execute/:toolId", executionRateLimit, async (req, res, next) => {
      try {
        const toolId = req.params.toolId;
        const context = {
          userId: req.headers["x-user-id"] as string,
          organizationId: req.headers["x-org-id"] as string,
          preferences: {
            preferredExecution: (req.headers["x-preferred-execution"] as any) || "local",
            privacy: (req.headers["x-privacy"] as any) || "local",
            budget: (req.headers["x-budget"] as any) || "free",
          }
        };
        
        const result = await executeTool({
          toolId,
          input: req.body,
          context,
          options: {
            verify: req.query.verify !== "false",
            timeout: parseInt(req.query.timeout as string) || 30000,
          }
        });
        
        res.json({ success: true, data: result });
      } catch (err) { next(err); }
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
      } catch (err) { next(err); }
    });

    app.get("/api/v1/capabilities", (_req, res, next) => {
      try {
        const capabilitiesJson = generateCapabilitiesJson(CANONICAL_ORIGIN);
        res.header("Content-Type", "application/json");
        res.send(capabilitiesJson);
      } catch (err) { next(err); }
    });

    app.get("/api/v1/tools", (_req, res, next) => {
      try {
        const toolsJson = generateToolsJson(CANONICAL_ORIGIN);
        res.header("Content-Type", "application/json");
        res.send(toolsJson);
      } catch (err) { next(err); }
    });

    app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  const staticRouteSet = new Set<string>(STATIC_ROUTES);
  const categoryRouteSet = new Set<string>(CATEGORY_SLUGS.map((s) => `/${s}`));
  const guideSlugSet = new Set<string>(GUIDES.map((g) => g.slug));
  const generatedToolSlugSet = new Set<string>(Object.keys(GENERATED_PUBLISHED_CONTENT));
  const pillarSlugSet = new Set<string>(PILLARS_50.map((pillar) => pillar.slug));

  (app as any)._classifyPath = function classifyPath(pathname: string): "known" | "unknown" {
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

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as any).requestId;
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

// Statuses are semantic: draft/roadmap concepts may still be published later,
// so they are ordinary 404s. Only explicitly retired URLs are permanently
// gone and qualify for 410.
const RETIRED_TOOL_SLUGS = new Set<string>(
  TOOLS_REGISTRY.filter((t) => t.status === "retired" && !PUBLIC_TOOL_SLUGS.has(t.slug)).map((t) => t.slug),
);

export function fallbackStatusForToolStatus(status?: "published" | "draft" | "roadmap" | "retired"): 404 | 410 {
  return status === "retired" ? 410 : 404;
}

/**
 * Minimal fallback for serverless (Vercel): static assets are served by the
 * platform before the function runs, so the function only sees paths that
 * didn't match a file. Explicitly retired slugs get 410 Gone; draft, roadmap,
 * and unknown paths get 404 — no filesystem reads either way.
 */
export function serveMinimalFallback() {
  return async function attach(app: Express) {
    const respond = (req: Request, res: Response) => {
      const toolMatch = req.path.match(/^\/tools\/([^/]+)\/?$/);
      const isRetired = toolMatch ? RETIRED_TOOL_SLUGS.has(toolMatch[1]) : false;
      const status = fallbackStatusForToolStatus(isRetired ? "retired" : undefined);
      const heading = isRetired ? "410 — Retired" : "404";
      const body = isRetired
        ? "This tool URL has been permanently retired. Browse the published directory for a current alternative."
        : "This URL does not map to a published tool or page.";
      res.status(status).setHeader("X-Robots-Tag", "noindex, nofollow").setHeader("Content-Type", "text/html; charset=utf-8").send(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${heading} — XFree.in</title><meta name="robots" content="noindex,nofollow"></head><body style="font-family:system-ui;padding:2rem;text-align:center"><h1>${heading}</h1><p>${body}</p><p><a href="/roadmap">Browse the roadmap</a> · <a href="/">Back to home</a></p></body></html>`,
      );
    };
    app.get("*", respond);
    app.head("*", respond);
  };
}

export function serveStaticFallback(distPath: string) {
  return async function attach(app: Express) {
    app.use(express.static(distPath, {
      index: false,
      redirect: false,
      maxAge: "1y",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
      },
    }));

    const classify = (app as any)._classifyPath as (p: string) => "known" | "unknown";

    const spaFallback = (req: Request, res: Response) => {
      const url = req.path;
      const status = classify(url);
      const prerendered = path.join(distPath, url.replace(/^\//, ""), "index.html");
      if (status === "known" && fs.existsSync(prerendered)) {
        return res.status(200).sendFile(prerendered);
      }
      if (status === "known") {
        return res.status(200).sendFile(path.join(distPath, "index.html"));
      }
      const notFoundPath = path.join(distPath, "404.html");
      if (fs.existsSync(notFoundPath)) return res.status(404).sendFile(notFoundPath);
      return res.status(404).sendFile(path.join(distPath, "index.html"));
    };

    app.get("*", spaFallback);
    app.head("*", spaFallback);
  };
}
