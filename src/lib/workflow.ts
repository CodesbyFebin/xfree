import { WorkflowDefinition, WorkflowStep, ExecutionResult } from "../types";
import { executeWorkflow, ExecutionContext, executeTool } from "./execution-engine";

const STORAGE_KEY = "xfree_workflows";

export function saveWorkflow(workflow: WorkflowDefinition): string {
  const workflows = listWorkflows();
  const existing = workflows.find((w) => w.id === workflow.id);
  const now = new Date().toISOString();
  const normalized: WorkflowDefinition = {
    ...workflow,
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  };
  if (existing) {
    Object.assign(existing, normalized);
    const idx = workflows.findIndex((w) => w.id === workflow.id);
    workflows[idx] = existing;
  } else {
    workflows.push(normalized);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  return normalized.id;
}

export function loadWorkflow(id: string): WorkflowDefinition | null {
  const workflows = listWorkflows();
  return workflows.find((w) => w.id === id) ?? null;
}

export function listWorkflows(): WorkflowDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkflowDefinition[];
  } catch {
    return [];
  }
}

export function deleteWorkflow(id: string): boolean {
  const workflows = listWorkflows();
  const idx = workflows.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  workflows.splice(idx, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  return true;
}

export async function runWorkflow(
  workflowId: string,
  input: any,
  context?: ExecutionContext,
): Promise<ExecutionResult[]> {
  const workflow = loadWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }
  const results: ExecutionResult[] = [];
  let currentInput = input;

  for (const step of workflow.steps) {
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

export class WorkflowEngine {
  save(workflow: WorkflowDefinition): string {
    return saveWorkflow(workflow);
  }

  load(id: string): WorkflowDefinition | null {
    return loadWorkflow(id);
  }

  list(): WorkflowDefinition[] {
    return listWorkflows();
  }

  delete(id: string): boolean {
    return deleteWorkflow(id);
  }

  async run(id: string, input: any, context?: ExecutionContext): Promise<ExecutionResult[]> {
    return runWorkflow(id, input, context);
  }
}

export const workflowEngine = new WorkflowEngine();
