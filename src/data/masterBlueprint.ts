/**
 * Master Blueprint — aggregate re-exports for all pillar, cluster, and
 * editorial data used by the app shell, server, and prerender pipeline.
 *
 * Centralised so that components/pages import from one barrel file
 * rather than reaching into internal data modules.
 */

export {
  PILLARS_60,
  type PillarDefinition,
  type PillarCategory,
  PILLAR_CATEGORIES,
  HEADER_GROUPS,
  type HeaderGroup,
  AUTHORITY_PILLARS,
  type AuthorityPillar,
  PUBLIC_PILLARS,
  PUBLIC_AUTHORITY_PILLARS,
  PUBLIC_HEADER_GROUPS,
  INDEXED_PILLARS,
  PILLARS_BY_SLUG,
  PILLARS_BY_CATEGORY,
  getPillarBySlug,
  getRelatedPillars,
  pillarResponseForStatus,
  getGitHubIssueUrl,
  CLUSTERS_50,
} from "./pillarRegistry";

export {
  CLUSTERS_600,
  type ClusterDefinition,
  type ClusterStatus,
  PUBLIC_CLUSTERS,
  DRAFT_CLUSTERS,
  CLUSTER_BY_SLUG,
  CLUSTER_COUNTS,
  getClusterBySlug,
  getClustersForPillar,
  getPublishedClustersForPillar,
  clusterResponseForStatus,
} from "./clusterRegistry";

export {
  PILLAR_EDITORIAL,
  type PillarEditorialContent,
  type PillarFaqEntry,
  getPillarEditorial,
  getRelatedPillars as getRelatedPillarsByEditorial,
} from "./pillarEditorial";

import { PILLARS_60 } from "./pillarRegistry";
import { CLUSTERS_600 } from "./clusterRegistry";

/** Total concept count shown on the roadmap: 60 pillars × 10 clusters = 600 */
export const ROADMAP_CONCEPT_COUNT = 600;

/** Pillars_50 — alias for the 50 topical pillars + roadmap extras.
 *  Some legacy imports reference PILLARS_50; we alias to PILLARS_60. */
export const PILLARS_50: typeof PILLARS_60 = PILLARS_60;

/** Total cluster count for search indexing */
export const TOTAL_CLUSTERS = CLUSTERS_600.length;

/** 10 search modifiers for roadmap concept expansion */
export const MODIFIERS_10: string[] = [
  "online", "free", "client-side", "privacy-first", "no-signup",
  "no-install", "open-source", "browser-based", "instant", "offline-capable",
];
