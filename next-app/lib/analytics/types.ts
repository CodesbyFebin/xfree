export interface ToolUsageEvent {
  toolId: string;
  toolSlug: string;
  timestamp: string;
  executionMode: 'local' | 'ai' | 'workflow';
  success: boolean;
  inputSize?: number;
  outputSize?: number;
  executionTimeMs?: number;
  errorType?: string;
}

export interface ToolScore {
  toolId: string;
  xfreeScore: number;
  privacyScore: number;
  usabilityScore: number;
  reliabilityScore: number;
  totalUses: number;
  successRate: number;
  avgExecutionTime: number;
  lastUpdated: string;
}

export interface PrivacyMetric {
  executionMode: 'local' | 'ai' | 'workflow';
  dataTransmission: 'none' | 'minimal' | 'full';
  storageUsed: 'none' | 'session' | 'persistent';
  thirdPartySharing: boolean;
  privacyScore: number;
}

export interface IntentMetric {
  intent: string;
  query: string;
  matchedTools: string[];
  confidence: number;
  resolved: boolean;
  feedback?: 'helpful' | 'not-helpful';
}

export interface WorkflowExecution {
  workflowId: string;
  steps: number;
  completedSteps: number;
  success: boolean;
  timestamp: string;
}

export type AnalyticsEvent =
  | { type: 'tool_use'; data: ToolUsageEvent }
  | { type: 'intent_resolution'; data: IntentMetric }
  | { type: 'workflow_execution'; data: WorkflowExecution }
  | { type: 'page_view'; data: { path: string; referrer?: string } }
  | { type: 'search_query'; data: { query: string; resultsCount: number } };
