# XFree.in indexing and Google Search Console validation

This file is the production indexing runbook. The canonical origin is fixed in
code as `https://www.xfree.in`; preview hosts and environment variables are not
allowed to redefine search-facing URLs.

## What the build enforces

| Gate | Production rule |
|---|---|
| Canonical origin | Every indexable URL uses `https://www.xfree.in` |
| Duplicate host | `https://xfree.in/*` permanently redirects to `https://www.xfree.in/*` |
| Trailing slash | Non-root document URLs redirect to the no-trailing-slash form |
| Unknown URLs | Real 404 response; prerendered 404 is `noindex,follow` and has no canonical |
| Tool publication | Only the public/published registry can enter search, sitemap, prerender, or API discovery |
| Roadmap separation | `/roadmap` and empty pillar pages are `noindex,follow`; a pillar enters the sitemap only when backed by a published tool |
| Community authority | `/contribute` is an indexable, prerendered authority page describing the governed roadmap → production workflow |
| Direct routes | Tool, category, guide, and static URLs resolve from the pathname on first load |
| Crawl discovery | Important homepage, category, header, footer, and tool navigation uses real `<a href>` links |
| Prerender | Every indexable sitemap URL receives route-specific title, description, canonical, H1, crawlable content, and applicable JSON-LD |
| Sitemap | `sitemap-index.xml` points to page, tool, and guide sitemaps; `sitemap.xml` remains a compatibility full sitemap |
| Freshness | `lastmod` comes from content metadata/review dates, not request time |
| Robots | Crawl is allowed except `/api/`; only the canonical sitemap index is advertised |
| IndexNow | The pinger always submits canonical `www` URLs |
| SEO validation | `npm run validate:seo` fails if the generated crawl/index invariants drift |

## Build-time SEO gate

Run:

```bash
npm run build
```

The build includes `npm run validate:seo`. A green validation must confirm:

- split sitemap union equals the full sitemap URL set;
- every sitemap URL has a prerendered HTML document;
- each indexable document has exactly one matching self-canonical;
- each indexable document has a useful title, description, H1, and `index,follow`;
- the 404 document has `noindex,follow` and no canonical;
- no `https://xfree.in` URL leaks into discovery artifacts;
- the homepage exposes crawlable category/tool links;
- all sitemap titles and meta descriptions are unique and within the enforced length bounds;
- `/contribute` is indexable, substantive, and linked to the canonical GitHub issue flow;
- roadmap-only pillars remain noindex and absent from the sitemap.

## Production smoke test

After deployment, run representative checks before asking Google to validate a
fix:

```bash
# Canonical host must redirect.
curl -sI https://xfree.in/tools/json-formatter

# Canonical pages must be HTTP 200.
curl -sI https://www.xfree.in/
curl -sI https://www.xfree.in/tools/json-formatter
curl -sI https://www.xfree.in/category/developer-tools
curl -sI https://www.xfree.in/guides

# Invalid paths must be real 404s, not a 200 SPA shell.
curl -sI https://www.xfree.in/tools/this-tool-does-not-exist
curl -sI https://www.xfree.in/category/this-category-does-not-exist

# Discovery files must be public.
curl -sI https://www.xfree.in/robots.txt
curl -sI https://www.xfree.in/sitemap-index.xml
curl -sI https://www.xfree.in/sitemap-pages.xml
curl -sI https://www.xfree.in/sitemap-tools.xml
curl -sI https://www.xfree.in/sitemap-guides.xml
```

Expected result: canonical pages return 200; the apex host permanently
redirects to `www`; invalid routes return 404; discovery files return 200.

## Google Search Console sequence

1. Keep a single Domain property if available, and make `https://www.xfree.in`
   the canonical web origin used by the site.
2. In **Sitemaps**, submit only:
   `https://www.xfree.in/sitemap-index.xml`.
3. Remove stale submitted sitemap URLs that point at the non-`www` host, RSS,
   or retired news/video feeds.
4. Inspect a representative set of URLs:
   - `/`
   - `/tools/json-formatter`
   - `/category/seo-tools`
   - `/guides`
   - `/contribute`
   - one published `/pillar/*` URL
   - one roadmap-only `/pillar/*` URL
   - one guide detail URL
   - one deliberately nonexistent `/tools/*` URL
5. For valid URLs confirm Google sees HTTP 200, indexing allowed, the rendered
   content, and the same user-declared canonical shown in the HTML.
6. For the invalid URL confirm HTTP 404. Do not request indexing for it.
7. Review **Page indexing** for these patterns and validate them only after the
   corrected production deployment is live:
   - Soft 404
   - Duplicate without user-selected canonical
   - Google chose different canonical than user
   - Crawled - currently not indexed
   - Discovered - currently not indexed
   - Server error (5xx)
8. Review **HTTPS**, **Core Web Vitals**, **Manual actions**, **Security issues**,
   and structured-data enhancement reports.
9. Use **Validate Fix** on issue groups after the deploy. Request indexing only
   for a small representative set of high-value URLs; sitemap discovery handles
   the broader set.

## IndexNow

The checked-in public key is a site-verification token, not a secret. Ping the
canonical URL inventory after a meaningful publish:

```bash
npm run indexnow
```

Or one explicit canonical URL:

```bash
npm run indexnow -- --url=https://www.xfree.in/tools/regex-tester-explainer
```

The script ignores `PUBLIC_SITE_URL` for host selection so an environment typo
cannot submit non-canonical apex-host URLs.

## Publishing rule

A URL belongs in the sitemap only when it is published, functional, unique,
server/prerender rendered, internally linked, self-canonical, and returns 200.
Draft tool seeds stay out of search-facing registries until those gates pass.
