export type ToolCategory =
  | "seo-tools"
  | "developer-tools"
  | "ai-tools"
  | "text-tools"
  | "converters"
  | "generators"
  | "validators";

export type ToolExecutionMode = "local" | "ai";
export type ToolStatus = "draft" | "indexable" | "noindex" | "retired";

export interface ToolDefinition {
  id: string;
  slug: string;
  title: string;
  pillarKeyword?: string;
  shortDescription: string;
  category: ToolCategory;
  categoryLabel: string;
  iconName: string;
  execution?: ToolExecutionMode;
  status?: ToolStatus;
  lastModified?: string;
  toolComponent?: string;
  isAi?: boolean;
  isFlagship?: boolean;
  tags: string[];
  exampleInput?: string;
  explanation: string;
  howToUse: string[];
  keyFeatures?: string[];
  benefits?: string[];
  useCases?: string[];
  privacyNotice: string;
  faqs: { question: string; answer: string }[];
  relatedToolIds: string[];
  supportedInputs?: string[];
  supportedOutputs?: string[];
  limitations?: string[];
}

export interface SavedItem {
  id: string;
  toolId: string;
  toolTitle: string;
  timestamp: number;
  inputSnippet: string;
  outputSnippet: string;
  starred?: boolean;
}

export interface IntentDefinition {
  id: string;
  phrases: readonly string[];
  keywords: readonly string[];
  capabilities: readonly string[];
  preferredToolId: string;
  description: string;
}

export interface IntentMatch {
  intent: IntentDefinition;
  score: number;
  confidence: "high" | "medium" | "low";
}

export interface WorkspacePreset {
  id: string;
  name: string;
  toolId: string;
  toolSlug: string;
  toolTitle: string;
  timestamp: number;
  inputContent?: string;
  outputContent?: string;
  configState?: any;
}
