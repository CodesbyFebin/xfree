import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { ApprovalStore } from "./approval-store";
import { JsonCacheProvider } from "./cache-provider";
import { flattenToolSpecs, validateReleaseDataset } from "./dataset";
import { GeminiContentGenerationProvider } from "./gemini-provider";
import { runGenerationBatch } from "./orchestrator";
import { LOCAL_ENGINES } from "../lib/studio/engines";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = argument(name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`--${name} must be a positive integer`);
  return value;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const datasetFile = path.resolve(argument("dataset") ?? path.join(root, "content", "dataset", "xfree-1500-v1.json"));
  if (!fs.existsSync(datasetFile)) throw new Error(`Authoritative dataset not found: ${datasetFile}`);

  const checked = validateReleaseDataset(JSON.parse(fs.readFileSync(datasetFile, "utf8")));
  if (!checked.valid || !checked.dataset) throw new Error(`Dataset hard gate failed: ${checked.errors.join("; ")}`);

  const pillar = argument("pillar");
  const limit = positiveInteger("limit", Number.MAX_SAFE_INTEGER);
  const allSpecs = flattenToolSpecs(checked.dataset);
  const selected = allSpecs.filter((spec) => !pillar || spec.pillarSlug === pillar).slice(0, limit);
  if (selected.length === 0) throw new Error(`No tool specifications matched${pillar ? ` pillar ${pillar}` : ""}`);
  if (selected.length > 50 && !process.argv.includes("--confirm-full")) {
    throw new Error(`Refusing to generate ${selected.length} pages without --confirm-full. Start with --pillar <slug> or --limit 50.`);
  }

  const availableEngineIds = new Set(LOCAL_ENGINES.map((engine) => engine.id));
  const missingEngineIds = [...new Set(selected.map((spec) => spec.engine.id).filter((id) => !availableEngineIds.has(id)))];
  if (missingEngineIds.length > 0) {
    throw new Error(`Generation preflight failed: ${missingEngineIds.length} selected Studio engines are not registered (${missingEngineIds.slice(0, 10).join(", ")}${missingEngineIds.length > 10 ? ", …" : ""})`);
  }

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const provider = new GeminiContentGenerationProvider(apiKey, process.env.GEMINI_BATCH_MODEL ?? "gemini-2.5-flash");
  const cache = new JsonCacheProvider(path.join(root, ".xfree-build-cache.json"));
  const approvals = new ApprovalStore(path.join(root, "content-approvals.json"));
  const delayMs = positiveInteger("delay-ms", 1500);

  console.log(`Generating ${selected.length} of ${allSpecs.length} validated specifications${pillar ? ` in ${pillar}` : ""}.`);
  const summary = await runGenerationBatch(selected, {
    provider,
    cache,
    approvals: approvals.asMap(),
    availableStudioEngineIds: availableEngineIds,
    publishedDirectory: path.join(root, "content", "published"),
    reviewDirectory: path.join(root, ".xfree-review-queue"),
    delayMs,
  });
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed > 0 || summary.draft > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
