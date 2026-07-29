/**
 * Long-form guide content for indexable tools.
 *
 * Authorship: XFree.in team. Drafted with Gemini/Claude assistance,
 * reviewed for technical accuracy before ship. If you edit these,
 * keep worked examples runnable and don't ship claims you can't verify
 * in the actual tool.
 */

export interface WorkedExample {
  title: string;
  input: string;
  output: string;
  explanation: string;
}

export interface GuideContent {
  /** One-paragraph plain-English overview. Shown as page intro and in prerender. */
  overview: string;
  /** 2–4 worked examples with real inputs and outputs. */
  workedExamples: WorkedExample[];
  /** Bullet list of concrete situations where this tool is the right call. */
  whenToUse: string[];
  /** Bullet list of situations where it's NOT the right call — honest limits. */
  whenNotToUse: string[];
  /** Common failure modes and fixes. */
  troubleshooting: Array<{ symptom: string; fix: string }>;
  /** Related tools by slug (must exist in registry). */
  relatedSlugs: string[];
  /** ISO date. */
  lastReviewed: string;
}

export const TOOL_GUIDES: Record<string, GuideContent> = {
  "regex-tester-explainer": {
    overview:
      "A regex tester is where you validate a pattern before shipping it into production code. This one runs your pattern in the browser, shows every match highlighted in the sample text, lists captured groups, and lets you preview replacements — all without sending anything to a server.",
    workedExamples: [
      {
        title: "Extract email addresses",
        input: 'Contact support@xfree.in or sales@acme.co for details.',
        output: 'Matches: ["support@xfree.in", "sales@acme.co"]',
        explanation:
          "Pattern: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}` with flag `g`. Note this is a permissive email regex — good for extraction, not for RFC 5321 validation.",
      },
      {
        title: "Capture year and month from a date",
        input: "2026-07-29",
        output: 'Groups: {"year": "2026", "month": "07", "day": "29"}',
        explanation:
          "Named groups: `(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})`. Named groups make replacement templates readable: `$<year>/$<month>`.",
      },
      {
        title: "Redact card-like strings",
        input: "Order paid with 4111 1111 1111 1111 on file.",
        output: "Order paid with **** **** **** 1111 on file.",
        explanation:
          "Pattern `\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?(\\d{4})` with replacement `**** **** **** $1`. This is redaction shaped like a card number — it is not PCI validation.",
      },
    ],
    whenToUse: [
      "You need to sanity-check a pattern before pasting it into production code.",
      "You're debugging why a regex matches too much or too little.",
      "You want to see which capture group corresponds to which part of the input.",
      "You're translating a regex between JavaScript, Python, and PCRE flavors and need to see behavior in the JS engine first.",
    ],
    whenNotToUse: [
      "Parsing HTML or XML — use a real parser, not regex.",
      "Validating email or URL against a spec — the RFCs are ugly; use a purpose-built validator.",
      "Anything performance-critical on multi-MB input — regex catastrophic backtracking is real. Profile before shipping.",
    ],
    troubleshooting: [
      { symptom: "Pattern matches nothing but you're sure it should", fix: "Check the flags. `g` for all matches, `i` for case-insensitive, `m` for multiline `^`/`$`. Also check whether your input has invisible characters (paste it into a hex viewer if suspicious)." },
      { symptom: "Browser hangs on submit", fix: "Catastrophic backtracking. Look for nested quantifiers like `(a+)+` or `(.*)*` and rewrite with atomic groups or possessive quantifiers where the engine supports them." },
      { symptom: "Works here but fails in Python/Go", fix: "JavaScript regex is closest to PCRE but not identical. Lookbehind support, named-group syntax, and Unicode property escapes differ. Test in the target runtime before shipping." },
    ],
    relatedSlugs: ["json-formatter-validator-diff", "url-slug-utm-builder", "base64-url-encoder-jwt-decoder"],
    lastReviewed: "2026-07-29",
  },

  "json-formatter-validator-diff": {
    overview:
      "A JSON tool that formats, validates, and highlights structural errors in JSON payloads. Useful when you're staring at a 40-line curl response and can't tell whether the API returned what you expected. Runs in your browser — the payload never leaves your machine.",
    workedExamples: [
      {
        title: "Format a minified API response",
        input: '{"user":{"id":42,"name":"Ada","roles":["admin","editor"]},"active":true}',
        output: '{\n  "user": {\n    "id": 42,\n    "name": "Ada",\n    "roles": ["admin", "editor"]\n  },\n  "active": true\n}',
        explanation: "Two-space indent, arrays inlined when short. Copy the formatted output back into your code review or docs.",
      },
      {
        title: "Catch a trailing comma",
        input: '{"a": 1, "b": 2,}',
        output: 'Error at line 1, col 16: unexpected "}" — trailing comma is invalid in strict JSON.',
        explanation: "JSON doesn't allow trailing commas. JSON5 does. Most APIs speak strict JSON; if yours accepts trailing commas, it's using a JSON5 or JSONC parser, not vanilla JSON.",
      },
      {
        title: "Spot a wrong quote",
        input: "{'name': 'Ada'}",
        output: "Error at line 1, col 2: expected \" but found '.",
        explanation: "JSON requires double-quoted keys and string values. Single quotes are JavaScript object literal syntax, not JSON — a common copy-paste mistake from browser dev tools.",
      },
    ],
    whenToUse: [
      "You want to eyeball an API response quickly.",
      "You need to prove to a coworker whether a payload is malformed or the server is misbehaving.",
      "You're generating fixtures for tests and want them consistently indented.",
    ],
    whenNotToUse: [
      "Very large payloads (100+ MB) — browsers will struggle. Use `jq` on the command line.",
      "Streams of newline-delimited JSON (NDJSON) — this tool assumes a single top-level value.",
      "Payloads that contain secrets — they're only in your browser, but the risk of accidentally sharing your screen is real. Redact first.",
    ],
    troubleshooting: [
      { symptom: '"Unexpected token in JSON at position N"', fix: "Look at that exact byte offset. It's usually one of: a trailing comma, a smart quote (`“`) copy-pasted from a doc, or an unescaped newline inside a string." },
      { symptom: "Numbers lose precision", fix: "JSON numbers are IEEE 754 doubles. Very large IDs (like Twitter's 64-bit snowflake IDs) round. Send them as strings from the API." },
      { symptom: "Special characters render wrong", fix: "Check the source encoding. The tool assumes UTF-8. If your payload is in Latin-1 or Windows-1252, re-encode before pasting." },
    ],
    relatedSlugs: ["regex-tester-explainer", "base64-url-encoder-jwt-decoder", "schema-markup-generator"],
    lastReviewed: "2026-07-29",
  },

  "base64-url-encoder-jwt-decoder": {
    overview:
      "Decodes JWT tokens and encodes/decodes Base64 and Base64URL strings. When you get a `401 Unauthorized` and need to check whether the token you're sending is actually the token you think you're sending — this is where you look. Everything happens in your browser; tokens never leave the page.",
    workedExamples: [
      {
        title: "Inspect a JWT",
        input: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRGV2IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        output: 'Header: {"alg":"HS256","typ":"JWT"}\nPayload: {"sub":"1234567890","name":"Alex Dev","iat":1516239022,"role":"admin"}',
        explanation: "A JWT is three Base64URL-encoded parts joined by dots. This tool splits it and pretty-prints each. The signature is shown but not verified — verification requires the signing secret or public key, which never comes near your browser.",
      },
      {
        title: "Encode a URL-safe token",
        input: "Bearer 5f/Aa+b=c",
        output: "QmVhcmVyIDVmL0FhK2I9Yw== (standard) / QmVhcmVyIDVmL0FhK2I9Yw (URL-safe, no padding)",
        explanation: "Standard Base64 uses `+`, `/`, and `=` padding. Base64URL replaces `+` with `-`, `/` with `_`, and drops padding. Use URL-safe when the value goes in a URL path, query string, or JWT.",
      },
      {
        title: "Check whether a token has expired",
        input: "(any JWT)",
        output: "exp: 1751145600 → Wed, 28 Jun 2025 20:00:00 GMT (expired 13 months ago)",
        explanation: "The `exp` claim is a Unix timestamp in seconds (not milliseconds). If it's in the past, the server should reject the token — check clock skew if it's borderline.",
      },
    ],
    whenToUse: [
      "You're debugging auth and need to know what a JWT actually contains.",
      "You need to convert between standard Base64 and URL-safe Base64.",
      "You're inspecting an OAuth token to check `aud`, `iss`, or `exp`.",
    ],
    whenNotToUse: [
      "Encrypting anything — Base64 is encoding, not encryption. A Base64 string is trivially reversible.",
      "Verifying a JWT's signature — that needs the key and belongs server-side.",
      "Storing secrets — anything you paste is in your browser's DOM. Close the tab when done.",
    ],
    troubleshooting: [
      { symptom: '"Invalid Base64" but the string looks fine', fix: "Check for missing padding (`=`) or URL-safe characters (`-`, `_`) that need conversion. Also check for whitespace or line breaks — some encoders wrap output at 76 chars." },
      { symptom: "JWT decoded but shows garbled JSON", fix: "The middle segment isn't valid JSON — likely you pasted a Base64-encoded blob that isn't a JWT, or the token was truncated." },
      { symptom: "Signature displayed but marked \"unverified\"", fix: "That's expected. Signature verification needs the HMAC secret (HS256) or the public key (RS256/ES256) — neither should ever be in a browser tool." },
    ],
    relatedSlugs: ["json-formatter-validator-diff", "url-slug-utm-builder", "regex-tester-explainer"],
    lastReviewed: "2026-07-29",
  },

  "cron-expression-generator": {
    overview:
      "Cron expressions are cryptic. This tool translates between plain English (\"every weekday at 9am\") and standard 5-field cron syntax, and shows you the next 5 execution times so you can double-check.",
    workedExamples: [
      {
        title: "Every 15 minutes during weekday business hours",
        input: 'Weekdays, 9am–5pm, every 15 minutes',
        output: "*/15 9-17 * * 1-5",
        explanation: "Fields: `minute hour day-of-month month day-of-week`. `*/15` means every 15 minutes. `9-17` is hour 9 through 17 (5pm). `1-5` is Mon–Fri.",
      },
      {
        title: "Nightly at 2:30am UTC",
        input: '2:30am every day',
        output: "30 2 * * *",
        explanation: "One of the safest windows for maintenance jobs — after most US traffic dies down, before EU traffic ramps up. Remember cron runs in the server's timezone; if your server is in UTC and you want 2:30am PST, use `30 10 * * *`.",
      },
      {
        title: "First day of every month",
        input: 'First day of the month, midnight',
        output: "0 0 1 * *",
        explanation: 'Handy for billing rollovers and monthly reports. Be careful: this doesn\'t run on the "last day" of the previous month — for that you\'d need a workaround since cron has no "last day" primitive.',
      },
    ],
    whenToUse: [
      "You're setting up a Kubernetes CronJob, a systemd timer, or a Vercel Cron trigger.",
      "You inherited a cron expression and can't tell when it runs.",
      "You want to verify the next few run times before deploying a scheduled job.",
    ],
    whenNotToUse: [
      "Sub-second scheduling — cron minimum resolution is one minute.",
      "Anything that must run *exactly* at a wall-clock moment — cron drift, DST transitions, and missed runs during downtime all apply.",
      "Complex conditional schedules — use a real scheduler (Temporal, Airflow) for `run at 9am unless the previous run failed`.",
    ],
    troubleshooting: [
      { symptom: "Job runs twice a year around DST", fix: "The 2am–3am hour either doesn't exist (spring) or exists twice (fall) in DST-observing timezones. Schedule jobs at 1am or 4am, or run your cron in UTC." },
      { symptom: 'AWS EventBridge or Quartz cron rejects my expression', fix: "Those use 6-field or 7-field cron (with seconds and/or year). Standard Unix cron is 5-field. Check your platform's docs." },
      { symptom: "Job didn't fire when the server was rebooting", fix: "Standard cron doesn't retry missed runs. If you need catch-up, use `anacron` or a job runner with persistence." },
    ],
    relatedSlugs: ["timestamp-color-converter", "url-slug-utm-builder", "json-formatter-validator-diff"],
    lastReviewed: "2026-07-29",
  },

  "bulk-url-extractor-sitemap-generator": {
    overview:
      "Paste any mess of HTML, log lines, or copied text, and this tool pulls out every valid URL, deduplicates, filters by domain, and can wrap the result in a Google-compliant XML sitemap. Useful when you're migrating a site, auditing outbound links, or building a sitemap from a crawl log.",
    workedExamples: [
      {
        title: "Extract from a paragraph",
        input: "Check out https://example.com/blog and https://example.com/blog/post-1. Also see https://other.com.",
        output: "https://example.com/blog\nhttps://example.com/blog/post-1\nhttps://other.com",
        explanation: "The tool finds URLs by pattern, so it works on plain text, HTML source, or log files. Duplicates are removed automatically.",
      },
      {
        title: "Filter to a single domain and generate sitemap",
        input: "https://example.com/a, https://other.com/b, https://example.com/c",
        output: "<url><loc>https://example.com/a</loc></url>\n<url><loc>https://example.com/c</loc></url>",
        explanation: "Set domain filter to `example.com`, enable sitemap wrap. The output is XML fragments you paste into a full urlset wrapper.",
      },
    ],
    whenToUse: [
      "Building a first sitemap for a legacy site with no existing crawl.",
      "Auditing which external domains your site links to.",
      "Extracting URLs from a Slack export or email thread for a link check.",
    ],
    whenNotToUse: [
      "Serving as your production sitemap generator — for that, generate from your CMS's URL registry so it stays in sync automatically.",
      "Very large inputs (10+ MB of text) — paste in chunks or use a command-line tool.",
    ],
    troubleshooting: [
      { symptom: "Missed some URLs I can see in the source", fix: "URLs inside JS strings or dynamically constructed at runtime won't appear in the raw HTML. Render the page in a headless browser first, then extract." },
      { symptom: "Extracted URLs include query strings I don't want in the sitemap", fix: "Enable 'strip query params' before generating the sitemap. Or post-process with a text editor before submitting to Search Console." },
    ],
    relatedSlugs: ["xml-sitemap-generator", "robots-txt-generator", "meta-tag-open-graph-preview"],
    lastReviewed: "2026-07-29",
  },

  "xml-sitemap-generator": {
    overview:
      "Turn a plain list of URLs into a valid XML sitemap Google and Bing can consume. Handles the schema, XML escaping, `lastmod`/`changefreq`/`priority` fields, and warns you when the file gets big enough to need a sitemap index.",
    workedExamples: [
      {
        title: "Three-URL site",
        input: "https://example.com/\nhttps://example.com/about\nhttps://example.com/pricing",
        output: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n  <url><loc>https://example.com/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n  <url><loc>https://example.com/pricing</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n</urlset>',
        explanation: "Google largely ignores `<priority>` and `<changefreq>`, but Bing and some AI crawlers still read them. Setting them costs nothing.",
      },
    ],
    whenToUse: [
      "You have a URL list from a crawl or CMS export and need Google-compliant XML.",
      "You're splitting a large sitemap and need per-segment files with consistent formatting.",
    ],
    whenNotToUse: [
      "Generating a sitemap for a live app — do it programmatically from your route registry so new pages appear automatically.",
      "Sitemaps over 50,000 URLs or 50 MB — split into multiple files with a sitemap index.",
    ],
    troubleshooting: [
      { symptom: 'Google Search Console reports "Sitemap could not be read"', fix: "Common causes: BOM at the start of the file, non-UTF-8 encoding, or an XML declaration on a line other than the first. Save as UTF-8 without BOM." },
      { symptom: "URLs in sitemap don't get indexed", fix: "The sitemap is a hint, not a demand. Google indexes what it thinks is worthwhile. Check the URL Inspection Tool for the actual reason — usually 'Discovered - currently not indexed' means Google saw it but didn't prioritize it." },
    ],
    relatedSlugs: ["bulk-url-extractor-sitemap-generator", "robots-txt-generator", "schema-markup-generator"],
    lastReviewed: "2026-07-29",
  },

  "robots-txt-generator": {
    overview:
      "Build a valid `robots.txt` with Allow/Disallow rules per crawler, sitemap references, and a URL tester so you can check whether a specific path would be blocked. Runs entirely in your browser.",
    workedExamples: [
      {
        title: "Block admin, allow everything else",
        input: "Disallow /admin/, Sitemap https://example.com/sitemap.xml",
        output: "User-agent: *\nDisallow: /admin/\n\nSitemap: https://example.com/sitemap.xml",
        explanation: "The default global rule applies to all crawlers. Sitemap directives are placed at the file level, outside any user-agent block.",
      },
      {
        title: "Split-brain AI policy",
        input: "Allow OAI-SearchBot and PerplexityBot; block GPTBot and CCBot",
        output: "User-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: *\nAllow: /",
        explanation: "Allows citation bots (which fetch to answer live queries and cite you) while blocking bulk training crawlers. See our docs/indexing.md for the full policy XFree.in itself uses.",
      },
    ],
    whenToUse: [
      "You need a first `robots.txt` and want to make sure the syntax is right.",
      "You're setting up an AI-crawler policy and want to test which paths get blocked.",
    ],
    whenNotToUse: [
      "As a security measure — `robots.txt` is a request, not enforcement. Well-behaved crawlers respect it; hostile ones ignore it. Protect sensitive paths with auth, not `Disallow`.",
      "To remove pages from Google's index — use `noindex` meta tags or the Removals tool. Blocking in `robots.txt` prevents crawl but doesn't remove already-indexed URLs.",
    ],
    troubleshooting: [
      { symptom: "Google still crawls a page I disallowed", fix: "Check for `Allow` rules that override, and remember `robots.txt` changes can take up to 24 hours to propagate. Also: Google may still index a URL it can't crawl if it has strong inbound links — the SERP snippet just won't have content." },
      { symptom: "Multiple user-agent blocks with conflicting rules", fix: "The most specific user-agent match wins. `User-agent: Googlebot-Image` beats `User-agent: Googlebot` beats `User-agent: *`." },
    ],
    relatedSlugs: ["xml-sitemap-generator", "bulk-url-extractor-sitemap-generator", "meta-tag-open-graph-preview"],
    lastReviewed: "2026-07-29",
  },

  "meta-tag-open-graph-preview": {
    overview:
      "Generate `<title>`, meta description, and Open Graph / Twitter Card tags, and see a live preview of how the page will look in Google search results and when shared to social. Includes character counters so you don't get truncated.",
    workedExamples: [
      {
        title: "Article page",
        input: "Title: 'How to write cron expressions', Description: 'A practical guide with worked examples.'",
        output: '<title>How to write cron expressions</title>\n<meta name="description" content="A practical guide with worked examples.">\n<meta property="og:title" content="How to write cron expressions">\n<meta property="og:description" content="A practical guide with worked examples.">\n<meta property="og:type" content="article">\n<meta name="twitter:card" content="summary_large_image">',
        explanation: "The preview panel shows how this renders in a Google SERP tile and a Twitter card. If your title is over 60 chars, Google truncates it with an ellipsis.",
      },
    ],
    whenToUse: [
      "You're writing metadata for a new page and want to see how it'll display before pushing.",
      "You inherited a page with generic meta tags and want to draft better ones.",
    ],
    whenNotToUse: [
      "As a substitute for real content — meta tags help clicks, not rankings. A great tag on a thin page still won't rank.",
      "For sites where meta is generated dynamically from a CMS — set the CMS logic, don't hand-craft per page.",
    ],
    troubleshooting: [
      { symptom: "Facebook/LinkedIn shows old image after I updated OG", fix: "Both cache OG images. Use Facebook's Sharing Debugger and LinkedIn's Post Inspector to force a refresh." },
      { symptom: "Twitter card doesn't render", fix: "Twitter/X requires an `og:image` at least 300×157 for `summary`, 600×314 for `summary_large_image`, publicly accessible (no auth), served over HTTPS." },
    ],
    relatedSlugs: ["schema-markup-generator", "robots-txt-generator", "url-slug-utm-builder"],
    lastReviewed: "2026-07-29",
  },

  "schema-markup-generator": {
    overview:
      "Build JSON-LD structured data for the common Schema.org types (Article, FAQPage, HowTo, Product, Organization, BreadcrumbList) with the required and recommended fields already filled in. Copy the output straight into a `<script type=\"application/ld+json\">` tag.",
    workedExamples: [
      {
        title: "FAQPage schema",
        input: "3 Q&A pairs about pricing",
        output: '{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    { "@type": "Question", "name": "Is it free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes." } }\n  ]\n}',
        explanation: "Only add FAQPage when the questions and answers are actually visible on the page. Google penalizes hidden-only FAQ schema.",
      },
    ],
    whenToUse: [
      "You have visible content on a page (FAQs, steps, product info) and want the corresponding JSON-LD.",
      "You're setting up rich-result eligibility and need the minimum required fields for a type.",
    ],
    whenNotToUse: [
      "For content you don't actually display — Google's structured-data policy is clear: schema must match visible content.",
      "As your only SEO tactic — schema doesn't cause rankings; it enables rich-result display for pages that already rank.",
    ],
    troubleshooting: [
      { symptom: 'Rich Results Test says "Missing field"', fix: "Some fields are required for eligibility (e.g., `Product` needs `offers` for the price snippet). The generator flags required fields; don't leave them blank if you want the rich result." },
      { symptom: "Rich result was eligible but never shows in SERP", fix: "Eligibility ≠ display. Google decides per-query which snippets to show. Don't over-optimize; ship correct schema and move on." },
    ],
    relatedSlugs: ["meta-tag-open-graph-preview", "xml-sitemap-generator", "json-formatter-validator-diff"],
    lastReviewed: "2026-07-29",
  },

  "url-slug-utm-builder": {
    overview:
      "Two related jobs: turning a title into a clean URL slug (lowercase, hyphenated, ASCII-safe) and appending UTM parameters to a destination URL for campaign tracking in Google Analytics or Plausible.",
    workedExamples: [
      {
        title: "Slugify a title",
        input: "How to Build a Modern Technical SEO Sitemap in 2026!",
        output: "how-to-build-a-modern-technical-seo-sitemap-in-2026",
        explanation: "Lowercase, non-ASCII stripped, spaces to hyphens, trailing punctuation removed. Use this as the final path segment.",
      },
      {
        title: "Build a UTM URL",
        input: "https://xfree.in/tools/regex-tester-explainer, source=newsletter, medium=email, campaign=july-launch",
        output: "https://xfree.in/tools/regex-tester-explainer?utm_source=newsletter&utm_medium=email&utm_campaign=july-launch",
        explanation: "UTM parameters are read by GA4 and most analytics tools out of the box. Keep `source` a specific channel name (not 'web'), and `medium` from Google's standard list (email, cpc, social, referral, etc.) for consistent reports.",
      },
    ],
    whenToUse: [
      "You're publishing a new post and need a clean, SEO-friendly URL.",
      "You're sending a campaign and need to tag the URL so analytics can attribute the traffic.",
    ],
    whenNotToUse: [
      "For internal navigation links — UTM params on internal links overwrite the user's original attribution and pollute reports.",
      "For URLs going into email templates that support their own tracking parameters — check for double-tagging.",
    ],
    troubleshooting: [
      { symptom: "Slug contains characters that break the URL", fix: "The tool strips non-ASCII by default. If you want transliteration (é → e, 中 → zhong), enable it — but check the result before publishing." },
      { symptom: "UTM shows in URL bar but not in analytics report", fix: "Check that your analytics is actually configured to capture UTM (default for GA4, requires plugin for Plausible). Also check that the destination page isn't redirecting and stripping the query string." },
    ],
    relatedSlugs: ["meta-tag-open-graph-preview", "bulk-url-extractor-sitemap-generator", "cron-expression-generator"],
    lastReviewed: "2026-07-29",
  },
};

export function guideForSlug(slug: string): GuideContent | undefined {
  return TOOL_GUIDES[slug];
}
