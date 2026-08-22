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
import { INDEXABLE_PILLARS } from "../data/pillarPublishing";
import { ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";
import { SITE_CONTENT_LASTMOD } from "../data/siteConfig";

function runGenerator() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const baseUrl = "https://www.xfree.in";

  const sitemapContent = generateSitemapXml(baseUrl);
  const sitemapIndexContent = generateSitemapIndexXml(baseUrl);
  const sitemapPagesContent = generatePagesSitemapXml(baseUrl);
  const sitemapToolsContent = generateToolsSitemapXml(baseUrl);
  const sitemapGuidesContent = generateGuidesSitemapXml(baseUrl);
  const rssContent = generateRssXml(baseUrl);
  const llmsContent = generateLlmsTxt(baseUrl);
  const llmsFullContent = generateLlmsFullTxt(baseUrl);
  const robotsContent = generateRobotsTxt(baseUrl);
  const capabilitiesContent = generateCapabilitiesJson(baseUrl);
  const toolsContent = generateToolsJson(baseUrl);
  const openApiContent = generateOpenApiJson(baseUrl);

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-index.xml"), sitemapIndexContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-pages.xml"), sitemapPagesContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-tools.xml"), sitemapToolsContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "sitemap-guides.xml"), sitemapGuidesContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "rss.xml"), rssContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "llms.txt"), llmsContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "llms-full.txt"), llmsFullContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "capabilities.json"), capabilitiesContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "tools.json"), toolsContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "openapi.json"), openApiContent, "utf-8");

  // Supplemental machine-readable trust/discovery surfaces. These files are
  // descriptive and intentionally make no claim of being Google ranking signals.
  const health = {
    status: "build-metadata",
    service: "www.xfree.in",
    canonicalOrigin: baseUrl,
    version: process.env.npm_package_version || "0.1.0",
    contentLastReviewed: SITE_CONTENT_LASTMOD,
    publishedTools: PUBLIC_TOOLS.length,
    indexablePillars: INDEXABLE_PILLARS.length,
    roadmapConcepts: ROADMAP_CONCEPT_COUNT,
    roadmapDisclaimer: "Roadmap concepts are planned taxonomy entries, not live or indexed tools.",
    runtimeHealthEndpoint: `${baseUrl}/api/health`,
    note: "This static file describes the build. Use /api/health for runtime liveness.",
    endpoints: { sitemap: `${baseUrl}/sitemap-index.xml`, llms: `${baseUrl}/llms.txt`, tools: `${baseUrl}/tools.json`, openapi: `${baseUrl}/openapi.json`, github: "https://github.com/CodesbyFebin/xfree" },
  };
  fs.writeFileSync(path.join(publicDir, "health.json"), JSON.stringify(health, null, 2) + "\n", "utf-8");

  const entity = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${baseUrl}/#website`,
    name: "XFree",
    alternateName: ["XFree.in", "XFree App"],
    url: `${baseUrl}/`,
    description: "Free browser-based developer, technical SEO, formatter, converter, and clearly disclosed AI micro-tools.",
    sameAs: ["https://github.com/CodesbyFebin/xfree"],
    disambiguatingDescription: "XFree.in is a browser-tool platform and is unrelated to the historical XFree86 X Window System implementation.",
  };
  fs.writeFileSync(path.join(publicDir, "entities.json"), JSON.stringify(entity, null, 2) + "\n", "utf-8");

  const knowledgeGraph = {
    schemaVersion: 1,
    canonicalEntity: `${baseUrl}/#website`,
    canonicalOrigin: baseUrl,
    repository: "https://github.com/CodesbyFebin/xfree",
    relationships: [
      { subject: "XFree", predicate: "publishes", object: "PublishedTools", count: PUBLIC_TOOLS.length },
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
    `Roadmap concepts: ${ROADMAP_CONCEPT_COUNT} (planning taxonomy; not a live-tool count)`,
    `LLM summary: ${baseUrl}/llms.txt`,
    `Full published-tool reference: ${baseUrl}/llms-full.txt`,
    `Tool catalog: ${baseUrl}/tools.json`,
    `OpenAPI: ${baseUrl}/openapi.json`,
    "Repository: https://github.com/CodesbyFebin/xfree",
    "Processing: each published tool documents local vs optional cloud behavior; do not assume all features are local.",
    "",
  ].join("\n"), "utf-8");

  fs.writeFileSync(path.join(publicDir, "humans.txt"), [
    "XFree.in",
    "Repository: https://github.com/CodesbyFebin/xfree",
    "License: MIT",
    "Mission: free, focused developer and SEO utilities with transparent processing disclosures.",
    "Content policy: implementation-first; planned concepts remain outside the index until reviewed.",
    "",
  ].join("\n"), "utf-8");

  const obsoleteProblemSitemap = path.join(publicDir, "problem-pages-sitemap.xml");
  if (fs.existsSync(obsoleteProblemSitemap)) fs.unlinkSync(obsoleteProblemSitemap);

  console.log("Successfully generated canonical sitemaps, feeds, robots, LLM/discovery files, entity data, health data, capabilities, and tools catalog.");
}

runGenerator();
