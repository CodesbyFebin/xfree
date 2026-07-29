import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { ThinkingLevel } from "@google/genai";

import { config, isProduction } from "./src/server/env";
import { getGeminiClient, generateWithTimeout } from "./src/server/gemini";
import { AI_TASKS, CHAT_SYSTEM_INSTRUCTION, THINKING_SYSTEM_INSTRUCTION, isValidTaskId } from "./src/server/tasks";
import { rateLimit, globalDailyGuard } from "./src/server/rate-limit";
import {
  AiRequestSchema,
  AiBatchSchema,
  AiChatSchema,
  AiThinkingSchema,
  ContactSchema,
  FeedbackSchema,
} from "./src/server/schemas";
import { deliverMessage } from "./src/server/delivery";
import { securityHeadersMiddleware } from "./src/middleware/security-headers";
import {
  generateSitemapXml,
  generateRssXml,
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateRobotsTxt,
} from "./src/utils/generateSitemap";
import { INDEXABLE_TOOL_SLUGS } from "./src/data/toolsRegistry";
import { STATIC_ROUTES, CATEGORY_SLUGS } from "./src/data/routes";

async function startServer() {
  const app = express();

  app.set("trust proxy", config.TRUST_PROXY);
  app.disable("x-powered-by");

  app.use((req, _res, next) => {
    (req as any).requestId = crypto.randomUUID();
    next();
  });

  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: "100kb" }));

  // ---------- Health ----------
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "xfree.in", timestamp: new Date().toISOString() });
  });

  app.get("/api/ready", (_req, res) => {
    const ready = Boolean(config.GEMINI_API_KEY) || !isProduction;
    res.status(ready ? 200 : 503).json({
      ready,
      geminiConfigured: Boolean(config.GEMINI_API_KEY),
      deliveryProvider: config.RESEND_API_KEY ? "resend" : "log",
    });
  });

  // ---------- SEO discovery files ----------
  const baseUrl = config.PUBLIC_SITE_URL;

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

  // ---------- AI ----------
  const aiPerMinute = rateLimit({ scope: "ai", limit: config.AI_RATE_LIMIT_PER_MINUTE, windowMs: 60_000 });
  const aiPerDay = rateLimit({ scope: "ai-day", limit: config.AI_RATE_LIMIT_PER_DAY, windowMs: 86_400_000 });
  const thinkingPerDay = rateLimit({ scope: "ai-thinking-day", limit: config.AI_THINKING_LIMIT_PER_DAY, windowMs: 86_400_000 });
  const contactRateLimit = rateLimit({ scope: "contact", limit: 5, windowMs: 3_600_000 });
  const feedbackRateLimit = rateLimit({ scope: "feedback", limit: 10, windowMs: 3_600_000 });
  const globalCap = globalDailyGuard(config.AI_GLOBAL_DAILY_LIMIT);

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
      return res.json({
        success: true,
        provider: "Google Gemini",
        model: config.GEMINI_DEFAULT_MODEL,
        data,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/ai/batch", aiPerMinute, aiPerDay, globalCap, async (req, res, next) => {
    try {
      const parsed = AiBatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      const { taskId, items } = parsed.data;
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
        } catch (itemErr: any) {
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
    } catch (err) {
      next(err);
    }
  });

  // ---------- Contact ----------
  app.post("/api/contact", contactRateLimit, async (req, res, next) => {
    try {
      const parsed = ContactSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
      if (parsed.data.website) return res.status(200).json({ success: true }); // honeypot silent-accept
      const result = await deliverMessage("contact", {
        subject: "New contact form submission",
        text: `From: ${parsed.data.email || "anonymous"}\n\n${parsed.data.message}`,
        meta: { requestId: (req as any).requestId, ip: req.ip },
      });
      if (!result.ok) return res.status(502).json({ error: "delivery_failed" });
      return res.status(200).json({ success: true, provider: result.provider });
    } catch (err) {
      next(err);
    }
  });

  // ---------- Feedback ----------
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
    } catch (err) {
      next(err);
    }
  });

  // ---------- Unknown API routes → 404 JSON ----------
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  // ---------- Route validation helpers ----------
  const staticRouteSet = new Set<string>(STATIC_ROUTES);
  const categoryRouteSet = new Set<string>(CATEGORY_SLUGS.map((s) => `/category/${s}`));

  function classifyPath(pathname: string): "known" | "unknown" {
    if (staticRouteSet.has(pathname)) return "known";
    if (categoryRouteSet.has(pathname)) return "known";
    const toolMatch = pathname.match(/^\/tools\/([^/]+)\/?$/);
    if (toolMatch && INDEXABLE_TOOL_SLUGS.has(toolMatch[1])) return "known";
    return "unknown";
  }

  // ---------- Dev vs prod frontend ----------
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.method !== "GET") return next();
      try {
        const url = req.originalUrl.split("?")[0];
        const templatePath = path.resolve(process.cwd(), "index.html");
        let template = fs.readFileSync(templatePath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        const status = classifyPath(url) === "known" ? 200 : 404;
        res.status(status).setHeader("Content-Type", "text/html; charset=utf-8").end(template);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      index: false,
      redirect: false,
      maxAge: "1y",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }));

    const spaFallback = (req: Request, res: Response) => {
      const url = req.path;
      const status = classifyPath(url);
      const prerendered = path.join(distPath, url.replace(/^\//, ""), "index.html");
      if (status === "known" && fs.existsSync(prerendered)) {
        return res.status(200).sendFile(prerendered);
      }
      if (status === "known") {
        return res.status(200).sendFile(path.join(distPath, "index.html"));
      }
      const notFoundPath = path.join(distPath, "404.html");
      if (fs.existsSync(notFoundPath)) {
        return res.status(404).sendFile(notFoundPath);
      }
      return res.status(404).sendFile(path.join(distPath, "index.html"));
    };

    app.get("*", spaFallback);
    app.head("*", spaFallback);
  }

  // ---------- Central error handler ----------
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as any).requestId;
    console.error(`[${requestId}]`, err?.message || err);
    if (res.headersSent) return;
    res.status(500).json({ error: "internal_error", requestId });
  });

  const server = app.listen(config.PORT, "0.0.0.0", () => {
    console.log(`XFree.in ${config.NODE_ENV} server on http://0.0.0.0:${config.PORT} (base=${config.PUBLIC_SITE_URL})`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, closing server...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref?.();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
