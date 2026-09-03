import { describe, it, expect } from "vitest";
import {
  PILLARS_60,
  PUBLIC_PILLARS,
  PUBLIC_HEADER_GROUPS,
  PUBLIC_AUTHORITY_PILLARS,
  AUTHORITY_PILLARS,
  HEADER_GROUPS,
  getPillarBySlug,
  pillarResponseForStatus,
  type PillarStatus,
} from "../pillarRegistry";

describe("Pillar Registry — contract", () => {
  it("defines exactly 60 topical pillars", () => {
    expect(PILLARS_60).toHaveLength(60);
  });

  it("every pillar slug is unique", () => {
    const slugs = PILLARS_60.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(60);
  });

  it("every pillar id is unique", () => {
    const ids = PILLARS_60.map((p) => p.id);
    expect(new Set(ids).size).toBe(60);
  });

  it("every pillar name starts with 'XFree '", () => {
    const offenders = PILLARS_60.filter((p) => !p.name.startsWith("XFree "));
    expect(offenders).toEqual([]);
  });

  it("every pillar name uses the display contract (no xfree- prefix in URL)", () => {
    const offenders = PILLARS_60.filter((p) => p.slug.startsWith("xfree-"));
    expect(offenders).toEqual([]);
  });

  it("every pillar declares a headerGroup from the six allowed values", () => {
    const allowed = new Set(HEADER_GROUPS.map((g) => g.id));
    const offenders = PILLARS_60.filter((p) => !allowed.has(p.headerGroup));
    expect(offenders).toEqual([]);
  });

  it("every pillar declares a valid PillarStatus", () => {
    const valid: PillarStatus[] = ["draft", "pending_review", "published", "retired"];
    const offenders = PILLARS_60.filter((p) => !valid.includes(p.status));
    expect(offenders).toEqual([]);
  });

  it("the six header groups each hold up to 10 pillars", () => {
    for (const group of HEADER_GROUPS) {
      const pillarsInGroup = PILLARS_60.filter((p) => p.headerGroup === group.id);
      expect(pillarsInGroup.length).toBeLessThanOrEqual(10);
    }
  });
});

describe("PUBLIC_PILLARS — derived visibility", () => {
  it("only includes pillars with status='published' AND indexable=true AND contentApproved=true", () => {
    const publicPillars = PILLARS_60.filter(
      (p) => p.status === "published" && p.indexable === true && p.contentApproved === true,
    );
    expect(PUBLIC_PILLARS).toEqual(publicPillars);
  });

  it("never exposes draft, pending_review, or retired pillars", () => {
    const offenders = PUBLIC_PILLARS.filter((p) => p.status !== "published");
    expect(offenders).toEqual([]);
  });

  it("no published pillar has more than 10 entries (group cap)", () => {
    for (const group of HEADER_GROUPS) {
      const groupPillars = PUBLIC_PILLARS.filter((p) => p.headerGroup === group.id);
      expect(groupPillars.length).toBeLessThanOrEqual(10);
    }
  });
});

describe("PUBLIC_HEADER_GROUPS — six-group contract", () => {
  it("derives pillars from PUBLIC_PILLARS via headerGroup", () => {
    for (const group of PUBLIC_HEADER_GROUPS) {
      const expected = PUBLIC_PILLARS.filter((p) => p.headerGroup === group.id);
      expect(group.pillars).toEqual(expected);
    }
  });

  it("drops groups that have no published pillars", () => {
    for (const group of PUBLIC_HEADER_GROUPS) {
      expect(group.pillars.length).toBeGreaterThan(0);
    }
  });
});

describe("Authority pillars — nine-platform contract", () => {
  it("defines exactly 9 platform pillars", () => {
    expect(AUTHORITY_PILLARS).toHaveLength(9);
  });

  it("the Studio pillar is the only one with external=true", () => {
    const studio = AUTHORITY_PILLARS.find((p) => p.id === "studio");
    expect(studio?.external).toBe(true);
    const externalCount = AUTHORITY_PILLARS.filter((p) => p.external).length;
    expect(externalCount).toBe(1);
  });

  it("OpenHost and Downloads are not indexable until their service ships", () => {
    const openhost = AUTHORITY_PILLARS.find((p) => p.id === "openhost");
    const downloads = AUTHORITY_PILLARS.find((p) => p.id === "downloads");
    expect(openhost?.indexable).toBe(false);
    expect(downloads?.indexable).toBe(false);
  });

  it("PUBLIC_AUTHORITY_PILLARS filters non-indexable entries", () => {
    const publicAuth = AUTHORITY_PILLARS.filter((p) => p.status === "published" && p.indexable === true);
    expect(PUBLIC_AUTHORITY_PILLARS).toEqual(publicAuth);
  });
});

describe("pillarResponseForStatus — HTTP contract", () => {
  it("returns 200 for published", () => {
    expect(pillarResponseForStatus({ status: "published" } as any)).toBe(200);
  });
  it("returns 404 for draft and pending_review", () => {
    expect(pillarResponseForStatus({ status: "draft" } as any)).toBe(404);
    expect(pillarResponseForStatus({ status: "pending_review" } as any)).toBe(404);
  });
  it("returns 410 for retired", () => {
    expect(pillarResponseForStatus({ status: "retired" } as any)).toBe(410);
  });
});

describe("getPillarBySlug", () => {
  it("returns the matching pillar", () => {
    const p = getPillarBySlug("dev-tools");
    expect(p?.name).toBe("XFree Developer Tools");
  });
  it("returns undefined for unknown slugs", () => {
    expect(getPillarBySlug("not-a-real-pillar")).toBeUndefined();
  });
});
