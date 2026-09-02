import { describe, it, expect } from "vitest";
import {
  executeTool,
  verifyToolResult,
  getCapabilityRecommendations,
  compareTools,
} from "../execution-engine";
import { TOOLS_REGISTRY } from "../../data/toolsRegistry";

describe("Execution Engine", () => {
  it("returns a structured failure for an unknown tool", async () => {
    const res = await executeTool({ toolId: "does-not-exist", input: {} });
    expect(res.success).toBe(false);
    expect(res.error).toContain("not found");
    expect(res.traceId).toBeTruthy();
  });

  it("executes a known local tool and attaches verification", async () => {
    const res = await executeTool({ toolId: "json-formatter", input: '{"a":1}' });
    expect(res.success).toBe(true);
    expect(res.toolExecuted).toBe("json-formatter");
    expect(res.verification).toBeDefined();
    expect(res.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("verifyToolResult flags stale verification", async () => {
    const tool = TOOLS_REGISTRY.find((t) => t.slug === "json-formatter")!;
    const out = { toolId: tool.id, output: "ok" };
    const vr = await verifyToolResult(tool, "input", out);
    expect(vr).toHaveProperty("checksPerformed");
    expect(typeof vr.valid).toBe("boolean");
  });

  it("recommends real tools for a capability query", () => {
    const recs = getCapabilityRecommendations("generate a sitemap");
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((t) => TOOLS_REGISTRY.includes(t))).toBe(true);
  });

  it("compares tools into a comparable score structure", () => {
    const cmp = compareTools(["json-formatter", "regex-tester"]);
    expect(cmp).toHaveLength(2);
    expect(cmp[0]).toHaveProperty("overallScore");
    expect(cmp[0]).toHaveProperty("strengths");
  });
});
