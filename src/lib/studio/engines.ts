import type { LocalEngine, StudioResult } from "./types";
import { BATCH4_LOCAL_ENGINES } from "./batch4-engines";
import { runWorker } from "./worker-client";
import {
  convertHexColor,
  convertIntegerBase,
  convertTimestamp,
  decodeHtmlEntities,
  decodeJwtWithoutVerification,
  decodeUrlComponent,
  decodeUtf8Hex,
  deduplicateLines,
  encodeUtf8Hex,
  encodeHtmlEntities,
  encodeUrlComponent,
  formatJson,
  generateSecurePasswords,
  extractEmailCandidates,
  extractHttpUrls,
  inspectUnicodeCodePoints,
  applyRot13,
  minifyJson,
  parseQueryString,
  normalizeWhitespace,
  removeEmptyLines,
  reverseLines,
  slugifyText,
  sortJsonKeys,
  sortLines,
} from "./local-engine-functions";

const output = (engineId: string, title: string, content: string, extension = "txt", mimeType = "text/plain"): Omit<StudioResult, "id" | "createdAt" | "processing"> => ({ engineId, title, content, extension, mimeType });
const utf8ToBase64 = (value: string) => btoa(String.fromCharCode(...new TextEncoder().encode(value)));
const base64ToUtf8 = (value: string) => new TextDecoder().decode(Uint8Array.from(atob(value.trim()), (char) => char.charCodeAt(0)));

