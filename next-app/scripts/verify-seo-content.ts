#!/usr/bin/env npx tsx
// Audits real tool data against the two SEO metrics that have an actual,
// checkable target: meta description length (search engines truncate
// around 155-160 chars) and title length (50-60 chars avoids truncation
// in search results - titles under 50 aren't a defect, just noted).
//
// Deliberately does NOT check keyword density (Google has said for years
// it doesn't count keyword frequency this way - a hard density % target
// just re-teaches keyword stuffing) or Flesch-Kincaid readability (that
// formula is built for paragraphs of prose, not 100-200 word technical
// tool descriptions - it produces a number, not a meaningful one).
//
// Run via `npm run verify:seo-content`.
import { TOOLS } from "../lib/data/toolsWithSEO";
import { truncateForMeta } from "../lib/seo/metaDescription";

const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESC_MIN = 140;
const DESC_MAX = 160;
const MIN_FAQ_COUNT = 1;

let warnings = 0;
let actionable = 0;

function warn(label: string, detail: string) {
  console.log(`  WARN  ${label} — ${detail}`);
  warnings++;
}

function action(label: string, detail: string) {
  console.log(`  FIX?  ${label} — ${detail}`);
  actionable++;
}

function main() {
  const tools = TOOLS.filter((t) => t.indexable);
  console.log(`\n=== SEO content audit: ${tools.length} indexable tools ===\n`);

  for (const tool of tools) {
    const title = `XFree ${tool.title} — Free Online, No Signup`;
    if (title.length < TITLE_MIN) {
      warn(`${tool.slug}: title`, `${title.length} chars, under the ${TITLE_MIN}-${TITLE_MAX} target ("${title}") - not truncated in results, just shorter than ideal`);
    } else if (title.length > TITLE_MAX) {
      action(`${tool.slug}: title`, `${title.length} chars, over ${TITLE_MAX} - risks truncation in search results ("${title}")`);
    }

    const rawDesc = tool.longDescription || tool.shortDescription;
    if (rawDesc.length > DESC_MAX) {
      const after = truncateForMeta(rawDesc, DESC_MAX);
      action(`${tool.slug}: description`, `source is ${rawDesc.length} chars (meta tag now truncates to ${after.length}: "${after}")`);
    } else if (rawDesc.length < DESC_MIN) {
      warn(`${tool.slug}: description`, `${rawDesc.length} chars, under the ${DESC_MIN}-${DESC_MAX} target`);
    }

    if (!tool.faqs || tool.faqs.length < MIN_FAQ_COUNT) {
      warn(`${tool.slug}: faqs`, `${tool.faqs?.length ?? 0} FAQ entries - thin content, no FAQPage schema will render for this page`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  ${actionable} description(s) now truncated for the meta tag (source copy on-page is unchanged)`);
  console.log(`  ${warnings} other item(s) noted (short titles, thin descriptions, missing FAQs) - not auto-fixed, for editorial review`);
  console.log(`\nNote: title/description length here reflect the *meta tag* generated in`);
  console.log(`app/[locale]/tools/[[...slug]]/page.tsx's generateMetadata, not on-page copy.`);
}

main();
