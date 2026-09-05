import { describe, expect, it } from "vitest";
import { fallbackStatusForToolStatus } from "../app";

describe("tool fallback status (GSC Contract v2 §3)", () => {
  it.each([undefined, "draft", "roadmap"] as const)("returns 404 for %s", (status) => {
    expect(fallbackStatusForToolStatus(status)).toBe(404);
  });

  it("reserves 410 for explicitly retired tools", () => {
    expect(fallbackStatusForToolStatus("retired")).toBe(410);
  });
});
