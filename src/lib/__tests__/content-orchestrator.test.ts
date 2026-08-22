import { describe, expect, it } from "vitest";
import { buildGenerationPrompt, sourceFingerprint } from "../../content-pipeline/orchestrator";
import type { ToolGenerationSpec } from "../../content-pipeline/schemas";

const spec: ToolGenerationSpec = {
  name: "JSON Record Flattener",
  slug: "json-record-flattener",
  category: "developer-tools",
  pillarSlug: "json-data-tools",
  summary: "Flatten nested JSON objects into predictable records for CSV exports and tabular processing.",
  engine: { id: "json-to-csv", status: "working", tested: true },
  inputParameters: ["JSON object or array"],
  outputFormats: ["JSON", "CSV"],
  useCases: ["Normalize API responses before spreadsheet review", "Prepare nested records for bulk data imports"],
  processing: {
    mode: "local",
    implementation: "web-worker",
    workingInputSentToServer: false,
    providers: [],
    verifiedAt: "2026-08-22",
    limitations: ["Available memory and nesting depth determine the practical input limit"],
  },
};

describe("content generation orchestrator", () => {
  it("creates stable source fingerprints independent of object key order", () => {
    const reordered = Object.fromEntries(Object.entries(spec).reverse()) as unknown as ToolGenerationSpec;
    expect(sourceFingerprint(reordered)).toBe(sourceFingerprint(spec));
  });

  it("forbids invented UGC, benchmarks, and unsupported implementation claims", () => {
    const prompt = buildGenerationPrompt(spec);
    expect(prompt).toContain("do not return HTML");
    expect(prompt).toContain("Do not invent users, testimonials, benchmarks, libraries, browser support, payload limits, or privacy guarantees");
    expect(prompt).toContain('"workingInputSentToServer":false');
  });
});
