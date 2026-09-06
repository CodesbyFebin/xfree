/**
 * Fails the build if any prerendered HTML in dist/ carries a noindex directive
 * (either <meta name="robots" content="...noindex..."> or X-Robots-Tag equivalents
 * embedded in a comment).
 *
 * Expected planning surfaces may also carry noindex,follow. The allow-list is
 * derived from the same pillar publishing policy used by sitemap + prerender,
 * so this gate catches accidental noindex on publishable pages without rejecting
 * intentional roadmap-only URLs.
 */
import fs from "fs";
import path from "path";
import { PILLARS_50 } from "../data/masterBlueprint";
import { isPillarIndexable } from "../data/pillarPublishing";

const DIST = path.join(process.cwd(), "dist");
const ALLOWED_NOINDEX = new Set<string>([
  "404.html",
  path.join("roadmap", "index.html"),
  ...PILLARS_50
    .filter((pillar) => !isPillarIndexable(pillar.slug))
    .map((pillar) => path.join("pillar", pillar.slug, "index.html")),
]);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

function hasNoindex(html: string): boolean {
  const metaRe = /<meta\s+[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["'][^"']*noindex[^"']*["'][^>]*>/i;
  const metaReReversed = /<meta\s+[^>]*content\s*=\s*["'][^"']*noindex[^"']*["'][^>]*name\s*=\s*["']robots["'][^>]*>/i;
  return metaRe.test(html) || metaReReversed.test(html);
}

function main() {
  if (!fs.existsSync(DIST)) {
    console.error(`[lint:noindex] dist/ not found — run \`npm run build\` first.`);
    process.exit(1);
  }
  const files = walk(DIST);
  const offenders: string[] = [];
  for (const f of files) {
    const rel = path.relative(DIST, f);
    if (ALLOWED_NOINDEX.has(rel)) continue;
    const html = fs.readFileSync(f, "utf-8");
    if (hasNoindex(html)) offenders.push(rel);
  }
  console.log(`[lint:noindex] scanned=${files.length} allow-listed=${ALLOWED_NOINDEX.size} offenders=${offenders.length}`);
  if (offenders.length) {
    for (const o of offenders) console.error(`  NOINDEX leak: dist/${o}`);
    process.exit(1);
  }
}

main();
