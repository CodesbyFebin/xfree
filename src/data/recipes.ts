export type RecipeTransformId = "lines-to-json-array" | "classify-urls-by-first-origin";

export interface RecipeStepConfig {
  /** Run the same allowlisted engine independently for each non-empty line. */
  mapLines?: boolean;
  /** Prefix a fixed, repository-owned query line before an engine receives input. */
  prependLine?: string;
}

export interface RecipeStepDefinition {
  id: string;
  kind: "engine" | "transform";
  engineId?: string;
  transformId?: RecipeTransformId;
  label: string;
  passthrough?: boolean;
  config?: RecipeStepConfig;
}

export interface RecipeDefinition {
  id: string;
  slug: string;
  version: number;
  title: string;
  summary: string;
  description: string;
  inputLabel: string;
  inputHint: string;
  sampleInput: string;
  outputLabel: string;
  outputExtension: string;
  outputMimeType: string;
  mode: "local";
  llmRequired: false;
  tags: string[];
  steps: RecipeStepDefinition[];
  notes: string[];
}

const step = (
  id: string,
  engineId: string,
  label: string,
  options: Pick<RecipeStepDefinition, "passthrough" | "config"> = {},
): RecipeStepDefinition => ({ id, kind: "engine", engineId, label, ...options });

const transform = (id: string, transformId: RecipeTransformId, label: string): RecipeStepDefinition => ({
  id,
  kind: "transform",
  transformId,
  label,
});

