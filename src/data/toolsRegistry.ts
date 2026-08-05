import { ToolDefinition } from "../types";
import seedToolsData from "../scripts/tools-seed.json";

export const CATEGORIES: { id: string; label: string; description: string; icon: string }[] = [
  {
    id: "seo-tools",
    label: "SEO & URL Tools",
    description: "Bulk extraction, XML sitemaps, Meta OpenGraph previews, Robots.txt, and Schema markup",
    icon: "Globe",
  },
  {
    id: "developer-tools",
    label: "Developer Tools",
    description: "Format, validate, diff, and convert JSON, XML, YAML, Regex, Cron, JWT, and SQL",
    icon: "Code2",
  },
  {
    id: "ai-tools",
    label: "Single-Purpose AI Tools",
    description: "Narrow, deterministic AI assistants for Regex, SQL, JSON Repair, SEO Meta, and Commit Messages",
    icon: "Sparkles",
  },
  {
    id: "text-tools",
    label: "Text & Diff Tools",
    description: "Text diffing, line sorting, word count, slugifier, and regex replacements",
    icon: "FileText",
  },
  {
    id: "converters",
    label: "Converters & Encoders",
    description: "Base64, URL encoding, Unix Timestamps, Color space conversion, and CSS units",
    icon: "ArrowLeftRight",
  },
  {
    id: "generators",
    label: "Generators",
    description: "UUID v4, Cron schedules, Hash generation (SHA-256/MD5), and UTM campaign links",
    icon: "Wand2",
  },
  {
    id: "validators",
    label: "Validators",
    description: "JSON, XML, Sitemap, Schema.org, and Robots.txt rule validators",
    icon: "CheckCircle2",
  },
];

function generate20Faqs(title: string, pillarKeyword: string, supportingKeywords: string[] = []): { question: string; answer: string }[] {
  const k1 = supportingKeywords[0] || pillarKeyword;
  const cleanTitle = title.replace(/\s*\|\s*Free Online Tool/i, "");

  return [
    {
      question: `What is the ${cleanTitle}?`,
      answer: `The ${cleanTitle} is a free, browser-based web utility designed to help marketers, webmasters, and developers execute ${pillarKeyword} tasks instantly without installing software or signing up.`
    },
    {
      question: `How does this free ${pillarKeyword} tool work?`,
      answer: `Our tool processes your input data directly in your browser using modern client-side JavaScript. Simply enter or paste your content, select your desired options, and receive real-time formatted results instantly.`
    },
    {
      question: `Is my input data safe and private when using ${cleanTitle}?`,
      answer: `Yes, 100% safe. All parsing, processing, and formatting happen locally inside your web browser. Your data is never uploaded to external servers or logged in database systems.`
    },
    {
      question: `Is ${cleanTitle} completely free to use without hidden limits?`,
      answer: `Yes, XFree.in offers completely free tools with zero usage limits, no credit card required, and no artificial daily quotas.`
    },
    {
      question: `Do I need to install software, extensions, or register an account?`,
      answer: `No setup or account required. You can access ${cleanTitle} from any modern browser on desktop or mobile devices anytime.`
    },
    {
      question: `How does ${cleanTitle} assist with search engine optimization (SEO)?`,
      answer: `By ensuring clean data formatting, correct technical structures, and accurate keyword optimization (${k1}), ${cleanTitle} helps improve site health, search indexing speed, and user experience.`
    },
    {
      question: `Can I process bulk data or large files using this tool?`,
      answer: `Yes! ${cleanTitle} is built with batch processing utilities and virtualized rendering to handle large inputs efficiently without slowing down your browser.`
    },
    {
      question: `What input formats are supported by ${cleanTitle}?`,
      answer: `Depending on the tool, you can upload or paste plain text, CSV spreadsheets, JSON payloads, XML snippets, or raw code blocks.`
    },
    {
      question: `Is there a daily limit on how many requests I can make?`,
      answer: `There are no limits! You can run unlimited checks, conversions, and generations as often as needed.`
    },
    {
      question: `How does ${cleanTitle} compare to paid software or desktop suites?`,
      answer: `Unlike paid software that requires expensive subscriptions and heavy downloads, ${cleanTitle} gives you instant web access with zero latency and complete privacy for free.`
    },
    {
      question: `Can I use ${cleanTitle} on mobile phones and tablets?`,
      answer: `Yes! All tools on XFree.in are built with responsive touch-friendly user interfaces designed specifically for mobile, tablet, and desktop viewports.`
    },
    {
      question: `How can I export or save my results from ${cleanTitle}?`,
      answer: `You can copy results with 1-click buttons, export to JSON or CSV formats, or download raw text/file files directly to your device.`
    },
    {
      question: `How does this tool help with ${k1}?`,
      answer: `${cleanTitle} streamlines workflows for ${k1} by automating manual validation, formatting, and conversion tasks in seconds.`
    },
    {
      question: `Can I use this tool offline after loading the page?`,
      answer: `Yes! Because the logic executes client-side, once the page loads, ${cleanTitle} can continue processing your data even if your connection drops.`
    },
    {
      question: `What are the best practices for ${pillarKeyword}?`,
      answer: `Always verify input formatting, keep clean backups of raw datasets, and use structured tools like ${cleanTitle} to prevent human error.`
    },
    {
      question: `Is ${cleanTitle} regularly updated?`,
      answer: `Yes, XFree.in maintains active updates to ensure compliance with the latest web standards, browser security policies, and search engine directives.`
    },
    {
      question: `Can I integrate outputs from ${cleanTitle} into my dev or marketing workflows?`,
      answer: `Absolutely. Outputs are standard, valid formats (JSON, XML, CSV, HTML, plain text) ready to copy directly into codebases, CMS platforms, or reports.`
    },
    {
      question: `Who can benefit most from using ${cleanTitle}?`,
      answer: `Digital marketers, SEO specialists, software developers, data analysts, content creators, and students rely on ${cleanTitle} for daily workflow speed.`
    },
    {
      question: `Does ${cleanTitle} require an API key or account login?`,
      answer: `No API key or sign-up is required for standard client-side tools. For AI features, standard Gemini backend integration handles request authentication seamlessly.`
    },
    {
      question: `Why should I choose XFree.in for ${pillarKeyword}?`,
      answer: `XFree.in delivers lightning-fast, ad-light, privacy-first web utilities with zero paywalls, clear user interface designs, and rich FAQ guidance.`
    }
  ];
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  "seo-tools": "SEO & URL Tools",
  "developer-tools": "Developer Tools",
  "ai-tools": "Single-Purpose AI Tools",
  "text-tools": "Text & Diff Tools",
  "converters": "Converters & Encoders",
  "generators": "Generators",
  "validators": "Validators"
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  "seo-tools": "Globe",
  "developer-tools": "Code2",
  "ai-tools": "Sparkles",
  "text-tools": "FileText",
  "converters": "ArrowLeftRight",
  "generators": "Wand2",
  "validators": "CheckCircle2"
};

