/**
 * Truncates text for a meta description / og:description / twitter:description
 * tag, which search engines and social platforms cut off (mid-word, mid-sentence,
 * wherever) somewhere around 155-160 characters. This trims at the last whole
 * word boundary that fits, so the visible snippet always ends cleanly instead
 * of getting hard-clipped by the platform in a way that reads as broken.
 *
 * This only affects the META tag - full on-page copy (longDescription,
 * explanation, etc.) is untouched, since that serves a different purpose
 * (complete context for a human reader) than a search-result snippet.
 */
export function truncateForMeta(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  const hardCut = text.slice(0, maxLength - 1);
  const lastSpace = hardCut.lastIndexOf(' ');
  const trimmed = lastSpace > 0 ? hardCut.slice(0, lastSpace) : hardCut;
  return `${trimmed.replace(/[.,;:]$/, '')}…`;
}
