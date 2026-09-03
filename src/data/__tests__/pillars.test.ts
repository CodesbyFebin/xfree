import { describe, it, expect } from "vitest";
import {
  PILLARS,
  HEADER_GROUPS,
  PUBLIC_PILLARS,
  PUBLIC_HEADER_GROUPS,
  PUBLIC_TOOL_PILLARS,
  PUBLIC_PILLAR_HREFS,
  findPillarByHref,
  isPublishedPillarHref,
} from "../pillars";

describe("XFree pillar naming contract", () => {
  it("exposes exactly 69 pillars (60 tool + 9 platform)", () => {
    expect(PILLARS.length).toBe(69);
    const toolPillars = PILLARS.filter((p) => p.type === "tool");
    const platformPillars = PILLARS.filter((p) => p.type === "platform");
    expect(toolPillars.length).toBe(60);
    expect(platformPillars.length).toBe(9);
  });

  it("every pillar display name follows the 'XFree <Topic>' pattern", () => {
    for (const p of PILLARS) {
      expect(p.name.startsWith("XFree "), `pillar ${p.id} does not start with "XFree ": ${p.name}`).toBe(true);
    }
  });

  it("every pillar href is canonical (no 'xfree-' prefix)", () => {
    for (const p of PILLARS) {
      const slug = p.href.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
      expect(slug.startsWith("xfree-"), `pillar ${p.id} href still has 'xfree-' prefix: ${p.href}`).toBe(false);
    }
  });

  it("no two pillars share an href", () => {
    const seen = new Set<string>();
    for (const p of PILLARS) {
      expect(seen.has(p.href), `duplicate pillar href: ${p.href}`).toBe(false);
      seen.add(p.href);
    }
  });

  it("platform pillar 'XFree Studio' points to https://app.xfree.in/", () => {
    const studio = findPillarByHref("https://app.xfree.in/");
    expect(studio?.name).toBe("XFree Studio");
  });

  it("the 60 tool pillars are grouped into 6 header dropdowns in order", () => {
    expect(HEADER_GROUPS.length).toBe(6);
    const labels = HEADER_GROUPS.map((g) => g.label);
    expect(labels).toEqual([
      "XFree Dev & Data",
      "XFree Web & SEO",
      "XFree AI & Automation",
      "XFree Media & Documents",
      "XFree Security & Network",
      "XFree Business & Productivity",
    ]);
    const totalItems = HEADER_GROUPS.reduce((n, g) => n + g.items.length, 0);
    expect(totalItems).toBe(60);
  });

  it("each header group has 10 items", () => {
    for (const g of HEADER_GROUPS) {
      expect(g.items.length, `${g.label} should have 10 items, has ${g.items.length}`).toBe(10);
    }
  });

  it("every header item uses the same 'XFree <Topic>' label as the pillar", () => {
    for (const g of HEADER_GROUPS) {
      for (const item of g.items) {
        const pillar = findPillarByHref(item.href);
        expect(pillar, `pillar not found for ${item.href}`).toBeDefined();
        expect(item.label, `label mismatch for ${item.href}`).toBe(pillar?.name);
      }
    }
  });
});

describe("PUBLIC_PILLARS / PUBLIC_HEADER_GROUPS", () => {
  it("PUBLIC_PILLARS contains only published pillars", () => {
    for (const p of PUBLIC_PILLARS) {
      expect(p.published, `${p.name} should be published`).toBe(true);
    }
  });

  it("PUBLIC_TOOL_PILLARS contains only published tool pillars (no platform)", () => {
    for (const p of PUBLIC_TOOL_PILLARS) {
      expect(p.type).toBe("tool");
      expect(p.published).toBe(true);
    }
  });

  it("PUBLIC_HEADER_GROUPS only includes published items and non-empty groups", () => {
    for (const g of PUBLIC_HEADER_GROUPS) {
      expect(g.items.length).toBeGreaterThan(0);
      for (const item of g.items) {
        expect(PUBLIC_PILLAR_HREFS.has(item.href)).toBe(true);
      }
    }
  });

  it("isPublishedPillarHref returns true for public pillar hrefs and false otherwise", () => {
    expect(isPublishedPillarHref("/dev-tools")).toBe(true);
    expect(isPublishedPillarHref("/database-tools")).toBe(false);
    expect(isPublishedPillarHref("/pillars")).toBe(true);
    expect(isPublishedPillarHref("/how-it-works")).toBe(true);
    expect(isPublishedPillarHref("/nonexistent")).toBe(false);
  });
});