// Map seed entries into ToolDefinition objects.
// IMPORTANT: seed entries do not have a real React component wired in App.tsx,
// so they are marked as draft/non-indexable. They still power the on-site
// keyword directory but never reach the sitemap and never render as tool pages.
const PROCESSED_SEED_TOOLS: ToolDefinition[] = (seedToolsData as any[]).map((seed) => {
  const catLabel = CATEGORY_LABEL_MAP[seed.cluster] || "Utilities";
  const iconName = CATEGORY_ICON_MAP[seed.cluster] || "Wand2";
  const isAi = seed.cluster === "ai-tools";

  return {
    id: seed.slug,
    slug: seed.slug,
    title: seed.title,
    pillarKeyword: seed.pillarKeyword,
    shortDescription: seed.description,
    category: seed.cluster,
    categoryLabel: catLabel,
    iconName: iconName,
    execution: isAi ? "ai" : "local",
    status: "draft",
    lastModified: "2026-03-15",
    isAi: isAi,
    toolComponent: seed.toolComponent,
    tags: [seed.pillarKeyword, ...(seed.supportingKeywords || []), seed.cluster],
    exampleInput: seed.exampleInput || `Sample input data for ${seed.title}`,
    explanation: `Draft entry for ${seed.title} (${seed.pillarKeyword}). This tool is not implemented and its route returns 404 until the component is built.`,
    howToUse: [
      `Enter or paste your raw text into the input editor.`,
      `Select your desired options or filters.`,
      `Click 'Process Data' or view instant transformation.`,
      `Copy results or export to file.`
    ],
    privacyNotice: isAi
      ? "AI-powered tool. Input is sent to XFree.in and processed by Google Gemini. Do not submit confidential data."
      : "This tool runs entirely in your browser. Input is not sent to XFree.in servers.",
    faqs: generate20Faqs(seed.title, seed.pillarKeyword, seed.supportingKeywords),
    relatedToolIds: ["bulk-url-sitemap", "json-formatter", "regex-tester"]
  };
});

