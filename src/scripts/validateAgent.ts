import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildRulesAgentPlan, getAgentAllowedEngineIds } from "../lib/agent-core";
import { LOCAL_BRAIN_MODEL_ID, WEBLLM_MODULE_URL, WEBLLM_VERSION } from "../lib/local-brain";
import { LOCAL_ENGINES } from "../lib/studio/engines";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const errors: string[] = [];
const fail = (message: string) => errors.push(message);
const expectIncludes = (value: string, needle: string, label: string) => { if (!value.includes(needle)) fail(`${label} missing ${needle}`); };
const expectNotIncludes = (value: string, needle: string, label: string) => { if (value.includes(needle)) fail(`${label} must not contain ${needle}`); };

const engineIds = LOCAL_ENGINES.map((engine) => engine.id);
const allowedIds = getAgentAllowedEngineIds();
if (engineIds.length < 100) fail(`Studio local engine registry unexpectedly shrank to ${engineIds.length}; expected at least 100.`);
if (new Set(engineIds).size !== engineIds.length) fail("Studio local engine IDs must be unique.");
if (allowedIds.length !== engineIds.length || allowedIds.some((id) => !engineIds.includes(id))) fail("Agent allowlist must equal the real Studio local-engine registry.");

const urlPlan = buildRulesAgentPlan("Extract URLs, remove duplicates, sort them, and export as JSON");
const urlPlanIds = urlPlan.steps.map((step) => step.engineId || step.transformId);
const expectedPlan = ["http-url-extract", "line-dedupe", "line-sort", "lines-to-json-array"];
if (JSON.stringify(urlPlanIds) !== JSON.stringify(expectedPlan)) fail(`Deterministic URL workflow changed: ${JSON.stringify(urlPlanIds)}`);
if (urlPlan.steps.length > 6) fail("Agent plans must remain bounded to six steps.");

if (WEBLLM_VERSION !== "0.2.84") fail(`WebLLM runtime must remain explicitly pinned; found ${WEBLLM_VERSION}.`);
if (!WEBLLM_MODULE_URL.includes(`@mlc-ai/web-llm@${WEBLLM_VERSION}/`)) fail("WebLLM module URL does not pin the declared version.");
if (LOCAL_BRAIN_MODEL_ID !== "SmolLM2-360M-Instruct-q4f32_1-MLC") fail(`Unexpected local brain model: ${LOCAL_BRAIN_MODEL_ID}`);

const localBrain = read("src/lib/local-brain.ts");
expectIncludes(localBrain, "validateExternalAgentPlan(command, draft)", "WebLLM planner");
expectIncludes(localBrain.toLowerCase(), "do not upload", "SOUL policy");
expectNotIncludes(localBrain, "/api/", "WebLLM planner");

const studioPage = read("src/components/pages/StudioPage.tsx");
expectIncludes(studioPage, "executeLocalAgentPlan", "Studio local execution");
expectIncludes(studioPage, "pickLocalWorkspace", "Studio folder sandbox");
expectIncludes(studioPage, "xfree_agent_soul", "SOUL persistence");

const securityHeaders = read("src/middleware/security-headers.ts");
for (const required of ["'wasm-unsafe-eval'", "https://cdn.jsdelivr.net", "https://huggingface.co", "https://raw.githubusercontent.com", "worker-src 'self' blob:"]) {
  expectIncludes(securityHeaders, required, "Agent CSP");
}
expectNotIncludes(securityHeaders, "'unsafe-eval'", "Agent CSP");
expectNotIncludes(securityHeaders, "Cross-Origin-Embedder-Policy", "Agent CSP");

const serviceWorker = read("public/sw.js");
expectIncludes(serviceWorker, "url.pathname.startsWith(\"/api/\")", "PWA cache policy");
expectIncludes(serviceWorker, "url.origin !== self.location.origin", "PWA cache policy");
expectNotIncludes(serviceWorker, "huggingface", "PWA cache policy");
expectNotIncludes(serviceWorker, "googlesyndication", "PWA cache policy");

const manifest = JSON.parse(read("public/site.webmanifest")) as { start_url?: string; display?: string; scope?: string };
if (manifest.start_url !== "/studio") fail(`PWA start_url must be /studio; found ${manifest.start_url ?? "missing"}.`);
if (manifest.scope !== "/") fail(`PWA scope must be /; found ${manifest.scope ?? "missing"}.`);
if (manifest.display !== "standalone") fail(`PWA display must be standalone; found ${manifest.display ?? "missing"}.`);

if (errors.length) {
  console.error(`[agent] FAIL — ${errors.length} invariant(s) violated`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`[agent] PASS — ${engineIds.length} local engines allowlisted`);
console.log(`[agent] deterministic plan: ${urlPlanIds.join(" → ")}`);
console.log(`[agent] WebLLM: ${WEBLLM_VERSION} / ${LOCAL_BRAIN_MODEL_ID} (opt-in WebGPU planner only)`);
console.log("[agent] workspace: read-only explicit directory picker");
console.log("[agent] PWA: same-origin local assets only; API/ads/model downloads excluded from SW cache");
