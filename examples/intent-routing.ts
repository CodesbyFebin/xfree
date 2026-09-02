/**
 * Example: intent → capability → execution routing.
 *
 * Run: `npx tsx examples/intent-routing.ts`
 *
 * Demonstrates the real classification + routing engine used by XFree.in.
 * No mocks — this exercises the actual src/lib code.
 */
import { classifyIntent, routeIntentToCapabilities } from "../src/lib/intent-engine";
import { getCapabilityRecommendations } from "../src/lib/execution-engine";
import { TOOLS_REGISTRY } from "../src/data/toolsRegistry";
import { PUBLIC_TOOLS } from "../src/data/publicTools";

function show(label: string, query: string) {
  const intent = classifyIntent(query);
  const route = routeIntentToCapabilities(intent);
  const recs = getCapabilityRecommendations(query);

  console.log(`\n=== ${label}: "${query}" ===`);
  console.log("intent       :", intent.intent, "(confidence", intent.confidence.toFixed(2) + ")");
  console.log("entities     :", intent.entities.join(", ") || "—");
  console.log("routed tools :", route.toolIds.length ? route.toolIds.join(", ") : "NONE (no tool fulfills this)");
  console.log("recommendations:", recs.map((t) => t.title).join(" | ") || "—");
}

console.log(`Registry: ${TOOLS_REGISTRY.length} total, ${PUBLIC_TOOLS.length} public`);

// A real, supported intent → must route to real tools.
show("Supported", "generate a sitemap for my site");
show("Supported", "test this regex ^\\d{3}$ against 123");

// An unsupported intent → must NOT fabricate a match (honesty guard).
show("Unsupported", "compress this PDF to 100kb");

// Unknown gibberish → low confidence, no over-claim.
show("Gibberish", "xyzzy plugh frobnicate");
