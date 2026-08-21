import { describe, it, expect } from "vitest";
import { classifyIntent, routeIntentToCapabilities } from "../intent-engine";
import { TOOLS_REGISTRY } from "../../data/toolsRegistry";
import { PUBLIC_TOOLS } from "../../data/publicTools";

describe("Intent Engine — classification", () => {
  it("classifies a PDF intent by entity even without a matching tool", () => {
    const result = classifyIntent("I need to compress this PDF");
    expect(result.intent).toContain("pdf");
    expect(result.entities).toContain("pdf");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("classifies a JSON formatting intent", () => {
    const result = classifyIntent("Format this JSON");
    expect(result.intent).toContain("json");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("detects local/private constraint from query", () => {
    const result = classifyIntent("compress this locally in my browser");
    expect(result.constraints.privacy).toBe("local");
  });
});

describe("Intent Engine — routing (honest, no over-claim)", () => {
  it("routes a real intent to the tools that actually solve it", () => {
    const route = routeIntentToCapabilities(classifyIntent("generate a sitemap"));
    expect(route.toolIds).toContain("bulk-url-sitemap");
    expect(route.toolIds).toContain("xml-sitemap-generator");
    expect(route.confidence).toBeGreaterThan(0);
  });

  it("returns no tools for an intent XFree cannot fulfill", () => {
    const route = routeIntentToCapabilities(classifyIntent("compress this PDF"));
    expect(route.toolIds).toHaveLength(0);
    expect(route.confidence).toBeLessThanOrEqual(0.2);
  });
});

describe("Intent Engine — unknown input", () => {
  it("handles gibberish gracefully", () => {
    const result = classifyIntent("xyzzy gibberish plugh");
    expect(result).toBeDefined();
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe("Tool Registry", () => {
  it("has indexable tools", () => {
    expect(PUBLIC_TOOLS.length).toBeGreaterThan(0);
  });

  it("has flagship tools", () => {
    const flagship = TOOLS_REGISTRY.filter((t) => t.isFlagship);
    expect(flagship.length).toBeGreaterThan(0);
  });

  it("never includes a draft tool in the indexable set", () => {
    const indexableIds = new Set(PUBLIC_TOOLS.map((t) => t.id));
    const draftInIndex = TOOLS_REGISTRY.filter(
      (t) => t.status === "draft" && indexableIds.has(t.id),
    );
    expect(draftInIndex).toHaveLength(0);
  });

  it("every tool carries a valid status enum value", () => {
    const valid = new Set(["published", "draft", "roadmap", "retired"]);
    expect(TOOLS_REGISTRY.every((t) => valid.has(t.status))).toBe(true);
  });

  it("publishes only explicitly indexable, completed tools", () => {
    expect(PUBLIC_TOOLS.every((t) => t.status === "published" && t.indexable)).toBe(true);
  });
});
