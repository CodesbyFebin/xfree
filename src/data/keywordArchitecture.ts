export interface KeywordCluster {
  id: string;
  primary: string;
  secondary: readonly string[];
  intent: "brand" | "tool" | "workflow" | "category" | "product";
  routes: readonly string[];
}

/**
 * Human-readable keyword architecture for copy and metadata consistency.
 * This is not a keyword-stuffing source and is never emitted as <meta name="keywords">.
 * One primary phrase should lead each page; secondary phrases are optional language
 * variants that may appear only when they improve the actual copy.
 */
export const KEYWORD_CLUSTERS: readonly KeywordCluster[] = [
  {
    id: "home",
    primary: "free developer tools",
    secondary: ["browser developer tools", "no signup developer tools", "local browser tools", "technical SEO tools"],
    intent: "brand",
    routes: ["/"],
  },
  {
    id: "recipes",
    primary: "local browser workflow recipes",
    secondary: ["developer workflow recipes", "inspectable tool chains", "reproducible browser workflows", "no signup workflow tools"],
    intent: "workflow",
    routes: ["/recipes", "/recipes/*"],
  },
  {
    id: "studio",
    primary: "local agent workflow studio",
    secondary: ["browser agent workflows", "deterministic tool chaining", "WebGPU agent planning", "local developer workspace"],
    intent: "product",
    routes: ["/studio", "https://app.xfree.in/"],
  },
  {
    id: "developer-tools",
    primary: "browser developer utilities",
    secondary: ["developer formatters", "developer validators", "data conversion tools", "local developer tools"],
    intent: "category",
    routes: ["/category/developer-tools"],
  },
  {
    id: "seo-tools",
    primary: "technical SEO tools",
    secondary: ["browser SEO utilities", "sitemap tools", "metadata tools", "URL audit tools"],
    intent: "category",
    routes: ["/category/seo-tools"],
  },
  {
    id: "tool-pages",
    primary: "XFree tool",
    secondary: ["browser-based", "local when supported", "no signup", "inspectable output"],
    intent: "tool",
    routes: ["/tools/*"],
  },
] as const;

export const KEYWORD_MODIFIERS = [
  "browser-based",
  "local",
  "no signup",
  "inspectable",
  "reproducible",
  "free",
] as const;

export function keywordCluster(id: string): KeywordCluster | undefined {
  return KEYWORD_CLUSTERS.find((cluster) => cluster.id === id);
}
