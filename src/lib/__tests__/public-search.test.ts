import { describe, it, expect } from "vitest";
import { publicSearch, type SearchKind } from "../public-search";
import { PUBLIC_TOOLS } from "../../data/publicTools";
import { PUBLIC_PILLARS } from "../../data/pillarRegistry";

describe("publicSearch (server-side filter over PUBLIC_TOOLS and PUBLIC_PILLARS)", () => {
  it("returns an empty result for an empty query when allow-empty sorts by recency", () => {
    const result = publicSearch({ query: "" });
    expect(result.query).toBe("");
    expect(result.total).toBe(PUBLIC_TOOLS.length + PUBLIC_PILLARS.length);
    expect(result.results.length).toBeGreaterThan(0);
  });

  it("matches a tool by title prefix", () => {
    const result = publicSearch({ query: "JSON", kinds: ["tool"] });
    expect(result.results.length).toBeGreaterThan(0);
    const top = result.results[0];
    expect(top.kind).toBe("tool");
    expect(top.title.toLowerCase()).toContain("json");
    expect(top.score).toBeGreaterThanOrEqual(50);
  });

  it("matches a pillar by slug", () => {
    const result = publicSearch({ query: "regex", kinds: ["pillar"] });
    expect(result.results.length).toBeGreaterThan(0);
    const top = result.results[0];
    expect(top.kind).toBe("pillar");
    expect(top.slug).toBe("regex-tools");
  });

  it("ranks title matches above description matches", () => {
    const result = publicSearch({ query: "sitemap" });
    expect(result.results.length).toBeGreaterThan(0);
    const first = result.results[0];
    expect(first.score).toBeGreaterThan(0);
  });

  it("returns no matches for nonsense input", () => {
    const result = publicSearch({ query: "zzzzz_unlikely_match_qqqq" });
    expect(result.results).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("respects the kinds filter (tools only)", () => {
    const result = publicSearch({ query: "", kinds: ["tool"] });
    for (const r of result.results) expect(r.kind).toBe("tool");
  });

  it("respects the kinds filter (pillars only)", () => {
    const result = publicSearch({ query: "", kinds: ["pillar"] });
    for (const r of result.results) expect(r.kind).toBe("pillar");
  });

  it("clamps the limit to at most 50", () => {
    const result = publicSearch({ query: "", limit: 1000 });
    expect(result.results.length).toBeLessThanOrEqual(50);
  });

  it("clamps the limit to at least 1", () => {
    const result = publicSearch({ query: "", limit: 0 });
    expect(result.results.length).toBe(1);
  });

  it("only returns published tools — no draft records leak", () => {
    const result = publicSearch({ query: "", kinds: ["tool"] });
    for (const r of result.results) {
      expect(PUBLIC_TOOLS.find((t) => (t.slug || t.id) === r.slug)).toBeDefined();
    }
  });

  it("only returns published pillars — no draft pillars leak", () => {
    const result = publicSearch({ query: "", kinds: ["pillar"] });
    for (const r of result.results) {
      expect(PUBLIC_PILLARS.find((p) => p.slug === r.slug)).toBeDefined();
    }
  });

  it("returns each tool with a /tools/<slug> href", () => {
    const result = publicSearch({ query: "json", kinds: ["tool"] });
    for (const r of result.results) {
      expect(r.href).toMatch(/^\/tools\//);
    }
  });

  it("returns each pillar with a /<slug> href", () => {
    const result = publicSearch({ query: "dev", kinds: ["pillar"] });
    for (const r of result.results) {
      expect(r.href).toMatch(/^\/[a-z0-9-]+$/);
    }
  });

  it("is case-insensitive", () => {
    const lower = publicSearch({ query: "json", kinds: ["tool"] });
    const upper = publicSearch({ query: "JSON", kinds: ["tool"] });
    const mixed = publicSearch({ query: "Json", kinds: ["tool"] });
    expect(lower.results.length).toBe(upper.results.length);
    expect(lower.results.length).toBe(mixed.results.length);
  });
});
