// Was previously a second, hand-maintained 58-tool array duplicating
// toolsWithSEO.ts's TOOLS_WITH_SEO - same slugs/status/indexable/execution
// values (verified by diffing both files - see
// docs/PUBLICATION_CONTRACT.md), but ~50 different shortDescription
// strings and one different title (cron-parser) that had silently drifted
// apart since whichever point they were split. Consolidated to a single
// source of truth: everything importing TOOLS or CATEGORIES from here now
// gets the exact same data as the tool detail pages, sitemap.ts, and
// Signals' matchTools.ts.
export { TOOLS, CATEGORIES } from './toolsWithSEO';

import { TOOLS, CATEGORIES } from './toolsWithSEO';

export const INDEXABLE_TOOL_SLUGS = TOOLS.filter((t) => t.indexable).map((t) => t.slug);

export const TOOLS_BY_CATEGORY = new Map(CATEGORIES.map((cat) => [cat.id, TOOLS.filter((t) => t.category === cat.id)]));

export function getToolsByCategory(categoryId: string) {
  return TOOLS_BY_CATEGORY.get(categoryId as (typeof CATEGORIES)[number]['id']) || [];
}
