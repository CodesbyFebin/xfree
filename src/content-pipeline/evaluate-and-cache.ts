import type { PublicationApproval } from "./schemas";
import type { CacheProvider } from "./cache-provider";
import { validateForPublication, type PublicationResult } from "./validate";

export interface EvaluationOptions {
  cache: CacheProvider;
  availableStudioEngineIds: ReadonlySet<string>;
  approval?: PublicationApproval;
  similarityThreshold?: number;
  sourceFingerprint?: string;
}

export function evaluateAndCacheCandidate(raw: unknown, slug: string, options: EvaluationOptions): PublicationResult {
  const corpus = options.cache.entries()
    .filter((entry) => entry.slug !== slug && entry.text.trim().length > 0)
    .map((entry) => ({ slug: entry.slug, text: entry.text }));

  const result = validateForPublication(raw, {
    availableStudioEngineIds: options.availableStudioEngineIds,
    similarityCorpus: corpus,
    similarityThreshold: options.similarityThreshold,
    approval: options.approval,
  });

  if (result.contentFingerprint && result.comparisonText !== undefined) {
    options.cache.set({
      slug,
      contentFingerprint: result.contentFingerprint,
      sourceFingerprint: options.sourceFingerprint,
      text: result.comparisonText,
      status: result.status,
      wordCount: result.wordCount,
      updatedAt: new Date().toISOString(),
      errors: result.errors,
    });
  }

  return result;
}
