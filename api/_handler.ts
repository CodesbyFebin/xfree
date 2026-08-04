// Vercel serverless entry — source of truth. Bundled to api/index.js by
// `npm run build:function` (esbuild inlines the whole src/ tree, node_modules
// stay external). Vercel deploys api/index.js — this .ts file is the source.
//
// Why bundle: Vercel's Node runtime resolution for ESM projects doesn't
// automatically ship imported .ts files from outside api/. `includeFiles`
// in vercel.json also didn't work in our testing. Pre-bundling side-steps
// both issues — the produced api/index.js has zero cross-directory imports.
import type { IncomingMessage, ServerResponse } from "http";
import { createApp, serveMinimalFallback } from "../src/server/app";

let handlerPromise: Promise<((req: IncomingMessage, res: ServerResponse) => void) | { bootError: string }> | null = null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      try {
        const app = await createApp({ attachSpaFallback: serveMinimalFallback() });
        return app as unknown as (req: IncomingMessage, res: ServerResponse) => void;
      } catch (err: any) {
        const detail = err?.stack || err?.message || String(err);
        console.error("[api] boot error:", detail);
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
