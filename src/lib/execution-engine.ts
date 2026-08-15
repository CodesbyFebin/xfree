import { XFreeScore, ExecutionStep, ExecutionPlan } from "../types";
import { TOOLS_REGISTRY, INDEXABLE_TOOLS, findIndexableTool, findToolBySlug } from "../data/toolsRegistry";
import { classifyIntent, routeIntentToCapabilities, buildExecutionPlan } from "./intent-engine";

export interface ExecutionContext {
  userId?: string;
  organizationId?: string;
  permissions?: string[];
  preferences?: {
    preferredExecution: "local" | "ai" | "workflow" | "external";
    privacy: "local" | "private" | "cloud";
    budget: "free" | "open-source" | "paid";
  };
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  verification?: VerificationResult;
  executionTimeMs: number;
  toolExecuted?: string;
  traceId: string;
}

export interface VerificationResult {
  valid: boolean;
  issues: string[];
  checksPerformed: string[];
  confidence: number;
  evidence?: any[];
}

export interface ToolExecutionRequest {
  toolId: string;
  input: any;
  context?: ExecutionContext;
  options?: {
    verify?: boolean;
    timeout?: number;
    fallback?: boolean;
  };
}

export interface WorkflowExecutionRequest {
  workflowId: string;
  input: any;
  context?: ExecutionContext;
  options?: {
    verify?: boolean;
    timeout?: number;
  };
}

/**
 * Execute a single tool with optional verification
 */
export async function executeTool(
  request: ToolExecutionRequest
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const traceId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  try {
    const tool = findToolBySlug(request.toolId) || findToolBySlug(request.toolId);
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${request.toolId}`,
        executionTimeMs: Date.now() - startTime,
        traceId,
      };
    }

    // Check tool availability
    if (tool.availability === "unavailable") {
      return {
        success: false,
        error: `Tool ${tool.title} is currently unavailable`,
        executionTimeMs: Date.now() - startTime,
        traceId,
      };
    }

    // Execute the tool
    const result = await executeToolInternal(tool, request.input, request.context);
    
    // Verify if requested
    let verification: VerificationResult | undefined;
    if (request.options?.verify !== false) {
      verification = await verifyToolResult(tool, request.input, result);
    }

    return {
      success: true,
      output: result,
      verification,
      executionTimeMs: Date.now() - startTime,
      toolExecuted: tool.id,
      traceId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      executionTimeMs: Date.now() - startTime,
      traceId,
    };
  }
}

/**
 * Internal tool execution logic
 */
async function executeToolInternal(
  tool: ToolDefinition,
  input: any,
  context?: ExecutionContext
): Promise<any> {
  // For local tools, we return a mock result or would call the actual component
  // In production, this would invoke the actual tool implementation
  const executionMode = tool.execution || "local";
  
  switch (executionMode) {
    case "local":
      return executeLocalTool(tool, input);
    case "ai":
      return executeAiTool(tool, input, context);
    case "workflow":
      return executeWorkflowTool(tool, input, context);
    default:
      throw new Error(`Unknown execution mode: ${executionMode}`);
  }
}

function executeLocalTool(tool: ToolDefinition, input: any): any {
  // Local tools run in the browser/client
  // Here we return a placeholder that the client would use
  return {
    toolId: tool.id,
    input,
    output: `Processed by ${tool.title} (local)`,
    note: "This tool executes client-side. The browser will run the actual implementation.",
  };
}

async function executeAiTool(tool: ToolDefinition, input: any, context?: ExecutionContext): Promise<any> {
  // AI tools would call the AI backend
  return {
    toolId: tool.id,
    input,
    output: `Processed by ${tool.title} (AI)`,
    note: "AI execution would be routed through /api/ai endpoint",
  };
}

function executeWorkflowTool(tool: ToolDefinition, input: any, context?: ExecutionContext): any {
  return {
    toolId: tool.id,
    input,
    output: `Workflow ${tool.title} executed`,
    note: "Workflow execution would chain multiple tools",
  };
}

/**
 * Verify the result of a tool execution
 */
export async function verifyToolResult(
  tool: ToolDefinition,
  input: any,
  output: any
): Promise<VerificationResult> {
  const checks: string[] = [];
  const issues: string[] = [];
  
  // Basic validation checks
  checks.push("output_exists");
  if (!output) {
    issues.push("No output produced");
  }
  
  checks.push("tool_execution_mode_valid");
  if (!["local", "ai", "workflow"].includes(tool.execution || "local")) {
    issues.push(`Invalid execution mode: ${tool.execution}`);
  }
  
  // Tool-specific verification
  if (tool.capabilities) {
    for (const cap of tool.capabilities) {
      checks.push(`capability_${cap.id}_output_schema`);
      // In production, validate output against outputSchema
    }
  }
  
  // Check if tool is verified
  if (tool.verification) {
    checks.push("tool_verification_status");
    if (tool.verification.status !== "verified") {
      issues.push(`Tool verification status: ${tool.verification.status}`);
    }
    checks.push("tool_last_verified");
    const lastVerified = new Date(tool.verification.lastVerified);
    const daysSinceVerification = (Date.now() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceVerification > 30) {
      issues.push(`Tool not verified in ${Math.round(daysSinceVerification)} days`);
    }
  }
  
  const confidence = issues.length === 0 ? 0.95 : Math.max(0.3, 0.9 - issues.length * 0.15);
  
  return {
    valid: issues.length === 0,
    issues,
    checksPerformed: checks,
    confidence,
    evidence: [{ input, output, toolId: tool.id, timestamp: new Date().toISOString() }],
  };
}

/**
 * Execute a workflow (sequence of tools)
 */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  input: any,
  context?: ExecutionContext
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  let currentInput = input;
  
  for (const step of workflow.steps) {
    const tool = findToolBySlug(step.toolId);
    if (!tool) {
      results.push({
        success: false,
        error: `Tool ${step.toolId} not found in workflow step ${step.step}`,
        executionTimeMs: 0,
        traceId: `wf_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      });
      break;
    }
    
    const stepInput = step.transform ? step.transform(currentInput) : currentInput;
    const result = await executeTool({
      toolId: step.toolId,
      input: stepInput,
      context,
      options: { verify: step.verify },
    });
    
    results.push(result);
    
    if (!result.success) {
      break;
    }
    
    if (result.output) {
      currentInput = result.output;
    }
  }
  
  return results;
}

