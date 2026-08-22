/**
 * Generates a transparent, heuristic keyword-opportunity matrix for XFree.
 *
 * IMPORTANT: This is NOT Ahrefs/SEMrush/DataForSEO data. It intentionally
 * avoids invented search volume/KD numbers. Scores are internal prioritization
 * signals only and must never be published as measured SEO facts.
 */
import fs from "fs";
import path from "path";
import { PUBLIC_TOOLS } from "../data/publicTools";

const OUT_DIR = path.join(process.cwd(), "reports");
const CSV_PATH = path.join(OUT_DIR, "xfree-keyword-opportunities.csv");
const MD_PATH = path.join(OUT_DIR, "xfree-keyword-opportunities.md");

const intentModifiers = [
  "no signup",
  "no login",
  "free online",
  "privacy-first",
  "browser-based",
  "local mode",
] as const;

const brandAnchors = [
  "XFree app",
  "XFree online tools",
  "XFree developer tools",
  "XFree SEO tools",
  "XFree free tools no signup",
  "XFree privacy-first tools",
] as const;

type Row = {
  keyword: string;
  target: string;
  intent: string;
  priority: number;
  evidence: string;
};

function heuristicPriority(keyword: string): number {
  let score = 50;
  if (/^XFree\b/.test(keyword)) score += 15;
  if (/no signup|no login/.test(keyword)) score += 10;
  if (/privacy-first|local mode|browser-based/.test(keyword)) score += 8;
  if (/free online/.test(keyword)) score += 6;
  return Math.min(100, score);
}

const rows: Row[] = [];
for (const keyword of brandAnchors) {
  rows.push({
    keyword,
    target: "/",
    intent: "brand + core intent",
    priority: heuristicPriority(keyword),
    evidence: "heuristic only; validate with Search Console or an external keyword provider",
  });
}

for (const tool of PUBLIC_TOOLS) {
  const base = `XFree ${tool.title}`.replace(/\s+/g, " ").trim();
  for (const modifier of intentModifiers) {
    const keyword = `${base} ${modifier}`;
    rows.push({
      keyword,
      target: `/tools/${tool.slug}`,
      intent: "brand + published tool + modifier",
      priority: heuristicPriority(keyword),
      evidence: "heuristic only; tool must remain truthful to its actual processing mode and capabilities",
    });
  }
}

rows.sort((a, b) => b.priority - a.priority || a.keyword.localeCompare(b.keyword));
fs.mkdirSync(OUT_DIR, { recursive: true });

const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
const csv = [
  ["keyword", "target", "intent", "priority", "evidence"].map(escapeCsv).join(","),
  ...rows.map((row) => [row.keyword, row.target, row.intent, row.priority, row.evidence].map(escapeCsv).join(",")),
].join("\n") + "\n";
fs.writeFileSync(CSV_PATH, csv);

const markdown = `# XFree keyword opportunity matrix\n\nGenerated from the published XFree tool registry.\n\n> These are **internal heuristic priorities**, not measured keyword difficulty or search-volume data. Validate opportunities with Google Search Console and/or a reputable external keyword provider before making market claims.\n\n## Brand disambiguation rule\n\nPrefer **XFree + specific intent/tool** language over the bare brand where it reads naturally. Do not keyword-stuff, create doorway pages, or claim guaranteed rankings.\n\n## Output\n\n- Published tools analyzed: ${PUBLIC_TOOLS.length}\n- Opportunity phrases: ${rows.length}\n- CSV: \`reports/xfree-keyword-opportunities.csv\`\n\n## Top heuristic opportunities\n\n${rows.slice(0, 20).map((row) => `- **${row.keyword}** → ${row.target} (priority ${row.priority})`).join("\n")}\n`;
fs.writeFileSync(MD_PATH, markdown);

console.log(`[keywords] wrote ${rows.length} heuristic opportunities from ${PUBLIC_TOOLS.length} published tools`);
console.log(`[keywords] ${CSV_PATH}`);
console.log(`[keywords] ${MD_PATH}`);
