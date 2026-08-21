import fs from "fs";
import path from "path";
import { TOOLS_REGISTRY, PUBLIC_TOOLS } from "../data/toolsRegistry";

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
    if (t.status === "published" && !t.indexable) {
      findings.push({ slug: t.slug, id: t.id, severity: "error", message: "published tool is not indexable" });
    }
    if (t.status !== "published" && t.indexable) {
      findings.push({ slug: t.slug, id: t.id, severity: "error", message: "unpublished tool is marked indexable" });
    }
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

  const appPath = path.join(process.cwd(), "src", "App.tsx");
  if (fs.existsSync(appPath)) {
    const app = fs.readFileSync(appPath, "utf-8");
    for (const t of PUBLIC_TOOLS) {
      if (!app.includes(`case "${t.id}"`)) {
        findings.push({
          slug: t.slug,
          id: t.id,
          severity: "error",
            message: `PUBLIC but no case "${t.id}" in App.tsx renderToolComponent — page would fall through to AI fallback`,
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
    indexableTools: PUBLIC_TOOLS.length,
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
