import { describe, it, expect } from "vitest";
import { PILLAR_EDITORIAL, getPillarEditorial, getRelatedPillars } from "../pillarEditorial";
import { PUBLIC_PILLARS, type PillarDefinition } from "../pillarRegistry";

describe("pillarEditorial (editorial content for published pillars)", () => {
  it("has content for every published pillar", () => {
    for (const pillar of PUBLIC_PILLARS) {
      expect(PILLAR_EDITORIAL[pillar.slug], `missing content for ${pillar.slug}`).toBeDefined();
    }
  });

  it("every directAnswer is a non-empty, factual string", () => {
    for (const [slug, content] of Object.entries(PILLAR_EDITORIAL)) {
      expect(content.directAnswer.length, slug).toBeGreaterThan(40);
      // Sanity: should not contain a fabricated "X users" or "verified" without ground
      expect(content.directAnswer, slug).not.toMatch(/\b\d{2,}\s+(users|reviews|tests)\b/i);
    }
  });

  it("every use case has a title and description", () => {
    for (const [slug, content] of Object.entries(PILLAR_EDITORIAL)) {
      expect(content.useCases.length, slug).toBeGreaterThan(0);
      for (const uc of content.useCases) {
        expect(uc.title.length, slug).toBeGreaterThan(3);
        expect(uc.description.length, slug).toBeGreaterThan(20);
      }
    }
  });

  it("every FAQ has 2-5 entries with substantive answers", () => {
    for (const [slug, content] of Object.entries(PILLAR_EDITORIAL)) {
      expect(content.faq.length, slug).toBeGreaterThanOrEqual(2);
      expect(content.faq.length, slug).toBeLessThanOrEqual(5);
      for (const entry of content.faq) {
        expect(entry.question.length, slug).toBeGreaterThan(8);
        expect(entry.answer.length, slug).toBeGreaterThan(30);
      }
    }
  });

  it("no fabricated user counts, ratings, or time-saved claims", () => {
    for (const [slug, content] of Object.entries(PILLAR_EDITORIAL)) {
      const text = JSON.stringify(content);
      expect(text, slug).not.toMatch(/\b\d+(\.\d+)?[kKmM]?\s+(users|customers|developers|reviews)\b/);
      expect(text, slug).not.toMatch(/(\d+)\s*★/);
      expect(text, slug).not.toMatch(/saves?\s+you\s+\d+/i);
    }
  });

  it("relatedPillarSlugs references only pillars in the public registry", () => {
    const known = new Set(PUBLIC_PILLARS.map((p) => p.slug));
    for (const [slug, content] of Object.entries(PILLAR_EDITORIAL)) {
      for (const ref of content.relatedPillarSlugs) {
        expect(known.has(ref), `${slug} references unknown pillar ${ref}`).toBe(true);
      }
    }
  });

  it("no pillar references itself in relatedPillarSlugs", () => {
    for (const [slug, content] of Object.entries(PILLAR_EDITORIAL)) {
      expect(content.relatedPillarSlugs, slug).not.toContain(slug);
    }
  });

  it("every entry has a lastReviewed date", () => {
    for (const [slug, content] of Object.entries(PILLAR_EDITORIAL)) {
      expect(content.lastReviewed, slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("getPillarEditorial", () => {
  it("returns the editorial record for a known slug", () => {
    expect(getPillarEditorial("dev-tools")?.pillarSlug).toBe("dev-tools");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getPillarEditorial("not-a-real-pillar")).toBeUndefined();
  });
});

describe("getRelatedPillars", () => {
  it("returns the related pillars for a published pillar", () => {
    const devTools = PUBLIC_PILLARS.find((p) => p.slug === "dev-tools");
    expect(devTools).toBeDefined();
    if (!devTools) return;
    const related = getRelatedPillars(devTools, PUBLIC_PILLARS);
    expect(related.length).toBeGreaterThan(0);
    for (const p of related) expect(p.slug).not.toBe("dev-tools");
  });

  it("returns an empty array for a pillar with no editorial", () => {
    const synthetic: PillarDefinition = {
      id: 999,
      name: "XFree Synthetic",
      slug: "synthetic-test",
      icon: "?",
      description: "test",
      headerGroup: "dev-data",
      status: "draft",
      indexable: false,
      contentApproved: false,
      approvedClusterIds: [],
      verifiedToolSlugs: [],
      lastmod: "2026-09-01",
    };
    const out = getRelatedPillars(synthetic, PUBLIC_PILLARS);
    expect(out).toEqual([]);
  });
});
