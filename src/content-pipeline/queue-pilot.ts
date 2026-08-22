import fs from "node:fs";
import path from "node:path";
import { JsonCacheProvider } from "./cache-provider";
import { evaluateAndCacheCandidate } from "./evaluate-and-cache";
import { sourceFingerprint } from "./orchestrator";
import { ToolCandidateSchema } from "./schemas";
import { LOCAL_ENGINES } from "../lib/studio/engines";

const ROOT = process.cwd();
const PILOT_DIRECTORY = path.join(ROOT, "content", "pilot");
const REVIEW_DIRECTORY = path.join(ROOT, ".xfree-review-queue");
const CACHE_FILE = path.join(ROOT, ".xfree-build-cache.json");

function writeAtomically(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, file);
}

function main(): void {
  const cache = new JsonCacheProvider(CACHE_FILE);
  const engineIds = new Set(LOCAL_ENGINES.map((engine) => engine.id));
  const files = fs.readdirSync(PILOT_DIRECTORY).filter((file) => file.endsWith(".json")).sort();
  let queued = 0;

  for (const file of files) {
    const candidate = ToolCandidateSchema.parse(JSON.parse(fs.readFileSync(path.join(PILOT_DIRECTORY, file), "utf8")));
    const spec = ToolCandidateSchema.omit({ content: true, metadata: true }).parse(candidate);
    const result = evaluateAndCacheCandidate(candidate, candidate.slug, {
      cache,
      availableStudioEngineIds: engineIds,
      sourceFingerprint: sourceFingerprint(spec),
    });
    if (result.status === "draft") throw new Error(`${candidate.slug} failed pilot gates: ${result.errors.join("; ")}`);
    writeAtomically(path.join(REVIEW_DIRECTORY, `${candidate.slug}.json`), {
      schemaVersion: 1,
      slug: candidate.slug,
      pillarSlug: candidate.pillarSlug,
      sourceFingerprint: sourceFingerprint(spec),
      spec,
      status: "pending_review",
      indexable: false,
      robots: "noindex, nofollow",
      wordCount: result.wordCount,
      contentFingerprint: result.contentFingerprint,
      content: candidate.content,
      metadata: candidate.metadata,
      processing: candidate.processing,
      reviewErrors: result.errors,
      similarityMatch: result.similarityMatch,
    });
    queued += 1;
  }
  cache.flush();
  console.log(`Queued ${queued} pilot page(s) for human review; none were published.`);
}

main();
