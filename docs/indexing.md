# Getting XFree.in indexed

Not a strategy essay — a punch list of what's wired and what to actually run.

## What ships in the repo

| Feature | Where | Status |
|---|---|---|
| Sitemap (indexable tools + categories + static pages) | generated → `dist/sitemap.xml` | wired |
| Split-brain `robots.txt` (allow citation bots, block bulk-training bots) | generated → `dist/robots.txt` | wired |
| Per-page prerender: unique `<title>`, meta description, canonical, OG/Twitter, JSON-LD | `src/scripts/prerender.ts` → `dist/**/index.html` | wired |
| JSON-LD: `Organization`, `WebSite`, `BreadcrumbList`, `SoftwareApplication`, `HowTo`, `FAQPage` (as applicable) | prerender | wired |
| `llms.txt` + `llms-full.txt` | generated → `dist/llms.txt` | wired |
| `noindex` self-sabotage lint (fails build if a non-404 page carries `noindex`) | `npm run lint:noindex` | wired |
| IndexNow key file at `/<key>.txt` | `public/<key>.txt` (checked in — the key is a self-issued site token, not a secret) | wired |
| IndexNow pinger | `npm run indexnow` | wired |
| Tool audit (indexable tool without a wired component → build fails) | `npm run audit:tools` | wired |

## What to actually do at launch

1. **Attach the domain.** In Vercel dashboard → Domains, add `xfree.in`. Set `PUBLIC_SITE_URL=https://xfree.in` in production env vars. Redeploy so canonicals + sitemap + IndexNow use the real host.
2. **Verify the IndexNow key file is publicly reachable.** After deploy:
   ```bash
   curl -sI https://xfree.in/dfa1cd2746301dcafa9c926f5a9d7f16.txt
   ```
   Must return 200. If not, IndexNow will reject every ping.
3. **Submit the sitemap** in Google Search Console and Bing Webmaster Tools once. That's it — after that, IndexNow pushes updates.
4. **Ping IndexNow after every deploy** — one shot for the whole indexable URL set:
   ```bash
   PUBLIC_SITE_URL=https://xfree.in npm run indexnow
   ```
   Or wire it into your Vercel deploy hook. IndexNow reaches Bing / Yandex / DuckDuckGo / Seznam / Naver from a single call.
5. **Ping IndexNow per URL** when you publish or edit one page:
   ```bash
   PUBLIC_SITE_URL=https://xfree.in npm run indexnow -- --url=https://xfree.in/tools/regex-tester-explainer
   ```

## What's *not* in the repo (deliberately)

- **Google Indexing API integration.** Google reserves this API for `JobPosting` and `BroadcastEvent`; general use is against their terms.
- **Brave Search auto-submit.** Brave publishes a submit-URL form for humans; I couldn't confirm a stable public unauthenticated POST API. Manual submission at https://search.brave.com/webmaster is the safe path.
- **Ping-o-matic / Google `ping` endpoints.** Deprecated.

## Split-brain `robots.txt` policy shipped

- **Allowed:** `Googlebot`, `Bingbot`, `DuckDuckBot`, `BraveBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`, `Applebot`. These fetch to answer live queries and cite you.
- **Disallowed:** `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Meta-ExternalAgent`, `Bytespider`. These crawl in bulk for training corpora.

If you want to consent to training too, flip the `Disallow: /` lines in [src/utils/generateSitemap.ts](../src/utils/generateSitemap.ts#L229) to `Allow: /`.

## Rotating the IndexNow key

The key is public by design — search engines verify by reading `/<key>.txt`. Rotating is only useful if you leaked the wrong key or want a new one:

```bash
NEW=$(openssl rand -hex 16)
rm public/*.txt.new 2>/dev/null || true
rm public/[0-9a-f]*.txt
printf '%s' "$NEW" > "public/${NEW}.txt"
```

The pinger auto-detects the key from `public/*.txt` on next run.

## Content-side notes (not code)

- The `generate20Faqs` helper produces 20 near-identical FAQs per tool. This is content-farming shape and search engines increasingly discount it. Trim to 4–6 tool-specific FAQs before requesting reindexation.
- `PrivacyPage.tsx` / `TermsPage.tsx` / `SecurityPage.tsx` still assert "100% client-side, zero logging" language that predates the AI/contact/feedback endpoints. Rewrite before public launch.
- Author byline / E-E-A-T signals are absent on tool pages — SoftwareApplication schema doesn't need it, but blog / docs pages will.
