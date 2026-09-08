import type { SignalCategory } from './sources';

export interface SignalItem {
  sourceId: string;
  sourceName: string;
  title: string;
  url: string;
  publishedAt: string; // ISO string
  categories: SignalCategory[];
}
