import fs from "fs";
import path from "path";
import { CANONICAL_ORIGIN } from "../data/siteConfig";
import { RECIPES } from "../data/recipes";

const DIST = path.join(process.cwd(), "dist");

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function cleanTemplate(template: string) {
  return template
    .replace(/<title>[^<]*<\/title>\s*/gi, "")
    .replace(/<meta\s+name=[\"']description[\"'][^>]*>\s*/gi, "")
    .replace(/<meta\s+name=[\"']robots[\"'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=[\"']canonical[\"'][^>]*>\s*/gi, "")
    .replace(/<meta\s+property=[\"']og:[^\"']+[\"'][^>]*>\s*/gi, "")
    .replace(/<meta\s+name=[\"']twitter:[^\"']+[\"'][^>]*>\s*/gi, "");
}

function inject(template: string, route: string, title: string, description: string, h1: string, body: string, jsonLd: unknown) {
  const canonical = `${CANONICAL_ORIGIN}${route}`;
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="robots" content="index,follow">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="XFree.in">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].join("\n    ");
  const shell = `<div id="prerender-shell" style="max-width:1120px;margin:0 auto;padding:40px 20px;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;line-height:1.65"><nav style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px"><a href="/">Home</a><a href="/recipes">Recipes</a><a href="/guides">Guides</a><a href="/contribute">Contribute</a></nav><main><h1>${escapeHtml(h1)}</h1>${body}</main></div>`;
  let html = cleanTemplate(template);
  html = html.replace("</head>", `    ${head}\n  </head>`);
  html = html.replace('<div id="root"></div>', `${shell}<div id="root"></div>`);
  return html;
}

function writeRoute(route: string, html: string) {
  const dir = path.join(DIST, route.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

const templatePath = path.join(DIST, "index.html");
if (!fs.existsSync(templatePath)) throw new Error("dist/index.html is required before recipe prerendering.");
const template = fs.readFileSync(templatePath, "utf8");

const indexBody = `<p>XFree recipes are versioned local workflows composed from allowlisted engines and closed built-in transforms. Shared recipe data cannot contain arbitrary executable JavaScript.</p><section><h2>Published workflow recipes</h2><ul>${RECIPES.map((recipe) => `<li><a href="/recipes/${escapeHtml(recipe.slug)}">${escapeHtml(recipe.title)}</a> — ${escapeHtml(recipe.summary)}</li>`).join("")}</ul></section><section><h2>How recipe sharing works</h2><p>Each recipe declares an ID, version, Local Mode requirement, LLM requirement flag, engine IDs, transform IDs, and safe configuration. Agent Studio validates the recipe against the production allowlist before running it.</p></section>`;
writeRoute("/recipes", inject(
  template,
  "/recipes",
  "XFree Workflow Recipes — Reproducible Local Browser Workflows",
  `Run ${RECIPES.length} versioned XFree workflows locally in your browser. Inspect every allowlisted engine step, reproduce results, and open recipes directly in Agent Studio.`,
  "XFree Workflow Recipes",
  indexBody,
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "XFree Workflow Recipes",
    url: `${CANONICAL_ORIGIN}/recipes`,
    hasPart: RECIPES.map((recipe) => ({ "@type": "HowTo", name: recipe.title, url: `${CANONICAL_ORIGIN}/recipes/${recipe.slug}` })),
  },
));

for (const recipe of RECIPES) {
  const route = `/recipes/${recipe.slug}`;
  const steps = recipe.steps.map((item, index) => `<li><strong>${index + 1}. ${escapeHtml(item.label)}</strong> <code>${escapeHtml(item.engineId ? `engine:${item.engineId}` : `transform:${item.transformId}`)}</code></li>`).join("");
  const notes = recipe.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  const body = `<p>${escapeHtml(recipe.description)}</p><p><a href="https://app.xfree.in/?recipe=${encodeURIComponent(recipe.slug)}">Open in XFree Agent Studio</a></p><section><h2>Execution plan</h2><ol>${steps}</ol></section><section><h2>Sample input</h2><pre><code>${escapeHtml(recipe.sampleInput)}</code></pre></section><section><h2>Processing contract</h2><p>Mode: local. LLM required: no. Shared recipe data contains reviewed engine and transform identifiers, not executable JavaScript.</p><ul>${notes}</ul></section>`;
  writeRoute(route, inject(
    template,
    route,
    `${recipe.title} — XFree Workflow Recipe`,
    recipe.summary,
    recipe.title,
    body,
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: recipe.title,
      description: recipe.summary,
      url: `${CANONICAL_ORIGIN}${route}`,
      step: recipe.steps.map((item, index) => ({ "@type": "HowToStep", position: index + 1, name: item.label, text: item.engineId ? `Run allowlisted local engine ${item.engineId}.` : `Run built-in transform ${item.transformId}.` })),
    },
  ));
}

console.log(`[recipes] prerender PASS — ${RECIPES.length + 1} canonical recipe page(s) written`);
