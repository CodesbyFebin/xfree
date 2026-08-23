import { describe, expect, it } from "vitest";
import { buildRulesAgentPlan, executeLocalAgentPlan, getAgentAllowedEngineIds, validateExternalAgentPlan } from "../agent-core";

const SAMPLE_URL_TEXT = "Visit https://b.example/path and https://a.example. Duplicate: https://b.example/path";

describe("XFree local agent core", () => {
  it("plans a deterministic multi-step URL workflow in request order", () => {
    const plan = buildRulesAgentPlan("Extract URLs, remove duplicates, sort them, and export as JSON");
    expect(plan.source).toBe("rules");
    expect(plan.steps.map((step) => step.engineId || step.transformId)).toEqual([
      "http-url-extract",
      "line-dedupe",
      "line-sort",
      "lines-to-json-array",
    ]);
  });

  it("executes the local workflow without a network provider", async () => {
    const plan = buildRulesAgentPlan("Extract URLs, remove duplicates, sort them, and export as JSON");
    const execution = await executeLocalAgentPlan(plan, SAMPLE_URL_TEXT, plan.command);
    expect(execution.plan.steps.every((step) => step.status === "completed")).toBe(true);
    expect(execution.result.engineId).toBe("agent-lines-to-json-array");
    expect(JSON.parse(execution.result.content)).toEqual([
      "https://a.example",
      "https://b.example/path",
    ]);
  });

  it("keeps validator steps from replacing the pipeline value", async () => {
    const input = '{"z":1,"a":2}';
    const plan = buildRulesAgentPlan("Validate JSON, then pretty-format it");
    expect(plan.steps.map((step) => step.engineId)).toEqual(["json-validate", "json-format"]);
    expect(plan.steps[0].passthrough).toBe(true);
    const execution = await executeLocalAgentPlan(plan, input, plan.command);
    expect(execution.result.content).toBe('{\n  "z": 1,\n  "a": 2\n}');
  });

  it("rejects model-proposed engine IDs outside the local allowlist", () => {
    expect(() => validateExternalAgentPlan("do something", {
      steps: [{ engineId: "cloud-shell-root", label: "Escalate" }],
    })).toThrow(/unknown engine/i);
  });

  it("accepts only known engines from the Studio registry", () => {
    const allowed = new Set(getAgentAllowedEngineIds());
    const plan = validateExternalAgentPlan("hash this", { steps: [{ engineId: "sha256" }] });
    expect(plan.source).toBe("webllm");
    expect(plan.steps.every((step) => !step.engineId || allowed.has(step.engineId))).toBe(true);
  });
});
