// src/lib/workflow.ts
// WorkflowEngine — manages workflow lifecycle with localStorage persistence

export type ExecutionMode = 'local' | 'cloud' | 'hybrid';
export type WorkflowStatus = 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'failed';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  engineId: string;
  name: string;
  description?: string;
  inputMapping?: Record<string, unknown>;
  outputMapping?: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
  status: StepStatus;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  executionMode: ExecutionMode;
  status: WorkflowStatus;
  version: string;
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  tags?: string[];
}

export interface StepExecutionResult {
  stepId: string;
  engineId: string;
  status: StepStatus;
  input: unknown;
  output?: unknown;
  error?: string;
  duration: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  currentStepIndex: number;
  totalSteps: number;
  startedAt: number;
  completedAt?: number;
  context: Record<string, unknown>;
  stepResults: StepExecutionResult[];
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  stepCount: number;
  executionMode: ExecutionMode;
  status: WorkflowStatus;
  createdAt: number;
  updatedAt: number;
  lastRunAt?: number;
  tags?: string[];
}

export type WorkflowEventType =
  | 'workflow:created'
  | 'workflow:updated'
  | 'workflow:deleted'
  | 'workflow:execution:started'
  | 'workflow:execution:step-started'
  | 'workflow:execution:step-completed'
  | 'workflow:execution:step-failed'
  | 'workflow:execution:completed'
  | 'workflow:execution:failed'
  | 'workflow:execution:cancelled'
  | 'workflow:execution:paused'
  | 'workflow:execution:resumed';

export interface WorkflowEvent {
  type: WorkflowEventType;
  workflowId?: string;
  executionId?: string;
  data?: unknown;
  timestamp: number;
}

export type WorkflowEventListener = (event: WorkflowEvent) => void;

type EngineRunner = (
  engineId: string,
  input: unknown,
  context: Record<string, unknown>
) => Promise<unknown>;

