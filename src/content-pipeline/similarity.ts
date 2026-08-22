export interface SimilarityDocument {
  slug: string;
  text: string;
}

export interface SimilarityMatch {
  slug: string;
  score: number;
}

export function normalizeForSimilarity(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function wordNgrams(value: string, size = 3): Set<string> {
  if (!Number.isInteger(size) || size < 1) throw new Error("N-gram size must be a positive integer");
  const tokens = normalizeForSimilarity(value);
  const grams = new Set<string>();
  if (tokens.length > 0 && tokens.length < size) {
    grams.add(tokens.join(" "));
    return grams;
  }
  for (let index = 0; index <= tokens.length - size; index += 1) {
    grams.add(tokens.slice(index, index + size).join(" "));
  }
  return grams;
}

export function jaccardSimilarity(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  if (left.size === 0 && right.size === 0) return 1;
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

export function findClosestDocument(text: string, corpus: readonly SimilarityDocument[], ngramSize = 3): SimilarityMatch | null {
  const candidate = wordNgrams(text, ngramSize);
  let closest: SimilarityMatch | null = null;
  for (const document of corpus) {
    const score = jaccardSimilarity(candidate, wordNgrams(document.text, ngramSize));
    if (!closest || score > closest.score) closest = { slug: document.slug, score };
  }
  return closest;
}
