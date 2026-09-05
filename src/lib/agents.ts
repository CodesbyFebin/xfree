import type { ToolDefinition } from "../types";
import { TOOLS_REGISTRY, findToolBySlug } from "../data/toolsRegistry";
import { classifyIntent, routeIntentToCapabilities, IntentClassification } from "./intent-engine";
import { solveProblem, executeTool, verifyToolResult } from "./execution-engine";

export type AgentType = 
  | "intent"
  | "research"
  | "tool-selection"
  | "browser"
  | "file"
  | "developer"
  | "seo"
  | "data"
  | "verification"
  | "workflow"
  | "security"
  | "orchestrator";

export interface AgentDefinition {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  permissions: AgentPermissions;
  status: "active" | "standby" | "maintenance" | "retired";
  version: string;
  provider?: string;
  model?: string;
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  supportsStreaming?: boolean;
  rateLimit?: RateLimitConfig;
  lastUsed?: string;
  performanceMetrics?: AgentPerformanceMetrics;
}

export interface AgentPermissions {
  canReadToolRegistry: boolean;
  canExecuteTools: string[];
  canReadFiles: boolean;
  canWriteFiles: boolean;
  canMakeHttpRequests: boolean;
  canAccessExternalApis: boolean;
  canScheduleTasks: boolean;
  canGenerateCode: boolean;
  requiresApproval: boolean;
  approvalThreshold?: "low" | "medium" | "high";
}

export interface RateLimitConfig {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
  globalLimit?: number;
}

export interface AgentPerformanceMetrics {
  avgResponseTimeMs: number;
  successRate: number;
  totalExecutions: number;
  lastUpdated: string;
}

export interface AgentExecutionRequest {
  agentId: string;
  input: any;
  context?: ExecutionContext;
  options?: {
    timeout?: number;
    verify?: boolean;
    stream?: boolean;
  };
}

export interface AgentExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  agentId: string;
  executionTimeMs: number;
  traceId: string;
  verification?: VerificationResult;
}

export interface ExecutionContext {
  userId?: string;
  organizationId?: string;
  permissions?: string[];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  preferredExecution: "local" | "ai" | "workflow" | "external";
  privacy: "local" | "private" | "cloud";
  budget: "free" | "open-source" | "paid";
}

export interface VerificationResult {
  valid: boolean;
  issues: string[];
  checksPerformed: string[];
  confidence: number;
}