const STORAGE_KEY = 'xfree:workflows';
const EXECUTIONS_STORAGE_KEY = 'xfree:workflow-executions';
const MAX_EXECUTION_HISTORY = 50;

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${ts}${rand}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function validateWorkflow(data: unknown): data is Workflow {
  if (!data || typeof data !== 'object') return false;
  const w = data as Record<string, unknown>;
  return (
    typeof w.id === 'string' &&
    typeof w.name === 'string' &&
    Array.isArray(w.steps) &&
    typeof w.executionMode === 'string' &&
    typeof w.status === 'string' &&
    typeof w.createdAt === 'number' &&
    typeof w.updatedAt === 'number'
  );
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private listeners: Set<WorkflowEventListener> = new Set();
  private engineRunner: EngineRunner | null = null;
  private activeExecutionId: string | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // ─── Engine Runner Registration ────────────────────────────────

  setEngineRunner(runner: EngineRunner): void {
    this.engineRunner = runner;
  }

  // ─── Event System ──────────────────────────────────────────────

  subscribe(listener: WorkflowEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: Omit<WorkflowEvent, 'timestamp'>): void {
    const full: WorkflowEvent = { ...event, timestamp: Date.now() };
    this.listeners.forEach((fn) => {
      try {
        fn(full);
      } catch {
        // listener errors must not break the engine
      }
    });
  }

  // ─── Persistence ───────────────────────────────────────────────

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    const rawWorkflows = safeParse<string[]>(
      localStorage.getItem(STORAGE_KEY),
      []
    );
    this.workflows.clear();
    if (Array.isArray(rawWorkflows)) {
      for (const w of rawWorkflows) {
        if (validateWorkflow(w)) {
          this.workflows.set(w.id, w);
        }
      }
    }

    const rawExecutions = safeParse<WorkflowExecution[]>(
      localStorage.getItem(EXECUTIONS_STORAGE_KEY),
      []
    );
    this.executions.clear();
    if (Array.isArray(rawExecutions)) {
      for (const ex of rawExecutions) {
        if (ex && typeof ex.id === 'string' && typeof ex.workflowId === 'string') {
          if (ex.status === 'running' || ex.status === 'paused') {
            ex.status = 'failed';
            ex.completedAt = Date.now();
          }
          this.executions.set(ex.id, ex);
        }
      }
    }
  }

  private persistWorkflows(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = Array.from(this.workflows.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable — silent fail
    }
  }

  private persistExecutions(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const all = Array.from(this.executions.values())
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, MAX_EXECUTION_HISTORY);
      localStorage.setItem(EXECUTIONS_STORAGE_KEY, JSON.stringify(all));
    } catch {
      // silent
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────────

  createWorkflow(params: {
    name: string;
    description?: string;
    executionMode?: ExecutionMode;
    tags?: string[];
  }): Workflow {
    const now = Date.now();
    const workflow: Workflow = {
      id: generateId('wf'),
      name: params.name.trim() || 'Untitled Workflow',
      description: params.description?.trim() ?? '',
      steps: [],
      executionMode: params.executionMode ?? 'local',
      status: 'draft',
      version: '1.0.0',
      createdAt: now,
      updatedAt: now,
      tags: params.tags ?? [],
    };

    this.workflows.set(workflow.id, workflow);
    this.persistWorkflows();
    this.emit({ type: 'workflow:created', workflowId: workflow.id, data: workflow });
    return workflow;
  }

  getWorkflow(id: string): Workflow | null {
    return this.workflows.get(id) ?? null;
  }

  listWorkflows(filter?: {
    status?: WorkflowStatus;
    tag?: string;
    search?: string;
  }): WorkflowSummary[] {
    let results = Array.from(this.workflows.values());

    if (filter?.status) {
      results = results.filter((w) => w.status === filter.status);
    }
    if (filter?.tag) {
      results = results.filter((w) => w.tags?.includes(filter.tag!));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }

    return results
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        stepCount: w.steps.length,
        executionMode: w.executionMode,
        status: w.status,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        lastRunAt: w.lastRunAt,
        tags: w.tags,
      }));
  }

  updateWorkflow(
    id: string,
    updates: Partial<Workflow>
  ): Workflow | null {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;
    if (workflow.status === 'running') return null;

    const now = Date.now();

    if (updates.name !== undefined) workflow.name = updates.name.trim() || workflow.name;
    if (updates.description !== undefined) workflow.description = updates.description.trim();
    if (updates.executionMode !== undefined) workflow.executionMode = updates.executionMode;
    if (updates.tags !== undefined) workflow.tags = updates.tags;
    if (updates.steps !== undefined) {
      workflow.steps = updates.steps.map((s) => ({
        ...s,
        id: s.id || generateId('step'),
        status: s.status || 'pending',
      }));
    }

    workflow.updatedAt = now;

    if (workflow.steps.length > 0 && workflow.status === 'draft') {
      workflow.status = 'ready';
    } else if (workflow.steps.length === 0 && workflow.status === 'ready') {
      workflow.status = 'draft';
    }

    this.persistWorkflows();
    this.emit({ type: 'workflow:updated', workflowId: id, data: workflow });
    return workflow;
  }

  deleteWorkflow(id: string): boolean {
    const workflow = this.workflows.get(id);
    if (!workflow) return false;
    if (workflow.status === 'running') return false;

    this.workflows.delete(id);
    this.persistWorkflows();
    this.emit({ type: 'workflow:deleted', workflowId: id });
    return true;
  }

  duplicateWorkflow(id: string): Workflow | null {
    const source = this.workflows.get(id);
    if (!source) return null;

    const now = Date.now();
    const dup: Workflow = {
      ...structuredClone(source),
      id: generateId('wf'),
      name: `${source.name} (copy)`,
      status: source.steps.length > 0 ? 'ready' : 'draft',
      createdAt: now,
      updatedAt: now,
      lastRunAt: undefined,
      steps: source.steps.map((s) => ({
        ...s,
        id: generateId('step'),
        status: 'pending' as StepStatus,
        input: undefined,
        output: undefined,
        error: undefined,
        startedAt: undefined,
        completedAt: undefined,
        duration: undefined,
      })),
    };

    this.workflows.set(dup.id, dup);
    this.persistWorkflows();
    this.emit({ type: 'workflow:created', workflowId: dup.id, data: dup });
    return dup;
  }

  // ─── Step Management ───────────────────────────────────────────

  addStep(
    workflowId: string,
    step: { engineId: string; name: string; description?: string; inputMapping?: Record<string, unknown> }
  ): WorkflowStep | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status === 'running') return null;

    const newStep: WorkflowStep = {
      id: generateId('step'),
      engineId: step.engineId,
      name: step.name,
      description: step.description,
      inputMapping: step.inputMapping,
      status: 'pending',
    };

    workflow.steps.push(newStep);
    workflow.updatedAt = Date.now();

    if (workflow.status === 'draft') {
      workflow.status = 'ready';
    }

    this.persistWorkflows();
    this.emit({ type: 'workflow:updated', workflowId, data: workflow });
    return newStep;
  }

  removeStep(workflowId: string, stepId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status === 'running') return false;

    const idx = workflow.steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return false;

    workflow.steps.splice(idx, 1);
    workflow.updatedAt = Date.now();

    if (workflow.steps.length === 0 && workflow.status === 'ready') {
      workflow.status = 'draft';
    }

    this.persistWorkflows();
    this.emit({ type: 'workflow:updated', workflowId, data: workflow });
    return true;
  }

  reorderSteps(workflowId: string, fromIndex: number, toIndex: number): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status === 'running') return false;
    if (fromIndex >= workflow.steps.length) return false;
    if (toIndex >= workflow.steps.length) return false;
    if (fromIndex === toIndex) return true;

    const [moved] = workflow.steps.splice(fromIndex, 1);
    workflow.steps.splice(toIndex, 0, moved);
    workflow.updatedAt = Date.now();

    this.persistWorkflows();
    this.emit({ type: 'workflow:updated', workflowId, data: workflow });
    return true;
  }

  // ─── Execution ─────────────────────────────────────────────────

  async executeWorkflow(
    workflowId: string,
    initialInput?: Record<string, unknown>
  ): Promise<WorkflowExecution | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;
    if (workflow.steps.length === 0) return null;
    if (workflow.status === 'running') return null;
    if (!this.engineRunner) return null;
    if (this.activeExecutionId) return null;

    this.abortController = new AbortController();
    const executionId = generateId('ex');

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      workflowName: workflow.name,
      status: 'running',
      currentStepIndex: 0,
      totalSteps: workflow.steps.length,
      startedAt: Date.now(),
      context: { ...(initialInput ?? {}) },
      stepResults: [],
    };

    this.activeExecutionId = executionId;
    this.executions.set(executionId, execution);

    workflow.status = 'running';
    workflow.lastRunAt = Date.now();
    this.persistWorkflows();

    this.emit({
      type: 'workflow:execution:started',
      workflowId,
      executionId,
      data: execution,
    });

    const runner = this.engineRunner;
    const signal = this.abortController.signal;

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        if (signal.aborted) {
          execution.status = 'cancelled';
          break;
        }

        const step = workflow.steps[i];
        const stepStart = Date.now();
        execution.currentStepIndex = i;

        this.emit({
          type: 'workflow:execution:step-started',
          workflowId,
          executionId,
          data: { stepIndex: i, stepId: step.id },
        });

        try {
          const input = this.resolveStepInput(step, execution.context);
          const output = await runner(step.engineId, input, execution.context);

          step.status = 'completed';
          step.output = output;
          step.completedAt = Date.now();
          step.duration = Date.now() - stepStart;

          execution.stepResults.push({
            stepId: step.id,
            engineId: step.engineId,
            status: 'completed',
            input,
            output,
            duration: step.duration!,
          });

          if (output !== undefined && step.outputMapping) {
            for (const [targetKey, sourceKey] of Object.entries(step.outputMapping)) {
              const val = (output as Record<string, unknown>)?.[String(sourceKey)];
              if (val !== undefined) {
                execution.context[targetKey] = val;
              }
            }
          }

          this.persistWorkflows();
          this.persistExecutions();

          this.emit({
            type: 'workflow:execution:step-completed',
            workflowId,
            executionId,
            data: { stepIndex: i, stepId: step.id, output, duration: step.duration! },
          });
        } catch (err) {
          const duration = Date.now() - stepStart;
          const errorMsg = err instanceof Error ? err.message : String(err);

          step.status = 'failed';
          step.error = errorMsg;
          step.completedAt = Date.now();
          step.duration = duration;

          execution.stepResults.push({
            stepId: step.id,
            engineId: step.engineId,
            status: 'failed',
            input: step.input,
            error: errorMsg,
            duration,
          });

          this.persistWorkflows();
          this.persistExecutions();

          this.emit({
            type: 'workflow:execution:step-failed',
            workflowId,
            executionId,
            data: { stepIndex: i, stepId: step.id, error: errorMsg },
          });

          execution.status = 'failed';
          execution.completedAt = Date.now();
          break;
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.completedAt = Date.now();
        workflow.status = 'ready';
        this.emit({ type: 'workflow:execution:completed', workflowId, executionId, data: execution });
      } else if (execution.status === 'failed') {
        workflow.status = 'ready';
        this.emit({ type: 'workflow:execution:failed', workflowId, executionId, data: execution });
      } else if (execution.status === 'cancelled') {
        workflow.status = 'ready';
        this.emit({ type: 'workflow:execution:cancelled', workflowId, executionId, data: execution });
      }
    } finally {
      this.persistWorkflows();
      this.persistExecutions();
      this.activeExecutionId = null;
      this.abortController = null;
    }

    return execution;
  }

  private resolveStepInput(
    step: WorkflowStep,
    context: Record<string, unknown>
  ): unknown {
    if (!step.inputMapping || Object.keys(step.inputMapping).length === 0) {
      return step.input ?? context;
    }

    const resolved: Record<string, unknown> = {};
    for (const [targetKey, sourceExpr] of Object.entries(step.inputMapping)) {
      const expr = String(sourceExpr);
      if (expr.startsWith('literal:')) {
        resolved[targetKey] = expr.slice(8);
      } else if (expr.includes('.')) {
        const parts = expr.split('.');
        let val: unknown = context;
        for (const part of parts) {
          if (val && typeof val === 'object') {
            val = (val as Record<string, unknown>)[part];
          } else {
            val = undefined;
            break;
          }
        }
        resolved[targetKey] = val;
      } else {
        resolved[targetKey] = context[expr];
      }
    }
    return resolved;
  }

  private waitForResume(executionId: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        const ex = this.executions.get(executionId);
        if (!ex || ex.status !== 'paused') {
          resolve();
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }

  pauseExecution(executionId: string): boolean {
    const ex = this.executions.get(executionId);
    if (!ex || ex.status !== 'running') return false;
    ex.status = 'paused';
    this.persistExecutions();
    this.emit({ type: 'workflow:execution:paused', workflowId: ex.workflowId, executionId });
    return true;
  }

  resumeExecution(executionId: string): boolean {
    const ex = this.executions.get(executionId);
    if (!ex || ex.status !== 'paused') return false;
    ex.status = 'running';
    this.persistExecutions();
    this.emit({ type: 'workflow:execution:resumed', workflowId: ex.workflowId, executionId });
    return true;
  }

  cancelExecution(executionId: string): boolean {
    if (this.activeExecutionId !== executionId) return false;
    this.abortController?.abort();
    return true;
  }

  getActiveExecution(): WorkflowExecution | null {
    if (!this.activeExecutionId) return null;
    return this.executions.get(this.activeExecutionId) ?? null;
  }

  getExecution(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) ?? null;
  }

  listExecutions(workflowId?: string): WorkflowExecution[] {
    let results = Array.from(this.executions.values());
    if (workflowId) {
      results = results.filter((ex) => ex.workflowId === workflowId);
    }
    return results.sort((a, b) => b.startedAt - a.startedAt);
  }

  deleteExecution(executionId: string): boolean {
    if (this.activeExecutionId === executionId) return false;
    const deleted = this.executions.delete(executionId);
    if (deleted) this.persistExecutions();
    return deleted;
  }

  clearExecutionHistory(): void {
    if (this.activeExecutionId) {
      const active = this.executions.get(this.activeExecutionId);
      this.executions.clear();
      if (active) this.executions.set(active.id, active);
    } else {
      this.executions.clear();
    }
    this.persistExecutions();
  }

  // ─── Export / Import ───────────────────────────────────────────

  exportWorkflow(workflowId: string): string | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const exportData = {
      format: 'xfree-workflow',
      version: '1.0',
      exportedAt: Date.now(),
      workflow: {
        ...workflow,
        status: workflow.steps.length > 0 ? 'ready' : 'draft',
        steps: workflow.steps.map((s) => ({
          ...s,
          status: 'pending' as StepStatus,
          input: undefined,
          output: undefined,
          error: undefined,
          startedAt: undefined,
          completedAt: undefined,
          duration: undefined,
        })),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  importWorkflow(json: string): Workflow | null {
    try {
      const data = JSON.parse(json);
      if (data.format !== 'xfree-workflow') return null;
      if (!validateWorkflow(data.workflow)) return null;

      const workflow: Workflow = {
        ...data.workflow,
        id: generateId('wf'),
        status: data.workflow.steps.length > 0 ? 'ready' : 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastRunAt: undefined,
        steps: data.workflow.steps.map((s: WorkflowStep) => ({
          ...s,
          id: generateId('step'),
          status: 'pending' as StepStatus,
        })),
      };

      this.workflows.set(workflow.id, workflow);
      this.persistWorkflows();
      this.emit({ type: 'workflow:created', workflowId: workflow.id, data: workflow });
      return workflow;
    } catch {
      return null;
    }
  }

  // ─── Stats ─────────────────────────────────────────────────────

  getStats(): {
    totalWorkflows: number;
    draft: number;
    ready: number;
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
  } {
    const all = Array.from(this.workflows.values());
    const execs = Array.from(this.executions.values());

    return {
      totalWorkflows: all.length,
      draft: all.filter((w) => w.status === 'draft').length,
      ready: all.filter((w) => w.status === 'ready').length,
      totalExecutions: execs.length,
      completedExecutions: execs.filter((e) => e.status === 'completed').length,
      failedExecutions: execs.filter((e) => e.status === 'failed').length,
    };
  }

  // ─── Reset ─────────────────────────────────────────────────────

  resetAll(): void {
    if (this.activeExecutionId) {
      this.abortController?.abort();
    }
    this.workflows.clear();
    this.executions.clear();
    this.activeExecutionId = null;
    this.abortController = null;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXECUTIONS_STORAGE_KEY);
    }
  }
}

// Singleton instance
let instance: WorkflowEngine | null = null;

export function getWorkflowEngine(): WorkflowEngine {
  if (!instance) {
    instance = new WorkflowEngine();
  }
  return instance;
}
