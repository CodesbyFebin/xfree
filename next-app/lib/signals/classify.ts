import type { SignalCategory, SignalSource } from './sources';

// Keyword → category heuristic. A title matching a keyword adds that
// category in addition to the source's own defaultCategories, so e.g. a
// GitHub Blog post about "AI code review" still surfaces under AI as
// well as Open Source rather than only ever bucketing by source.
const KEYWORD_CATEGORIES: { pattern: RegExp; category: SignalCategory }[] = [
  { pattern: /\b(ai|llm|gpt|model|agent|machine learning|neural|embedding)\b/i, category: 'ai' },
  { pattern: /\b(security|vulnerabilit|cve|exploit|encrypt|auth|breach)\b/i, category: 'security' },
  { pattern: /\b(chrome|firefox|safari|webkit|browser|devtools|web platform)\b/i, category: 'browser' },
  { pattern: /\b(open source|open-source|github|git|repository|license)\b/i, category: 'open-source' },
  { pattern: /\b(css|javascript|typescript|react|framework|api|performance|accessibility|html)\b/i, category: 'web-development' },
];

export function classify(title: string, source: SignalSource): SignalCategory[] {
  const matched = new Set<SignalCategory>(source.defaultCategories);
  for (const { pattern, category } of KEYWORD_CATEGORIES) {
    if (pattern.test(title)) matched.add(category);
  }
  return Array.from(matched);
}
