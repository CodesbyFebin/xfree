import type { SignalCategory } from './sources';

export interface SignalItem {
  sourceId: string;
  sourceName: string;
  title: string;
  /** RSS <description> / Atom <summary>, HTML-stripped and length-capped.
   *  Optional because a minority of feeds omit it entirely - matching
   *  (see matchTools.ts) falls back to title-only when absent. */
  summary?: string;
  url: string;
  publishedAt: string; // ISO string
  categories: SignalCategory[];
}
