import fs from "fs";
import path from "path";
import { CANONICAL_ORIGIN, SITE_CONTENT_LASTMOD } from "../data/siteConfig";
import { RECIPES, recipeSharePayload } from "../data/recipes";

const PUBLIC = path.join(process.cwd(), "public");

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

function recipeUrl(slug?: string) {
  return slug ? `${CANONICAL_ORIGIN}/recipes/${slug}` : `${CANONICAL_ORIGIN}/recipes`;
}

function appendUrls(fileName: string) {
  const filePath = path.join(PUBLIC, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`${fileName} must exist before recipe discovery generation.`);
  let xml = fs.readFileSync(filePath, "utf8");
  const urls = [recipeUrl(), ...RECIPES.map((recipe) => recipeUrl(recipe.slug))];
  const rows = urls
    .filter((url) => !xml.includes(`<loc>${escapeXml(url)}</loc>`))
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${SITE_CONTENT_LASTMOD}</lastmod>\n  </url>`)
    .join("\n");
  if (rows) xml = xml.replace("</urlset>", `${rows}\n</urlset>`);
  fs.writeFileSync(filePath, xml, "utf8");
}

function appendLlmsFile(fileName: string, full: boolean) {
  const filePath = path.join(PUBLIC, fileName);
  if (!fs.existsSync(filePath)) return;
  let text = fs.readFileSync(filePath, "utf8");
  if (text.includes("## Workflow Recipes")) return;
  text += `\n## Workflow Recipes\n\n`;
  text += `- [Workflow Recipes](${recipeUrl()}): Versioned, deterministic local workflows composed from allowlisted XFree engines.\n`;
  for (const recipe of RECIPES) {
    text += `- [${recipe.title}](${recipeUrl(recipe.slug)}): ${recipe.summary}`;
    if (full) text += ` Steps: ${recipe.steps.map((step) => step.engineId || step.transformId).join(" → ")}.`;
    text += `\n`;
  }
  fs.writeFileSync(filePath, text, "utf8");
}

function writeRecipeJson() {
  const recipeDir = path.join(PUBLIC, "recipes");
  fs.mkdirSync(recipeDir, { recursive: true });
  const catalog = RECIPES.map((recipe) => ({
    id: recipe.id,
    slug: recipe.slug,
    version: recipe.version,
    title: recipe.title,
    summary: recipe.summary,
    url: recipeUrl(recipe.slug),
    studioUrl: `https://app.xfree.in/?recipe=${encodeURIComponent(recipe.slug)}`,
    share: recipeSharePayload(recipe),
  }));
  fs.writeFileSync(path.join(PUBLIC, "recipes.json"), JSON.stringify({ schemaVersion: 1, generatedFrom: "src/data/recipes.ts", recipes: catalog }, null, 2), "utf8");
  for (const recipe of RECIPES) {
    fs.writeFileSync(path.join(recipeDir, `${recipe.slug}.json`), JSON.stringify({
      schemaVersion: 1,
      id: recipe.id,
      slug: recipe.slug,
      version: recipe.version,
      title: recipe.title,
      summary: recipe.summary,
      description: recipe.description,
      mode: recipe.mode,
      llmRequired: recipe.llmRequired,
      canonical: recipeUrl(recipe.slug),
      studioUrl: `https://app.xfree.in/?recipe=${encodeURIComponent(recipe.slug)}`,
      share: recipeSharePayload(recipe),
    }, null, 2), "utf8");
  }
}

appendUrls("sitemap-pages.xml");
appendUrls("sitemap.xml");
appendLlmsFile("llms.txt", false);
appendLlmsFile("llms-full.txt", true);
writeRecipeJson();
console.log(`[recipes] discovery PASS — ${RECIPES.length} recipe URLs added to sitemap + machine-readable catalog`);
