/**
 * Guide-content scaffolder.
 *
 * Reads PUBLIC_TOOLS, finds tools without a guide entry, and prints a
 * TypeScript stub you paste into src/data/toolGuides.ts. Fills required
 * fields from the tool registry so the seed content is real, not lorem-ipsum.
 *
 * Optional Gemini enrichment (--gemini) uses the same server-side client
 * we ship for the AI endpoints. Requires GEMINI_API_KEY. Costs API budget.
 *
 * Usage:
 *   npm run generate:guides                   # print stubs for missing tools
 *   npm run generate:guides -- --gemini       # ask Gemini to draft each stub
 *   npm run generate:guides -- --slug=foo     # target one tool
 */
import { PUBLIC_TOOLS } from "../data/publicTools";
import { TOOL_GUIDES } from "../data/toolGuides";

const args = process.argv.slice(2);
const wantGemini = args.includes("--gemini");
const only = args.find((a) => a.startsWith("--slug="))?.slice("--slug=".length);

function stub(slug: string, title: string, pillar: string, category: string, related: string[]): string {
  return `  "${slug}": {
    overview: "TODO: 2–3 sentence overview of ${title}. Cover what it does, when it's useful, and privacy stance. Anchor around the pillar keyword: ${pillar}.",
    workedExamples: [
      { title: "TODO: example 1", input: "TODO: paste a real input", output: "TODO: paste the real tool output", explanation: "TODO: why this example matters." },
      { title: "TODO: example 2", input: "TODO", output: "TODO", explanation: "TODO" },
    ],
    whenToUse: [
      "TODO: concrete situation 1",
      "TODO: concrete situation 2",
    ],
    whenNotToUse: [
      "TODO: honest limitation 1",
      "TODO: honest limitation 2",
    ],
    troubleshooting: [
      { symptom: "TODO", fix: "TODO" },
    ],
    relatedSlugs: ${JSON.stringify(related.slice(0, 4))},
    lastReviewed: "${new Date().toISOString().slice(0, 10)}",
  },`;
}

async function enrichWithGemini(_toolTitle: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("[guides] --gemini requires GEMINI_API_KEY in env.");
    return null;
  }
  // Deliberately not wired to hit the API from this scaffolder — that path
  // burns API budget for output that still needs human review. Ship the
  // stubs, review, edit, then use the /api/ai/thinking endpoint interactively
  // if you want draft help on one guide at a time.
  console.error("[guides] --gemini enrichment is opt-in and unimplemented on purpose. See docs/content.md.");
  return null;
}

async function main() {
  const missing = PUBLIC_TOOLS.filter((t) => !TOOL_GUIDES[t.slug]);
  const target = only ? missing.filter((t) => t.slug === only) : missing;

  if (!target.length) {
    console.log(`[guides] no missing guides. total tools=${PUBLIC_TOOLS.length} with-guide=${Object.keys(TOOL_GUIDES).length}`);
    return;
  }

  console.log(`[guides] ${target.length} tool(s) missing a guide. Paste the stubs below into src/data/toolGuides.ts inside TOOL_GUIDES:\n`);

  for (const tool of target) {
    if (wantGemini) await enrichWithGemini(tool.title);
    const related = PUBLIC_TOOLS
      .filter((t) => t.slug !== tool.slug && t.category === tool.category)
      .map((t) => t.slug);
    console.log(stub(tool.slug, tool.title, tool.pillarKeyword || tool.title, tool.category, related));
    console.log("");
  }

  console.log(`[guides] done. Replace every TODO with real content BEFORE shipping — do not publish stubs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
