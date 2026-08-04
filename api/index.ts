// Vercel serverless entry — wraps the Express app as a Vercel Node function.
// Vercel serves prerendered static HTML + assets from outputDirectory directly;
// this function only handles /api/* and unknown-route 404s.
//
// The src/ tree is included in the function bundle via `functions.includeFiles`
// in vercel.json — without that, Vercel doesn't ship src/server/app.ts and the
// import below throws ERR_MODULE_NOT_FOUND at cold start.
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
