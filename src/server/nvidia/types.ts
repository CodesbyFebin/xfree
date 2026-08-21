export const NVIDIA_TASK_TYPES = ["code", "json", "sql", "summarization", "reasoning", "general"] as const;

export type NvidiaTaskType = (typeof NVIDIA_TASK_TYPES)[number];

export interface NvidiaModel {
  id: string;
  name: string;
  ownedBy?: string;
  capabilities: Array<"chat" | "code" | "long-context" | "reasoning" | "efficient">;
}

export interface NvidiaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NvidiaModelResolution {
  requestedModel: string;
  usedModel: string;
  wasFallback: boolean;
  fallbackReason?: "auto_routing" | "selected_model_unavailable";
}
