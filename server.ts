import path from "path";
import fs from "fs";
import type { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import { config, isProduction } from "./src/server/env";
import { createApp, serveStaticFallback } from "./src/server/app";

async function start() {
  if (isProduction) {
    const distPath = path.join(process.cwd(), "dist");
    const app = await createApp({ attachStatic: serveStaticFallback(distPath) });
    startListening(app);
    return;
  }

  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
    appType: "custom",
  });

  const app = await createApp({
    attachStatic: async (a) => { a.use(vite.middlewares); },
    attachSpaFallback: async (a) => {
      const templatePath = path.resolve(process.cwd(), "index.html");
      const classify = (a as any)._classifyPath as (p: string) => "known" | "unknown";
      a.use(async (req: Request, res: Response, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        try {
          const url = req.originalUrl.split("?")[0];
          let template = fs.readFileSync(templatePath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          const status = classify(url) === "known" ? 200 : 404;
          res.status(status).setHeader("Content-Type", "text/html; charset=utf-8").end(template);
        } catch (err) { next(err); }
      });
    },
  });

  startListening(app);
}

function startListening(app: any) {
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

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
