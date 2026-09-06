// XFree Cluster Registry — authoritative source for the 600 governed
// sub-clusters under the 60 topical pillars. Every cluster carries explicit
// lifecycle fields. Visibility in navigation, sitemap, and prerender is
// derived from PUBLIC_CLUSTERS — no cluster is published automatically.

import { PILLARS_60, type PillarDefinition } from "./pillarRegistry";

export type ClusterStatus = "draft" | "pending_review" | "published" | "retired";

export interface ClusterDefinition {
  id: string;
  pillarSlug: string;
  name: string;
  slug: string;
  description: string;
  status: ClusterStatus;
  indexable: boolean;
  contentApproved: boolean;
  relatedToolSlugs: string[];
  relatedGuideSlugs: string[];
  siblingClusterIds: string[];
  lastmod: string;
}

// The 60 cluster types that map to each pillar's ten sub-clusters.
// These are the canonical cluster categories — not all 600 are published.
export const CLUSTER_TYPES: string[] = [
  "utilities", "generators", "converters", "validators", "analyzers",
  "formatters", "debuggers", "optimizers", "testers", "builders",
  "calculators", "encoders-decoders", "visualizers", "linters", "simulators",
  "playgrounds", "extractors", "mappers", "transformers", "compilers",
  "snippets", "templates", "checkers", "monitors", "scanners",
  "profilers", "benchmarkers", "migrators", "synchronizers", "packagers",
  "bundlers", "transpilers", "polyfills", "shims", "mockers",
  "stubs", "fakers", "data-generators", "parsers", "serializers",
  "deserializers", "query-builders", "schema-designers", "indexers", "cachers",
  "traffic-shapers", "rate-limiters", "webhook-testers", "cli-builders", "sdk-generators",
  "documenters", "reporters", "notifiers", "archivers", "uploaders",
  "downloaders", "previewers", "converters-media", "editors", "reviewers",
  "annotators", "summarizers", "translators", "validators-advanced", "orchestrators",
];

// Ten sub-cluster slots per topical pillar. Each slot is a governed record
// with a unique ID, slug, and description. All start as draft.
function cluster(
  pillar: PillarDefinition,
  index: number,
  name: string,
  description: string,
  relatedToolSlugs: string[] = [],
  relatedGuideSlugs: string[] = [],
  status: ClusterStatus = "draft",
): ClusterDefinition {
  const slug = `${pillar.slug}/${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
  return {
    id: `${pillar.slug}::${slug.split("/")[1]}`,
    pillarSlug: pillar.slug,
    name,
    slug,
    description,
    status,
    indexable: false,
    contentApproved: false,
    relatedToolSlugs,
    relatedGuideSlugs,
    siblingClusterIds: [],
    lastmod: "2026-09-03",
  };
}

// Generate 10 sub-cluster slots for each of the 60 topical pillars.
// All start as draft — publication requires content approval.
export const CLUSTERS_600: ClusterDefinition[] = [];
for (const pillar of PILLARS_60) {
  for (let i = 0; i < 10; i++) {
    const typeName = CLUSTER_TYPES[i % CLUSTER_TYPES.length];
    const name = `${typeName} ${i + 1}`;
    const description = `${name} under the ${pillar.name} pillar. Draft until content-reviewed and approved.`;
    CLUSTERS_600.push(cluster(pillar, i, name, description));
  }
}

// Derived public collections — single source of truth.
export const PUBLIC_CLUSTERS: ClusterDefinition[] = CLUSTERS_600.filter(
  (cluster) =>
    cluster.status === "published" &&
    cluster.indexable === true &&
    cluster.contentApproved === true,
);

export const DRAFT_CLUSTERS: ClusterDefinition[] = CLUSTERS_600.filter(
  (cluster) => cluster.status === "draft" || !cluster.contentApproved,
);

export const CLUSTER_BY_SLUG: ReadonlyMap<string, ClusterDefinition> = new Map(
  CLUSTERS_600.map((c) => [c.slug, c]),
);

export function getClusterBySlug(slug: string): ClusterDefinition | undefined {
  return CLUSTER_BY_SLUG.get(slug);
}

export function getClustersForPillar(pillarSlug: string): ClusterDefinition[] {
  return CLUSTERS_600.filter((c) => c.pillarSlug === pillarSlug);
}

export function getPublishedClustersForPillar(pillarSlug: string): ClusterDefinition[] {
  return PUBLIC_CLUSTERS.filter((c) => c.pillarSlug === pillarSlug);
}

export function clusterResponseForStatus(cluster: ClusterDefinition): 200 | 404 | 410 {
  if (cluster.status === "published") return 200;
  if (cluster.status === "retired") return 410;
  return 404;
}

// Counts for validation and reporting.
export const CLUSTER_COUNTS = {
  total: CLUSTERS_600.length,
  published: PUBLIC_CLUSTERS.length,
  draft: DRAFT_CLUSTERS.length,
  pillars: PILLARS_60.length,
  types: CLUSTER_TYPES.length,
};