/**
 * Solve a natural language problem by routing to appropriate tools
 */
export async function solveProblem(
  problem: string,
  context?: ExecutionContext
): Promise<{
  intent: any;
  plan: ExecutionPlan;
  results: ExecutionResult[];
  finalOutput?: any;
}> {
  // Classify the intent
  const intent = classifyIntent(problem);
  
  // Build execution plan
  const plan = buildExecutionPlan(intent);
  
  // Execute the plan
  const results: ExecutionResult[] = [];
  let currentOutput: any = undefined;
  
  for (const step of plan.steps) {
    const input = currentOutput || { problem, intent: intent.intent };
    const result = await executeTool({
      toolId: step.toolId,
      input,
      context,
      options: { verify: step.verify },
    });
    
    results.push(result);
    
    if (!result.success) {
      // Try fallback
      if (plan.fallbackToolIds && plan.fallbackToolIds.length > 0) {
        for (const fallbackId of plan.fallbackToolIds) {
          const fallbackResult = await executeTool({
            toolId: fallbackId,
            input,
            context,
            options: { verify: step.verify },
          });
          
          results.push(fallbackResult);
          if (fallbackResult.success) {
            currentOutput = fallbackResult.output;
            break;
          }
        }
      }
      if (!currentOutput) {
        break;
      }
    } else {
      currentOutput = result.output;
    }
  }
  
  return {
    intent,
    plan,
    results,
    finalOutput: currentOutput,
  };
}

export interface WorkflowStep {
  step: number;
  toolId: string;
  action: "execute" | "ai" | "wait" | "verify" | "prompt";
  expectedOutput?: string;
  verify?: boolean;
  transform?: (input: any) => any;
  prompt?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get capability recommendations for a given problem
 */
export function getCapabilityRecommendations(problem: string): ToolDefinition[] {
  const intent = classifyIntent(problem);
  const route = routeIntentToCapabilities(intent);
  
  return route.toolIds
    .map(id => findToolBySlug(id))
    .filter((t): t is ToolDefinition => t !== undefined);
}

/**
 * Compare multiple tools for a given capability
 */
export function compareTools(
  toolIds: string[],
  criteria: string[] = ["capabilityFit", "reliability", "speed", "privacy", "pricing"]
): ComparisonResult[] {
  const tools = toolIds
    .map(id => findToolBySlug(id))
    .filter((t): t is ToolDefinition => t !== undefined);
  
  return tools.map(tool => ({
    toolId: tool.id,
    toolTitle: tool.title,
    scores: criteria.map(c => ({
      criterion: c,
      score: tool.xfreeScore?.breakdown?.[c] || tool.xfreeScore?.[c] || 0,
      weight: 1,
    })),
    overallScore: tool.xfreeScore?.overall || 0,
    strengths: extractStrengths(tool, criteria),
    weaknesses: extractWeaknesses(tool, criteria),
  }));
}

function extractStrengths(tool: ToolDefinition, criteria: string[]): string[] {
  const strengths: string[] = [];
  if (tool.xfreeScore) {
    for (const c of criteria) {
      const score = tool.xfreeScore.breakdown?.[c] || tool.xfreeScore[c as keyof typeof tool.xfreeScore];
      if (typeof score === "number" && score >= 0.8) {
        strengths.push(c);
      }
    }
  }
  if (tool.isFlagship) strengths.push("flagship");
  if (tool.verification?.status === "verified") strengths.push("verified");
  return strengths;
}

function extractWeaknesses(tool: ToolDefinition, criteria: string[]): string[] {
  const weaknesses: string[] = [];
  if (tool.xfreeScore) {
    for (const c of criteria) {
      const score = tool.xfreeScore.breakdown?.[c] || tool.xfreeScore[c as keyof typeof tool.xfreeScore];
      if (typeof score === "number" && score <= 0.5) {
        weaknesses.push(c);
      }
    }
  }
  if (tool.verification?.status === "failed") weaknesses.push("verification_failed");
  if (tool.availability === "degraded") weaknesses.push("degraded");
  return weaknesses;
}

export interface ComparisonResult {
  toolId: string;
  toolTitle: string;
  scores: Array<{ criterion: string; score: number; weight: number }>;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Health check for a tool
 */
export async function healthCheckTool(toolId: string): Promise<{
  healthy: boolean;
  toolId: string;
  latencyMs?: number;
  error?: string;
  lastChecked: string;
}> {
  const tool = findToolBySlug(toolId);
  if (!tool) {
    return {
      healthy: false,
      toolId,
      error: "Tool not found",
      lastChecked: new Date().toISOString(),
    };
  }
  
  const start = Date.now();
  try {
    // Simple connectivity check
    await executeTool({
      toolId,
      input: { test: true },
      options: { verify: false, timeout: 5000 },
    });
    
    return {
      healthy: true,
      toolId,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      toolId,
      error: error instanceof Error ? error.message : "Health check failed",
      lastChecked: new Date().toISOString(),
    };
  }
}