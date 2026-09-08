import fs from "fs";
import path from "path";
import {
  generateSitemapXml,
  generatePagesSitemapXml,
  generateToolsSitemapXml,
  generateGuidesSitemapXml,
  generateSitemapIndexXml,
  generateRssXml,
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateRobotsTxt,
  generateAiTxt,
  generateSecurityTxt,
  generateHumansTxt,
  generateJsonFeed,
} from "../utils/generateSitemap";
import { generateCapabilitiesJson, generateToolsJson, generateProblemPagesSitemap } from "../utils/generateStructuredData";
import { INDEXNOW_KEY, INDEXNOW_KEY_FILE } from "../utils/indexNow";

function runGenerator() {
  const publicDir = path.join(process.cwd(), "public");
  const wellKnownDir = path.join(publicDir, ".well-known");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(wellKnownDir)) {
    fs.mkdirSync(wellKnownDir, { recursive: true });
  }

  const baseUrl = process.env.BASE_URL || "https://www.xfree.in";

  const files: Record<string, string> = {
    "sitemap.xml": generateSitemapXml(baseUrl),
    "sitemap-index.xml": generateSitemapIndexXml(baseUrl),
    "sitemap-pages.xml": generatePagesSitemapXml(baseUrl),
    "sitemap-tools.xml": generateToolsSitemapXml(baseUrl),
    "sitemap-guides.xml": generateGuidesSitemapXml(baseUrl),
    "rss.xml": generateRssXml(baseUrl),
    "feed.json": generateJsonFeed(baseUrl),
    "llms.txt": generateLlmsTxt(baseUrl),
    "llms-full.txt": generateLlmsFullTxt(baseUrl),
    "robots.txt": generateRobotsTxt(baseUrl),
    "ai.txt": generateAiTxt(baseUrl),
    "humans.txt": generateHumansTxt(baseUrl),
    "capabilities.json": generateCapabilitiesJson(baseUrl),
    "tools.json": generateToolsJson(baseUrl),
    "problem-pages-sitemap.xml": generateProblemPagesSitemap(baseUrl),
    [INDEXNOW_KEY_FILE]: INDEXNOW_KEY,
  };

  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(publicDir, name), content, "utf-8");
  }

  const securityTxt = generateSecurityTxt(baseUrl);
  fs.writeFileSync(path.join(wellKnownDir, "security.txt"), securityTxt, "utf-8");
  fs.writeFileSync(path.join(publicDir, "security.txt"), securityTxt, "utf-8");

  // AI crawler discovery files — also place at /.well-known/ (RFC 9116 pattern)
  // so crawlers that probe .well-known/ find them automatically.
  const wellKnownFiles: Record<string, string> = {
    "ai.txt": generateAiTxt(baseUrl),
    "llms.txt": generateLlmsTxt(baseUrl),
    "llms-full.txt": generateLlmsFullTxt(baseUrl),
    "capabilities.json": generateCapabilitiesJson(baseUrl),
  };
  for (const [name, content] of Object.entries(wellKnownFiles)) {
    fs.writeFileSync(path.join(wellKnownDir, name), content, "utf-8");
  }

  const generated = [...Object.keys(files), ".well-known/security.txt", "security.txt", ".well-known/ai.txt", ".well-known/llms.txt", ".well-known/llms-full.txt", ".well-known/capabilities.json"];
  console.log(`Successfully generated ${generated.length} machine-readable files in /public: ${generated.join(", ")}`);
}

runGenerator();
