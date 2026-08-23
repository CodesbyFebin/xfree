import { getAgentAllowedEngineIds, validateExternalAgentPlan } from "./agent-core";
import type { LocalAgentPlan } from "./agent-core";

export const LOCAL_BRAIN_MODEL_ID = "SmolLM2-360M-Instruct-q4f32_1-MLC";
export const WEBLLM_VERSION = "0.2.84";
export const WEBLLM_MODULE_URL = `https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@${WEBLLM_VERSION}/+esm`;

export const DEFAULT_SOUL = `# XFree Agent SOUL\n\n- Prefer local XFree engines over network calls.\n- Never invent a tool or engine ID.\n- Keep plans short, explicit, and reversible.\n- Do not upload user input or file contents.\n- Validate structured data before transforming or exporting when useful.\n- Explain when a requested capability is not available in the browser sandbox.`;

export interface LocalAgentCapabilities {
  webGpu: boolean;
  fileSystemAccess: boolean;
  serviceWorker: boolean;
  periodicBackgroundSync: boolean;
}

export interface LocalBrainProgress {
  progress: number;
  text: string;
}

interface WebLlmEngine {
  chat: {
    completions: {
      create(request: Record<string, unknown>): Promise<{ choices?: Array<{ message?: { content?: string | null } }> }>;
    };
  };
}

let cachedEngine: WebLlmEngine | null = null;
let enginePromise: Promise<WebLlmEngine> | null = null;

export function detectLocalAgentCapabilities(): LocalAgentCapabilities {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { webGpu: false, fileSystemAccess: false, serviceWorker: false, periodicBackgroundSync: false };
  }

  return {
    webGpu: "gpu" in navigator,
    fileSystemAccess: "showDirectoryPicker" in window,
    serviceWorker: "serviceWorker" in navigator,
    periodicBackgroundSync: "PeriodicSyncManager" in window,
  };
}

async function loadLocalBrain(onProgress?: (progress: LocalBrainProgress) => void): Promise<WebLlmEngine> {
  if (cachedEngine) return cachedEngine;
  if (enginePromise) return enginePromise;
  if (!("gpu" in navigator)) throw new Error("WebGPU is not available in this browser. Use Rules mode or a WebGPU-capable browser.");

  enginePromise = (async () => {
    onProgress?.({ progress: 0, text: "Loading WebLLM runtime…" });
    const moduleUrl: string = WEBLLM_MODULE_URL;
    const webllm = await import(/* @vite-ignore */ moduleUrl) as {
      CreateMLCEngine?: (modelId: string, options?: Record<string, unknown>) => Promise<WebLlmEngine>;
    };
    if (typeof webllm.CreateMLCEngine !== "function") throw new Error("WebLLM runtime did not expose CreateMLCEngine.");

    const engine = await webllm.CreateMLCEngine(LOCAL_BRAIN_MODEL_ID, {
      initProgressCallback: (report: { progress?: number; text?: string }) => {
        onProgress?.({ progress: Math.max(0, Math.min(1, report.progress ?? 0)), text: report.text || "Loading local model…" });
      },
    });
    cachedEngine = engine;
    onProgress?.({ progress: 1, text: "Local WebGPU brain ready." });
    return engine;
  })();

  try {
    return await enginePromise;
  } catch (error) {
    enginePromise = null;
    throw error;
  }
}

export async function planWithLocalBrain(
  command: string,
  inputPreview: string,
  soul = DEFAULT_SOUL,
  onProgress?: (progress: LocalBrainProgress) => void,
): Promise<LocalAgentPlan> {
  const engine = await loadLocalBrain(onProgress);
  const allowedEngineIds = getAgentAllowedEngineIds();
  const system = `You are the local planning layer for XFree Agent Studio. You DO NOT execute tools. You only return a short JSON plan that will be validated by a deterministic allowlist before execution.\n\n${soul}\n\nAllowed engine IDs:\n${allowedEngineIds.join(", ")}\n\nThe only allowed transformId is: lines-to-json-array.\n\nReturn JSON only with this shape:\n{\"rationale\":\"brief reason\",\"steps\":[{\"engineId\":\"allowed-id\",\"label\":\"human label\",\"passthrough\":false}]}\nOr for the built-in transform: {\"transformId\":\"lines-to-json-array\",\"label\":\"Convert result lines to JSON array\"}.\nUse 1 to 6 steps. Never invent IDs. A passthrough engine validates/checks data without replacing the previous pipeline value.`;

  const completion = await engine.chat.completions.create({
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Request: ${command}\n\nInput preview (may be truncated; do not echo secrets):\n${inputPreview.slice(0, 1200)}` },
    ],
    temperature: 0,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Local brain did not return a plan.");

  let draft: unknown;
  try {
    draft = JSON.parse(content);
  } catch {
    throw new Error("Local brain returned malformed JSON. No tools were executed.");
  }

  return validateExternalAgentPlan(command, draft);
}

export function resetLocalBrainForSession() {
  cachedEngine = null;
  enginePromise = null;
}
