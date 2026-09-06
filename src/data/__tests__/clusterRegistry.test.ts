import { describe, it, expect } from "vitest";
import {
  PILLARS_60,
  HEADER_GROUPS,
  AUTHORITY_PILLARS,
  PUBLIC_PILLARS,
  PUBLIC_HEADER_GROUPS,
  PUBLIC_AUTHORITY_PILLARS,
  getPillarBySlug,
  pillarResponseForStatus,
} from "../pillarRegistry";
import {
  CLUSTERS_600,
  PUBLIC_CLUSTERS,
  DRAFT_CLUSTERS,
  CLUSTER_BY_SLUG,
  getClusterBySlug,
  getClustersForPillar,
  getPublishedClustersForPillar,
  CLUSTER_COUNTS,
} from "../clusterRegistry";

describe("60-Pillar Registry", () => {
  it("has exactly 60 topical pillars", () => {
    expect(PILLARS_60).toHaveLength(60);
  });

  it("has exactly 6 header groups", () => {
    expect(HEADER_GROUPS).toHaveLength(6);
  });

  it("has exactly 9 platform/authority pillars", () => {
    expect(AUTHORITY_PILLARS).toHaveLength(9);
  });

  it("every pillar has a unique ID and slug", () => {
    const ids = new Set(PILLARS_60.map((p) => p.id));
    const slugs = new Set(PILLARS_60.map((p) => p.slug));
    expect(ids.size).toBe(60);
    expect(slugs.size).toBe(60);
  });

  it("every pillar name begins with 'XFree'", () => {
    for (const p of PILLARS_60) {
      expect(p.name.startsWith("XFree")).toBe(true);
    }
  });

  it("every pillar has a valid headerGroup", () => {
    const validGroups = new Set(HEADER_GROUPS.map((g) => g.id));
    for (const p of PILLARS_60) {
      expect(validGroups.has(p.headerGroup)).toBe(true);
    }
  });

  it("six groups each have exactly 10 pillars", () => {
    for (const group of HEADER_GROUPS) {
      const pillarsInGroup = PILLARS_60.filter((p) => p.headerGroup === group.id);
      expect(pillarsInGroup).toHaveLength(10);
    }
  });

  it("PUBLIC_PILLARS only contains published, indexable, approved pillars", () => {
    for (const p of PUBLIC_PILLARS) {
      expect(p.status).toBe("published");
      expect(p.indexable).toBe(true);
      expect(p.contentApproved).toBe(true);
    }
  });

  it("draft pillars are excluded from PUBLIC_PILLARS", () => {
    for (const p of PUBLIC_PILLARS) {
      expect(p.status).not.toBe("draft");
    }
  });

  it("PUBLIC_HEADER_GROUPS only includes groups with published pillars", () => {
    for (const group of PUBLIC_HEADER_GROUPS) {
      expect(group.pillars.length).toBeGreaterThan(0);
    }
  });

  it("PUBLIC_AUTHORITY_PILLARS only contains published, indexable pillars", () => {
    for (const p of PUBLIC_AUTHORITY_PILLARS) {
      expect(p.status).toBe("published");
      expect(p.indexable).toBe(true);
    }
  });

  it("getPillarBySlug returns the correct pillar", () => {
    const pillar = getPillarBySlug("dev-tools");
    expect(pillar).toBeDefined();
    expect(pillar!.name).toBe("XFree Developer Tools");
  });

  it("getPillarBySlug returns undefined for unknown slug", () => {
    expect(getPillarBySlug("nonexistent-slug")).toBeUndefined();
  });

  it("pillarResponseForStatus returns correct HTTP status", () => {
    const published = PILLARS_60.find((p) => p.status === "published");
    if (published) expect(pillarResponseForStatus(published)).toBe(200);
    const draft = PILLARS_60.find((p) => p.status === "draft");
    if (draft) expect(pillarResponseForStatus(draft)).toBe(404);
  });
});

describe("600-Cluster Registry", () => {
  it("has exactly 600 cluster definitions", () => {
    expect(CLUSTERS_600).toHaveLength(600);
  });

  it("has exactly 10 clusters per pillar", () => {
    for (const pillar of PILLARS_60) {
      const clusters = getClustersForPillar(pillar.slug);
      expect(clusters).toHaveLength(10);
    }
  });

  it("every cluster has a unique ID and slug", () => {
    const ids = new Set(CLUSTERS_600.map((c) => c.id));
    const slugs = new Set(CLUSTERS_600.map((c) => c.slug));
    expect(ids.size).toBe(600);
    expect(slugs.size).toBe(600);
  });

  it("every cluster references a valid pillar", () => {
    const pillarSlugs = new Set(PILLARS_60.map((p) => p.slug));
    for (const c of CLUSTERS_600) {
      expect(pillarSlugs.has(c.pillarSlug)).toBe(true);
    }
  });

  it("all clusters start as draft", () => {
    for (const c of CLUSTERS_600) {
      expect(c.status).toBe("draft");
      expect(c.indexable).toBe(false);
      expect(c.contentApproved).toBe(false);
    }
  });

  it("PUBLIC_CLUSTERS is empty (no cluster is published yet)", () => {
    expect(PUBLIC_CLUSTERS).toHaveLength(0);
  });

  it("DRAFT_CLUSTERS equals total count", () => {
    expect(DRAFT_CLUSTERS).toHaveLength(600);
  });

  it("getClusterBySlug returns the correct cluster", () => {
    const cluster = getClusterBySlug("dev-tools/utilities-1");
    expect(cluster).toBeDefined();
    expect(cluster!.pillarSlug).toBe("dev-tools");
  });

  it("getClusterBySlug returns undefined for unknown slug", () => {
    expect(getClusterBySlug("nonexistent/cluster")).toBeUndefined();
  });

  it("getPublishedClustersForPillar returns empty for all pillars", () => {
    for (const pillar of PILLARS_60) {
      expect(getPublishedClustersForPillar(pillar.slug)).toHaveLength(0);
    }
  });

  it("CLUSTER_COUNTS reports correct totals", () => {
    expect(CLUSTER_COUNTS.total).toBe(600);
    expect(CLUSTER_COUNTS.published).toBe(0);
    expect(CLUSTER_COUNTS.draft).toBe(600);
    expect(CLUSTER_COUNTS.pillars).toBe(60);
  });
});