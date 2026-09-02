import { describe, expect, it } from "vitest";
import { validateReleaseDataset } from "../../content-pipeline/dataset";

function tool(pillarSlug: string, index: number) {
  return {
    name: `Verified Utility ${pillarSlug} ${index}`,
    slug: `${pillarSlug}-tool-${index}`,
    category: "developer-tools",
    pillarSlug,
    summary: `A verified utility specification for ${pillarSlug} with factual processing and output behavior.`,
    engine: { id: `engine-${pillarSlug}-${index}`, status: "working", tested: true },
    inputParameters: ["text input"],
    outputFormats: ["plain text"],
    useCases: ["Validate structured technical input safely", "Prepare deterministic output for another workflow"],
    processing: {
      mode: "local",
      implementation: "browser-js",
      workingInputSentToServer: false,
      providers: [],
      verifiedAt: "2026-08-22",
      limitations: ["Practical input capacity depends on browser memory and input complexity"],
    },
  };
}

describe("30 by 50 release dataset", () => {
  it("accepts an internally consistent 1,500-tool matrix", () => {
    const pillars = Array.from({ length: 30 }, (_, pillarIndex) => {
      const slug = `pillar-${pillarIndex + 1}`;
      return {
        name: `Pillar ${pillarIndex + 1}`,
        slug,
        description: `A production pillar containing verified, related tool specifications and factual technical documentation for cluster ${pillarIndex + 1}.`,
        status: "active",
        tools: Array.from({ length: 50 }, (_, toolIndex) => tool(slug, toolIndex + 1)),
      };
    });
    const result = validateReleaseDataset({ schemaVersion: 1, datasetId: "xfree-1500-v1", updatedAt: "2026-08-22T12:00:00.000Z", pillars });
    expect(result.valid).toBe(true);
    expect(result.toolCount).toBe(1500);
  });

  it("rejects a partial matrix as release-ready", () => {
    const slug = "partial-pillar";
    const result = validateReleaseDataset({
      schemaVersion: 1,
      datasetId: "partial",
      updatedAt: "2026-08-22T12:00:00.000Z",
      pillars: [{ name: "Partial Pillar", slug, description: "A partial development fixture that must never be accepted as the complete production release matrix for XFree.", status: "draft", tools: [tool(slug, 1)] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("exactly 30 pillars"))).toBe(true);
  });

  it("rejects untested or non-working release engines", () => {
    const slug = "partial-pillar";
    const broken = tool(slug, 1);
    broken.engine = { id: "draft-engine", status: "draft", tested: false };
    const result = validateReleaseDataset({
      schemaVersion: 1,
      datasetId: "unverified-engine",
      updatedAt: "2026-08-22T12:00:00.000Z",
      pillars: [{ name: "Partial Pillar", slug, description: "A fixture proving that untested engines cannot enter a release dataset even before the matrix-size gate passes.", status: "active", tools: [broken] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("tested, working engine"))).toBe(true);
  });

  it("rejects keyword aliases that reuse one Studio engine as multiple tools", () => {
    const pillars = Array.from({ length: 30 }, (_, pillarIndex) => {
      const slug = `pillar-${pillarIndex + 1}`;
      return {
        name: `Pillar ${pillarIndex + 1}`,
        slug,
        description: `A production pillar containing verified, related tool specifications and factual technical documentation for cluster ${pillarIndex + 1}.`,
        status: "active",
        tools: Array.from({ length: 50 }, (_, toolIndex) => ({
          ...tool(slug, toolIndex + 1),
          engine: { id: "shared-engine", status: "working", tested: true },
        })),
      };
    });
    const result = validateReleaseDataset({ schemaVersion: 1, datasetId: "doorway-matrix", updatedAt: "2026-08-22T12:00:00.000Z", pillars });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("assigned to multiple tool pages"))).toBe(true);
  });
});
