export type ProcessingMode = "local" | "cloud";

export interface StudioFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

export interface StudioResult {
  id: string;
  title: string;
  content: string;
  mimeType: string;
  extension: string;
  engineId: string;
  createdAt: number;
  processing: "Local" | "NVIDIA";
  model?: string;
  sourceResultId?: string;
}

export interface StudioMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider: "NVIDIA" | "Local";
  model?: string;
  fallbackNotice?: string;
}

export type StudioMobileTab = "files" | "chat" | "results";

export interface LocalEngine {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  placeholder: string;
  run(input: string, command: string): Promise<Omit<StudioResult, "id" | "createdAt" | "processing">>;
}
