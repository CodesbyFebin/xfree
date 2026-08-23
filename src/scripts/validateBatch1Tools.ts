import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BATCH1_PUBLISHED_TOOLS } from "../data/publishedBatch1Tools";
import { PUBLIC_TOOLS } from "../data/publicTools";
import { LOCAL_ENGINES } from "../lib/studio/engines";

const errors: string[] = [];
const engineIds = new Set(LOCAL_ENGINES.map((engine) => engine.id));
const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const source = readFileSync(resolve(process.cwd(), "src/components/tools/LocalEngineToolComponent.tsx"), "utf8");

if (BATCH1_PUBLISHED_TOOLS.length !== 50) errors.push(`Expected exactly 50 Batch 1 tools, found ${BATCH1_PUBLISHED_TOOLS.length}.`);

const ids = new Set<string>();
const slugs = new Set<string>();
const titles = new Set<string>();
let shortest = { slug: "", words: Number.POSITIVE_INFINITY };

for (const tool of BATCH1_PUBLISHED_TOOLS) {
  if (ids.has(tool.id)) errors.push(`${tool.slug}: duplicate id ${tool.id}`);
  if (slugs.has(tool.slug)) errors.push(`${tool.slug}: duplicate slug`);
  if (titles.has(tool.title)) errors.push(`${tool.slug}: duplicate title ${tool.title}`);
  ids.add(tool.id);
  slugs.add(tool.slug);
  titles.add(tool.title);

  if (tool.execution !== "local") errors.push(`${tool.slug}: execution must be local`);
  if (tool.status !== "published") errors.push(`${tool.slug}: status must be published`);
  if (tool.indexable !== true) errors.push(`${tool.slug}: indexable must be true`);
  if (tool.shortDescription.length < 70 || tool.shortDescription.length > 160) {
    errors.push(`${tool.slug}: description length ${tool.shortDescription.length}; expected 70–160 characters`);
  }
  if (!tool.securityReview?.passed) errors.push(`${tool.slug}: securityReview.passed must be true`);
  if ((tool.faqs?.length ?? 0) < 3) errors.push(`${tool.slug}: requires at least 3 visible FAQ items`);

  const marker = tool.toolComponent || "";
  if (!marker.startsWith("local-engine:")) {
    errors.push(`${tool.slug}: missing local-engine runtime marker`);
  } else {
    const engineId = marker.slice("local-engine:".length);
    if (engineId !== tool.id) errors.push(`${tool.slug}: engine marker ${engineId} must match tool id ${tool.id}`);
    if (!engineIds.has(engineId)) errors.push(`${tool.slug}: unknown local engine ${engineId}`);
  }

  const publisherText = [
    tool.explanation,
    ...(tool.howToUse || []),
    ...(tool.keyFeatures || []),
    ...(tool.benefits || []),
    ...(tool.useCases || []),
    ...tool.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ...(tool.limitations || []),
  ].join(" ");
  const words = wordCount(publisherText);
  if (words < 350) errors.push(`${tool.slug}: only ${words} publisher-content words; minimum is 350`);
  if (words < shortest.words) shortest = { slug: tool.slug, words };
}

for (const tool of BATCH1_PUBLISHED_TOOLS) {
  if (!PUBLIC_TOOLS.some((candidate) => candidate.slug === tool.slug)) errors.push(`${tool.slug}: missing from PUBLIC_TOOLS`);
}

if (/\bfetch\s*\(/.test(source)) errors.push("LocalEngineToolComponent must not perform network fetches.");
if (/innerHTML/.test(source)) errors.push("LocalEngineToolComponent must not use innerHTML.");
if (!source.includes("LOCAL_ENGINES")) errors.push("LocalEngineToolComponent must execute the shared Studio engine registry.");
if (!source.includes("Ctrl+Shift+C")) errors.push("LocalEngineToolComponent must document the keyboard copy shortcut.");

if (errors.length) {
  console.error(`\n[batch1] FAIL — ${errors.length} invariant(s) broken:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`[batch1] PASS — ${BATCH1_PUBLISHED_TOOLS.length} local tools publication-gated`);
console.log(`[batch1] public catalog: ${PUBLIC_TOOLS.length} tool(s)`);
console.log(`[batch1] shortest documentation: ${shortest.slug} (${shortest.words} words)`);
console.log("[batch1] runtime: shared LOCAL_ENGINES; no fetch(); no innerHTML");
