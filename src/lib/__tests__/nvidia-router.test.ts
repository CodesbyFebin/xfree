import { describe, expect, it } from "vitest";
import { inferModelCapabilities, selectModelForTask } from "../../server/nvidia/router";
import type { NvidiaModel } from "../../server/nvidia/types";

const models: NvidiaModel[] = [
  { id: "meta/llama-3.1-8b-instruct", name: "llama", capabilities: ["chat", "efficient"] },
  { id: "qwen/qwen3-coder-32b-instruct", name: "qwen coder", capabilities: ["chat", "code"] },
  { id: "nvidia/nemotron-3-super-120b-a12b", name: "nemotron", capabilities: ["chat", "reasoning"] },
];

describe("NVIDIA task router", () => {
  it("prefers a coding model for code tasks", () => {
    expect(selectModelForTask("code", models)?.id).toBe("qwen/qwen3-coder-32b-instruct");
  });

  it("prefers a reasoning model for reasoning tasks", () => {
    expect(selectModelForTask("reasoning", models)?.id).toBe("nvidia/nemotron-3-super-120b-a12b");
  });

  it("returns null for an empty account model list", () => {
    expect(selectModelForTask("general", [])).toBeNull();
  });

  it("infers useful selector capabilities without promising provider metadata", () => {
    expect(inferModelCapabilities("qwen/qwen3-coder-32b-instruct")).toContain("code");
    expect(inferModelCapabilities("deepseek-ai/reasoning-model")).toContain("reasoning");
  });
});
