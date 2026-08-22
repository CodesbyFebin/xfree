import { describe, expect, it } from "vitest";
import { validateForPublication } from "../../content-pipeline/validate";

const directAnswer = Array.from({ length: 45 }, (_, index) => `answer${index}`).join(" ");
const paragraph = Array.from({ length: 180 }, (_, index) => `technical${index}`).join(" ");

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    name: "JSON Record Flattener",
    slug: "json-record-flattener",
    category: "developer-tools",
    pillarSlug: "json-data-tools",
    summary: "Flatten nested JSON objects into predictable records for CSV exports and tabular data processing.",
    engine: { id: "json-to-csv", status: "working", tested: true },
    inputParameters: ["JSON object or array"],
    outputFormats: ["JSON", "CSV"],
    useCases: ["Prepare nested API responses for spreadsheet review", "Normalize records before bulk data imports"],
    processing: {
      mode: "local",
      implementation: "web-worker",
      workingInputSentToServer: false,
      providers: [],
      verifiedAt: "2026-08-22",
      limitations: ["Available memory and nesting depth determine the practical input limit"],
    },
    content: {
      directAnswer,
      technicalDetails: paragraph,
      instructions: paragraph,
      examples: [{ title: "Nested record", input: '{"user":{"id":1}}', output: '{"user.id":1}', explanation: "The nested key is converted into a predictable dotted path for downstream processing." }],
      edgeCases: ["Arrays require an explicit expansion strategy to avoid ambiguous output columns.", "Circular references are invalid JSON and must be removed before processing."],
      faqs: [
        { question: "Does working input leave the browser?", answer: "No. This verified engine performs its transformation in a browser Web Worker." },
        { question: "What happens to nested arrays?", answer: "The selected expansion option determines whether arrays remain serialized or become indexed fields." },
        { question: "Can I export the result?", answer: "Yes. The working engine provides JSON and CSV result downloads after successful validation." },
      ],
    },
    metadata: {
      title: "JSON Record Flattener — Free Browser Tool | XFree",
      description: "Flatten nested JSON records locally, inspect dotted paths, handle arrays deliberately, and export normalized JSON or CSV without registration.",
      h1: "JSON Record Flattener — Online Local Mode Utility",
    },
    ...overrides,
  };
}

describe("content publication gate", () => {
  it("publishes only a verified candidate backed by a real Studio engine", () => {
    const pending = validateForPublication(candidate(), { availableStudioEngineIds: new Set(["json-to-csv"]) });
    expect(pending.status).toBe("pending_review");
    const result = validateForPublication(candidate(), {
      availableStudioEngineIds: new Set(["json-to-csv"]),
      approval: {
        slug: "json-record-flattener",
        contentFingerprint: pending.contentFingerprint!,
        decision: "approved",
        reviewer: "XFree editorial reviewer",
        reviewedAt: "2026-08-22T12:00:00.000Z",
        notes: "Verified the engine behavior, technical examples, processing disclosure, and page-specific content.",
        reviewedSimilaritySlugs: [],
      },
    });
    expect(result.status).toBe("published");
    expect(result.studioDeepLink).toBe("https://app.xfree.in/?tool=json-to-csv");
    expect(result.jsonLd?.url).toBe("https://www.xfree.in/tools/json-record-flattener");
    expect(result.jsonLd?.potentialAction.target).toBe("https://app.xfree.in/?tool=json-to-csv");
  });

  it("quarantines content whose engine is missing", () => {
    const result = validateForPublication(candidate({ engine: { id: "missing-engine", status: "missing", tested: false } }), { availableStudioEngineIds: new Set(["json-to-csv"]) });
    expect(result.status).toBe("draft");
    expect(result.indexable).toBe(false);
    expect(result.errors.some((error) => error.includes("working engine"))).toBe(true);
  });

  it("rejects universal privacy or latency claims", () => {
    const value = candidate();
    value.content.technicalDetails += " Zero server latency and no data logging.";
    const result = validateForPublication(value, { availableStudioEngineIds: new Set(["json-to-csv"]) });
    expect(result.status).toBe("draft");
    expect(result.errors.some((error) => error.includes("zero server latency"))).toBe(true);
  });

  it("flags near-duplicate content for review without publishing it", () => {
    const value = candidate();
    const result = validateForPublication(value, {
      availableStudioEngineIds: new Set(["json-to-csv"]),
      similarityCorpus: [{ slug: "existing-json-tool", text: [value.content.directAnswer, value.content.technicalDetails, value.content.instructions].join(" ") }],
      similarityThreshold: 0.5,
    });
    expect(result.status).toBe("pending_review");
    expect(result.similarityMatch?.slug).toBe("existing-json-tool");
  });
});
