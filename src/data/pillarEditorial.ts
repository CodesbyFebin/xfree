/**
 * Editorial pillar content for all 60 XFree pillars.
 * Each entry includes: direct answer, purpose and audience,
 * practical use cases, how processing works, supported inputs
 * and outputs, local/cloud boundary, known limitations,
 * troubleshooting, editorial FAQ, and related-pillar cross-links.
 * No fabricated reviews, counts, "time saved", or tool outputs.
 */

import type { PillarDefinition } from "./pillarRegistry";

export interface PillarFaqEntry {
  question: string;
  answer: string;
}

export interface PillarEditorialContent {
  pillarSlug: string;
  directAnswer: string;
  purposeAndAudience: string;
  useCases: ReadonlyArray<{ title: string; description: string }>;
  howProcessingWorks: string;
  supportedInputs: ReadonlyArray<string>;
  supportedOutputs: ReadonlyArray<string>;
  localCloudBoundary: string;
  knownLimitations: ReadonlyArray<string>;
  troubleshooting: ReadonlyArray<{ issue: string; resolution: string }>;
  faq: ReadonlyArray<PillarFaqEntry>;
  relatedPillarSlugs: ReadonlyArray<string>;
  lastReviewed: string;
}

const REVIEWED = "2026-09-05";

export const PILLAR_EDITORIAL: Record<string, PillarEditorialContent> = {
  "dev-tools": {
    pillarSlug: "dev-tools",
    directAnswer: "XFree Developer Tools is a collection of browser-based utilities for working with structured data: formatting, validation, diff, conversion, and inspection of JSON, XML, YAML, regex patterns, cron expressions, JWTs, and SQL. Each tool runs locally in the browser by default.",
    purposeAndAudience: "This pillar serves software developers, DevOps engineers, and technical founders who need quick, private utilities without leaving their browser. It is not a code editor or IDE replacement — it is a set of focused, single-purpose tools for the moments when you need to inspect or transform data fast.",
    useCases: [
      { title: "Debugging an API response", description: "Paste a JSON payload to format and inspect its structure without leaving the browser or trusting an external formatter with your data." },
      { title: "Validating a cron expression", description: "Confirm what a cron string actually means before pasting it into a scheduler or CI workflow." },
      { title: "Comparing two configuration files", description: "Diff two JSON or YAML files to find exactly what changed between environments." },
      { title: "Inspecting a JWT", description: "Decode a token's header and payload to verify issuer, audience, and expiry without sending it to a third party." },
    ],
    howProcessingWorks: "All tools in this pillar run client-side using JavaScript. Input is parsed in the browser, transformed according to the tool's logic, and displayed in the output panel. No server round-trip is required for core utilities. When Cloud Mode is enabled, AI-powered tools may send input to the selected provider with explicit consent.",
    supportedInputs: ["JSON documents", "XML documents", "YAML documents", "Regular expression patterns", "Cron expression strings", "JWT tokens", "SQL queries", "Plain text"],
    supportedOutputs: ["Formatted JSON", "Minified JSON", "Syntax-highlighted code", "Match results", "Human-readable cron descriptions", "Decoded JWT claims", "Formatted SQL", "Diff output"],
    localCloudBoundary: "Local Mode is the default. All deterministic tools (formatters, validators, converters) run entirely in the browser. AI-powered tools (regex explanation, SQL generation, commit message generation) require explicit Cloud Mode opt-in and send only the user's input to the selected provider.",
    knownLimitations: [
      "File size is limited by browser memory — typically 50-200 MB for JSON tools",
      "Cron expressions follow the standard 5-field or 6-field format",
      "SQL formatting is syntax-aware but does not execute queries",
      "JWT decoding does not verify signatures — it only reads structure",
    ],
    troubleshooting: [
      { issue: "Tool returns an error on valid input", resolution: "Check for trailing commas in JSON, unsupported YAML features, or invalid regex syntax. Copy the error message and check the FAQ for common patterns." },
      { issue: "Large file causes browser slowdown", resolution: "Split the input into smaller chunks. Use the batch processing tool for bulk operations." },
      { issue: "Output does not match expectations", resolution: "Verify the input format matches the tool's documented expectations. Check the examples section for valid input samples." },
    ],
    faq: [
      { question: "Do these tools run in the browser or on a server?", answer: "Local Mode is the default. Your input is processed in the browser using JavaScript. There is no server round-trip required for the core utilities." },
      { question: "Is there a tool count I can rely on?", answer: "The exact count of verified tools is shown on the homepage. The number updates as tools pass the publication gate. Draft tools that have not been verified are not counted." },
      { question: "Can I use these tools offline?", answer: "Once the page is loaded, yes. The tools run entirely client-side. An initial internet connection is required to load the page and its assets." },
      { question: "Are my inputs stored on XFree servers?", answer: "No. In Local Mode, your input never leaves the browser. In Cloud Mode, input is sent to the selected provider only with your explicit consent." },
    ],
    relatedPillarSlugs: ["json-data-tools", "regex-tools", "encoding-tools", "schema-tools"],
    lastReviewed: REVIEWED,
  },
};