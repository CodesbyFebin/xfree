import fs from "fs";
import path from "path";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { ROADMAP_CONCEPT_COUNT } from "../data/masterBlueprint";
import { INDEXABLE_PILLARS } from "../data/pillarPublishing";

const start = "<!-- XFREE_STATS_START -->";
const end = "<!-- XFREE_STATS_END -->";
const readmePath = path.join(process.cwd(), "README.md");
const input = fs.readFileSync(readmePath, "utf8");

if (!input.includes(start) || !input.includes(end)) {
  throw new Error("README stats markers are missing");
}

const block = [
  start,
  `- **Published local tools:** ${PUBLIC_TOOLS.length}`,
  `- **Roadmap concepts:** ${ROADMAP_CONCEPT_COUNT.toLocaleString("en-US")}`,
  `- **Indexable pillars with published tools:** ${INDEXABLE_PILLARS.length}`,
  '- **Canonical host:** `https://www.xfree.in`',
  '- **Publication rule:** only implementation-backed, reviewed, local tools may enter the public sitemap.',
  end,
].join("\n");

const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
const output = input.replace(pattern, block);
fs.writeFileSync(readmePath, output, "utf8");
console.log(`[readme:stats] tools=${PUBLIC_TOOLS.length} roadmap=${ROADMAP_CONCEPT_COUNT} pillars=${INDEXABLE_PILLARS.length}`);
