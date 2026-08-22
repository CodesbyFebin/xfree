import fs from "node:fs";
import path from "node:path";
import { getRoadmapCatalog } from "../utils/search25k";

interface Options {
  count: number;
  offset: number;
  pillar: string;
  output?: string;
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readOptions(): Options {
  const rawCount = Number(argValue("--count") ?? 5);
  const rawOffset = Number(argValue("--offset") ?? 0);
  const pillar = (argValue("--pillar") ?? "all").trim() || "all";
  const output = argValue("--output");

  return {
    count: Number.isFinite(rawCount) ? Math.max(1, Math.min(10, Math.floor(rawCount))) : 5,
    offset: Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0,
    pillar,
    output,
  };
}

const options = readOptions();
const planned = getRoadmapCatalog()
  .filter((item) => item.status === "planned")
  .filter((item) => options.pillar === "all" || item.pillarSlug === options.pillar)
  .slice(options.offset, options.offset + options.count)
  .map((item) => ({
    id: item.id,
    title: `Build: ${item.name}`,
    pillar: item.pillar,
    pillarSlug: item.pillarSlug,
    concept: item.name,
    body: [
      "## Tool request",
      "",
      `**Concept:** ${item.name}`,
      `**Pillar:** ${item.pillar}`,
      `**Roadmap ID:** ${item.id}`,
      "",
      item.description,
      "",
      "## Publication requirements",
      "",
      "- [ ] Implement real working functionality in the current React/TypeScript architecture.",
      "- [ ] Define inputs, outputs, edge cases, and error states.",
      "- [ ] Prefer local/browser processing where appropriate; disclose any cloud or hybrid handoff.",
      "- [ ] Add automated tests and keyboard-accessible controls.",
      "- [ ] Add truthful documentation, examples, limitations, and processing disclosure.",
      "- [ ] Keep the concept out of the public sitemap until publication gates pass.",
      "- [ ] Run `npm run verify` before requesting merge when dependencies are available.",
      "",
      "See: https://www.xfree.in/contribute",
    ].join("\n"),
  }));

const json = `${JSON.stringify(planned, null, 2)}\n`;
if (options.output) {
  const outputPath = path.resolve(options.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, json, "utf8");
  console.error(`Wrote ${planned.length} deterministic good-first-issue candidate(s) to ${outputPath}`);
} else {
  process.stdout.write(json);
}
