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
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
