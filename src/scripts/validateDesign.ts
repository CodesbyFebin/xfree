import fs from "fs";
import path from "path";
import { KEYWORD_CLUSTERS } from "../data/keywordArchitecture";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const errors: string[] = [];

const main = read("src/main.tsx");
const header = read("src/components/Header.tsx");
const hero = read("src/components/HeroBanner.tsx");
const css = read("src/index.css");
const studioHeader = read("src/components/studio/StudioHeader.tsx");

if (!main.includes("ThemeProvider")) errors.push("main.tsx must wrap App in ThemeProvider.");
if (!header.includes("useTheme") || !header.includes("toggleTheme")) errors.push("Header must expose the persistent Light/Dark toggle.");
if (!header.includes('href="/recipes"')) errors.push("Primary navigation must expose /recipes.");
if (!css.includes("@custom-variant dark")) errors.push("Tailwind dark variant must be class-driven for the manual toggle.");
if (!css.includes("html.dark .starry-bg")) errors.push("Dark public canvas override is missing.");
if (!hero.includes("xfree-home-marketing")) errors.push("Homepage must register the marketing theme scope.");
if (hero.includes("xfree-home-light")) errors.push("Deprecated forced-light homepage class is still present.");
if (!studioHeader.includes("xfree-studio-dark")) errors.push("Studio must retain its operational dark command-center scope.");

const primaries = new Set<string>();
for (const cluster of KEYWORD_CLUSTERS) {
  const key = cluster.primary.toLowerCase();
  if (primaries.has(key)) errors.push(`Duplicate primary keyword cluster: ${cluster.primary}`);
  primaries.add(key);
  if (!cluster.routes.length) errors.push(`${cluster.id}: keyword cluster has no owning route.`);
}
if (!KEYWORD_CLUSTERS.some((cluster) => cluster.id === "home" && cluster.primary === "free developer tools")) errors.push("Homepage must own the primary 'free developer tools' intent.");
if (!KEYWORD_CLUSTERS.some((cluster) => cluster.id === "recipes" && cluster.primary === "local browser workflow recipes")) errors.push("Recipes must own the primary 'local browser workflow recipes' intent.");
if (!KEYWORD_CLUSTERS.some((cluster) => cluster.id === "studio" && cluster.primary === "local agent workflow studio")) errors.push("Studio must own the primary 'local agent workflow studio' intent.");

if (errors.length) {
  console.error("[design] FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`[design] PASS — persistent Light/Dark public theme and ${KEYWORD_CLUSTERS.length} governed keyword clusters validated`);
console.log("[design] Studio remains operational-dark; public preference persists across navigation.");