// Specialist Agent Definitions
export const SPECIALIST_AGENTS: AgentDefinition[] = [
  {
    id: "intent-agent",
    type: "intent",
    name: "Intent Classifier",
    description: "Understands natural language queries and routes them to appropriate capabilities",
    capabilities: ["intent_classification", "entity_extraction", "constraint_detection"],
    permissions: {
      canReadToolRegistry: true,
      canExecuteTools: [],
      canReadFiles: false,
      canWriteFiles: false,
      canMakeHttpRequests: false,
      canAccessExternalApis: false,
      canScheduleTasks: false,
      canGenerateCode: false,
      requiresApproval: false,
    },
    status: "active",
    version: "1.0.0",
    systemPrompt: "You are XFree's Intent Agent. Your job is to understand what the user wants to accomplish, extract the core problem, identify relevant capabilities, and route to the best solution. Be concise and action-oriented.",
    maxTokens: 2000,
    temperature: 0.1,
  },
  {
    id: "research-agent",
    type: "research",
    name: "Research Agent",
    description: "Gathers information about problems, competitors, and available solutions",
    capabilities: ["web_research", "source_verification", "competitor_analysis", "fact_checking"],
    permissions: {
      canReadToolRegistry: true,
      canExecuteTools: ["bulk-url-sitemap", "regex-tester"],
      canReadFiles: true,
      canWriteFiles: false,
      canMakeHttpRequests: true,
      canAccessExternalApis: true,
      canScheduleTasks: false,
      canGenerateCode: false,
      requiresApproval: false,
    },
    status: "active",
    version: "1.0.0",
    systemPrompt: "You are XFree's Research Agent. Investigate problems, find relevant solutions, verify sources, and extract actionable insights. Focus on accuracy and relevance.",
    maxTokens: 4000,
    temperature: 0.3,
  },
  {
    id: "tool-selection-agent",
    type: "tool-selection",
    name: "Tool Selection Agent",
    description: "Evaluates available tools and recommends the best fit for a given task",
    capabilities: ["capability_matching", "tool_evaluation", "price_analysis", "privacy_assessment"],
    permissions: {
      canReadToolRegistry: true,
      canExecuteTools: [],
      canReadFiles: true,
      canWriteFiles: false,
      canMakeHttpRequests: false,
      canAccessExternalApis: false,
      canScheduleTasks: false,
      canGenerateCode: false,
      requiresApproval: false,
    },
    status: "active",
    version: "1.0.0",
    systemPrompt: "You are XFree's Tool Selection Agent. Evaluate tools based on capability fit, reliability, privacy, and cost. Recommend the best options with clear justification.",
    maxTokens: 2000,
    temperature: 0.2,
  },
  {
    id: "verification-agent",
    type: "verification",
    name: "Verification Agent",
    description: "Validates tool outputs and workflow results",
    capabilities: ["result_validation", "error_detection", "quality_check", "outcome_verification"],
    permissions: {
      canReadToolRegistry: true,
      canExecuteTools: [],
      canReadFiles: true,
      canWriteFiles: true,
      canMakeHttpRequests: false,
      canAccessExternalApis: false,
      canScheduleTasks: false,
      canGenerateCode: false,
      requiresApproval: false,
    },
    status: "active",
    version: "1.0.0",
    systemPrompt: "You are XFree's Verification Agent. Check that tool outputs are correct, valid, and meet the expected criteria. Flag any issues or inconsistencies.",
    maxTokens: 1500,
    temperature: 0.1,
  },
  {
    id: "workflow-agent",
    type: "workflow",
    name: "Workflow Builder Agent",
    description: "Constructs and executes multi-step workflows to solve complex problems",
    capabilities: ["workflow_design", "step_optimization", "dependency_resolution", "workflow_execution"],
    permissions: {
      canReadToolRegistry: true,
      canExecuteTools: [],
      canReadFiles: true,
      canWriteFiles: true,
      canMakeHttpRequests: true,
      canAccessExternalApis: true,
      canScheduleTasks: true,
      canGenerateCode: false,
      requiresApproval: false,
    },
    status: "active",
    version: "1.0.0",
    systemPrompt: "You are XFree's Workflow Agent. Build efficient workflows by chaining tools to solve complex multi-step problems. Optimize for speed, reliability, and privacy.",
    maxTokens: 3000,
    temperature: 0.3,
  },
  {
    id: "security-agent",
    type: "security",
    name: "Security Agent",
    description: "Reviews workflows and tool usage for security risk",
    capabilities: ["risk_assessment", "permission_validation", "audit_review", "compliance_check"],
    permissions: {
      canReadToolRegistry: true,
      canExecuteTools: [],
      canReadFiles: true,
      canWriteFiles: false,
      canMakeHttpRequests: true,
      canAccessExternalApis: true,
      canScheduleTasks: false,
      canGenerateCode: false,
      requiresApproval: true,
      approvalThreshold: "high",
    },
    status: "active",
    version: "1.0.0",
    systemPrompt: "You are XFree's Security Agent. Review all tool executions for potential security vulnerabilities, permission violations, and compliance issues. Do not approve high-risk operations without explicit user consent.",
    maxTokens: 1000,
    temperature: 0.1,
  },
];

export interface AgentSwarmPlan {
  primaryAgentId: string;
  supportingAgents: string[];
  executionOrder: string[];
  dependencies: Map<string, string[]>;
}

export function getAgentById(id: string): AgentDefinition | undefined {
  return SPECIALIST_AGENTS.find(a => a.id === id);
}

export function getAgentsByType(type: AgentType): AgentDefinition[] {
  return SPECIALIST_AGENTS.filter(a => a.type === type);
}

export function canExecuteTool(agentId: string, toolId: string): boolean {
  const agent = getAgentById(agentId);
  if (!agent) return false;
  return agent.permissions.canExecuteTools.includes(toolId) || 
         agent.permissions.canExecuteTools.includes("*");
}

export class AgentOrchestrationError extends Error {
  readonly agentId?: string;
  readonly operation: string;
  constructor(operation: string, agentId?: string, message?: string) {
    super(message ?? `Agent operation failed: ${operation}`);
    this.name = "AgentOrchestrationError";
    this.operation = operation;
    this.agentId = agentId;
  }
}

