# Deploying XFree.in to Vercel

## One-time setup

1. **Rotate your Gemini key first** if you shared the previous one in chat — that key must be considered compromised. Get a fresh one at https://aistudio.google.com/app/apikey.

2. **Link the project locally** (from the repo root):
   ```bash
   npm i -g vercel@latest
   vercel login
   vercel link
   ```
   When prompted, select the existing project at `projects555/xfree`.

3. **Set production environment variables** in the Vercel dashboard (Settings → Environment Variables) or via CLI:
   ```bash
   vercel env add GEMINI_API_KEY production
   vercel env add PUBLIC_SITE_URL production          # https://xfree.in
   vercel env add GEMINI_DEFAULT_MODEL production      # gemini-2.5-flash
   vercel env add GEMINI_THINKING_MODEL production     # gemini-2.5-pro
   vercel env add NVIDIA_API_KEY production            # optional NVIDIA Cloud Mode
   vercel env add NVIDIA_BASE_URL production           # https://integrate.api.nvidia.com/v1
   vercel env add RESEND_API_KEY production            # optional
   vercel env add CONTACT_TO_EMAIL production          # contact@xfree.in
   vercel env add CONTACT_FROM_EMAIL production        # noreply@xfree.in
   ```

## Deploy

```bash
vercel --prod
```

Vercel reads `vercel.json`, runs `npm run build:vercel`, serves `dist/` as static assets, and runs `api/index.ts` for `/api/*` and unknown routes.

## What Vercel actually does with this project

- **Static files** (`dist/index.html`, `dist/tools/*/index.html`, `dist/category/*/index.html`, `dist/assets/*`, `dist/sitemap.xml`, `dist/robots.txt`, etc.) are served directly by Vercel's CDN.
- **`api/index.ts`** — a single Node serverless function — handles `/api/health`, `/api/ready`, `/api/ai*`, `/api/nvidia/*`, `/api/contact`, `/api/feedback`, and returns 404 for any non-static route that leaks through the rewrite.
- `cleanUrls: true` — so `dist/tools/regex-tester-explainer/index.html` is served at `/tools/regex-tester-explainer`.
- Unknown tools (no prerendered file) fall through to the rewrite and the function returns 404.

## Known limitations of the Vercel setup

1. **Rate limiter state does not persist across cold starts.** The in-memory buckets in `src/server/rate-limit.ts` reset when Vercel spawns a fresh instance. For low-traffic beta this is acceptable; for scale, wire Vercel KV or Upstash Redis and replace the `store` map in `rate-limit.ts`.
2. **Function cold start** adds ~200-500 ms to the first request after idle.
3. **No streaming** — the current AI routes buffer full Gemini or NVIDIA responses. Fine for short commands, not for long chats.
4. **60 s function timeout** — `vercel.json` sets `maxDuration: 60`; provider calls have shorter configurable request timeouts.

## Verifying the production deploy

Once `vercel --prod` completes, it prints the URL. Then:

```bash
DEPLOY_URL=https://your-deployment.vercel.app
curl -sI $DEPLOY_URL/                                    # 200
curl -sI $DEPLOY_URL/tools/regex-tester-explainer        # 200
curl -sI $DEPLOY_URL/tools/does-not-exist                # 404
curl -sI $DEPLOY_URL/api/health                          # 200 JSON
curl -sI $DEPLOY_URL/sitemap.xml                         # 200 XML
curl -s $DEPLOY_URL/tools/regex-tester-explainer | grep -o '<title>[^<]*</title>'
curl -s -X POST $DEPLOY_URL/api/ai -H 'Content-Type: application/json' -d '{}'  # 400
```

## Custom domains

The existing `projects555/xfree` project serves both surfaces:

- `https://www.xfree.in` — canonical main website
- `https://app.xfree.in` — redirects its root to `/studio`

Keep `PUBLIC_SITE_URL=https://www.xfree.in` so the sitemap and canonical tags stay on the main domain. Add both domains under Vercel Settings → Domains, configure the DNS records Vercel provides, and redeploy after changing domain or environment settings.