// Primary 10 production catalog tools (Indexable)
const HAND_CRAFTED_TOOLS: ToolDefinition[] = [
  {
    id: "bulk-url-sitemap",
    slug: "bulk-url-extractor",
    title: "Bulk URL Extractor & Sitemap Generator",
    pillarKeyword: "Free Bulk URL Extractor & Sitemap Generator Online",
    shortDescription: "Extract URLs from massive raw text or HTML, clean, deduplicate, filter by domain, and generate valid XML Sitemaps with Sitemap-Index splitting.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    isFlagship: true,
    tags: ["sitemap", "url extractor", "bulk urls", "xml sitemap", "seo", "domain filter"],
    exampleInput: `Check out our site at https://example.com/blog/seo-guide and https://example.com/about!\nhttps://example.com/products/view?id=123 and duplicate link https://example.com/about.`,
    explanation: "Parses raw text, HTML, or logs to isolate HTTP/HTTPS URLs, deduplicate them, filter by domain, and export Google-compliant XML Sitemaps.",
    howToUse: [
      "Paste any raw text or HTML snippet into the input area.",
      "Select domain filter, query parameter removal, and deduplication options.",
      "View real-time extracted URL stats.",
      "Download generated XML Sitemap file."
    ],
    privacyNotice: "Local processing: input text and extracted URLs stay in your browser.",
    faqs: [
      { question: "Which URL formats does the extractor find?", answer: "Any string starting with http:// or https://, including URLs with query strings, fragments, and ports. Protocol-relative URLs (starting with //) are optionally normalized to https://. Relative paths without a base URL aren't extracted — regex-based extraction needs a full URL." },
      { question: "Does it deduplicate and strip query parameters?", answer: "Yes to dedup (default on). Query-string stripping is optional — enable it before generating a sitemap, since tracking params (utm_source, fbclid) create URL variants Google treats as duplicates of the canonical page." },
      { question: "How large an input can it handle?", answer: "Tested to about 5 MB of pasted text on a mid-range laptop. Above that, the browser tab slows noticeably. For very large log files, split them or use a command-line tool like grep -oE." },
      { question: "Why is the tool missing URLs I can see on a live page?", answer: "It works on the raw text you paste. If a page renders URLs only after JavaScript executes (single-page apps, dynamic feeds), pasting the View Source HTML won't contain those URLs. Render the page in a headless browser first (Puppeteer, Playwright) and paste that." },
      { question: "Can it push the extracted URLs straight into a sitemap?", answer: "Yes. Toggle 'Wrap as sitemap' and the tool emits a sitemapindex or urlset XML you can paste into a valid <?xml?> wrapper. For canonical sitemap generation from an authoritative registry, use the dedicated XML Sitemap Generator instead." },
      { question: "Does the input leave my browser?", answer: "No. Extraction runs locally in the browser tab. The site as a whole loads Google AdSense which sets advertising cookies (see the Privacy page), but the pasted text you extract from is never sent to XFree.in or any AI backend." }
    ],
    relatedToolIds: ["robots-txt-generator", "meta-tag-generator", "schema-markup-generator"]
  },
  {
    id: "xml-sitemap-generator",
    slug: "xml-sitemap-generator",
    title: "XML Sitemap Generator & Validator",
    pillarKeyword: "XML Sitemap Generator",
    shortDescription: "Generate valid Google & Bing XML sitemaps with priority, changefreq, lastmod, and automatic chunking for large link sets.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["xml sitemap", "seo", "google indexing", "sitemap validator"],
    exampleInput: "https://example.com/\nhttps://example.com/about\nhttps://example.com/services",
    explanation: "Converts lists of web URLs into schema-compliant XML sitemaps with proper XML escaping and sitemap index generation.",
    howToUse: [
      "Enter list of URLs line by line.",
      "Adjust priority and change frequency settings.",
      "Click generate and download sitemap.xml."
    ],
    privacyNotice: "Local processing: your URL list stays in your browser.",
    faqs: [
      { question: "What's the URL limit per sitemap file?", answer: "50,000 URLs or 50 MB uncompressed, per the sitemaps.org protocol. The tool auto-splits into multiple files and emits a sitemapindex.xml when you exceed either limit." },
      { question: "Do Google and Bing actually use <priority> and <changefreq>?", answer: "Google largely ignores both. Bing still reads changefreq as a hint. The tool sets sensible defaults but neither field affects rankings — the URLs themselves and their <lastmod> matter more." },
      { question: "Does it auto-generate lastmod dates?", answer: "Only if you paste them. Fabricating lastmod (e.g., setting every URL to today) is a known anti-pattern that trains crawlers to ignore your dates entirely. The tool leaves lastmod blank when no date is provided." },
      { question: "Google Search Console says 'sitemap could not be read' — why?", answer: "Almost always one of three things: a BOM (byte-order mark) at the start of the file, non-UTF-8 encoding, or an XML declaration on any line except the first. Save the file as UTF-8 without BOM and put <?xml version=\"1.0\" ...?> at line 1, column 1." },
      { question: "Does it validate URLs before including them?", answer: "It rejects malformed URLs, non-http(s) schemes, and duplicates in the same list. It does NOT fetch each URL to check for 200 — that's a separate crawl step. Google will drop URLs from your sitemap that 404, redirect, or noindex." },
      { question: "Does my URL list leave the browser?", answer: "No. Sitemap XML is generated locally in your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the URLs you paste are never uploaded." }
    ],
    relatedToolIds: ["bulk-url-sitemap", "robots-txt-generator"]
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
    title: "JSON / XML Formatter, Validator & Tree Viewer",
    pillarKeyword: "JSON Formatter and Validator",
    shortDescription: "Format, validate, repair, minify, and inspect JSON/XML data with interactive tree views and error location diagnostics.",
    category: "developer-tools",
    categoryLabel: "Developer Tools",
    iconName: "Code2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    isFlagship: true,
    tags: ["json formatter", "json validator", "json tree", "json repair", "xml format"],
    exampleInput: '{"name": "XFree Platform", "tools": 10, "active": true, "tags": ["seo", "dev"]}',
    explanation: "Parses JSON and XML payloads, identifies syntax errors with line/column markers, provides formatting, minification, and visual tree hierarchy.",
    howToUse: [
      "Paste JSON or XML payload into the input editor.",
      "Toggle between Format, Minify, and Interactive Tree modes.",
      "Review validation diagnostics or click Auto-Fix for minor syntax repairs."
    ],
    privacyNotice: "Local processing: your JSON payload stays in the browser and is not sent to XFree.in servers.",
    // Six page-specific FAQs. Each answer corresponds to something the tool
    // actually does or a limit that actually applies. Deliberately not the
    // templated generate20Faqs output, which was scaled-content shape.
    faqs: [
      {
        question: "Does this validate strict JSON or JSON5?",
        answer: "Strict JSON per RFC 8259. Trailing commas, unquoted keys, single-quoted strings, and comments are all rejected. If your source is JSON5 or JSONC, use a JSON5-aware parser instead — this tool will flag those as errors."
      },
      {
        question: "What's the largest payload I can paste in?",
        answer: "The tool is tested up to about 10 MB of formatted JSON. Above that, browsers slow down noticeably and Chrome tabs can be killed by the OS for memory pressure. For anything larger, use jq on the command line."
      },
      {
        question: "Will large numeric IDs lose precision?",
        answer: "Yes. JSON numbers are IEEE 754 doubles, so integers larger than 2^53 (9,007,199,254,740,992) silently round. If you're inspecting 64-bit database IDs or Twitter snowflake IDs, send them as strings from your API — the tool shows them exactly as received."
      },
      {
        question: "Does it handle XML too?",
        answer: "Yes. The XML mode uses the browser's DOMParser. It formats and validates well-formed XML, but does not resolve external DTDs or validate against a schema. Encoding is assumed to be UTF-8."
      },
      {
        question: "Does my input leave the browser?",
        answer: "No. The formatter, validator, and diff all run in your browser tab. The site itself uses Google AdSense which sets advertising cookies (see the Privacy page), but the JSON you paste is never sent to XFree.in or to any AI backend."
      },
      {
        question: "Why does my JSON error say \"Unexpected token in JSON at position N\"?",
        answer: "N is the byte offset from the start of the input. The three most common causes are trailing commas, smart quotes copy-pasted from a document, and unescaped newlines inside string values. Look at the exact byte and the character just before it."
      }
    ],
    relatedToolIds: ["regex-tester", "base64-encoder-decoder"]
  },
  {
    id: "regex-tester",
    slug: "regex-tester",
    title: "Regex Tester & Interactive Match Explainer",
    pillarKeyword: "Regex Tester",
    shortDescription: "Test regular expressions live with match group breakdown, string replacement previews, and flags (g, i, m).",
    category: "developer-tools",
    categoryLabel: "Developer Tools",
    iconName: "Code2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["regex tester", "regular expression", "regex match", "regex replace"],
    exampleInput: "Contact support@xfree.in or sales@company.com for inquiries.",
    explanation: "Evaluates regex patterns against sample text in real-time, showing match groups, indices, and string replacement outputs.",
    howToUse: [
      "Type regular expression pattern and flags.",
      "Enter test string into input box.",
      "View highlighted matches and captured group tables."
    ],
    privacyNotice: "Local processing: your pattern and test string stay in your browser.",
    faqs: [
      { question: "Which regex flavor does this use?", answer: "JavaScript (ECMAScript) regex, since it runs in your browser. That's close to PCRE but not identical — most notably, lookbehind support and Unicode property escapes (\\p{...}) require a modern browser, and JavaScript has no possessive quantifiers or atomic groups." },
      { question: "Does the pattern work the same in Python or Go?", answer: "Usually mostly, but not always. Named-group syntax differs (?P<name> in Python re, ?<name> in JavaScript/Go). Character-class shorthand behavior around Unicode varies. Test in the target runtime before shipping — don't assume portability." },
      { question: "What is catastrophic backtracking and does the tool warn me?", answer: "Nested quantifiers on ambiguous patterns — for example (a+)+ or (.*)* — can take exponential time on adversarial input. The tool aborts execution after a short timeout on your test string, but it doesn't statically detect the problem. Rewrite ambiguous patterns; don't just hope your input stays benign." },
      { question: "Are named capture groups and backreferences supported?", answer: "Yes. (?<name>...) captures by name, and $<name> or \\k<name> back-references it in the replacement. Modern JavaScript engines support both." },
      { question: "How large a test string can I paste?", answer: "The engine handles millions of characters, but a single catastrophic-backtracking pattern on a long input will still hang. Start with a small representative sample, verify the pattern behaves, then scale up." },
      { question: "Does my input leave the browser?", answer: "No. The regex engine is your browser's built-in RegExp. The site loads Google AdSense which sets cookies (see the Privacy page), but your pattern and test string never go to XFree.in or any AI backend." }
    ],
    relatedToolIds: ["json-formatter", "cron-expression-generator"]
  },
  {
    id: "cron-expression-generator",
    slug: "cron-expression-generator",
    title: "Cron Expression Generator & Human Translator",
    pillarKeyword: "Cron Expression Generator",
    shortDescription: "Generate standard 5-part cron schedule expressions, view plain-English explanations, and calculate upcoming execution times.",
    category: "generators",
    categoryLabel: "Generators",
    iconName: "Wand2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["cron generator", "cron syntax", "cron schedule", "cron expression"],
    exampleInput: "*/15 9-17 * * 1-5",
    explanation: "Translates cron syntax into human-readable sentences and calculates exact future execution timestamps.",
    howToUse: [
      "Configure minute, hour, day of month, month, and day of week options.",
      "Review generated 5-part cron expression string.",
      "Inspect upcoming execution times list."
    ],
    privacyNotice: "Local processing: cron parsing and next-run calculations happen in your browser.",
    faqs: [
      { question: "Which cron dialect does the tool support?", answer: "Standard 5-field Unix cron: minute hour day-of-month month day-of-week. AWS EventBridge (6-field with seconds and ? placeholder), Quartz (6-7 fields), and Kubernetes CronJob all differ — the tool won't generate valid expressions for those. Kubernetes CronJob uses 5-field Unix cron, so it's compatible." },
      { question: "How does it handle DST and time zones?", answer: "The tool computes next-run times in your browser's local time zone. If your server runs in UTC, subtract accordingly. In DST-observing zones, 2am–3am either doesn't exist (spring) or exists twice (fall) — schedule at 1am or 4am to sidestep the ambiguity, or run cron in UTC." },
      { question: "Why do day-of-month and day-of-week seem to combine oddly?", answer: "In most cron implementations (Vixie cron, Kubernetes, GNU), if BOTH day-of-month and day-of-week are set (not *), the rule is OR — not AND. `0 0 15 * 1` runs at midnight on the 15th OR any Monday, not 'midnight on the 15th if it's a Monday.' Use * for one field when you want AND-like behavior." },
      { question: "Can I schedule sub-minute jobs?", answer: "No. Standard cron's minimum resolution is one minute. For second-level scheduling, use a purpose-built scheduler (Temporal, Airflow, systemd timers with OnCalendar)." },
      { question: "Does GitHub Actions accept these expressions?", answer: "Yes for the 5-field format, but GitHub Actions cron always runs in UTC — there's no way to specify a timezone in the workflow. Convert accordingly." },
      { question: "Does the tool store my schedules?", answer: "No. Everything is local to your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the cron expressions you build never leave the browser." }
    ],
    relatedToolIds: ["regex-tester", "url-slug-utm-builder"]
  },
  {
    id: "meta-tag-generator",
    slug: "meta-tag-generator",
    title: "Meta Tag & Open Graph Social Card Preview",
    pillarKeyword: "Meta Tag Generator",
    shortDescription: "Generate meta title tags, meta descriptions, and Open Graph / Twitter Cards with real-time Google SERP and social card previews.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["meta tags", "open graph", "twitter card", "serp preview", "seo"],
    exampleInput: "Title: XFree.in Platform\nDescription: Free developer and SEO micro-tools.",
    explanation: "Constructs HTML meta tags for title, description, canonical URL, og:title, og:image, and twitter:card with length character count validation.",
    howToUse: [
      "Fill in page title, description, canonical URL, and OG image link.",
      "Inspect live Google search result snippet and Twitter/Facebook preview card.",
      "Copy generated HTML code snippet."
    ],
    privacyNotice: "Local processing: previews render entirely in your browser.",
    faqs: [
      { question: "What length limits does it warn about?", answer: "Title over 60 characters (Google truncates) and description over 160 characters (Google may rewrite). These are guidelines, not hard limits — Google renders titles pixel-based, not character-based, so a title with lots of narrow letters can fit more, and vice versa." },
      { question: "Why does Google sometimes show a different title in search results than the one I set?", answer: "Google may rewrite titles when it thinks it can better match user intent — using your H1, anchor text pointing at your page, or metadata. Keep your <title> concise, put the primary keyword first, and match on-page content — Google is more likely to keep it." },
      { question: "Does the tool validate my og:image URL?", answer: "It checks the format (must be an absolute URL) and displays a preview if the image loads in your browser. It does NOT fetch the image server-side or check dimensions — Twitter and Facebook both cache OG images aggressively, so use their debugger tools (developers.facebook.com/tools/debug, cards-dev.twitter.com) after publish." },
      { question: "Which Twitter card types does it support?", answer: "summary (small square thumbnail) and summary_large_image (1200×630 hero image). Choose summary_large_image if you have a real OG image; the small variant looks generic. player and app cards are Twitter-specific and not generated here." },
      { question: "Facebook still shows my old preview after I updated the tags — why?", answer: "Facebook, LinkedIn, and Twitter all cache OG data per URL. Force a refresh in their respective debuggers: Facebook Sharing Debugger, LinkedIn Post Inspector, Twitter Card Validator. The tool itself only generates the markup — it can't invalidate their caches." },
      { question: "Does the tool upload my image?", answer: "No. Everything renders locally, including the SERP and social card previews. The site loads Google AdSense which sets cookies (see the Privacy page), but neither your metadata nor your OG image URL is transmitted to XFree.in." }
    ],
    relatedToolIds: ["schema-markup-generator", "robots-txt-generator"]
  },
  {
    id: "robots-txt-generator",
    slug: "robots-txt-generator",
    title: "Robots.txt Generator & User-Agent Rule Tester",
    pillarKeyword: "Robots.txt Generator",
    shortDescription: "Create valid robots.txt directives for search engine crawlers, test path allowance rules, and specify XML sitemaps.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["robots.txt", "crawler rules", "allow disallow", "seo auditing"],
    exampleInput: "User-agent: *\nDisallow: /admin/\nSitemap: https://xfree.in/sitemap.xml",
    explanation: "Builds RFC 9309 compliant robots.txt files with Allow/Disallow rule groups, crawl-delay directives, and sitemap references.",
    howToUse: [
      "Add user-agent rules (e.g. Googlebot, Bingbot, *).",
      "Specify allowed and disallowed path rules.",
      "Test URL path against current rules to verify crawler permissions."
    ],
    privacyNotice: "Local processing: rule composition and URL testing happen in your browser.",
    faqs: [
      { question: "Does the tool support wildcards and end-of-line anchors?", answer: "Yes. * matches any sequence of characters within a path, and $ anchors to the end of the URL. `Disallow: /*.pdf$` blocks everything ending in .pdf. Both are RFC 9309-compliant and understood by Google, Bing, and most modern crawlers." },
      { question: "How do multiple user-agent groups behave?", answer: "The most specific matching user-agent wins per bot. `User-agent: Googlebot-Image` takes precedence over `User-agent: Googlebot` for Googlebot-Image; `User-agent: Googlebot` beats `User-agent: *` for Googlebot. Rules do NOT combine across groups — the winning group applies alone." },
      { question: "Is robots.txt a security mechanism?", answer: "No. It's a request, not enforcement. Well-behaved crawlers respect it; hostile ones ignore it. Never rely on Disallow to protect sensitive URLs — use HTTP auth, IP allow-lists, or moving the content off a discoverable path. Robots.txt entries can even help attackers find your admin paths." },
      { question: "Will `Disallow` remove already-indexed pages from Google?", answer: "No. Disallow prevents future crawling but doesn't remove URLs already in the index. If an external site links to the blocked URL, Google may keep showing it in results with no snippet. To remove, use a `noindex` meta tag (which requires the crawler to actually fetch the page) or Google Search Console's Removals tool." },
      { question: "How is case sensitivity handled?", answer: "User-agent tokens are case-insensitive (`Googlebot` = `googlebot`). Path values are case-sensitive per the spec, matching URL case exactly. `/Admin/` and `/admin/` are different paths." },
      { question: "Does the URL-tester store my rules?", answer: "No. Rule editing and URL testing happen entirely in your browser. The site loads Google AdSense which sets cookies (see the Privacy page), but nothing you type here is uploaded." }
    ],
    relatedToolIds: ["bulk-url-sitemap", "meta-tag-generator"]
  },
  {
    id: "schema-markup-generator",
    slug: "schema-markup-generator",
    title: "Schema Markup Generator (JSON-LD Structured Data)",
    pillarKeyword: "Schema Markup Generator",
    shortDescription: "Generate valid Schema.org JSON-LD structured data for WebSite, Organization, SoftwareApplication, FAQPage, Article, and Breadcrumbs.",
    category: "seo-tools",
    categoryLabel: "SEO & URL Tools",
    iconName: "Globe",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["schema markup", "json-ld", "structured data", "faq schema", "rich snippet"],
    exampleInput: "Name: XFree\nURL: https://xfree.in",
    explanation: "Generates rich snippet structured data in valid JSON-LD format with form validation and Google Rich Results compliance checks.",
    howToUse: [
      "Select Schema type (e.g. WebSite, Organization, FAQPage, Article).",
      "Fill in required metadata fields.",
      "Copy formatted JSON-LD script tag."
    ],
    privacyNotice: "Local processing: JSON-LD is generated in your browser and never uploaded.",
    faqs: [
      { question: "Which schema types can I generate?", answer: "Organization, WebSite, WebPage, SoftwareApplication, Article, BreadcrumbList, FAQPage, HowTo, and Product. Types that require visible on-page content (FAQPage, HowTo) will fail Google's Rich Results validation if you emit the schema without matching visible content — Google explicitly checks for that." },
      { question: "Can I combine multiple schemas on one page?", answer: "Yes. Wrap them in a single script with an @graph array, and give each node a stable @id. That's more compact than multiple <script type=\"application/ld+json\"> tags and lets you cross-reference nodes (e.g., an Article publisher pointing at your Organization @id)." },
      { question: "Does valid schema guarantee rich results in Google?", answer: "No. Validation is a prerequisite, not a guarantee. Google decides per-query and per-page whether to show a rich result based on content quality, indexation status, and eligibility signals. Ship correct schema and don't over-optimize." },
      { question: "What about fabricated ratings and reviews?", answer: "Don't. Google's structured-data policy explicitly prohibits AggregateRating/Review markup for content the site doesn't genuinely have. Detection is common and manual actions removing all rich results from the site are the typical penalty. The tool won't stop you but you shouldn't." },
      { question: "Where do I put the generated <script> tag?", answer: "Anywhere in the HTML — <head> or <body>, either works. Most sites put it in <head> for consistency. The important part is that the schema fields match visible content on the page." },
      { question: "Does my input data get sent anywhere?", answer: "No. The generator builds JSON-LD locally in your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the values you enter (names, URLs, prices, etc.) never leave the browser." }
    ],
    relatedToolIds: ["meta-tag-generator", "bulk-url-sitemap"]
  },
  {
    id: "base64-encoder-decoder",
    slug: "base64-encoder-decoder",
    title: "Base64 Encoder/Decoder & JWT Token Inspector",
    pillarKeyword: "Base64 & JWT Decoder",
    shortDescription: "Safely encode and decode Base64 strings, UTF-8 text, Base64URL parameters, and inspect OAuth JWT headers, payloads, and claims.",
    category: "converters",
    categoryLabel: "Converters & Encoders",
    iconName: "ArrowLeftRight",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["base64", "jwt decoder", "url encode", "base64url", "oauth token"],
    exampleInput: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRGV2IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    explanation: "Decodes JWT headers and payload claims without transmitting tokens to external servers. Supports UTF-8 safe Base64 and Base64URL encoding/decoding.",
    howToUse: [
      "Select JWT, Base64, or URL mode.",
      "Paste token or text input.",
      "View decoded header, payload claims, and expiration date."
    ],
    privacyNotice: "Local processing: tokens and strings are decoded in your browser and never uploaded.",
    faqs: [
      { question: "Is Base64 encryption?", answer: "No. Base64 is an encoding, not encryption. A Base64 string is trivially reversible with a decoder — anyone can read what's inside. Don't use it to protect secrets, credentials, or anything you'd hesitate to publish in plaintext." },
      { question: "What's the difference between Base64 and Base64URL?", answer: "Standard Base64 uses +, /, and = padding, which are all reserved characters in URL paths and query strings. Base64URL replaces + with -, / with _, and drops the padding. Use Base64URL for anything going into a URL or a JWT — the tool converts both directions." },
      { question: "Does it verify JWT signatures?", answer: "No. Signature verification requires the signing secret (HS256) or the public key (RS256/ES256) — neither should ever be pasted into a browser tool. The decoder shows the signature bytes as unverified and clearly labels it. If you need to verify, use jwt.io locally (offline) or your language's JWT library server-side." },
      { question: "What claims does the JWT view surface?", answer: "It highlights the standard claims: iss (issuer), sub (subject), aud (audience), exp (expiration), iat (issued-at), nbf (not-before), and jti (JWT ID). Timestamps are shown in both Unix and human-readable form, and expired tokens are flagged in red." },
      { question: "Can I paste a token with 4 or 5 segments (JWE)?", answer: "The decoder handles the JWT/JWS 3-segment format (header.payload.signature). JWE (encrypted JWT) has 5 segments and requires the recipient's private key to decrypt — the tool won't and shouldn't try." },
      { question: "Where does my token go?", answer: "Nowhere. Decoding is your browser splitting on '.' and Base64URL-decoding two segments. The site loads Google AdSense which sets cookies (see the Privacy page), but the token you paste stays in the tab. Close the tab when you're done for extra safety." }
    ],
    relatedToolIds: ["json-formatter", "url-slug-utm-builder"]
  },
  {
    id: "url-slug-utm-builder",
    slug: "url-slug-utm-builder",
    title: "URL Slug Generator & Campaign UTM Parameter Builder",
    pillarKeyword: "URL Slug Generator",
    shortDescription: "Clean title strings into SEO-friendly URL slugs, and build campaign URLs with UTM parameters (source, medium, campaign, term, content).",
    category: "generators",
    categoryLabel: "Generators",
    iconName: "Wand2",
    execution: "local",
    status: "indexable",
    lastModified: "2026-03-15",
    tags: ["url slug", "utm builder", "google analytics", "campaign tracking", "clean url"],
    exampleInput: "Title: How to Build a Modern Technical SEO Sitemap in 2026!",
    explanation: "Converts strings into lowercase, hyphen-separated clean URL slugs while stripping special characters. Appends validated Google Analytics UTM parameters to base URLs.",
    howToUse: [
      "Type title string to generate clean URL slug.",
      "Enter destination URL and campaign UTM details.",
      "Copy final clean tracking URL."
    ],
    privacyNotice: "Local processing: slug and URL construction happen in your browser.",
    faqs: [
      { question: "How does it handle non-ASCII characters in slugs?", answer: "By default it strips non-ASCII. Enable transliteration to map accented characters to their ASCII equivalents (é → e, ñ → n, ç → c). For non-Latin scripts (中文, العربية, हिन्दी) transliteration is lossy — for those, choose a slug in the target language you own." },
      { question: "Which UTM parameters does the builder support?", answer: "The five Google Analytics standard params: utm_source, utm_medium, utm_campaign, utm_term, utm_content. Non-standard params (utm_id, custom keys) can be added manually to the query string but won't show in GA4's default reports." },
      { question: "What if my destination URL already has a query string?", answer: "The builder merges. Existing keys are preserved unless a UTM param has the same name (unlikely). The output uses & separators throughout — no double ? bugs." },
      { question: "Should I add UTM params to internal links?", answer: "No. UTM on internal links overwrites the visitor's original attribution (the source that brought them to the site) and pollutes GA4 reports. Use UTM only on inbound links — email campaigns, ads, external posts." },
      { question: "Does UTM tagging affect SEO?", answer: "It shouldn't, if your canonical tags are correct. Google folds parameterized variants into the canonical URL when the tag points at the clean version. Verify canonical is set on the destination page before running a big campaign." },
      { question: "Does the URL leave the browser?", answer: "No. Slug generation and UTM append are pure string operations in your browser tab. The site loads Google AdSense which sets cookies (see the Privacy page), but the URLs you build here are never sent anywhere." }
    ],
    relatedToolIds: ["bulk-url-sitemap", "base64-encoder-decoder"]
  }
];

// Combine seed tools and handcrafted tools while removing duplicate IDs
const toolMap = new Map<string, ToolDefinition>();

PROCESSED_SEED_TOOLS.forEach(tool => {
  toolMap.set(tool.id, tool);
});

HAND_CRAFTED_TOOLS.forEach(tool => {
  toolMap.set(tool.id, tool);
});

export const TOOLS_REGISTRY: ToolDefinition[] = Array.from(toolMap.values());

// Tools that have a real wired React component AND are approved for indexing/sitemap.
export const INDEXABLE_TOOLS: ToolDefinition[] = TOOLS_REGISTRY.filter(
  (t) => t.status === "indexable",
);

export const INDEXABLE_TOOL_SLUGS: Set<string> = new Set(INDEXABLE_TOOLS.map((t) => t.slug));

export function findIndexableTool(slug: string): ToolDefinition | undefined {
  return INDEXABLE_TOOLS.find((t) => t.slug === slug);
}

export function findToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS_REGISTRY.find((t) => t.slug === slug || t.id === slug);
}