export const RECIPES: RecipeDefinition[] = [
  {
    id: "recipe-url-cleanup-v1",
    slug: "url-cleanup-pipeline",
    version: 1,
    title: "URL Cleanup Pipeline",
    summary: "Extract HTTP(S) URLs, normalize each URL, remove duplicates, sort the list, and export a JSON array.",
    description: "Use this recipe when links are buried inside copied documents, logs, tickets, crawl output, or chat transcripts. The recipe first extracts HTTP and HTTPS candidates, then runs the audited URL normalizer independently across each line. It removes exact duplicates, sorts the surviving URLs, and serializes the final list as JSON. No LLM is required and no arbitrary JavaScript is accepted from the recipe payload.",
    inputLabel: "Mixed text containing URLs",
    inputHint: "Paste any text containing http:// or https:// links.",
    sampleInput: "Docs: https://www.xfree.in/docs#start\nHome: https://www.xfree.in/\nDuplicate: https://www.xfree.in/docs#start\nExternal: https://example.com:443/a#fragment",
    outputLabel: "Normalized URL JSON array",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["url", "dedupe", "normalize", "json", "seo"],
    steps: [
      step("extract", "http-url-extract", "Extract HTTP and HTTPS URLs"),
      step("normalize", "url-normalize", "Normalize each extracted URL", { config: { mapLines: true } }),
      step("dedupe", "line-dedupe", "Remove duplicate URLs"),
      step("sort", "line-sort", "Sort URLs"),
      transform("json", "lines-to-json-array", "Convert URL lines to a JSON array"),
    ],
    notes: [
      "URL normalization removes fragments, lowercases hostnames, and removes default ports where the engine supports it.",
      "The workflow intentionally does not fetch remote URLs or test their HTTP status.",
    ],
  },
  {
    id: "recipe-log-sanitizer-v1",
    slug: "log-sanitizer",
    version: 1,
    title: "Log Sanitizer",
    summary: "Trim log lines, keep ERROR lines, deduplicate repeated errors, sort them, and emit structured JSON.",
    description: "This recipe is a deterministic first-pass error triage workflow for pasted application or server logs. It trims leading and trailing whitespace, filters for the fixed repository-owned token ERROR, deduplicates repeated lines, sorts the remaining entries, and emits a JSON array. The filter token is part of the reviewed recipe definition rather than executable user code, so shared recipe URLs cannot redefine the filter implementation or inject scripts.",
    inputLabel: "Application or server log text",
    inputHint: "Paste logs. Version 1 keeps lines containing the exact text ERROR.",
    sampleInput: "INFO boot complete\n ERROR database timeout \nWARN retrying\nERROR database timeout\nERROR cache unavailable",
    outputLabel: "Deduplicated ERROR lines",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["logs", "errors", "cleanup", "dedupe", "json"],
    steps: [
      step("trim", "trim-lines", "Trim each log line"),
      step("errors", "filter-lines", "Keep lines containing ERROR", { config: { prependLine: "ERROR" } }),
      step("dedupe", "line-dedupe", "Remove repeated error lines"),
      step("sort", "line-sort", "Sort unique error lines"),
      transform("json", "lines-to-json-array", "Convert error lines to a JSON array"),
    ],
    notes: [
      "Version 1 uses a literal ERROR filter. It does not infer severity or semantics with an LLM.",
      "Secrets already present in a log are not automatically redacted; review input before sharing output.",
    ],
  },
  {
    id: "recipe-jwt-inspection-v1",
    slug: "jwt-inspection-workflow",
    version: 1,
    title: "JWT Inspection Workflow",
    summary: "Decode a JWT without verifying its signature, format the decoded JSON, and sort object keys for inspection.",
    description: "This workflow is designed for local inspection of JWT structure and claims. It uses the existing unverified JWT decoder, then formats the resulting JSON and sorts keys recursively to make comparison easier. The recipe does not claim that a token is authentic, valid, or trusted: decoding is not signature verification. Keep production secrets and live bearer tokens out of screenshots, issue reports, and public recipe examples.",
    inputLabel: "JWT token",
    inputHint: "Paste a three-part JWT. The signature is not verified.",
    sampleInput: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4ZnJlZS1kZW1vIiwicm9sZSI6ImRldmVsb3BlciJ9.",
    outputLabel: "Formatted decoded JWT",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["jwt", "security", "json", "decode"],
    steps: [
      step("decode", "jwt-decode", "Decode JWT sections without signature verification"),
      step("format", "json-format", "Format decoded JSON"),
      step("sort", "json-sort-keys", "Sort JSON keys for inspection"),
    ],
    notes: [
      "Decoding a JWT does not establish authenticity or authorization.",
      "Do not paste sensitive production tokens into public bug reports or shared screenshots.",
    ],
  },
  {
    id: "recipe-seo-url-audit-v1",
    slug: "seo-url-audit",
    version: 1,
    title: "SEO URL Audit",
    summary: "Extract and normalize links, deduplicate them, then classify URLs by the origin of the first extracted URL.",
    description: "Use this recipe for a quick local classification pass over URLs copied from crawl output, page source, reports, or content inventories. After extraction and normalization, the workflow removes duplicates and classifies each URL as internal or external. Version 1 deliberately uses the origin of the first extracted URL as the internal baseline so the shared recipe needs no arbitrary hostname expression or executable configuration. Put a representative site URL first when using this workflow.",
    inputLabel: "Text containing site and external links",
    inputHint: "Put a representative site URL first; its origin becomes the internal baseline.",
    sampleInput: "https://www.xfree.in/\nDocs https://www.xfree.in/docs#intro\nReference https://example.com/reference\nDuplicate https://www.xfree.in/docs#intro",
    outputLabel: "Internal/external URL classification",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["seo", "url", "internal links", "external links", "audit"],
    steps: [
      step("extract", "http-url-extract", "Extract HTTP and HTTPS URLs"),
      step("normalize", "url-normalize", "Normalize each URL", { config: { mapLines: true } }),
      step("dedupe", "line-dedupe", "Remove duplicate URLs"),
      transform("classify", "classify-urls-by-first-origin", "Classify URLs against the first URL origin"),
    ],
    notes: [
      "The first extracted URL defines the internal origin in version 1.",
      "This is a structural classification pass; it does not crawl pages or measure indexability.",
    ],
  },
  {
    id: "recipe-json-api-cleanup-v1",
    slug: "json-api-cleanup",
    version: 1,
    title: "JSON API Cleanup",
    summary: "Validate JSON, format it, and recursively sort object keys into a stable review-friendly representation.",
    description: "This recipe turns pasted API JSON into a deterministic, readable representation without sending the payload to a model. Validation runs first as a passthrough gate: if parsing fails, later steps never execute. Valid JSON is then pretty-formatted and object keys are sorted recursively while array order is preserved. The output is useful for code review, fixtures, diff preparation, and debugging where stable key order makes changes easier to inspect.",
    inputLabel: "JSON API payload",
    inputHint: "Paste a valid JSON object or array.",
    sampleInput: "{\"z\":3,\"user\":{\"name\":\"Ada\",\"id\":7},\"items\":[2,1]}",
    outputLabel: "Validated, formatted, key-sorted JSON",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["json", "api", "validate", "format", "developer"],
    steps: [
      step("validate", "json-validate", "Validate JSON syntax", { passthrough: true }),
      step("format", "json-format", "Pretty-format JSON"),
      step("sort", "json-sort-keys", "Sort object keys recursively"),
    ],
    notes: [
      "Array order is preserved; only object keys are sorted.",
      "Version 1 does not flatten nested JSON because no flatten engine is currently part of the allowlisted production engine set.",
    ],
  },
  {
    id: "recipe-text-cleanup-v1",
    slug: "text-cleanup-pipeline",
    version: 1,
    title: "Text Cleanup Pipeline",
    summary: "Trim lines, remove blanks, deduplicate repeated lines, sort the result, and count words without changing final text.",
    description: "Use this recipe to clean pasted lists, notes, exported labels, or line-oriented text before reuse. It trims each line, removes empty lines, deduplicates exact repeats, and sorts the remaining content. A final word-count engine runs in passthrough mode so the execution trace records a useful metric while the recipe output remains the cleaned text rather than replacing it with the numeric count.",
    inputLabel: "Messy multiline text",
    inputHint: "Paste line-oriented text containing whitespace, blanks, or duplicates.",
    sampleInput: "  beta  \n\nalpha\nbeta\n gamma\nalpha ",
    outputLabel: "Cleaned sorted text",
    outputExtension: "txt",
    outputMimeType: "text/plain",
    mode: "local",
    llmRequired: false,
    tags: ["text", "cleanup", "dedupe", "sort", "count"],
    steps: [
      step("trim", "trim-lines", "Trim line whitespace"),
      step("blank", "empty-line-remove", "Remove blank lines"),
      step("dedupe", "line-dedupe", "Remove duplicate lines"),
      step("sort", "line-sort", "Sort cleaned lines"),
      step("count", "word-count", "Count words for the execution trace", { passthrough: true }),
    ],
    notes: [
      "Deduplication is exact after trimming; it is not fuzzy or semantic.",
      "The word-count step is informational and does not replace the cleaned output.",
    ],
  },
  {
    id: "recipe-csv-preparation-v1",
    slug: "csv-preparation",
    version: 1,
    title: "CSV Preparation",
    summary: "Parse CSV into structured JSON, then serialize it back into consistently quoted CSV for a deterministic cleanup pass.",
    description: "This recipe uses XFree's local CSV parser and serializer as a round-trip validation and normalization workflow. The CSV-to-JSON engine parses the header row and quoted fields; malformed quoted input fails instead of being silently guessed. The structured result is then sent to the JSON-to-CSV engine, which produces consistently quoted CSV output. It is useful before importing data into tools that are sensitive to inconsistent quoting or delimiter edge cases.",
    inputLabel: "CSV with a header row",
    inputHint: "Paste comma-delimited CSV. Quoted commas are supported by the production parser.",
    sampleInput: "name,role\nAda,Engineer\n\"Grace Hopper\",\"Compiler, Navy\"",
    outputLabel: "Normalized CSV",
    outputExtension: "csv",
    outputMimeType: "text/csv",
    mode: "local",
    llmRequired: false,
    tags: ["csv", "data", "normalize", "validate", "export"],
    steps: [
      step("parse", "csv-to-json", "Parse CSV into structured JSON"),
      step("serialize", "json-to-csv", "Serialize structured rows as normalized CSV"),
    ],
    notes: [
      "Version 1 is comma-delimited and does not auto-detect arbitrary delimiter formats.",
      "Review inferred types after import: the CSV parser represents cells as text.",
    ],
  },
  {
    id: "recipe-developer-clipboard-v1",
    slug: "developer-clipboard-cleanup",
    version: 1,
    title: "Developer Clipboard Cleanup",
    summary: "Pull URL-shaped values out of noisy terminal or CI output, deduplicate and sort them, then export JSON.",
    description: "Developer clipboard content often mixes prompts, timestamps, status messages, stack output, and useful URLs. Version 1 of this recipe intentionally solves one auditable slice of that problem: it extracts HTTP and HTTPS values, removes duplicates, sorts the list, and returns JSON. It does not use an LLM to decide what is important, so the behavior is predictable and reproducible across runs.",
    inputLabel: "Mixed terminal or CI output",
    inputHint: "Paste terminal output containing URLs you want to collect.",
    sampleInput: "$ deploy\nPreview: https://preview.example.dev/build/42\nDocs https://docs.example.dev/runbook\nRetrying...\nPreview: https://preview.example.dev/build/42",
    outputLabel: "Useful URL values as JSON",
    outputExtension: "json",
    outputMimeType: "application/json",
    mode: "local",
    llmRequired: false,
    tags: ["clipboard", "terminal", "urls", "developer", "json"],
    steps: [
      step("extract", "http-url-extract", "Extract URL-shaped values"),
      step("dedupe", "line-dedupe", "Remove duplicate values"),
      step("sort", "line-sort", "Sort useful values"),
      transform("json", "lines-to-json-array", "Convert values to a JSON array"),
    ],
    notes: [
      "Version 1 extracts HTTP(S) URLs only; it does not infer arbitrary secret, hash, or identifier types.",
      "Do not publish clipboard output that contains private deployment URLs or credentials.",
    ],
  },
];

export const RECIPE_SLUGS = new Set(RECIPES.map((recipe) => recipe.slug));

export function getRecipeBySlug(slug: string): RecipeDefinition | undefined {
  return RECIPES.find((recipe) => recipe.slug === slug);
}

export function recipeSharePayload(recipe: RecipeDefinition) {
  return {
    recipeId: recipe.id,
    version: recipe.version,
    mode: recipe.mode,
    llmRequired: recipe.llmRequired,
    steps: recipe.steps.map((item) => ({
      id: item.id,
      kind: item.kind,
      ...(item.engineId ? { engineId: item.engineId } : {}),
      ...(item.transformId ? { transformId: item.transformId } : {}),
      ...(item.passthrough ? { passthrough: true } : {}),
      ...(item.config ? { config: item.config } : {}),
    })),
  };
}