export const LOCAL_ENGINES: LocalEngine[] = [
  { id: "json-to-csv", name: "JSON → CSV", description: "Convert objects to consistently quoted CSV.", keywords: ["json", "csv", "convert"], placeholder: "Paste a JSON object or array…", run: async (input) => output("json-to-csv", "CSV result", await runWorker("json-to-csv", input), "csv", "text/csv") },
  { id: "csv-to-json", name: "CSV → JSON", description: "Parse quoted CSV into structured JSON.", keywords: ["csv", "json", "parse"], placeholder: "Paste CSV with a header row…", run: async (input) => output("csv-to-json", "JSON result", await runWorker("csv-to-json", input), "json", "application/json") },
  { id: "base64-encode", name: "Base64 Encode", description: "Encode UTF-8 text locally.", keywords: ["base64", "encode"], placeholder: "Paste text to encode…", run: async (input) => output("base64-encode", "Base64 result", utf8ToBase64(input)) },
  { id: "base64-decode", name: "Base64 Decode", description: "Decode Base64 to UTF-8.", keywords: ["base64", "decode"], placeholder: "Paste Base64 to decode…", run: async (input) => output("base64-decode", "Decoded text", base64ToUtf8(input)) },
  { id: "sha256", name: "SHA-256 Hash", description: "Generate a SHA-256 digest in a worker.", keywords: ["hash", "sha", "sha256", "digest"], placeholder: "Paste content to hash…", run: async (input) => output("sha256", "SHA-256 digest", await runWorker("hash", input, "SHA-256")) },
  { id: "uuid", name: "UUID Generator", description: "Generate RFC 4122 UUIDs locally.", keywords: ["uuid", "guid", "generate"], placeholder: "Optionally enter how many UUIDs (1–100)…", run: async (input) => { const count = Math.min(100, Math.max(1, Number.parseInt(input, 10) || 1)); return output("uuid", `${count} UUID${count === 1 ? "" : "s"}`, Array.from({ length: count }, () => crypto.randomUUID()).join("\n")); } },
  { id: "case-converter", name: "Case + Word Tools", description: "Normalize case and count text.", keywords: ["case", "uppercase", "lowercase", "word", "count"], placeholder: "Paste text and mention upper, lower, title, or count…", run: async (input, command) => { const words = input.trim() ? input.trim().split(/\s+/).length : 0; const mode = command.toLowerCase(); const content = mode.includes("upper") ? input.toUpperCase() : mode.includes("lower") ? input.toLowerCase() : mode.includes("title") ? input.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : `${input}\n\nWords: ${words} · Characters: ${input.length}`; return output("case-converter", "Text result", content); } },
  { id: "regex", name: "Regex Tester", description: "Test JavaScript regular expressions locally.", keywords: ["regex", "regexp", "match"], placeholder: "Enter /pattern/flags on line one, then test text…", run: async (input) => { const [expression, ...body] = input.split("\n"); const match = expression.match(/^\/(.*)\/([dgimsuvy]*)$/); if (!match) throw new Error("First line must use /pattern/flags format."); const regex = new RegExp(match[1], match[2].includes("g") ? match[2] : `${match[2]}g`); const matches = [...body.join("\n").matchAll(regex)].map((item) => ({ match: item[0], index: item.index, groups: item.groups ?? {} })); return output("regex", `${matches.length} regex match${matches.length === 1 ? "" : "es"}`, JSON.stringify(matches, null, 2), "json", "application/json"); } },
  { id: "url-encode", name: "URL Encode", description: "Percent-encode text as a URL component.", keywords: ["url", "uri", "percent", "encode"], placeholder: "Paste text or a URL component to encode…", run: async (input) => output("url-encode", "Encoded URL component", encodeUrlComponent(input)) },
  { id: "url-decode", name: "URL Decode", description: "Decode percent-encoded URL text.", keywords: ["url", "uri", "percent", "decode"], placeholder: "Paste percent-encoded text to decode…", run: async (input) => output("url-decode", "Decoded URL component", decodeUrlComponent(input)) },
  { id: "jwt-decode", name: "JWT Decode (Unverified)", description: "Inspect JWT sections without verifying the signature.", keywords: ["jwt", "token", "decode", "inspect"], placeholder: "Paste a three-part JWT…", run: async (input) => output("jwt-decode", "Decoded JWT — signature not verified", decodeJwtWithoutVerification(input), "json", "application/json") },
  { id: "password-generator", name: "Secure Password Generator", description: "Generate passwords with unbiased Web Crypto sampling.", keywords: ["password", "credential", "secure", "generate"], placeholder: "Enter length and optional count, for example: 24 5", run: async (input) => output("password-generator", "Generated passwords", generateSecurePasswords(input)) },
  { id: "color-converter", name: "HEX Color Converter", description: "Convert HEX colors to RGB and HSL.", keywords: ["color", "hex", "rgb", "hsl", "convert"], placeholder: "Enter a HEX color such as #0ea5e9…", run: async (input) => output("color-converter", "Converted color", convertHexColor(input), "json", "application/json") },
  { id: "json-format", name: "JSON Formatter", description: "Parse and indent valid JSON with two spaces.", keywords: ["json", "format", "beautify", "pretty"], placeholder: "Paste valid JSON to format…", run: async (input) => output("json-format", "Formatted JSON", formatJson(input), "json", "application/json") },
  { id: "json-minify", name: "JSON Minifier", description: "Remove insignificant JSON whitespace by parsing and serializing.", keywords: ["json", "minify", "compact"], placeholder: "Paste valid JSON to minify…", run: async (input) => output("json-minify", "Minified JSON", minifyJson(input), "json", "application/json") },
  { id: "json-sort-keys", name: "JSON Key Sorter", description: "Sort object keys recursively while preserving array order.", keywords: ["json", "sort", "keys", "canonical"], placeholder: "Paste valid JSON with object keys to sort…", run: async (input) => output("json-sort-keys", "Key-sorted JSON", sortJsonKeys(input), "json", "application/json") },
  { id: "html-encode", name: "HTML Entity Encoder", description: "Escape five HTML-significant characters.", keywords: ["html", "entity", "escape", "encode"], placeholder: "Paste text containing &, <, >, quotes, or apostrophes…", run: async (input) => output("html-encode", "HTML-encoded text", encodeHtmlEntities(input)) },
  { id: "html-decode", name: "HTML Entity Decoder", description: "Decode common named and numeric HTML entities.", keywords: ["html", "entity", "unescape", "decode"], placeholder: "Paste common named or numeric HTML entities…", run: async (input) => output("html-decode", "HTML-decoded text", decodeHtmlEntities(input)) },
  { id: "slugify", name: "Text Slugifier", description: "Create a lowercase ASCII hyphenated slug.", keywords: ["slug", "slugify", "url", "text"], placeholder: "Paste a title to convert into a slug…", run: async (input) => output("slugify", "Generated slug", slugifyText(input)) },
  { id: "line-dedupe", name: "Line Deduplicator", description: "Remove exact duplicate lines while preserving first occurrence order.", keywords: ["line", "dedupe", "duplicate", "unique"], placeholder: "Paste lines to deduplicate…", run: async (input) => output("line-dedupe", "Deduplicated lines", deduplicateLines(input)) },
  { id: "line-sort", name: "Line Sorter", description: "Sort lines with the browser locale comparator.", keywords: ["line", "sort", "alphabetical", "order"], placeholder: "Paste lines to sort…", run: async (input) => output("line-sort", "Sorted lines", sortLines(input)) },
  { id: "query-parse", name: "Query String Parser", description: "Parse URL query parameters and preserve repeated keys.", keywords: ["query", "url", "parameter", "parse"], placeholder: "Paste a query string or URL containing ?parameters…", run: async (input) => output("query-parse", "Parsed query parameters", parseQueryString(input), "json", "application/json") },
  { id: "timestamp-convert", name: "Timestamp Converter", description: "Convert Unix seconds, milliseconds, or ISO date-time input.", keywords: ["timestamp", "unix", "epoch", "date", "time"], placeholder: "Enter Unix seconds, milliseconds, or an ISO date-time…", run: async (input) => output("timestamp-convert", "Converted timestamp", convertTimestamp(input), "json", "application/json") },
  { id: "hex-encode", name: "UTF-8 HEX Encoder", description: "Encode Unicode text as lowercase UTF-8 byte pairs.", keywords: ["hex", "utf8", "encode", "bytes"], placeholder: "Paste Unicode text to encode as HEX bytes…", run: async (input) => output("hex-encode", "UTF-8 HEX", encodeUtf8Hex(input)) },
  { id: "hex-decode", name: "UTF-8 HEX Decoder", description: "Decode complete HEX byte pairs as strict UTF-8 text.", keywords: ["hex", "utf8", "decode", "bytes"], placeholder: "Paste HEX byte pairs to decode as UTF-8…", run: async (input) => output("hex-decode", "Decoded UTF-8 text", decodeUtf8Hex(input)) },
  { id: "unicode-code-points", name: "Unicode Code Point Inspector", description: "Inspect code points and UTF-16 unit counts.", keywords: ["unicode", "code", "point", "utf16", "character"], placeholder: "Paste Unicode text to inspect…", run: async (input) => output("unicode-code-points", "Unicode code points", inspectUnicodeCodePoints(input), "json", "application/json") },
  { id: "rot13", name: "ROT13 Transformer", description: "Apply reversible ROT13 substitution to ASCII letters.", keywords: ["rot13", "rotate", "cipher", "text"], placeholder: "Paste text to transform with ROT13…", run: async (input) => output("rot13", "ROT13 result", applyRot13(input)) },
  { id: "whitespace-normalize", name: "Whitespace Normalizer", description: "Trim text and collapse whitespace runs to one space.", keywords: ["whitespace", "normalize", "space", "cleanup"], placeholder: "Paste text containing repeated whitespace…", run: async (input) => output("whitespace-normalize", "Normalized whitespace", normalizeWhitespace(input)) },
  { id: "empty-line-remove", name: "Empty Line Remover", description: "Remove blank and whitespace-only lines.", keywords: ["empty", "blank", "line", "remove"], placeholder: "Paste multiline text containing blank lines…", run: async (input) => output("empty-line-remove", "Text without empty lines", removeEmptyLines(input)) },
  { id: "line-reverse", name: "Line Order Reverser", description: "Reverse line order without reversing characters.", keywords: ["line", "reverse", "order", "flip"], placeholder: "Paste lines to reverse…", run: async (input) => output("line-reverse", "Reversed line order", reverseLines(input)) },
  { id: "email-extract", name: "Email Candidate Extractor", description: "Extract unique email-shaped strings with a practical pattern.", keywords: ["email", "extract", "address", "find"], placeholder: "Paste text containing email-shaped values…", run: async (input) => output("email-extract", "Extracted email candidates", extractEmailCandidates(input)) },
  { id: "http-url-extract", name: "HTTP URL Extractor", description: "Extract unique HTTP and HTTPS URL candidates.", keywords: ["url", "http", "https", "extract", "link"], placeholder: "Paste text containing HTTP or HTTPS URLs…", run: async (input) => output("http-url-extract", "Extracted HTTP URLs", extractHttpUrls(input)) },
  { id: "integer-base-convert", name: "Integer Base Converter", description: "Convert signed integers between bases 2 and 36 with BigInt.", keywords: ["base", "binary", "decimal", "hex", "integer", "convert"], placeholder: "Use: integer sourceBase targetBase — for example FF 16 10", run: async (input) => output("integer-base-convert", "Converted integer", convertIntegerBase(input)) },
  ...BATCH4_LOCAL_ENGINES,
];

export function resolveLocalEngine(command: string, preferred?: string): LocalEngine {
  if (preferred) { const exact = LOCAL_ENGINES.find((engine) => engine.id === preferred); if (exact) return exact; }
  const normalized = command.toLowerCase();
  return LOCAL_ENGINES.map((engine) => ({ engine, score: engine.keywords.filter((keyword) => normalized.includes(keyword)).length })).sort((a, b) => b.score - a.score)[0]?.engine ?? LOCAL_ENGINES[0];
}
