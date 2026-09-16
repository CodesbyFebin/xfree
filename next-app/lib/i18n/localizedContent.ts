import { getMessages } from 'next-intl/server';
import type { ToolDefinition } from '@/types';
// lib/data/pillars.ts has its own PillarDefinition (category: PillarCategory,
// a union type) distinct from @/types's more generic one (category: string) -
// every real pillar object in the app flows through the former, so that's
// the one this needs to merge onto without a type mismatch.
import type { PillarDefinition } from '@/lib/data/pillars';

type ToolTranslation = Partial<
  Pick<ToolDefinition, 'title' | 'shortDescription' | 'longDescription' | 'explanation' | 'howToUse' | 'faqs'>
>;
type PillarTranslation = Partial<Pick<PillarDefinition, 'name' | 'description'>>;

/**
 * Loads this locale's tool/pillar translation tables (messages/*.json's
 * "Tools"/"Pillars" namespaces, keyed by slug) once per request. English
 * needs no lookup - the tool/pillar data objects already ARE the English
 * copy, so translations are only stored for the other 9 locales.
 */
export async function loadContentTranslations(locale: string) {
  if (locale === 'en') return { tools: {}, pillars: {} };
  const messages = await getMessages({ locale });
  return {
    tools: ((messages as Record<string, unknown>).Tools ?? {}) as Record<string, ToolTranslation>,
    pillars: ((messages as Record<string, unknown>).Pillars ?? {}) as Record<string, PillarTranslation>,
  };
}

/**
 * Merges a tool's translated fields (if this slug has been translated for
 * the current locale) over its English source data. Untranslated tools -
 * most of them, translation is incremental - fall through unchanged, so a
 * partially-translated catalog never shows a missing-content gap.
 */
export function localizeTool(tool: ToolDefinition, tools: Record<string, ToolTranslation>): ToolDefinition {
  const translation = tools[tool.slug];
  return translation ? { ...tool, ...translation } : tool;
}

export function localizePillar(pillar: PillarDefinition, pillars: Record<string, PillarTranslation>): PillarDefinition {
  const translation = pillars[pillar.slug];
  return translation ? { ...pillar, ...translation } : pillar;
}
