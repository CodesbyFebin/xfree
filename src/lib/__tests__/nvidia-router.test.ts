import { describe, expect, it } from "vitest";
import { inferModelCapabilities, selectModelForTask } from "../../server/nvidia/router";
import type { NvidiaModel } from "../../server/nvidia/types";
import { inferModelKind, isChatCompatibleKind, NVIDIA_REFERENCE_CATALOG } from "../../server/nvidia/catalog";

const models: NvidiaModel[] = [
  { id: "meta/llama-3.1-8b-instruct", name: "llama", capabilities: ["chat", "efficient"], kind: "chat", chatCompatible: true },
  { id: "qwen/qwen3-coder-32b-instruct", name: "qwen coder", capabilities: ["chat", "code"], kind: "chat", chatCompatible: true },
  { id: "nvidia/nemotron-3-super-120b-a12b", name: "nemotron", capabilities: ["chat", "reasoning"], kind: "chat", chatCompatible: true },
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

  it("classifies all 58 reference catalog entries without treating specialized endpoints as chat", () => {
    expect(NVIDIA_REFERENCE_CATALOG).toHaveLength(58);
    expect(inferModelKind("nvidia/nv-embed-v1")).toBe("embedding");
    expect(inferModelKind("nvidia/rerank-qa-mistral-4b")).toBe("rerank");
    expect(isChatCompatibleKind(inferModelKind("nvidia/nv-embed-v1"))).toBe(false);
    expect(isChatCompatibleKind(inferModelKind("meta/llama-3.3-70b-instruct"))).toBe(true);
  });
});
