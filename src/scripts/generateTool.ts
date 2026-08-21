/**
 * Tool scaffolder.
 *
 * Usage:
 *   npm run generate:tool -- --slug=word-counter --title="Word Counter" --category=text-tools --description="Count words, characters, and reading time in a text."
 *
 * What it does:
 *   1. Prints a registry entry (paste into src/data/toolsRegistry.ts as
 *      a new HAND_CRAFTED_TOOLS item — status starts as "draft").
 *   2. Writes src/components/tools/<PascalCase>.tsx as a placeholder
 *      component that renders "Not implemented yet" and a link back home.
 *      Prevents fake tools shipping — the noindex lint + build won't fail,
 *      but the tool stays hidden because its registry entry is draft.
 *   3. Prints a switch-case snippet to paste into App.tsx renderToolComponent.
 *   4. Prints a guide stub for src/data/toolGuides.ts.
 *
 * Nothing is auto-added to any registry — the operator has to paste the
 * printed snippets. This is deliberate: it forces a human read of the
 * generated stub before it can ship.
 *
 * When the component is REALLY implemented, flip status: "draft" -> "indexable"
 * and the tool will appear in the sitemap on next build.
 */
import fs from "fs";
import path from "path";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

function toPascalCase(s: string): string {
  return s.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
}

const VALID_CATEGORIES = ["seo-tools", "developer-tools", "ai-tools", "text-tools", "converters", "generators", "validators"];

function main() {
  const slug = arg("slug");
  const title = arg("title");
  const category = arg("category");
  const description = arg("description");
  const pillar = arg("pillar") || title;

  if (!slug || !title || !category || !description) {
    console.error("Usage: npm run generate:tool -- --slug=<kebab> --title=\"...\" --category=<cat> --description=\"...\" [--pillar=\"...\"]");
    console.error(`Valid categories: ${VALID_CATEGORIES.join(", ")}`);
    process.exit(2);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    console.error(`slug must be kebab-case (lowercase letters, digits, hyphens). got: ${slug}`);
    process.exit(2);
  }
  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
    process.exit(2);
  }

  const componentName = toPascalCase(slug);
  const componentPath = path.join("src", "components", "tools", `${componentName}.tsx`);

  if (fs.existsSync(componentPath)) {
    console.error(`refusing to overwrite existing component: ${componentPath}`);
    process.exit(1);
  }

  // 1. Write the component stub
  const stub = `import React from "react";
import type { ToolDefinition } from "../../types";

interface Props {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

/**
 * ${title} — placeholder component.
 *
 * TODO: implement the real tool here. Until this file has a working UI:
 * - keep the tool's registry entry at status: "draft"
 * - the tool won't appear in the sitemap or the homepage grid
 * - the route /tools/${slug} will 404 at the server
 *
 * When ready, set status to "published", indexable to true, and rebuild.
 */
export const ${componentName}: React.FC<Props> = ({ tool: _tool, onSaveHistory: _onSaveHistory }) => {
  return (
    <div className="p-8 rounded-2xl bg-slate-900/70 border border-amber-800 text-slate-200 space-y-3">
      <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Draft — not yet implemented</div>
      <h3 className="text-lg font-bold text-white">${title}</h3>
      <p className="text-sm">This tool is scaffolded but not yet functional. It will not appear publicly until implementation is complete and its registry status is set to "published" with indexable enabled.</p>
    </div>
  );
};
`;

  fs.mkdirSync(path.dirname(componentPath), { recursive: true });
  fs.writeFileSync(componentPath, stub, "utf-8");
  console.log(`[generate:tool] wrote ${componentPath}`);

  // 2. Print registry stub
  console.log("\n--- Paste into HAND_CRAFTED_TOOLS in src/data/toolsRegistry.ts ---\n");
  console.log(`  {
    id: "${slug}",
    slug: "${slug}",
    title: ${JSON.stringify(title)},
    pillarKeyword: ${JSON.stringify(pillar)},
    shortDescription: ${JSON.stringify(description)},
    category: "${category}",
    categoryLabel: ${JSON.stringify(labelForCategory(category))},
    iconName: ${JSON.stringify(iconForCategory(category))},
    execution: "local",
    status: "draft",
    indexable: false,  // set status to "published" and this to true when the component is REAL
    lastModified: "${new Date().toISOString().slice(0, 10)}",
    tags: [${JSON.stringify(pillar)}, "${category}"],
    exampleInput: "TODO: real example input",
    explanation: "TODO: 1–2 sentence explanation of what this tool does.",
    howToUse: [
      "TODO: step 1",
      "TODO: step 2",
      "TODO: step 3"
    ],
    privacyNotice: "This tool runs entirely in your browser. Input is not sent to XFree.in servers.",
    faqs: [
      { question: ${JSON.stringify(`What does ${title} do?`)}, answer: "TODO" }
    ],
    relatedToolIds: []
  },`);

  // 3. Print App.tsx switch case
  console.log("\n--- Paste into src/App.tsx renderToolComponent switch ---\n");
  console.log(`      case "${slug}":`);
  console.log(`        return <${componentName} tool={tool} onSaveHistory={saveHist} />;`);
  console.log(`\n--- Add import at top of src/App.tsx ---\n`);
  console.log(`import { ${componentName} } from "./components/tools/${componentName}";`);

  // 4. Print guide stub
  console.log("\n--- Optional: paste into TOOL_GUIDES in src/data/toolGuides.ts ---\n");
  console.log(`  "${slug}": {
    overview: "TODO: 2–3 sentence overview.",
    workedExamples: [
      { title: "TODO", input: "TODO", output: "TODO", explanation: "TODO" }
    ],
    whenToUse: ["TODO"],
    whenNotToUse: ["TODO"],
    troubleshooting: [{ symptom: "TODO", fix: "TODO" }],
    relatedSlugs: [],
    lastReviewed: "${new Date().toISOString().slice(0, 10)}"
  },`);

  console.log("\n[generate:tool] done. Next: paste the snippets above, implement the component, then flip status → indexable.");
}

function labelForCategory(cat: string): string {
  const m: Record<string, string> = {
    "seo-tools": "SEO & URL Tools",
    "developer-tools": "Developer Tools",
    "ai-tools": "Single-Purpose AI Tools",
    "text-tools": "Text & Diff Tools",
    "converters": "Converters & Encoders",
    "generators": "Generators",
    "validators": "Validators",
  };
  return m[cat] || "Utilities";
}

function iconForCategory(cat: string): string {
  const m: Record<string, string> = {
    "seo-tools": "Globe",
    "developer-tools": "Code2",
    "ai-tools": "Sparkles",
    "text-tools": "FileText",
    "converters": "ArrowLeftRight",
    "generators": "Wand2",
    "validators": "CheckCircle2",
  };
  return m[cat] || "Wand2";
}

main();
