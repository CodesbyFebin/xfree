import fs from "fs";
import path from "path";
import { WORKFLOW_RECIPES } from "../data/recipes";
import { CANONICAL_ORIGIN } from "../data/siteConfig";

const DIST = path.join(process.cwd(), "dist");
const BASE = CANONICAL_ORIGIN;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function readCleanTemplate(): string {
  const file = path.join(DIST, "index.html");
  if (!fs.existsSync(file)) throw new Error("dist/index.html not found — run vite build before prerender:recipes");
  return fs.readFileSync(file, "utf-8");
}

function writeRoute(route: string, html: string) {
  const dir = path.join(DIST, route.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
}

function inject(template: string, meta: { route: string; title: string; description: string; h1: string; intro: string; body: string; jsonLd: unknown[] }) {
  const canonical = `${BASE}${meta.route}`;
  const head = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="index,follow" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="XFree.in" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": meta.jsonLd })}</script>`,
  ].join("\n    ");

  const shell = `<div id="prerender-shell" style="max-width:1120px;margin:0 auto;padding:32px 20px;font-family:system-ui,-apple-system,sans-serif;line-height:1.65"><nav aria-label="Primary" style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px"><a href="/">Home</a><a href="/recipes">Recipes</a><a href="/guides">Guides</a><a href="/how-it-works">How it works</a><a href="/contribute">Contribute</a></nav><main><h1>${escapeHtml(meta.h1)}</h1><p>${escapeHtml(meta.intro)}</p>${meta.body}</main></div>`;

  let out = template.replace(/<title>[^<]*<\/title>\s*/gi, "");
  out = out.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, "");
  out = out.replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, "");
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");
  out = out.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, "");
  out = out.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "");
  out = out.replace("</head>", `    ${head}\n  </head>`);
  out = out.replace('<div id="root"></div>', `${shell}<div id="root"></div>`);
  return out;
}

function breadcrumb(items: Array<{ name: string; url: string }>) {
  return { "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })) };
}

function renderIndexBody() {
  return `<section><h2>Reproducible starter workflows</h2><ul>${WORKFLOW_RECIPES.map((recipe) => `<li><a href="/recipes/${escapeHtml(recipe.slug)}">${escapeHtml(recipe.title)}</a> — ${escapeHtml(recipe.shortDescription)} · v${escapeHtml(recipe.version)} · Local · LLM not required</li>`).join("")}</ul></section><section><h2>How recipe sharing works</h2><p>Recipes share only versioned IDs, allowlisted local engine IDs, named bounded transforms, and safe configuration. They do not contain arbitrary executable JavaScript, remote scripts, or hidden network calls.</p><p><a href="https://app.xfree.in/">Open XFree Agent Studio</a></p></section>`;
}

function renderRecipeBody(recipe: (typeof WORKFLOW_RECIPES)[number]) {
  const steps = recipe.steps.map((step, index) => `<li><strong>${index + 1}. ${escapeHtml(step.label)}</strong> — <code>${escapeHtml(step.kind === "engine" ? `engine:${step.engineId}` : `transform:${step.transformId}`)}</code></li>`).join("");
  return `<section><h2>Execution plan</h2><ol>${steps}</ol></section><section><h2>Processing and requirements</h2><p><strong>Processing:</strong> Local. <strong>LLM required:</strong> No. <strong>Version:</strong> ${escapeHtml(recipe.version)}.</p><p>The recipe declares <code>networkAccess=false</code> and Studio revalidates every engine and transform identifier before execution.</p></section><section><h2>Example input</h2><pre><code>${escapeHtml(recipe.exampleInput)}</code></pre><p>${escapeHtml(recipe.exampleOutputDescription)}</p><p><a href="https://app.xfree.in/?recipe=${encodeURIComponent(recipe.slug)}">Open this recipe in Agent Studio</a></p></section><section><h2>Frequently asked questions</h2><h3>Does this recipe upload working input?</h3><p>No. This starter recipe is local and declares networkAccess=false.</p><h3>Is a local LLM required?</h3><p>No. The recipe plan is deterministic; optional WebGPU planning is a separate Studio feature.</p><h3>Can a shared recipe execute arbitrary code?</h3><p>No. Only allowlisted engine and bounded transform identifiers are accepted.</p></section>`;
}

const template = readCleanTemplate();

writeRoute("/recipes", inject(template, {
  route: "/recipes",
  title: "Local Browser Workflow Recipes — XFree.in",
  description: "Run versioned, inspectable developer workflow recipes locally in XFree Agent Studio. See every allowlisted engine and transform before execution.",
  h1: "Local browser workflow recipes",
  intro: "Reproducible browser workflows built from XFree local engines and bounded transforms. No signup is required, and the starter recipes do not require an LLM.",
  body: renderIndexBody(),
  jsonLd: [
    breadcrumb([{ name: "Home", url: `${BASE}/` }, { name: "Recipes", url: `${BASE}/recipes` }]),
    { "@type": "CollectionPage", name: "XFree Local Browser Workflow Recipes", url: `${BASE}/recipes`, description: "Versioned, inspectable local developer workflows for XFree Agent Studio." },
  ],
}));

for (const recipe of WORKFLOW_RECIPES) {
  const route = `/recipes/${recipe.slug}`;
  writeRoute(route, inject(template, {
    route,
    title: `${recipe.title} — Local Browser Workflow | XFree.in`,
    description: recipe.shortDescription,
    h1: recipe.title,
    intro: recipe.directAnswer,
    body: renderRecipeBody(recipe),
    jsonLd: [
      breadcrumb([{ name: "Home", url: `${BASE}/` }, { name: "Recipes", url: `${BASE}/recipes` }, { name: recipe.title, url: `${BASE}${route}` }]),
      { "@type": "HowTo", name: recipe.title, description: recipe.shortDescription, url: `${BASE}${route}`, step: recipe.steps.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.label, text: step.kind === "engine" ? `Run allowlisted local engine ${step.engineId}.` : `Run bounded local transform ${step.transformId}.` })) },
    ],
  }));
}

console.log(`[prerender:recipes] wrote ${WORKFLOW_RECIPES.length + 1} recipe routes to dist/`);
