import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  GeneratedEditorialSchema,
  ToolGenerationSpecSchema,
  type GeneratedEditorial,
  type PublicationApproval,
  type ToolGenerationSpec,
} from "./schemas";
import type { CacheProvider } from "./cache-provider";
import { evaluateAndCacheCandidate } from "./evaluate-and-cache";
import type { PublicationResult } from "./validate";

export interface ContentGenerationProvider {
  generate(spec: ToolGenerationSpec, prompt: string): Promise<unknown>;
}

export interface BatchOptions {
  provider: ContentGenerationProvider;
  cache: CacheProvider;
  availableStudioEngineIds: ReadonlySet<string>;
  approvals?: ReadonlyMap<string, PublicationApproval>;
  publishedDirectory: string;
  reviewDirectory: string;
  delayMs?: number;
}

export interface BatchSummary {
  published: number;
  pendingReview: number;
  draft: number;
  failed: number;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function sourceFingerprint(spec: ToolGenerationSpec): string {
  return createHash("sha256").update(stableJson(spec)).digest("hex");
}

export function buildGenerationPrompt(spec: ToolGenerationSpec): string {
  return [
    "Write structured technical documentation for the supplied XFree tool specification.",
    "Return only data matching the requested editorial schema; do not return HTML.",
    "Do not invent users, testimonials, benchmarks, libraries, browser support, payload limits, or privacy guarantees.",
    "Use only facts present in the specification. Treat missing evidence as unknown and state the limitation.",
    "Include one direct definition, technical behavior, instructions, at least one exact input/output example, edge cases, and 3–8 troubleshooting FAQs.",
    "Do not add an H1 inside body content. The renderer owns the page heading.",
    "Aim for 500–850 useful words, but never add filler to reach a number.",
    "Address supplied high-intent search questions naturally when present; never repeat them mechanically or stuff keywords.",
    "Processing language must match the supplied local, cloud, or hybrid evidence.",
    `Specification: ${stableJson(spec)}`,
  ].join("\n");
}

function writeJsonAtomically(directory: string, slug: string, value: unknown): void {
  fs.mkdirSync(directory, { recursive: true });
  const destination = path.join(directory, `${slug}.json`);
  const temporary = `${destination}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporary, destination);
}

function readReviewCandidate(
  directory: string,
  spec: ToolGenerationSpec,
  expectedSourceFingerprint: string,
): unknown | null {
  const file = path.join(directory, `${spec.slug}.json`);
  if (!fs.existsSync(file)) return null;
  const payload = JSON.parse(fs.readFileSync(file, "utf8")) as {
    spec?: unknown;
    content?: unknown;
    metadata?: unknown;
  };
  const queuedSpec = ToolGenerationSpecSchema.safeParse(payload.spec);
  if (!queuedSpec.success || sourceFingerprint(queuedSpec.data) !== expectedSourceFingerprint) return null;
  return { ...queuedSpec.data, content: payload.content, metadata: payload.metadata };
}

async function wait(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function runGenerationBatch(rawSpecs: readonly unknown[], options: BatchOptions): Promise<BatchSummary> {
  const summary: BatchSummary = { published: 0, pendingReview: 0, draft: 0, failed: 0 };

  for (const rawSpec of rawSpecs) {
    const parsedSpec = ToolGenerationSpecSchema.safeParse(rawSpec);
    if (!parsedSpec.success) {
      summary.failed += 1;
      continue;
    }

    const spec = parsedSpec.data;
    const fingerprint = sourceFingerprint(spec);
    const cached = options.cache.get(spec.slug);
    if (cached?.status === "published" && cached.sourceFingerprint === fingerprint) {
      summary.published += 1;
      continue;
    }

    try {
      const approval = options.approvals?.get(spec.slug);
      const queuedCandidate = readReviewCandidate(options.reviewDirectory, spec, fingerprint);
      if (cached?.status === "pending_review" && cached.sourceFingerprint === fingerprint && queuedCandidate && !approval) {
        summary.pendingReview += 1;
        continue;
      }
      const approvedReviewCandidate = approval
        ? queuedCandidate
        : null;
      const candidate = approvedReviewCandidate ?? await (async () => {
        const generated = await options.provider.generate(spec, buildGenerationPrompt(spec));
        const editorial = GeneratedEditorialSchema.parse(generated) as GeneratedEditorial;
        return { ...spec, ...editorial };
      })();
      const result = evaluateAndCacheCandidate(candidate, spec.slug, {
        cache: options.cache,
        availableStudioEngineIds: options.availableStudioEngineIds,
        approval,
        sourceFingerprint: fingerprint,
      });
      persistResult(spec, result, options, fingerprint, approval);
      if (result.status === "published") summary.published += 1;
      else if (result.status === "pending_review") summary.pendingReview += 1;
      else summary.draft += 1;
    } catch {
      summary.failed += 1;
    } finally {
      options.cache.flush();
      await wait(options.delayMs ?? 0);
    }
  }

  return summary;
}

function persistResult(
  spec: ToolGenerationSpec,
  result: PublicationResult,
  options: BatchOptions,
  specFingerprint: string,
  approval?: PublicationApproval,
): void {
  const payload = {
    schemaVersion: 1,
    slug: spec.slug,
    pillarSlug: spec.pillarSlug,
    sourceFingerprint: specFingerprint,
    spec,
    status: result.status,
    indexable: result.indexable,
    robots: result.robots,
    wordCount: result.wordCount,
    contentFingerprint: result.contentFingerprint,
    studioDeepLink: result.studioDeepLink,
    jsonLd: result.jsonLd,
    content: result.candidate?.content,
    metadata: result.candidate?.metadata
      ? { ...result.candidate.metadata, canonical: `https://www.xfree.in/tools/${spec.slug}` }
      : undefined,
    processing: spec.processing,
    approval: result.status === "published" ? approval : undefined,
    reviewErrors: result.errors,
    similarityMatch: result.similarityMatch,
  };
  writeJsonAtomically(
    result.status === "published" ? options.publishedDirectory : options.reviewDirectory,
    spec.slug,
    payload,
  );
}
