import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY, INDEXABLE_TOOLS } from "../data/toolsRegistry";

interface Finding {
  slug: string;
  id: string;
  severity: "error" | "warn";
  message: string;
}

function audit(): Finding[] {
  const findings: Finding[] = [];
  const bySlug = new Map<string, string>();
  const byId = new Map<string, string>();

  for (const t of TOOLS_REGISTRY) {
    if (!t.slug) findings.push({ slug: t.slug, id: t.id, severity: "error", message: "missing slug" });
    if (!t.title) findings.push({ slug: t.slug, id: t.id, severity: "error", message: "missing title" });
    if (!t.shortDescription || t.shortDescription.length < 20) {
      findings.push({ slug: t.slug, id: t.id, severity: "warn", message: "short/missing description" });
    }
    if (bySlug.has(t.slug)) {
      findings.push({ slug: t.slug, id: t.id, severity: "error", message: `duplicate slug (also on id=${bySlug.get(t.slug)})` });
    } else {
      bySlug.set(t.slug, t.id);
    }
    if (byId.has(t.id)) {
      findings.push({ slug: t.slug, id: t.id, severity: "error", message: `duplicate id (also on slug=${byId.get(t.id)})` });
    } else {
      byId.set(t.id, t.slug);
    }
  }

  // These tools are deliberately informational/comparison content (e.g. "VPN
  // guide", "cloud storage comparison") rather than an interactive utility —
  // ToolDetailPage's static description/FAQ/comparison content is the correct
  // rendering for them, not a missing feature. Everything else that is
  // INDEXABLE is presented as a working tool and must have a real widget.
  const GUIDE_STYLE_TOOL_IDS = new Set([
    "cloud-storage-guide",
    "vpn-guide",
    "wetransfer-alternative",
    "canva-alternative",
  ]);

  const appPath = path.join(process.cwd(), "src", "App.tsx");
  if (fs.existsSync(appPath)) {
    const source = fs.readFileSync(appPath, "utf-8");
    for (const t of INDEXABLE_TOOLS) {
      if (GUIDE_STYLE_TOOL_IDS.has(t.id)) continue;
      if (!source.includes(`case "${t.id}"`)) {
        findings.push({
          slug: t.slug,
          id: t.id,
          severity: "error",
          message: `INDEXABLE but no case "${t.id}" in App.tsx renderInteractiveTool — page renders as a working tool but has no actual widget`,
        });
      }
    }
  }

  return findings;
}

function main() {
  const findings = audit();
  const errors = findings.filter((f) => f.severity === "error");
  const warns = findings.filter((f) => f.severity === "warn");
  const report = {
    totalTools: TOOLS_REGISTRY.length,
    indexableTools: INDEXABLE_TOOLS.length,
    errors: errors.length,
    warnings: warns.length,
    findings,
  };
  const reportsDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, "tool-audit.json"), JSON.stringify(report, null, 2));
  console.log(`[audit:tools] total=${report.totalTools} indexable=${report.indexableTools} errors=${errors.length} warnings=${warns.length}`);
  if (errors.length) {
    for (const e of errors) console.error(`  ERROR ${e.slug || e.id}: ${e.message}`);
    process.exit(1);
  }
}

main();
