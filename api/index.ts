// Vercel serverless entry — wraps the Express app as a Vercel Node function.
// Vercel serves prerendered static HTML + assets from outputDirectory directly;
// this function only handles /api/* and unknown-route 404s.
import type { IncomingMessage, ServerResponse } from "http";
import { createApp, serveMinimalFallback } from "../src/server/app";

let handlerPromise: Promise<(req: IncomingMessage, res: ServerResponse) => void> | null = null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const app = await createApp({ attachSpaFallback: serveMinimalFallback() });
      return app as unknown as (req: IncomingMessage, res: ServerResponse) => void;
    })();
  }
  return handlerPromise;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  const h = await getHandler();
  return h(req, res);
}
