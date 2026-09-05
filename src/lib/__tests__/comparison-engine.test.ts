import { describe, it, expect } from "vitest";
import { compareTools, extractStrengths, extractWeaknesses, DEFAULT_CRITERIA } from "../comparison-engine";
import { findToolBySlug } from "../../data/toolsRegistry";

describe("ComparisonEngine — compareTools", () => {
  it("returns a result for each tool id", () => {
    const results = compareTools(["json-formatter", "regex-tester"]);
    expect(results).toHaveLength(2);
  });

  it("includes strengths and weaknesses arrays", () => {
    const results = compareTools(["json-formatter"]);
    expect(results[0]).toHaveProperty("strengths");
    expect(results[0]).toHaveProperty("weaknesses");
    expect(Array.isArray(results[0].strengths)).toBe(true);
    expect(Array.isArray(results[0].weaknesses)).toBe(true);
  });

  it("returns empty for unknown tool ids", () => {
    const results = compareTools(["unknown-tool"]);
    expect(results).toHaveLength(0);
  });

  it("uses default criteria when none specified", () => {
    const results = compareTools(["json-formatter"]);
    expect(results[0].scores).toHaveLength(Object.keys(DEFAULT_CRITERIA).length);
  });
});

describe("ComparisonEngine — extractStrengths / Weakness", () => {
  it("extracts strengths and weaknesses from a tool", () => {
    const tool = findToolBySlug("json-formatter");
    expect(tool).toBeDefined();
    const strengths = extractStrengths(tool!, ["capabilityFit"]);
    const weaknesses = extractWeaknesses(tool!, ["capabilityFit"]);
    expect(Array.isArray(strengths)).toBe(true);
    expect(Array.isArray(weaknesses)).toBe(true);
  });

  it("flags flagship tools as strength", () => {
    const tool = findToolBySlug("json-formatter");
    expect(tool).toBeDefined();
    if (tool?.isFlagship) {
      expect(extractStrengths(tool, ["capabilityFit"])).toContain("flagship");
    } else {
      expect(extractStrengths(tool!, ["capabilityFit"])).not.toContain("flagship");
    }
  });
});

describe("ComparisonEngine — DEFAULT_CRITERIA", () => {
  it("has expected criteria keys", () => {
    expect(DEFAULT_CRITERIA).toHaveProperty("capabilityFit");
    expect(DEFAULT_CRITERIA).toHaveProperty("reliability");
    expect(DEFAULT_CRITERIA).toHaveProperty("speed");
    expect(DEFAULT_CRITERIA).toHaveProperty("privacy");
    expect(DEFAULT_CRITERIA).toHaveProperty("pricing");
  });

  it("weights sum to 1", () => {
    const sum = Object.values(DEFAULT_CRITERIA).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 2);
  });
});
