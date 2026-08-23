export type RecipeTransformId =
  | "lines-to-json-array"
  | "map-lines-url-normalize"
  | "extract-error-lines"
  | "extract-first-jwt"
  | "classify-urls"
  | "text-summary"
  | "extract-clipboard-values";

export type RecipeStep =
  | { kind: "engine"; engineId: string; label: string; passthrough?: boolean }
  | { kind: "transform"; transformId: RecipeTransformId; label: string };

export interface WorkflowRecipe {
  id: string;
  slug: string;
  version: string;
  title: string;
  shortDescription: string;
  directAnswer: string;
  processing: "local";
  llmRequired: false;
  keywords: readonly string[];
  steps: readonly RecipeStep[];
  exampleInput: string;
  exampleOutputDescription: string;
  safeConfiguration: Readonly<Record<string, string | number | boolean>>;
}

export const WORKFLOW_RECIPES: readonly WorkflowRecipe[] = [
  {
    id: "url-cleanup-pipeline",
    slug: "url-cleanup-pipeline",
    version: "1.0.0",
    title: "URL Cleanup Pipeline",
    shortDescription: "Extract, normalize, deduplicate, sort, and export HTTP URLs as a JSON array entirely in the browser.",
    directAnswer: "The URL Cleanup Pipeline turns mixed text into a deterministic JSON list of normalized HTTP and HTTPS URLs. Every step runs through an allowlisted XFree local engine or bounded built-in transform, so the plan is inspectable before execution.",
    processing: "local",
    llmRequired: false,
    keywords: ["local URL workflow", "URL cleanup pipeline", "browser URL extractor", "deduplicate URLs"],
    steps: [
      { kind: "engine", engineId: "http-url-extract", label: "Extract HTTP URLs" },
      { kind: "transform", transformId: "map-lines-url-normalize", label: "Normalize each URL" },
      { kind: "engine", engineId: "line-dedupe", label: "Remove duplicates" },
      { kind: "engine", engineId: "line-sort", label: "Sort URLs" },
      { kind: "transform", transformId: "lines-to-json-array", label: "Export as JSON array" },
    ],
    exampleInput: "Docs: https://Example.com:443/docs#intro\nDuplicate: https://example.com/docs\nAPI: https://example.com/api?q=1",
    exampleOutputDescription: "A normalized, deduplicated, alphabetically sorted JSON array of discovered URLs.",
    safeConfiguration: { maxSteps: 6, networkAccess: false },
  },
  {
    id: "log-sanitizer",
    slug: "log-sanitizer",
    version: "1.0.0",
    title: "Log Sanitizer",
    shortDescription: "Clean log text, keep error-oriented lines, deduplicate repeated failures, and export structured JSON locally.",
    directAnswer: "The Log Sanitizer reduces pasted logs to the lines most likely to need investigation without uploading the file. It removes blanks, keeps lines containing explicit error/failure markers, deduplicates them, and emits a JSON array for follow-up analysis.",
    processing: "local",
    llmRequired: false,
    keywords: ["local log sanitizer", "browser log analyzer workflow", "extract error lines", "developer log cleanup"],
    steps: [
      { kind: "engine", engineId: "empty-line-remove", label: "Remove blank lines" },
      { kind: "transform", transformId: "extract-error-lines", label: "Keep error-oriented lines" },
      { kind: "engine", engineId: "line-dedupe", label: "Deduplicate repeated failures" },
      { kind: "transform", transformId: "lines-to-json-array", label: "Export as JSON array" },
    ],
    exampleInput: "INFO server started\nERROR database timeout\nWARN retrying\nERROR database timeout\nHTTP 500 /api/orders",
    exampleOutputDescription: "A JSON array containing unique ERROR, FATAL, exception, failed, and HTTP 5xx-oriented lines.",
    safeConfiguration: { maxSteps: 6, networkAccess: false },
  },
  {
    id: "jwt-inspection-workflow",
    slug: "jwt-inspection-workflow",
    version: "1.0.0",
    title: "JWT Inspection Workflow",
    shortDescription: "Extract the first JWT-like token, decode its unverified claims, and format the result as readable JSON locally.",
    directAnswer: "The JWT Inspection Workflow finds the first three-part JWT-shaped value in pasted text and decodes its header and payload without verifying the signature. It is for inspection only, and the recipe keeps that limitation visible in both the plan and output.",
    processing: "local",
    llmRequired: false,
    keywords: ["JWT inspection workflow", "local JWT decoder", "browser token inspection", "decode JWT claims"],
    steps: [
      { kind: "transform", transformId: "extract-first-jwt", label: "Extract first JWT candidate" },
      { kind: "engine", engineId: "jwt-decode", label: "Decode JWT without signature verification" },
      { kind: "engine", engineId: "json-format", label: "Format decoded JSON" },
    ],
    exampleInput: "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZXYtdXNlciIsInJvbGUiOiJyZWFkZXIifQ.",
    exampleOutputDescription: "Formatted JSON showing the decoded JWT sections with an explicit unverified-signature warning from the engine.",
    safeConfiguration: { maxSteps: 6, signatureVerification: false, networkAccess: false },
  },
  {
    id: "seo-url-audit",
    slug: "seo-url-audit",
    version: "1.0.0",
    title: "SEO URL Audit",
    shortDescription: "Extract and normalize links, remove duplicates, then classify URLs as same-origin or external in-browser.",
    directAnswer: "The SEO URL Audit converts mixed crawl or page text into a compact same-origin versus external URL report. The first normalized URL establishes the comparison origin; no remote page is fetched, so this recipe audits supplied URLs rather than crawling the web.",
    processing: "local",
    llmRequired: false,
    keywords: ["SEO URL audit", "internal external link classifier", "browser link audit", "technical SEO URL workflow"],
    steps: [
      { kind: "engine", engineId: "http-url-extract", label: "Extract HTTP URLs" },
      { kind: "transform", transformId: "map-lines-url-normalize", label: "Normalize each URL" },
      { kind: "engine", engineId: "line-dedupe", label: "Remove duplicates" },
      { kind: "transform", transformId: "classify-urls", label: "Classify same-origin and external URLs" },
    ],
    exampleInput: "https://www.example.com/\nhttps://www.example.com/docs#start\nhttps://external.example.org/reference",
    exampleOutputDescription: "A JSON object containing baseOrigin, internal URLs, external URLs, and counts.",
    safeConfiguration: { classificationBase: "first-normalized-url-origin", networkAccess: false },
  },
  {
    id: "json-api-cleanup",
    slug: "json-api-cleanup",
    version: "1.0.0",
    title: "JSON API Cleanup",
    shortDescription: "Validate API JSON, format it consistently, sort object keys recursively, and return inspectable browser-local output.",
    directAnswer: "The JSON API Cleanup recipe validates pasted JSON before transforming it, then formats and recursively sorts object keys for easier review or diffs. Validation is a passthrough step, so valid source data continues into the formatting stages without a server call.",
    processing: "local",
    llmRequired: false,
    keywords: ["JSON API cleanup", "local JSON workflow", "JSON validate format sort", "browser JSON formatter"],
    steps: [
      { kind: "engine", engineId: "json-validate", label: "Validate JSON", passthrough: true },
      { kind: "engine", engineId: "json-format", label: "Format JSON" },
      { kind: "engine", engineId: "json-sort-keys", label: "Sort object keys" },
    ],
    exampleInput: "{\"z\":1,\"user\":{\"name\":\"XFree\",\"id\":7},\"a\":true}",
    exampleOutputDescription: "Readable two-space JSON with recursively sorted object keys.",
    safeConfiguration: { maxSteps: 6, networkAccess: false },
  },
  {
    id: "text-cleanup-pipeline",
    slug: "text-cleanup-pipeline",
    version: "1.0.0",
    title: "Text Cleanup Pipeline",
    shortDescription: "Trim lines, remove blanks and duplicates, sort the cleaned text, then append deterministic line and word metrics.",
    directAnswer: "The Text Cleanup Pipeline makes copied lists and notes consistent without sending them anywhere. It trims each line, removes empty and duplicate values, sorts the result, and finishes with deterministic line, word, and character counts.",
    processing: "local",
    llmRequired: false,
    keywords: ["text cleanup pipeline", "deduplicate text lines", "browser text workflow", "sort and count text"],
    steps: [
      { kind: "engine", engineId: "trim-lines", label: "Trim each line" },
      { kind: "engine", engineId: "empty-line-remove", label: "Remove blank lines" },
      { kind: "engine", engineId: "line-dedupe", label: "Remove duplicates" },
      { kind: "engine", engineId: "line-sort", label: "Sort cleaned lines" },
      { kind: "transform", transformId: "text-summary", label: "Add line and word metrics" },
    ],
    exampleInput: "  zebra  \nalpha\n\nalpha\n beta ",
    exampleOutputDescription: "A JSON object containing cleanedText plus deterministic lineCount, wordCount, and characterCount metrics.",
    safeConfiguration: { maxSteps: 6, networkAccess: false },
  },
  {
    id: "csv-preparation",
    slug: "csv-preparation",
    version: "1.0.0",
    title: "CSV Preparation",
    shortDescription: "Parse CSV into structured JSON and serialize it back to consistently quoted CSV using local browser engines.",
    directAnswer: "The CSV Preparation recipe uses a parse-and-reserialize round trip to expose malformed quoted fields and normalize output. It is intentionally conservative: it does not guess delimiters or silently repair invalid rows that the parser cannot understand.",
    processing: "local",
    llmRequired: false,
    keywords: ["CSV preparation workflow", "local CSV validator", "CSV normalize browser", "CSV JSON round trip"],
    steps: [
      { kind: "engine", engineId: "csv-to-json", label: "Parse CSV into JSON" },
      { kind: "engine", engineId: "json-to-csv", label: "Serialize normalized CSV" },
    ],
    exampleInput: "name,role\n\"Ada\",\"developer\"\n\"Lin\",\"reviewer\"",
    exampleOutputDescription: "Consistently serialized CSV after a successful structured parse.",
    safeConfiguration: { delimiter: "comma", networkAccess: false },
  },
  {
    id: "developer-clipboard-cleanup",
    slug: "developer-clipboard-cleanup",
    version: "1.0.0",
    title: "Developer Clipboard Cleanup",
    shortDescription: "Clean pasted terminal or developer clipboard lines, remove noise from blanks and duplicates, and export JSON locally.",
    directAnswer: "The Developer Clipboard Cleanup recipe turns messy copied terminal or editor text into a compact set of useful line values. It trims, removes blanks and duplicates, extracts common developer-shaped values when present, and exports the result as JSON.",
    processing: "local",
    llmRequired: false,
    keywords: ["developer clipboard cleanup", "terminal output cleanup", "browser clipboard workflow", "extract developer values"],
    steps: [
      { kind: "engine", engineId: "trim-lines", label: "Trim copied lines" },
      { kind: "engine", engineId: "empty-line-remove", label: "Remove blank lines" },
      { kind: "engine", engineId: "line-dedupe", label: "Remove duplicate lines" },
      { kind: "transform", transformId: "extract-clipboard-values", label: "Extract common developer-shaped values" },
      { kind: "transform", transformId: "lines-to-json-array", label: "Export as JSON array" },
    ],
    exampleInput: "  https://example.com/api  \nrequest-id: 550e8400-e29b-41d4-a716-446655440000\nhttps://example.com/api\nuser@example.com",
    exampleOutputDescription: "A JSON array of unique URL, email, UUID, hash-like, or key/value-style values found in the cleaned clipboard text.",
    safeConfiguration: { maxSteps: 6, networkAccess: false },
  },
] as const;

export function getRecipeBySlug(slug: string): WorkflowRecipe | undefined {
  return WORKFLOW_RECIPES.find((recipe) => recipe.slug === slug);
}

export function getShareableRecipe(recipe: WorkflowRecipe) {
  return {
    recipeId: recipe.id,
    version: recipe.version,
    processing: recipe.processing,
    llmRequired: recipe.llmRequired,
    steps: recipe.steps,
    safeConfiguration: recipe.safeConfiguration,
  };
}
