import fs from "fs";
import path from "path";
import {
  generateSitemapXml,
  generateSitemapIndexXml,
  generatePagesSitemapXml,
  generateToolsSitemapXml,
  generateGuidesSitemapXml,
  generateRssXml,
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateRobotsTxt,
} from "../utils/generateSitemap";
import { generateCapabilitiesJson, generateToolsJson } from "../utils/generateStructuredData";
import { generateOpenApiJson } from "../utils/generateOpenApi";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { WORKFLOW_RECIPES, getShareableRecipe } from "../data/recipes";
import { INDEXABLE_PILLARS } from "../data/pillarPublishing";
import { ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";
import { SITE_CONTENT_LASTMOD } from "../data/siteConfig";

function runGenerator() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const baseUrl = "https://www.xfree.in";

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), generateSitemapXml(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-index.xml"), generateSitemapIndexXml(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-pages.xml"), generatePagesSitemapXml(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-tools.xml"), generateToolsSitemapXml(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-guides.xml"), generateGuidesSitemapXml(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "rss.xml"), generateRssXml(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "llms.txt"), generateLlmsTxt(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "llms-full.txt"), generateLlmsFullTxt(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "robots.txt"), generateRobotsTxt(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "capabilities.json"), generateCapabilitiesJson(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "tools.json"), generateToolsJson(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "openapi.json"), generateOpenApiJson(baseUrl), "utf-8");
  fs.writeFileSync(path.join(publicDir, "recipes.json"), JSON.stringify({
    schemaVersion: 1,
    canonical: `${baseUrl}/recipes`,
    executionPolicy: "Recipe steps are declarative IDs only; Agent Studio revalidates every engine and transform before local execution.",
    recipes: WORKFLOW_RECIPES.map((recipe) => ({
      ...getShareableRecipe(recipe),
      title: recipe.title,
      url: `${baseUrl}/recipes/${recipe.slug}`,
      studioUrl: `https://app.xfree.in/?recipe=${encodeURIComponent(recipe.slug)}`,
      description: recipe.shortDescription,
    })),
  }, null, 2) + "\n", "utf-8");

  const health = {
    status: "build-metadata",
    service: "www.xfree.in",
    canonicalOrigin: baseUrl,
    version: process.env.npm_package_version || "0.1.0",
    contentLastReviewed: SITE_CONTENT_LASTMOD,
    publishedTools: PUBLIC_TOOLS.length,
    publishedRecipes: WORKFLOW_RECIPES.length,
    indexablePillars: INDEXABLE_PILLARS.length,
    roadmapConcepts: ROADMAP_CONCEPT_COUNT,
    roadmapDisclaimer: "Roadmap concepts are planned taxonomy entries, not live or indexed tools.",
    runtimeHealthEndpoint: `${baseUrl}/api/health`,
    note: "This static file describes the build. Use /api/health for runtime liveness.",
    endpoints: { sitemap: `${baseUrl}/sitemap-index.xml`, llms: `${baseUrl}/llms.txt`, tools: `${baseUrl}/tools.json`, recipes: `${baseUrl}/recipes.json`, openapi: `${baseUrl}/openapi.json`, github: "https://github.com/CodesbyFebin/xfree" },
  };
  fs.writeFileSync(path.join(publicDir, "health.json"), JSON.stringify(health, null, 2) + "\n", "utf-8");

  const entity = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${baseUrl}/#website`,
    name: "XFree",
    alternateName: ["XFree.in", "XFree App"],
    url: `${baseUrl}/`,
    description: "Free browser-based developer and technical SEO tools, plus inspectable local workflow recipes and clearly disclosed optional AI features.",
    sameAs: ["https://github.com/CodesbyFebin/xfree"],
    disambiguatingDescription: "XFree.in is a browser-tool and local workflow platform and is unrelated to the historical XFree86 X Window System implementation.",
  };
  fs.writeFileSync(path.join(publicDir, "entities.json"), JSON.stringify(entity, null, 2) + "\n", "utf-8");

  const knowledgeGraph = {
    schemaVersion: 1,
    canonicalEntity: `${baseUrl}/#website`,
    canonicalOrigin: baseUrl,
    repository: "https://github.com/CodesbyFebin/xfree",
    relationships: [
      { subject: "XFree", predicate: "publishes", object: "PublishedTools", count: PUBLIC_TOOLS.length },
      { subject: "XFree", predicate: "publishes", object: "WorkflowRecipes", count: WORKFLOW_RECIPES.length },
      { subject: "WorkflowRecipes", predicate: "executeWith", object: "AllowlistedLocalEnginesAndTransforms" },
      { subject: "XFree", predicate: "organizesRoadmapWith", object: "ToolPillars", count: 50 },
      { subject: "ToolPillars", predicate: "indexableWhen", object: "ContainsPublishedTool" },
      { subject: "Roadmap", predicate: "containsPlannedConcepts", object: ROADMAP_CONCEPT_COUNT },
    ],
  };
  fs.writeFileSync(path.join(publicDir, "knowledge-graph.json"), JSON.stringify(knowledgeGraph, null, 2) + "\n", "utf-8");

  fs.writeFileSync(path.join(publicDir, "ai.txt"), [
    "# XFree.in AI/agent discovery note",
    "# This is an informational, non-standard file. robots.txt remains the crawl-control source.",
    `Canonical: ${baseUrl}/`,
    `Published tools: ${PUBLIC_TOOLS.length}`,
    `Published local recipes: ${WORKFLOW_RECIPES.length}`,
    `Roadmap concepts: ${ROADMAP_CONCEPT_COUNT} (planning taxonomy; not a live-tool count)`,
    `LLM summary: ${baseUrl}/llms.txt`,
    `Full published reference: ${baseUrl}/llms-full.txt`,
    `Tool catalog: ${baseUrl}/tools.json`,
    `Recipe catalog: ${baseUrl}/recipes.json`,
    `OpenAPI: ${baseUrl}/openapi.json`,
    "Repository: https://github.com/CodesbyFebin/xfree",
    "Processing: published recipes are local; individual tools document local vs optional cloud behavior. Do not assume every platform feature is local.",
    "",
  ].join("\n"), "utf-8");

  fs.writeFileSync(path.join(publicDir, "humans.txt"), [
    "XFree.in",
    "Repository: https://github.com/CodesbyFebin/xfree",
    "License: MIT",
    "Mission: free, focused developer and SEO utilities plus inspectable local workflow recipes with transparent processing disclosures.",
    "Content policy: implementation-first; planned concepts remain outside the index until reviewed.",
    "",
  ].join("\n"), "utf-8");

  const obsoleteProblemSitemap = path.join(publicDir, "problem-pages-sitemap.xml");
  if (fs.existsSync(obsoleteProblemSitemap)) fs.unlinkSync(obsoleteProblemSitemap);

  console.log("Successfully generated canonical sitemaps, feeds, robots, LLM/discovery files, entity data, health data, capabilities, tool catalog, and recipe catalog.");
}

runGenerator();
