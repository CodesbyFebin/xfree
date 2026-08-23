import { describe, expect, it } from "vitest";
import { BATCH1_PUBLISHED_TOOLS } from "../../data/publishedBatch1Tools";
import { PUBLIC_TOOLS } from "../../data/publicTools";
import { LOCAL_ENGINES } from "../studio/engines";

const engineIds = new Set(LOCAL_ENGINES.map((engine) => engine.id));

describe("published local tools batch 1", () => {
  it("publishes exactly 50 unique client-side tools", () => {
    expect(BATCH1_PUBLISHED_TOOLS).toHaveLength(50);
    expect(new Set(BATCH1_PUBLISHED_TOOLS.map((tool) => tool.id)).size).toBe(50);
    expect(new Set(BATCH1_PUBLISHED_TOOLS.map((tool) => tool.slug)).size).toBe(50);
    for (const tool of BATCH1_PUBLISHED_TOOLS) {
      expect(tool.execution).toBe("local");
      expect(tool.status).toBe("published");
      expect(tool.indexable).toBe(true);
      expect(tool.securityReview?.passed).toBe(true);
    }
  });

  it("maps every published tool to a real Studio local engine", () => {
    for (const tool of BATCH1_PUBLISHED_TOOLS) {
      expect(tool.toolComponent).toBe(`local-engine:${tool.id}`);
      expect(engineIds.has(tool.id)).toBe(true);
    }
  });

  it("enforces metadata and FAQ publication floors", () => {
    for (const tool of BATCH1_PUBLISHED_TOOLS) {
      expect(tool.shortDescription.length).toBeGreaterThanOrEqual(70);
      expect(tool.shortDescription.length).toBeLessThanOrEqual(160);
      expect(tool.faqs.length).toBeGreaterThanOrEqual(3);
      expect(tool.explanation.length).toBeGreaterThan(300);
    }
  });

  it("exposes every batch tool through the governed public catalog", () => {
    const publicSlugs = new Set(PUBLIC_TOOLS.map((tool) => tool.slug));
    for (const tool of BATCH1_PUBLISHED_TOOLS) expect(publicSlugs.has(tool.slug)).toBe(true);
  });
});
