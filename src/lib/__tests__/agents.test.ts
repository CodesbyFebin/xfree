import { describe, it, expect } from "vitest";
import {
  SPECIALIST_AGENTS,
  getAgentById,
  getAgentsByType,
  canExecuteTool,
  executeAgent,
  AgentOrchestrationError,
} from "../agents";

describe("Agent Infrastructure", () => {
  it("defines a non-empty specialist roster", () => {
    expect(SPECIALIST_AGENTS.length).toBeGreaterThan(0);
  });

  it("every agent has required metadata", () => {
    for (const a of SPECIALIST_AGENTS) {
      expect(a.id).toBeTruthy();
      expect(a.type).toBeTruthy();
      expect(a.systemPrompt).toBeTruthy();
      expect(a.permissions).toBeDefined();
    }
  });

  it("looks agents up by id and type", () => {
    expect(getAgentById("intent-agent")?.name).toBe("Intent Classifier");
    expect(getAgentsByType("verification").length).toBeGreaterThan(0);
  });

  it("enforces per-agent tool execution permissions", () => {
    expect(canExecuteTool("research-agent", "regex-tester")).toBe(true);
    expect(canExecuteTool("intent-agent", "regex-tester")).toBe(false);
  });

  it("security agent requires approval", () => {
    const sec = getAgentById("security-agent")!;
    expect(sec.permissions.requiresApproval).toBe(true);
    expect(sec.permissions.approvalThreshold).toBe("high");
  });
});

describe("Agent Execution Runtime", () => {
  it("throws AgentOrchestrationError for unknown agent", async () => {
    const result = await executeAgent("nonexistent-agent", "test", "execute");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Agent not found");
  });

  it("classify-intent operation returns classification and route", async () => {
    const result = await executeAgent("intent-agent", "format this JSON", "classify-intent");
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty("classification");
    expect(result.output).toHaveProperty("route");
    expect(result.output.classification.intent).toContain("json");
  });

  it("classify-intent returns no tools for unfulfillable intent", async () => {
    const result = await executeAgent("intent-agent", "compress this PDF", "classify-intent");
    expect(result.success).toBe(true);
    expect(result.output.route.toolIds).toHaveLength(0);
  });

  it("solve operation routes the problem through solveProblem", async () => {
    const result = await executeAgent("intent-agent", "generate a sitemap", "solve");
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty("intent");
    expect(result.output).toHaveProperty("plan");
    expect(result.output).toHaveProperty("results");
  });

  it("execute operation requires toolId and input in object form", async () => {
    const result = await executeAgent("research-agent", "test", "execute");
    expect(result.success).toBe(false);
    expect(result.error).toContain("requires");
  });

  it("execute operation calls executeTool with correct params", async () => {
    const result = await executeAgent("research-agent", { toolId: "json-formatter", input: '{"a":1}' }, "execute");
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty("toolExecuted", "json-formatter");
  });

  it("verify operation validates tool results", async () => {
    const tool = getAgentById("verification-agent");
    expect(tool).toBeDefined();
    const result = await executeAgent("verification-agent", { toolId: "json-formatter", input: '{"a":1}', output: { valid: true } }, "verify");
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty("verification");
  });

  it("build-workflow operation uses workflow execution preferences", async () => {
    const result = await executeAgent("workflow-agent", "sitemap generation workflow", "build-workflow");
    expect(result.success).toBe(true);
    expect(result.output).toHaveProperty("plan");
  });

  it("review-security flags dangerous operations", async () => {
    const result = await executeAgent("security-agent", "drop table users", "review-security");
    expect(result.success).toBe(true);
    expect(result.output.valid).toBe(false);
    expect(result.output.issues.length).toBeGreaterThan(0);
    expect(result.output.requiresApproval).toBe(true);
  });

  it("review-security passes safe operations", async () => {
    const result = await executeAgent("security-agent", "list my favorite tools", "review-security");
    expect(result.success).toBe(true);
    expect(result.output.valid).toBe(true);
  });
});
