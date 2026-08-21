import type { LocalEngine, StudioResult } from "./types";
import { runWorker } from "./worker-client";

const output = (engineId: string, title: string, content: string, extension = "txt", mimeType = "text/plain"): Omit<StudioResult, "id" | "createdAt" | "processing"> => ({ engineId, title, content, extension, mimeType });
const utf8ToBase64 = (value: string) => btoa(String.fromCharCode(...new TextEncoder().encode(value)));
const base64ToUtf8 = (value: string) => new TextDecoder().decode(Uint8Array.from(atob(value.trim()), (char) => char.charCodeAt(0)));

export const LOCAL_ENGINES: LocalEngine[] = [
  { id: "json-to-csv", name: "JSON → CSV", description: "Convert objects to standards-safe CSV.", keywords: ["json", "csv", "convert"], placeholder: "Paste a JSON object or array…", run: async (input) => output("json-to-csv", "CSV result", await runWorker("json-to-csv", input), "csv", "text/csv") },
  { id: "csv-to-json", name: "CSV → JSON", description: "Parse quoted CSV into structured JSON.", keywords: ["csv", "json", "parse"], placeholder: "Paste CSV with a header row…", run: async (input) => output("csv-to-json", "JSON result", await runWorker("csv-to-json", input), "json", "application/json") },
  { id: "base64-encode", name: "Base64 Encode", description: "Encode UTF-8 text locally.", keywords: ["base64", "encode"], placeholder: "Paste text to encode…", run: async (input) => output("base64-encode", "Base64 result", utf8ToBase64(input)) },
  { id: "base64-decode", name: "Base64 Decode", description: "Decode Base64 to UTF-8.", keywords: ["base64", "decode"], placeholder: "Paste Base64 to decode…", run: async (input) => output("base64-decode", "Decoded text", base64ToUtf8(input)) },
  { id: "sha256", name: "SHA-256 Hash", description: "Generate a SHA-256 digest in a worker.", keywords: ["hash", "sha", "sha256", "digest"], placeholder: "Paste content to hash…", run: async (input) => output("sha256", "SHA-256 digest", await runWorker("hash", input, "SHA-256")) },
  { id: "uuid", name: "UUID Generator", description: "Generate RFC 4122 UUIDs locally.", keywords: ["uuid", "guid", "generate"], placeholder: "Optionally enter how many UUIDs (1–100)…", run: async (input) => { const count = Math.min(100, Math.max(1, Number.parseInt(input, 10) || 1)); return output("uuid", `${count} UUID${count === 1 ? "" : "s"}`, Array.from({ length: count }, () => crypto.randomUUID()).join("\n")); } },
  { id: "case-converter", name: "Case + Word Tools", description: "Normalize case and count text.", keywords: ["case", "uppercase", "lowercase", "word", "count"], placeholder: "Paste text and mention upper, lower, title, or count…", run: async (input, command) => { const words = input.trim() ? input.trim().split(/\s+/).length : 0; const mode = command.toLowerCase(); const content = mode.includes("upper") ? input.toUpperCase() : mode.includes("lower") ? input.toLowerCase() : mode.includes("title") ? input.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : `${input}\n\nWords: ${words} · Characters: ${input.length}`; return output("case-converter", "Text result", content); } },
  { id: "regex", name: "Regex Tester", description: "Test JavaScript regular expressions locally.", keywords: ["regex", "regexp", "match"], placeholder: "Enter /pattern/flags on line one, then test text…", run: async (input) => { const [expression, ...body] = input.split("\n"); const match = expression.match(/^\/(.*)\/([dgimsuvy]*)$/); if (!match) throw new Error("First line must use /pattern/flags format."); const regex = new RegExp(match[1], match[2].includes("g") ? match[2] : `${match[2]}g`); const matches = [...body.join("\n").matchAll(regex)].map((item) => ({ match: item[0], index: item.index, groups: item.groups ?? {} })); return output("regex", `${matches.length} regex match${matches.length === 1 ? "" : "es"}`, JSON.stringify(matches, null, 2), "json", "application/json"); } },
];

export function resolveLocalEngine(command: string, preferred?: string): LocalEngine {
  if (preferred) { const exact = LOCAL_ENGINES.find((engine) => engine.id === preferred); if (exact) return exact; }
  const normalized = command.toLowerCase();
  return LOCAL_ENGINES.map((engine) => ({ engine, score: engine.keywords.filter((keyword) => normalized.includes(keyword)).length })).sort((a, b) => b.score - a.score)[0]?.engine ?? LOCAL_ENGINES[0];
}
