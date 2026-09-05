/**
 * Editorial pillar content for published XFree pillars.
 * Each pillar entry is limited to: a direct answer, a short
 * practical-use-cases list, an editorial FAQ, and related-pillar
 * cross-links. No fabricated reviews, counts, "time saved", or
 * tool outputs are included — those require real editorial work
 * and live tool runs.
 */

import type { PillarDefinition } from "./pillarRegistry";

export interface PillarFaqEntry {
  question: string;
  answer: string;
}

export interface PillarEditorialContent {
  pillarSlug: string;
  directAnswer: string;
  useCases: ReadonlyArray<{
    title: string;
    description: string;
  }>;
  faq: ReadonlyArray<PillarFaqEntry>;
  relatedPillarSlugs: ReadonlyArray<string>;
  lastReviewed: string;
}

const REVIEWED = "2026-09-05";

export const PILLAR_EDITORIAL: Record<string, PillarEditorialContent> = {
  "dev-tools": {
    pillarSlug: "dev-tools",
    directAnswer:
      "XFree Developer Tools is a collection of browser-based utilities for working with structured data: formatting, validation, diff, conversion, and inspection of JSON, XML, YAML, regex patterns, cron expressions, JWTs, and SQL. Each tool runs locally in the browser by default.",
    useCases: [
      {
        title: "Debugging an API response",
        description:
          "Paste a JSON payload to format and inspect its structure without leaving the browser or trusting an external formatter with your data.",
      },
      {
        title: "Validating a cron expression",
        description:
          "Confirm what a cron string actually means before pasting it into a scheduler or CI workflow.",
      },
    ],
    faq: [
      {
        question: "Do these tools run in the browser or on a server?",
        answer:
          "Local Mode is the default. Your input is processed in the browser using JavaScript. There is no server round-trip required for the core utilities.",
      },
      {
        question: "Is there a tool count I can rely on?",
        answer:
          "The exact count of verified tools is shown on the homepage. The number updates as tools pass the publication gate. Draft tools that have not been verified are not counted.",
      },
    ],
    relatedPillarSlugs: ["json-data-tools", "regex-tools", "encoding-tools"],
    lastReviewed: REVIEWED,
  },

  "json-data-tools": {
    pillarSlug: "json-data-tools",
    directAnswer:
      "XFree JSON & Data Tools focus on JSON and structured-data workflows: format, validate, convert, flatten, sort, filter, compare, deduplicate, and visualize. The pillar groups utilities that work on JSON-shaped data, including JSON Lines, JSON5-style inputs where parseable, and JSON Pointer lookups.",
    useCases: [
      {
        title: "Auditing a JSON config file",
        description:
          "Sort keys, deduplicate, or flatten a nested config in your browser to compare against a reference.",
      },
      {
        title: "Converting between JSON and CSV",
        description:
          "Move between machine and spreadsheet representations without uploading to an online converter.",
      },
    ],
    faq: [
      {
        question: "Do these tools handle JSON Lines?",
        answer:
          "Tools in this pillar work on individual JSON documents. Use the converters in the XFree Developer Tools pillar to move between JSON Lines and arrays.",
      },
      {
        question: "Are large files supported?",
        answer:
          "All processing happens in the browser tab. Practical file size depends on your device's available memory. There is no server-side processing.",
      },
    ],
    relatedPillarSlugs: ["dev-tools", "encoding-tools", "schema-tools"],
    lastReviewed: REVIEWED,
  },

  "regex-tools": {
    pillarSlug: "regex-tools",
    directAnswer:
      "XFree Regex Tools let you test, build, and explain regular expression patterns in your browser. You can experiment with matches, capture groups, and replacements against a sample string without sending the pattern to a remote service.",
    useCases: [
      {
        title: "Iterating on a log-extraction pattern",
        description:
          "Paste a sample log line, try pattern variations, and see which captures survive edge cases like empty fields.",
      },
      {
        title: "Explaining a pattern you inherited",
        description:
          "Step through group by group to see what each capture does in real input.",
      },
    ],
    faq: [
      {
        question: "Which regex flavor is used?",
        answer:
          "The browser's JavaScript RegExp engine. This is a modern PCRE-style implementation. Flags and named groups are supported as the browser supports them.",
      },
      {
        question: "Can I export the matched groups?",
        answer:
          "Yes. The output is shown in your browser and can be copied to the clipboard or saved as a file from the tool page.",
      },
    ],
    relatedPillarSlugs: ["dev-tools", "encoding-tools"],
    lastReviewed: REVIEWED,
  },

  "encoding-tools": {
    pillarSlug: "encoding-tools",
    directAnswer:
      "XFree Encoding Tools handle binary-to-text encodings, character-set conversions, and structured-token inspection. The pillar groups Base64, URL, HTML entity, Unicode, hexadecimal, and JWT decoders so the right conversion is one click away.",
    useCases: [
      {
        title: "Inspecting a JWT without exposing it",
        description:
          "Decode a JSON Web Token's header and payload in the browser to see issuer, audience, and expiry without sending the token to a third party.",
      },
      {
        title: "Round-tripping a string through Base64",
        description:
          "Encode or decode UTF-8 text with Base64 to test a transport that requires a binary-safe representation.",
      },
    ],
    faq: [
      {
        question: "Does the Base64 encoder preserve UTF-8?",
        answer:
          "Yes. The encoder uses the standard UTF-8 → Base64 path, so multi-byte characters such as emoji round-trip correctly.",
      },
      {
        question: "Are JWT signatures verified?",
        answer:
          "No. The decoder inspects the token structure and shows the claims. Verifying signatures requires the signing key, which is not available client-side without explicit user input.",
      },
    ],
    relatedPillarSlugs: ["security-tools", "token-tools", "regex-tools"],
    lastReviewed: REVIEWED,
  },

  "seo-tools": {
    pillarSlug: "seo-tools",
    directAnswer:
      "XFree SEO Tools cover the technical-SEO work that happens before publishing: metadata, canonical tags, sitemaps, robots.txt, schema markup, and redirect inspection. The pillar is for the publishing-and-indexing side of SEO, not the analytics or back-link side.",
    useCases: [
      {
        title: "Generating a meta title and description preview",
        description:
          "See how your title and description render at the Google pixel limit before pushing a change to production.",
      },
      {
        title: "Producing a valid robots.txt",
        description:
          "Compose a robots.txt that matches the canonical structure and includes sitemap declaration.",
      },
    ],
    faq: [
      {
        question: "Do these tools check live SERPs?",
        answer:
          "No. SERP analytics require a search console connection and are not part of this pillar. The tools here generate and validate SEO assets client-side.",
      },
      {
        question: "Will the generated schema pass Google's Rich Results test?",
        answer:
          "The generator produces valid JSON-LD. Whether a particular page qualifies for a rich result depends on the structured data policy for that result type, which Google maintains separately.",
      },
    ],
    relatedPillarSlugs: ["metadata-tools", "schema-tools", "crawl-indexing-tools", "url-tools"],
    lastReviewed: REVIEWED,
  },

  "url-tools": {
    pillarSlug: "url-tools",
    directAnswer:
      "XFree URL Tools cover URL parsing, slug generation, UTM parameter handling, and bulk URL extraction. The pillar is the home of utilities that work on URL-shaped strings rather than HTML or markup.",
    useCases: [
      {
        title: "Building a campaign URL",
        description:
          "Compose utm_source, utm_medium, and utm_campaign into a clean URL and verify the result still passes the original destination.",
      },
      {
        title: "Extracting URLs from a document",
        description:
          "Pull every URL out of a piece of HTML or text, deduplicate, and export the list.",
      },
    ],
    faq: [
      {
        question: "How is a slug generated?",
        answer:
          "The slugifier lowercases, removes diacritics, replaces non-alphanumeric runs with a hyphen, and trims leading and trailing hyphens.",
      },
      {
        question: "Are reserved URL characters escaped?",
        answer:
          "Yes. The slugifier is RFC 3986 path-safe; the URL builder percent-encodes parameters and preserves the original query string when present.",
      },
    ],
    relatedPillarSlugs: ["seo-tools", "marketing-tools", "crawl-indexing-tools"],
    lastReviewed: REVIEWED,
  },

  "schema-tools": {
    pillarSlug: "schema-tools",
    directAnswer:
      "XFree Schema Tools generate, validate, and preview JSON-LD structured data. The pillar supports the most common schema.org types (Article, Product, Organization, FAQPage, HowTo, BreadcrumbList) and emits the markup you can paste into a page.",
    useCases: [
      {
        title: "Producing Article schema for a blog post",
        description:
          "Generate the JSON-LD for an Article, fill in the values, and copy the result into your page template.",
      },
      {
        title: "Validating existing schema",
        description:
          "The validator checks for required properties, recommended properties, and obvious type mismatches.",
      },
    ],
    faq: [
      {
        question: "Which schema.org types are supported?",
        answer:
          "The generator covers the high-frequency types: Article, BlogPosting, Product, Organization, FAQPage, HowTo, BreadcrumbList, and a few specialized types. Unsupported types return a clear error rather than silent truncation.",
      },
      {
        question: "Does the tool validate against schema.org?",
        answer:
          "It performs structural validation. Schema.org's full validator runs the official SHACL-based suite and is the source of truth for edge cases.",
      },
    ],
    relatedPillarSlugs: ["seo-tools", "metadata-tools", "dev-tools"],
    lastReviewed: REVIEWED,
  },

  "crawl-indexing-tools": {
    pillarSlug: "crawl-indexing-tools",
    directAnswer:
      "XFree Crawl & Indexing Tools generate XML sitemaps, robots.txt directives, and redirect inspection reports. The pillar covers the discovery and indexing artifacts a crawler reads, not the crawler itself.",
    useCases: [
      {
        title: "Producing an XML sitemap from a URL list",
        description:
          "Paste URLs, set priority and changefreq per group, and emit a standards-compliant XML sitemap.",
      },
      {
        title: "Auditing robots.txt for production",
        description:
          "Check the rules against a URL pattern to see which crawlers will be allowed or blocked.",
      },
    ],
    faq: [
      {
        question: "Does the tool generate a sitemap index file?",
        answer:
          "Yes. If the URL list exceeds the per-file limit, a sitemap index is emitted alongside the page sitemaps.",
      },
      {
        question: "Will this affect my production indexing?",
        answer:
          "No. Sitemaps only describe URLs you want crawled. They do not force inclusion, and they are advisory for modern search engines that crawl the open web.",
      },
    ],
    relatedPillarSlugs: ["seo-tools", "url-tools", "metadata-tools"],
    lastReviewed: REVIEWED,
  },

  "metadata-tools": {
    pillarSlug: "metadata-tools",
    directAnswer:
      "XFree Metadata Tools generate the metadata that ships in a page head: title, meta description, canonical link, Open Graph, and Twitter Card markup. The pillar focuses on the artifacts a publisher or CMS can paste into a template.",
    useCases: [
      {
        title: "Producing a meta description that fits",
        description:
          "The previewer shows the rendered length against the typical 155-160 character search-result snippet limit.",
      },
      {
        title: "Building an Open Graph block",
        description:
          "Compose the og:title, og:description, og:image, and og:type for a shareable URL.",
      },
    ],
    faq: [
      {
        question: "What happens if my title is too long?",
        answer:
          "The previewer shows the truncated snippet. Truncation rules vary by surface; the tool does not silently rewrite the title.",
      },
      {
        question: "Does this tool generate the canonical link automatically?",
        answer:
          "No. The canonical is a per-page decision and must be set by the publisher. The tool shows the recommended URL and accepts a manual override.",
      },
    ],
    relatedPillarSlugs: ["seo-tools", "schema-tools", "crawl-indexing-tools"],
    lastReviewed: REVIEWED,
  },

  "security-tools": {
    pillarSlug: "security-tools",
    directAnswer:
      "XFree Security Tools group browser-based utilities for inspecting security artifacts: hashing, password generation, JWT decoding, and security-header evaluation. The pillar focuses on inspection and generation in the browser; it does not perform remote security scanning.",
    useCases: [
      {
        title: "Reviewing response headers",
        description:
          "Paste a headers block or a URL to see the resulting Content-Security-Policy, HSTS, X-Frame-Options, and Permissions-Policy surface.",
      },
      {
        title: "Generating a strong password",
        description:
          "Use a cryptographically strong random source to produce a password of a chosen length and character set.",
      },
    ],
    faq: [
      {
        question: "Do these tools make network requests?",
        answer:
          "Local Mode is the default. URL-based header inspection is the single exception and is clearly disclosed before any request is made.",
      },
      {
        question: "Are passwords stored?",
        answer:
          "No. Password generation runs entirely in the browser. The output is provided to the user only and is not transmitted to any server.",
      },
    ],
    relatedPillarSlugs: ["token-tools", "encoding-tools", "dev-tools"],
    lastReviewed: REVIEWED,
  },

  "token-tools": {
    pillarSlug: "token-tools",
    directAnswer:
      "XFree Token Tools inspect JSON Web Tokens: decode the header and payload, list registered claims, and surface expiry information. The pillar does not sign or verify tokens; it only reads their content.",
    useCases: [
      {
        title: "Confirming a token's expiry",
        description:
          "Decode a token, find the exp claim, and compare to the current time before sending the token to a service.",
      },
      {
        title: "Auditing registered claims",
        description:
          "List every claim in a token's payload to confirm the issuer is sending only the data your service expects.",
      },
    ],
    faq: [
      {
        question: "Is the signing key needed?",
        answer:
          "No for decoding. The decoder only needs the token itself. Verification requires the signing key, which is not requested or accepted by the decoder.",
      },
      {
        question: "Are JWE (encrypted) tokens supported?",
        answer:
          "Not in the current build. The decoder handles JWS-structured tokens, which is the common form for OAuth and OIDC access tokens.",
      },
    ],
    relatedPillarSlugs: ["security-tools", "encoding-tools", "dev-tools"],
    lastReviewed: REVIEWED,
  },

  "marketing-tools": {
    pillarSlug: "marketing-tools",
    directAnswer:
      "XFree Marketing Tools compose campaign URLs and short-link assets. The pillar focuses on the URL and identifier side of marketing, not on analytics or audience segmentation.",
    useCases: [
      {
        title: "Building a campaign URL with UTM tags",
        description:
          "Compose utm_source, utm_medium, and utm_campaign plus optional utm_term and utm_content into a single clean URL.",
      },
      {
        title: "Generating a marketing slug",
        description:
          "Produce a path slug that is short, lower-case, and stable enough for a long-running campaign.",
      },
    ],
    faq: [
      {
        question: "Do the generated URLs preserve existing query parameters?",
        answer:
          "Yes. The builder appends UTM parameters to any existing query string without dropping what is already there.",
      },
      {
        question: "Are campaign names normalized?",
        answer:
          "Yes. The builder lower-cases and trims campaign values, and replaces internal whitespace with an underscore, which is the common convention.",
      },
    ],
    relatedPillarSlugs: ["url-tools", "seo-tools", "dev-tools"],
    lastReviewed: REVIEWED,
  },
};

export function getPillarEditorial(slug: string): PillarEditorialContent | undefined {
  return PILLAR_EDITORIAL[slug];
}

export function getRelatedPillars(
  pillar: PillarDefinition,
  allPillars: ReadonlyArray<PillarDefinition>,
): ReadonlyArray<PillarDefinition> {
  const editorial = PILLAR_EDITORIAL[pillar.slug];
  if (!editorial) return [];
  const bySlug = new Map<string, PillarDefinition>();
  for (const def of allPillars) bySlug.set(def.slug, def);
  const out: PillarDefinition[] = [];
  for (const slug of editorial.relatedPillarSlugs) {
    const def = bySlug.get(slug);
    if (def) out.push(def);
  }
  return out;
}

export const PILLAR_EDITORIAL_LAST_REVIEWED = REVIEWED;
