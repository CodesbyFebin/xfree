// Vercel serverless entry — wraps the Express app as a Vercel Node function.
import type { IncomingMessage, ServerResponse } from "http";

let handlerPromise: Promise<((req: IncomingMessage, res: ServerResponse) => void) | { bootError: string }> | null = null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      try {
        const mod = await import("../src/server/app");
        const app = await mod.createApp({ attachSpaFallback: mod.serveMinimalFallback() });
        return app as unknown as (req: IncomingMessage, res: ServerResponse) => void;
      } catch (err: any) {
        const detail = err?.stack || err?.message || String(err);
        console.error("[api/index] boot error:", detail);
        return { bootError: detail };
      }
    })();
  }
  return handlerPromise;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  const h = await getHandler();
  if ("bootError" in h) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(`function boot failed:\n${h.bootError.slice(0, 4000)}`);
    return;
  }
  return h(req, res);
}
