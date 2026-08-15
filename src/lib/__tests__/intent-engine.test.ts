import { describe, it, expect } from "vitest";
import { classifyIntent, routeIntentToCapabilities } from "../intent-engine";
import { TOOLS_REGISTRY } from "../../data/toolsRegistry";

describe("Intent Engine", () => {
  it("should classify PDF compression intent", () => {
    const result = classifyIntent("I need to compress this PDF");
    expect(result.intent).toContain("pdf");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should classify JSON formatting intent", () => {
    const result = classifyIntent("Format this JSON");
    expect(result.intent).toContain("json");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("should route intent to capabilities", () => {
    const intent = classifyIntent("compress PDF");
    const route = routeIntentToCapabilities(intent);
    expect(route.toolIds.length).toBeGreaterThan(0);
    expect(route.confidence).toBeGreaterThan(0);
  });

  it("should handle unknown intents gracefully", () => {
    const result = classifyIntent("xyzzy gibberish");
    expect(result).toBeDefined();
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe("Tool Registry", () => {
  it("should have indexable tools", () => {
    expect(TOOLS_REGISTRY.length).toBeGreaterThan(0);
  });

  it("should have flagship tools", () => {
    const flagship = TOOLS_REGISTRY.filter(t => t.isFlagship);
    expect(flagship.length).toBeGreaterThan(0);
  });
});