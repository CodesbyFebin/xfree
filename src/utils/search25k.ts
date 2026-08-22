import { CLUSTERS_50, MODIFIERS_10, PILLARS_50, ROADMAP_CONCEPT_COUNT, getGitHubIssueUrl } from "../data/masterBlueprint";
import { PUBLIC_TOOLS } from "../data/publicTools";

export interface RoadmapSearchItem {
  id: string;
  name: string;
  slug: string;
  pillar: string;
  pillarSlug: string;
  cluster: string;
  modifier: string;
  description: string;
  status: "published" | "planned";
  liveUrl?: string;
  githubIssueUrl: string;
}

let cachedCatalog: RoadmapSearchItem[] | null = null;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getRoadmapCatalog(): RoadmapSearchItem[] {
  if (cachedCatalog) return cachedCatalog;
  const items: RoadmapSearchItem[] = [];
  let id = 1;
  for (const pillar of PILLARS_50) {
    for (const cluster of CLUSTERS_50) {
      for (const modifier of MODIFIERS_10) {
        const name = `${pillar.name} ${cluster.replace(/s$/, "")} — ${modifier}`;
        const slug = slugify(name);
        const description = `Planned ${modifier.toLowerCase()} concept for ${pillar.name.toLowerCase()} ${cluster.toLowerCase()} workflows.`;
        items.push({
          id: `R${id++}`,
          name,
          slug,
          pillar: pillar.name,
          pillarSlug: pillar.slug,
          cluster,
          modifier,
          description,
          status: "planned",
          githubIssueUrl: getGitHubIssueUrl(name, pillar.name, description),
        });
      }
    }
  }
  cachedCatalog = items;
  return items;
}

export function searchRoadmap(query: string, pillarSlug = "all", limit = 60): RoadmapSearchItem[] {
  const q = query.trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  const published: RoadmapSearchItem[] = PUBLIC_TOOLS.map<RoadmapSearchItem>((tool) => ({
    id: `published-${tool.slug}`,
    name: tool.title,
    slug: tool.slug,
    pillar: tool.categoryLabel || tool.category,
    pillarSlug: tool.category,
    cluster: "Published tools",
    modifier: tool.isAi ? "Disclosed AI processing" : "Published browser utility",
    description: tool.shortDescription,
    status: "published",
    liveUrl: `/tools/${tool.slug}`,
    githubIssueUrl: getGitHubIssueUrl(tool.title, tool.categoryLabel || tool.category, tool.shortDescription),
  })).filter((item) => {
    if (pillarSlug !== "all" && item.pillarSlug !== pillarSlug) return false;
    if (!tokens.length) return true;
    const haystack = `${item.name} ${item.description} ${item.pillar}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });

  const planned = getRoadmapCatalog().filter((item) => {
    if (pillarSlug !== "all" && item.pillarSlug !== pillarSlug) return false;
    if (!tokens.length) return true;
    const haystack = `${item.name} ${item.description} ${item.pillar} ${item.cluster} ${item.modifier}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });

  return [...published, ...planned].slice(0, limit);
}

export { ROADMAP_CONCEPT_COUNT };
