export type ToolCategory =
  | "seo-tools"
  | "developer-tools"
  | "ai-tools"
  | "text-tools"
  | "converters"
  | "generators"
  | "validators";

export type ToolExecutionMode = "local" | "ai" | "workflow";
export type ToolStatus = "draft" | "indexable" | "noindex" | "retired";
export type VerificationStatus = "verified" | "pending" | "failed" | "unknown";
export type PricingModel = "free" | "freemium" | "paid" | "custom";

export interface ToolCapabilities {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  requiredAuth?: boolean;
  supportsBatch?: boolean;
  estimatedLatencyMs?: number;
}

export interface ToolPricing {
  model: PricingModel;
  freeTier?: {
    limits: string[];
    features: string[];
  };
  paidTiers?: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  currency: string;
}

export interface ToolLimits {
  rateLimit?: string;
  maxInputSize?: string;
  maxOutputSize?: string;
  dailyQuota?: number;
  concurrentRequests?: number;
}

export interface ToolIntegrations {
  apis?: string[];
  webhooks?: string[];
  mcpServers?: string[];
  cliTools?: string[];
  platforms?: string[];
}

export interface ToolVerification {
  status: VerificationStatus;
  lastVerified: string;
  verificationMethod: "automated" | "manual" | "user-reported" | "provider-reported";
  verifiedCapabilities: string[];
  knownIssues?: string[];
}

export interface XFreeScore {
  overall: number;
  capabilityFit: number;
  reliability: number;
  speed: number;
  privacy: number;
  pricing: number;
  freeTier: number;
  ux: number;
  integrationQuality: number;
  freshness: number;
  availability: number;
  userSuccess: number;
  breakdown?: Record<string, number>;
}

export interface ExecutionStep {
  step: number;
  action: "execute" | "ai" | "wait" | "verify" | "prompt";
  toolId: string;
  expectedOutput?: string;
  verify?: boolean;
  prompt?: string;
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  primaryToolId: string;
  fallbackToolIds?: string[];
  constraints: IntentConstraints;
  confidence: number;
}

export interface IntentConstraints {
  privacy?: "local" | "private" | "cloud";
  budget?: "free" | "open-source" | "paid";
  urgency?: "instant" | "soon" | "flexible";
  expertise?: "beginner" | "intermediate" | "advanced";
  platform?: string[];
  region?: string;
  size?: "small" | "medium" | "large" | "unlimited";
}

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

  // New structured capability fields
  capabilities?: ToolCapabilities[];
  pricing?: ToolPricing;
  limits?: ToolLimits;
  integrations?: ToolIntegrations;
  verification?: ToolVerification;
  xfreeScore?: XFreeScore;
  supportedRegions?: string[];
  supportedPlatforms?: string[];
  availability?: "available" | "degraded" | "unavailable" | "unknown";
  reliability?: number;
  securityReview?: {
    passed: boolean;
    reviewedAt: string;
    notes?: string;
  };
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
