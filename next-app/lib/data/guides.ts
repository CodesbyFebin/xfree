export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: { language?: string; body: string };
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
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
    description: "A short regex cheat sheet covering the character classes, quantifiers, anchors, groups, and flags you'll use 90% of the time.",
    intro: "Regex references online tend to list every arcane feature. This one lists the parts you actually reach for: extracting things, redacting things, splitting things, validating things.",
    sections: [
      {
        heading: "Character classes",
        paragraphs: ["Match a set of characters at one position."],
        code: {
          language: "regex",
          body: "\\d        one digit (0-9)\n\\D        one non-digit\n\\w        one word char [A-Za-z0-9_]\n\\W        one non-word char\n\\s        one whitespace char\n.         any char except newline\n[abc]     literally a, b, or c\n[^abc]    anything except a, b, or c\n[a-z]     range a through z",
        },
      },
      {
        heading: "Quantifiers",
        paragraphs: ["Repeat the previous atom."],
        code: {
          language: "regex",
          body: "*         zero or more\n+         one or more\n?         zero or one\n{3}       exactly 3\n{3,}      3 or more\n{3,7}     between 3 and 7",
        },
      },
      {
        heading: "Anchors and boundaries",
        code: {
          language: "regex",
          body: "^         start of string\n$         end of string\n\\b        word boundary\n\\B        NOT a word boundary",
        },
      },
      {
        heading: "Groups and captures",
        code: {
          language: "regex",
          body: "(abc)             capturing group\n(?:abc)           non-capturing group\n(?<name>abc)      named capture\n(?=abc)           positive lookahead\n(?!abc)           negative lookahead",
        },
      },
      {
        heading: "Flags",
        code: {
          language: "regex",
          body: "g   global - return ALL matches\ni   case-insensitive\nm   multiline\ns   dotall - . matches newlines\nu   unicode support",
        },
      },
      {
        heading: "Patterns you'll actually use",
        code: {
          language: "regex",
          body: "// Extract URLs\nhttps?://[^\\s\"'<>]+\n\n// Loose email\na-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\n\n// ISO date\n(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
        },
      },
    ],
    relatedToolSlugs: ["regex-tester"],
    lastReviewed: "2026-08-03",
  },
  {
    slug: "cron-expression-examples",
    title: "Cron Expression Examples: 20 Real Schedules Explained",
    description: "Ready-to-use cron expressions for common jobs with what each field means.",
    intro: "Cron syntax is compact and unforgiving. This is a list of expressions people actually deploy, with the intent stated plainly.",
    sections: [
      {
        heading: "The five fields",
        paragraphs: ["Standard Unix cron is five space-separated fields: minute, hour, day of month, month, day of week."],
        code: {
          language: "text",
          body: "* * * * *  command\n| | | | |\n| | | | +--- day of week (0-6)\n| | | +----- month (1-12)\n| | +------- day of month (1-31)\n| +--------- hour (0-23)\n+ ----------- minute (0-59)",
        },
      },
      {
        heading: "Common schedules",
        code: {
          language: "text",
          body: "*/5 * * * *         every 5 minutes\n0 * * * *           every hour\n0 9 * * *           9am every day\n0 9 * * 1-5         9am weekdays\n*/15 9-17 * * 1-5   every 15 min, 9am-5pm weekdays\n0 0 1 * *           midnight on the 1st",
        },
      },
    ],
    relatedToolSlugs: ["cron-generator"],
    lastReviewed: "2026-08-03",
  },
  {
    slug: "common-json-formatting-errors",
    title: "Common JSON Errors and How to Fix Them",
    description: "Every JSON parse error with the exact fix.",
    intro: "JSON has a small spec but a big habit of failing in confusing ways. This guide walks through the failures people actually run into.",
    sections: [
      {
        heading: "Trailing commas",
        paragraphs: ["JSON does not allow a comma before a closing } or ]. This is the number-one JSON error."],
        code: {
          language: "json",
          body: "// broken\n{\"a\": 1, \"b\": 2,}\n\n// fixed\n{\"a\": 1, \"b\": 2}",
        },
      },
      {
        heading: "Single quotes instead of double quotes",
        paragraphs: ["JSON keys and string values must be double-quoted. Single quotes are JavaScript syntax."],
        code: {
          language: "json",
          body: "// broken\n{'name': 'Ada'}\n\n// fixed\n{\"name\": \"Ada\"}",
        },
      },
      {
        heading: "Number precision",
        paragraphs: ["JSON numbers are IEEE 754 doubles. Integers larger than 2^53 silently lose precision."],
        code: {
          language: "json",
          body: "// safe\n{\"tweetId\": \"1234567890123456789\"}",
        },
      },
    ],
    relatedToolSlugs: ["json-formatter"],
    lastReviewed: "2026-08-03",
  },
  {
    slug: "canonical-tag-vs-301-redirect",
    title: "Canonical Tag vs 301 Redirect: When to Use Which",
    description: "Canonical tags and 301 redirects both handle duplicate URLs but do different jobs.",
    intro: "Both tools consolidate signals from multiple URLs to a single preferred URL. Picking the wrong one loses traffic or loses control.",
    sections: [
      {
        heading: "The one-line rule",
        paragraphs: ["If both URLs should keep serving content, use a canonical tag. If the old URL is dead or moved for good, use a 301 redirect."],
      },
      {
        heading: "301 redirect",
        paragraphs: ["A 301 is an HTTP response that says 'this URL moved permanently.' Use when: renamed a page, restructured a site, migrated to new domain."],
      },
      {
        heading: "Canonical tag",
        paragraphs: ["A canonical tag is an HTML link element that says 'the preferred version of this page is over here.' Use for: tracking params, filter variants, paginated content."],
      },
    ],
    relatedToolSlugs: [],
    lastReviewed: "2026-08-03",
  },
  {
    slug: "json-best-practices",
    title: "JSON Best Practices for APIs",
    description: "Best practices for designing and consuming JSON APIs: naming conventions, error handling, versioning, and pagination.",
    intro: "JSON is the lingua franca of web APIs. These best practices will help you design cleaner, more maintainable APIs.",
    sections: [
      {
        heading: "Naming conventions",
        paragraphs: ["Use camelCase for keys. Be consistent. Avoid abbreviations."],
      },
      {
        heading: "Error handling",
        paragraphs: ["Return consistent error objects with code, message, and details fields."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["json-formatter", "json-validator"],
    lastReviewed: "2026-08-04",
  },
  {
    slug: "regex-performance",
    title: "Regex Performance Tips",
    description: "Optimize regex patterns for speed: avoid backtracking, use possessive quantifiers, and pre-compile patterns.",
    intro: "Regular expressions can be fast or catastrophic. Learn to write efficient patterns.",
    sections: [
      {
        heading: "Avoid backtracking",
        paragraphs: ["Nested quantifiers like (a+)+ can cause exponential backtracking."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["regex-tester"],
    lastReviewed: "2026-08-05",
  },
  {
    slug: "seo-checklist",
    title: "SEO Checklist for 2026",
    description: "Complete SEO checklist: meta tags, schema markup, sitemaps, Core Web Vitals, and mobile optimization.",
    intro: "Stay ahead with this comprehensive SEO checklist for modern websites.",
    sections: [
      {
        heading: "Technical SEO",
        paragraphs: ["Ensure proper indexing, crawlability, and structured data."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["meta-tag-generator", "xml-sitemap-generator"],
    lastReviewed: "2026-08-06",
  },
  {
    slug: "password-security",
    title: "Password Security Guide",
    description: "How to generate, store, and verify passwords securely using bcrypt, Argon2, and modern best practices.",
    intro: "Password security is critical. Learn the best practices for handling passwords.",
    sections: [
      {
        heading: "Hashing algorithms",
        paragraphs: ["Use bcrypt or Argon2. Never use MD5 or SHA-1 for passwords."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["password-generator", "bcrypt-hash"],
    lastReviewed: "2026-08-07",
  },
  {
    slug: "jwt-best-practices",
    title: "JWT Best Practices",
    description: "Secure JWT usage: algorithm selection, secret management, expiration, and revocation strategies.",
    intro: "JWTs are powerful but easy to misuse. Follow these best practices.",
    sections: [
      {
        heading: "Algorithm selection",
        paragraphs: ["Prefer RS256 over HS256 for public keys. Never use 'none' algorithm."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["jwt-decoder", "jwt-encoder"],
    lastReviewed: "2026-08-08",
  },
  {
    slug: "css-optimization",
    title: "CSS Optimization Techniques",
    description: "Minify, purge, and optimize CSS for faster page loads: remove unused styles, compress, and cache.",
    intro: "CSS performance matters. Learn to optimize your stylesheets.",
    sections: [
      {
        heading: "Minification",
        paragraphs: ["Remove whitespace, comments, and shorten values."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["css-minifier"],
    lastReviewed: "2026-08-09",
  },
  {
    slug: "html-minification",
    title: "HTML Minification Guide",
    description: "Reduce HTML file size by removing comments, whitespace, and optional tags without breaking layout.",
    intro: "Smaller HTML files load faster. Learn safe minification techniques.",
    sections: [
      {
        heading: "What to remove",
        paragraphs: ["Comments, extra whitespace, and optional closing tags."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["html-minifier"],
    lastReviewed: "2026-08-10",
  },
  {
    slug: "base64-guide",
    title: "Base64 Encoding Guide",
    description: "When and how to use Base64 encoding: data URIs, email attachments, and API payloads.",
    intro: "Base64 is everywhere. Understand when to use it and when not to.",
    sections: [
      {
        heading: "Use cases",
        paragraphs: ["Data URIs, email MIME, API payloads with binary data."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["base64-encode", "base64-decode"],
    lastReviewed: "2026-08-11",
  },
  {
    slug: "cron-scheduling",
    title: "Cron Scheduling Explained",
    description: "Master cron expressions: syntax, special characters, common patterns, and testing tools.",
    intro: "Cron is the standard for scheduled tasks. Master the syntax.",
    sections: [
      {
        heading: "Basic syntax",
        paragraphs: ["Five fields: minute, hour, day of month, month, day of week."],
      },
    ],
    relatedGuideSlugs: [],
    relatedToolSlugs: ["cron-generator", "cron-parser"],
    lastReviewed: "2026-08-12",
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
