import type { SignalCategory } from './sources';

// Real tool slugs only (verified against lib/data/toolsWithSEO.ts) -
// picked for genuine topical relevance per category, not just padding.
export const CATEGORY_RELATED_TOOLS: Record<SignalCategory, string[]> = {
  ai: ['json-formatter', 'json-validator', 'word-counter'],
  'web-development': ['css-minifier', 'html-minifier', 'js-minifier'],
  'open-source': ['diff-tool', 'markdown-editor', 'uuid-generator'],
  security: ['hash-generator', 'jwt-decoder', 'password-generator'],
  browser: ['meta-tag-generator', 'url-validator', 'robots-txt-generator'],
};
