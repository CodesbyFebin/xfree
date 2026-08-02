import fs from "fs";
import path from "path";
import { generateSitemapXml, generateRssXml, generateLlmsTxt, generateLlmsFullTxt, generateRobotsTxt } from "../utils/generateSitemap";

function runGenerator() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const baseUrl = process.env.BASE_URL || "https://www.xfree.in";

  const sitemapContent = generateSitemapXml(baseUrl);
  const rssContent = generateRssXml(baseUrl);
  const llmsContent = generateLlmsTxt(baseUrl);
  const llmsFullContent = generateLlmsFullTxt(baseUrl);
  const robotsContent = generateRobotsTxt(baseUrl);

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "rss.xml"), rssContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "llms.txt"), llmsContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "llms-full.txt"), llmsFullContent, "utf-8");
  fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsContent, "utf-8");

  console.log("Successfully generated sitemap.xml, rss.xml, llms.txt, llms-full.txt, and robots.txt in /public!");
}

runGenerator();