export type AgentOperation = "execute" | "verify" | "solve" | "build-workflow" | "review-security" | "classify-intent";

export interface AgentExecutionOptions {
  timeout?: number;
  verify?: boolean;
  stream?: boolean;
}

export async function executeAgent(
  agentId: string,
  input: string | Record<string, any>,
  operation: AgentOperation = "execute",
  options?: AgentExecutionOptions,
): Promise<AgentExecutionResult> {
  const startTime = Date.now();
  const traceId = `agent_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    const agent = getAgentById(agentId);
    if (!agent) {
      return {
        success: false,
        error: `Agent not found: ${agentId}`,
        agentId,
        executionTimeMs: Date.now() - startTime,
        traceId,
      };
    }

    if (agent.status !== "active") {
      return {
        success: false,
        error: `Agent ${agentId} is not active (status: ${agent.status})`,
        agentId,
        executionTimeMs: Date.now() - startTime,
        traceId,
      };
    }

    let result: any;

    switch (operation) {
      case "classify-intent": {
        const query = typeof input === "string" ? input : JSON.stringify(input);
        const classification: IntentClassification = classifyIntent(query);
        const route = routeIntentToCapabilities(classification);
        result = { classification, route };
        break;
      }

      case "solve": {
        const query = typeof input === "string" ? input : JSON.stringify(input);
        const solveResult = await solveProblem(query);
        result = solveResult;
        break;
      }

      case "execute": {
        if (typeof input !== "object" || !("toolId" in input)) {
          throw new AgentOrchestrationError(operation, agentId, "execute requires { toolId, input }");
        }
        const executeResult = await executeTool({
          toolId: (input as any).toolId,
          input: (input as any).input,
          context: (input as any).context,
          options: { verify: options?.verify ?? true, timeout: options?.timeout },
        });
        result = executeResult;
        break;
      }

      case "verify": {
        if (typeof input !== "object" || !("toolId" in input)) {
          throw new AgentOrchestrationError(operation, agentId, "verify requires { toolId, input, output }");
        }
        const tool = findToolBySlug((input as any).toolId);
        if (!tool) {
          throw new AgentOrchestrationError(operation, agentId, `Tool not found: ${(input as any).toolId}`);
        }
        const verification = await verifyToolResult(tool, (input as any).input, (input as any).output);
        result = { verification };
        break;
      }

      case "build-workflow": {
        const query = typeof input === "string" ? input : JSON.stringify(input);
        const solveResult = await solveProblem(query, {
          preferences: {
            preferredExecution: "workflow",
            privacy: "local",
            budget: "free",
          },
        });
        result = solveResult;
        break;
      }

      case "review-security": {
        const review = await reviewSecurity(agentId, input);
        result = review;
        break;
      }

      default:
        throw new AgentOrchestrationError(operation, agentId, `Unsupported operation: ${operation}`);
    }

    return {
      success: true,
      output: result,
      agentId,
      executionTimeMs: Date.now() - startTime,
      traceId,
    };
  } catch (err: any) {
    if (err instanceof AgentOrchestrationError) {
      return {
        success: false,
        error: err.message,
        agentId,
        executionTimeMs: Date.now() - startTime,
        traceId,
      };
    }
    return {
      success: false,
      error: err?.message ?? "Unknown agent error",
      agentId,
      executionTimeMs: Date.now() - startTime,
      traceId,
    };
  }
}

async function reviewSecurity(agentId: string, input: string | Record<string, any>): Promise<any> {
  const agent = getAgentById(agentId);
  if (agent?.type !== "security") {
    return { valid: false, issues: ["Agent is not a security agent"] };
  }

  const inputStr = typeof input === "string" ? input : JSON.stringify(input);
  const riskPatterns = [
    /delete\s+(all|production|database)/i,
    /drop\s+table/i,
    /rm\s+-rf/i,
    /format\s+(c|disk)/i,
    /send\s+email\s+to\s+(all|users)/i,
    /publish\s+(production|live)/i,
    /grant\s+admin/i,
    /change\s+password/i,
  ];

  const issues: string[] = [];
  for (const pattern of riskPatterns) {
    if (pattern.test(inputStr)) {
      issues.push(`Potentially dangerous operation detected: ${pattern.source}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    requiresApproval: issues.length > 0,
    agentId,
    reviewedAt: new Date().toISOString(),
  };
}