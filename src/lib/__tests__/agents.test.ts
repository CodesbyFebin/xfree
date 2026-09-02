import { describe, it, expect } from "vitest";
import {
  SPECIALIST_AGENTS,
  getAgentById,
  getAgentsByType,
  canExecuteTool,
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
