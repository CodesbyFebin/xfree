/**
 * Standalone guide/blog content. Not tied to a tool component — these
 * are reference pages for developers looking up how something works.
 * Authorship: XFree.in team. Every guide is reviewed before ship; the
 * lastReviewed date reflects the last time a human re-verified the content.
 */

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: { language?: string; body: string };
}

export interface Guide {
  slug: string;
  title: string;
  /** SERP-facing description, 150–160 chars. */
  description: string;
  /** One-paragraph intro shown at top of page and injected into prerender shell. */
  intro: string;
  sections: GuideSection[];
  relatedGuideSlugs?: string[];
  relatedToolSlugs?: string[];
  lastReviewed: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "regex-cheat-sheet",
    title: "Regex Cheat Sheet: The Patterns You Actually Use",
    description: "A short regex cheat sheet covering the character classes, quantifiers, anchors, groups, and flags you'll use 90% of the time — with worked examples.",
    intro:
      "Regex references online tend to list every arcane feature ever added to the standard. This one lists the parts you actually reach for in a real workday: extracting things, redacting things, splitting things, validating things. Every example is runnable in a JavaScript regex engine (which is what your browser and Node.js use).",
    sections: [
      {
        heading: "Character classes",
        paragraphs: ["Match a set of characters at one position."],
        code: {
          language: "regex",
          body:
            "\\d        one digit (0–9)\n" +
            "\\D        one non-digit\n" +
            "\\w        one word char [A-Za-z0-9_]\n" +
            "\\W        one non-word char\n" +
            "\\s        one whitespace char (space, tab, newline)\n" +
            "\\S        one non-whitespace char\n" +
            ".         any char except newline (or any char with /s flag)\n" +
            "[abc]     literally a, b, or c\n" +
            "[^abc]    anything except a, b, or c\n" +
            "[a-z]     range a through z",
        },
      },
      {
        heading: "Quantifiers",
        paragraphs: ["Repeat the previous atom. Add ? after any quantifier to make it lazy (match as little as possible)."],
        code: {
          language: "regex",
          body:
            "*         zero or more\n" +
            "+         one or more\n" +
            "?         zero or one\n" +
            "{3}       exactly 3\n" +
            "{3,}      3 or more\n" +
            "{3,7}     between 3 and 7\n" +
            "*?  +?    lazy variants — match as little as possible",
        },
      },
      {
        heading: "Anchors and boundaries",
        code: {
          language: "regex",
          body:
            "^         start of string (or start of line with /m flag)\n" +
            "$         end of string (or end of line with /m flag)\n" +
            "\\b        word boundary — between \\w and \\W\n" +
            "\\B        NOT a word boundary",
        },
      },
      {
        heading: "Groups and captures",
        code: {
          language: "regex",
          body:
            "(abc)             capturing group; refer to it as $1 in replacements\n" +
            "(?:abc)           non-capturing group — use when you only need to group for a quantifier\n" +
            "(?<name>abc)      named capture; refer to as $<name>\n" +
            "(?=abc)           positive lookahead — 'followed by abc'\n" +
            "(?!abc)           negative lookahead — 'not followed by abc'\n" +
            "(?<=abc)          positive lookbehind — 'preceded by abc'\n" +
            "(?<!abc)          negative lookbehind",
        },
      },
      {
        heading: "Flags",
        code: {
          language: "regex",
          body:
            "g   global — return ALL matches, not just the first\n" +
            "i   case-insensitive\n" +
            "m   multiline — ^ and $ match line boundaries, not just string boundaries\n" +
            "s   dotall — . matches newlines too\n" +
            "u   unicode — full Unicode support, enables \\u{...} and \\p{...}",
        },
      },
      {
        heading: "Patterns you'll actually use",
        code: {
          language: "regex",
          body:
            "// Extract URLs\nhttps?://[^\\s\"'<>]+\n\n" +
            "// Loose email extraction (not RFC 5321 validation)\n[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\n\n" +
            "// ISO date parts\n(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})\n\n" +
            "// Card-shaped number redaction (not PCI validation)\n\\d{4}[ -]?\\d{4}[ -]?\\d{4}[ -]?(\\d{4})\n// replacement: **** **** **** $1\n\n" +
            "// UUID v4-ish\n[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\n\n" +
            "// Trim leading/trailing whitespace\n^\\s+|\\s+$    // with /gm",
        },
      },
      {
        heading: "Things that will burn you",
        bullets: [
          "Catastrophic backtracking. Nested quantifiers like (a+)+ or (.*)* can freeze the engine on adversarial input. Rewrite with atomic groups where the engine supports them, or restructure to avoid the ambiguity.",
          "JavaScript regex differs from PCRE, Python re, and Go regexp. Lookbehind and named-group syntax vary. Test in the target runtime before shipping.",
          "Parsing HTML with regex. Just don't — use a real parser.",
          "The dot (.) does not match newlines unless you use the s flag.",
          "Anchors ^ and $ are string boundaries by default, not line boundaries. Add the m flag for line-oriented matching.",
        ],
      },
    ],
    relatedGuideSlugs: ["common-json-formatting-errors"],
    relatedToolSlugs: ["regex-tester"],
    lastReviewed: "2026-08-03",
  },

  {
    slug: "cron-expression-examples",
    title: "Cron Expression Examples: 20 Real Schedules Explained",
    description: "Ready-to-use cron expressions for common jobs — nightly builds, hourly polling, weekday-only reports — with what each field means and where cron will bite you.",
    intro:
      "Cron syntax is compact and unforgiving. This is a list of expressions people actually deploy, with the intent stated plainly and the fields broken down. If your scheduler uses a variant (AWS EventBridge, Quartz, k8s CronJob), the differences are noted at the bottom.",
    sections: [
      {
        heading: "The five fields",
        paragraphs: [
          "Standard Unix cron is five space-separated fields: minute, hour, day of month, month, day of week. Values can be a number, a comma-separated list (1,3,5), a range (9-17), a step (*/15), or the wildcard *.",
        ],
        code: {
          language: "text",
          body:
            "┌───────────── minute       (0–59)\n" +
            "│ ┌─────────── hour         (0–23)\n" +
            "│ │ ┌───────── day of month (1–31)\n" +
            "│ │ │ ┌─────── month        (1–12)\n" +
            "│ │ │ │ ┌───── day of week  (0–6, Sunday=0)\n" +
            "│ │ │ │ │\n" +
            "* * * * *  command",
        },
      },
      {
        heading: "Every N units",
        code: {
          language: "text",
          body:
            "* * * * *           every minute\n" +
            "*/5 * * * *         every 5 minutes\n" +
            "*/15 * * * *        every 15 minutes\n" +
            "*/30 * * * *        every 30 minutes\n" +
            "0 * * * *           every hour on the hour\n" +
            "0 */2 * * *         every 2 hours (0, 2, 4, …)\n" +
            "0 */6 * * *         every 6 hours",
        },
      },
      {
        heading: "Daily",
        code: {
          language: "text",
          body:
            "0 0 * * *           midnight every day\n" +
            "30 2 * * *          02:30 every day — a safe maintenance window\n" +
            "0 9 * * *           9am every day\n" +
            "0 18 * * *          6pm every day",
        },
      },
      {
        heading: "Business hours / weekdays",
        code: {
          language: "text",
          body:
            "*/15 9-17 * * 1-5   every 15 min, 9am–5pm, Mon–Fri\n" +
            "0 9 * * 1-5         9am on weekdays\n" +
            "0 17 * * 1-5        5pm on weekdays\n" +
            "0 9 * * 1           9am every Monday\n" +
            "0 9 * * 6,0         9am on Saturday and Sunday",
        },
      },
      {
        heading: "Monthly and yearly",
        code: {
          language: "text",
          body:
            "0 0 1 * *           midnight on the 1st of every month\n" +
            "0 0 1 1 *           midnight on Jan 1 (yearly)\n" +
            "0 0 15 * *          midnight on the 15th of every month\n" +
            "0 0 1 */3 *         midnight on the 1st every 3 months (quarterly)",
        },
      },
      {
        heading: "Things cron gets wrong that you have to design around",
        bullets: [
          "Cron doesn't retry missed runs. If the server was down at the scheduled time, the run is simply skipped. Use anacron or a job runner with persistence if you need catch-up.",
          "DST is a landmine. The 2am–3am hour either doesn't exist (spring forward) or exists twice (fall back) in observing timezones. Schedule at 1am or 4am, or run cron in UTC.",
          "Day-of-month AND day-of-week filters use OR logic in most cron implementations, not AND. `0 0 15 * 1` means 'midnight on the 15th OR on any Monday,' not 'midnight on the 15th if it's a Monday.'",
          "Sub-minute scheduling isn't possible in standard cron. If you need second-level precision, use a proper scheduler.",
          "Wall-clock exactness isn't guaranteed. There's typically a few seconds of drift, and jobs can queue if the previous run hasn't finished.",
        ],
      },
      {
        heading: "Variants",
        bullets: [
          "AWS EventBridge and CloudWatch Events use a 6-field format with seconds, and ? in the day-of-week or day-of-month slot to mean 'no specific value.'",
          "Quartz (Java) uses 6 or 7 fields (seconds, minute, hour, day, month, day-of-week, optional year).",
          "Kubernetes CronJob and standard Unix cron use the 5-field format described above.",
          "GitHub Actions uses 5-field POSIX cron in UTC. There is no way to specify a local timezone.",
        ],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["cron-expression-generator"],
    lastReviewed: "2026-08-03",
  },

  {
    slug: "common-json-formatting-errors",
    title: "Common JSON Errors and How to Fix Them",
    description: "Every JSON parse error you're going to hit — trailing commas, wrong quote marks, unescaped strings, precision loss — with the exact fix.",
    intro:
      "JSON has a small spec but a big habit of failing in confusing ways because most parsers stop at the first byte that violates the grammar and give you a cryptic offset. This guide walks through the failures people actually run into, what the error message really means, and how to fix each one.",
    sections: [
      {
        heading: "Trailing commas",
        paragraphs: [
          "JSON does not allow a comma before a closing } or ]. This is the number-one JSON error because JavaScript object literals DO allow trailing commas, and copy-pasting between the two lands you in trouble.",
        ],
        code: {
          language: "json",
          body:
            "// broken\n{\"a\": 1, \"b\": 2,}\n\n" +
            "// fixed\n{\"a\": 1, \"b\": 2}",
        },
      },
      {
        heading: "Single quotes instead of double quotes",
        paragraphs: [
          "JSON keys and string values must be double-quoted. Single quotes are JavaScript syntax. If your source is a JavaScript object literal from browser dev tools, you'll need to rewrite the quotes.",
        ],
        code: {
          language: "json",
          body:
            "// broken\n{'name': 'Ada'}\n\n" +
            "// fixed\n{\"name\": \"Ada\"}",
        },
      },
      {
        heading: "Unquoted keys",
        paragraphs: [
          "Same JavaScript-vs-JSON trap. Keys must always be double-quoted strings in JSON.",
        ],
        code: {
          language: "json",
          body:
            "// broken\n{name: \"Ada\"}\n\n" +
            "// fixed\n{\"name\": \"Ada\"}",
        },
      },
      {
        heading: "Unescaped characters in strings",
        paragraphs: [
          "Inside a JSON string, you must escape: double quote (\\\"), backslash (\\\\), newline (\\n), carriage return (\\r), tab (\\t), and forward slash (\\/, optional but sometimes needed).",
        ],
        code: {
          language: "json",
          body:
            "// broken — literal newline in the string\n{\"note\": \"line one\nline two\"}\n\n" +
            "// fixed\n{\"note\": \"line one\\nline two\"}",
        },
      },
      {
        heading: "Smart quotes",
        paragraphs: [
          "Text pasted from Google Docs, Word, or macOS Notes may contain typographic quotes (\u201c\u201d) instead of straight quotes (\"). JSON parsers don't recognize them. Sanitize with a find-and-replace before parsing.",
        ],
      },
      {
        heading: "Number precision",
        paragraphs: [
          "JSON numbers are IEEE 754 doubles. Integers larger than 2^53 (9,007,199,254,740,992) silently lose precision. This bites you with 64-bit database IDs, Twitter snowflake IDs, and financial values in cents.",
          "The fix is to send large numbers as strings from the server and parse them into a big-int on the client if you need arithmetic.",
        ],
        code: {
          language: "json",
          body:
            "// silent precision loss on the client\n{\"tweetId\": 1234567890123456789}\n\n" +
            "// safe\n{\"tweetId\": \"1234567890123456789\"}",
        },
      },
      {
        heading: "\"Unexpected token in JSON at position N\"",
        paragraphs: [
          "The N is a byte offset from the start of the input. Look at that exact byte. Usually one of: trailing comma, smart quote, unescaped newline in a string, or a stray BOM at position 0 (which happens when a UTF-8 file was saved with a byte-order mark).",
        ],
      },
      {
        heading: "NDJSON vs JSON",
        paragraphs: [
          "Some APIs return newline-delimited JSON (one JSON value per line, no wrapping array). A standard JSON.parse call on the whole payload will fail. Split on newlines and parse each line separately, or use a streaming parser.",
        ],
      },
      {
        heading: "JSON5, JSONC, and other supersets",
        paragraphs: [
          "JSON5 (Mozilla's spec) and JSONC (VS Code's) allow comments, trailing commas, and single-quoted strings. They are NOT vanilla JSON — a standard JSON parser will reject them. If a colleague swears their JSON is valid but yours won't parse it, check whether they're using a superset.",
        ],
      },
    ],
    relatedGuideSlugs: ["regex-cheat-sheet"],
    relatedToolSlugs: ["json-formatter"],
    lastReviewed: "2026-08-03",
  },

  {
    slug: "canonical-tag-vs-301-redirect",
    title: "Canonical Tag vs 301 Redirect: When to Use Which",
    description: "Canonical tags and 301 redirects both handle duplicate URLs but do different jobs. This is the practical rule for picking the right one.",
    intro:
      "Both tools consolidate signals from multiple URLs to a single preferred URL. The difference: a 301 redirect physically moves the user (and Googlebot) to the new URL; a canonical tag lets both URLs stay reachable while telling search engines which one is the master. Picking the wrong one loses traffic or loses control of your site.",
    sections: [
      {
        heading: "The one-line rule",
        paragraphs: [
          "If both URLs should keep serving content (session-tracking params, filter variants, mobile vs desktop with the same content), use a canonical tag. If the old URL is dead or moved for good (site migration, URL rewrite, brand rename), use a 301 redirect.",
        ],
      },
      {
        heading: "301 redirect",
        paragraphs: [
          "A 301 is an HTTP response that says 'this URL moved permanently; go to the Location header instead.' The user's browser follows it, the URL bar updates, and Googlebot treats the new URL as the canonical one for ranking purposes.",
          "Use when: you renamed a page, restructured a site, consolidated two pages into one, migrated to a new domain, switched to HTTPS, or standardized on www vs apex.",
        ],
        code: {
          language: "http",
          body:
            "GET /old-post HTTP/1.1\n\n" +
            "HTTP/1.1 301 Moved Permanently\nLocation: https://example.com/new-post",
        },
      },
      {
        heading: "Canonical tag",
        paragraphs: [
          "A canonical tag is an HTML link element (or HTTP header) that says 'the preferred version of this page is over here.' The browser still shows the current URL; only search engines act on the hint.",
          "Use when: you have session or tracking parameters (?utm_source=…), filter/sort variants of a list, printable versions of a page, syndicated content republished elsewhere, or paginated content where each page needs to stay reachable but you want signals to consolidate.",
        ],
        code: {
          language: "html",
          body: '<link rel="canonical" href="https://example.com/post" />',
        },
      },
      {
        heading: "What NOT to do",
        bullets: [
          "Don't 301-redirect a page that users actually reach for a reason (like tracking-parameter URLs — you'd break the tracking).",
          "Don't canonical two pages to each other. Only ever canonical to a page that self-canonicals (i.e. points at itself).",
          "Don't canonical to a URL that redirects. Google follows one hop then gives up; you'll waste crawl budget and lose the signal.",
          "Don't canonical across different content. If page A and page B have substantially different content, Google may ignore the canonical hint entirely.",
          "Don't rely on canonical to keep low-quality pages out of the index — use noindex for that. Canonical is a consolidation hint, not a removal directive.",
        ],
      },
      {
        heading: "Fixing a canonical/301 mismatch",
        paragraphs: [
          "The most common issue: your site canonicals point to xfree.in but the server 301-redirects xfree.in to www.xfree.in. Every crawl becomes: hit canonical URL (xfree.in) → 301 → fetch www.xfree.in → notice canonical says xfree.in → back to start. Fix by making canonicals point to the redirect target (www.xfree.in) from the source of truth.",
        ],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: [],
    lastReviewed: "2026-08-03",
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
