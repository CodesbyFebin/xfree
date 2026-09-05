import { describe, it, expect, beforeEach, vi } from "vitest";

const store: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};

(globalThis as any).localStorage = localStorageMock;
import {
  WorkflowEngine,
  workflowEngine,
  saveWorkflow,
  loadWorkflow,
  listWorkflows,
  deleteWorkflow,
  runWorkflow,
} from "../workflow";
import type { WorkflowDefinition } from "../../types";

const STORAGE_KEY = "xfree_workflows";

function makeWorkflow(id: string, steps: any[] = []): WorkflowDefinition {
  return {
    id,
    name: `Workflow ${id}`,
    description: "Test workflow",
    steps,
    tags: ["test"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("WorkflowEngine", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("save and load", () => {
    it("saves a workflow and returns its id", () => {
      const wf = makeWorkflow("wf-1");
      const id = saveWorkflow(wf);
      expect(id).toBe("wf-1");
    });

    it("loads a previously saved workflow", () => {
      const wf = makeWorkflow("wf-1");
      saveWorkflow(wf);
      const loaded = loadWorkflow("wf-1");
      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe("wf-1");
      expect(loaded!.name).toBe("Workflow wf-1");
    });

    it("returns null for a non-existent workflow id", () => {
      expect(loadWorkflow("nope")).toBeNull();
    });
  });

  describe("list", () => {
    it("returns empty array when nothing is saved", () => {
      expect(listWorkflows()).toHaveLength(0);
    });

    it("returns all saved workflows", () => {
      saveWorkflow(makeWorkflow("wf-1"));
      saveWorkflow(makeWorkflow("wf-2"));
      expect(listWorkflows()).toHaveLength(2);
    });

    it("persists to localStorage with the expected key", () => {
      saveWorkflow(makeWorkflow("wf-1"));
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("wf-1");
    });
  });

  describe("delete", () => {
    it("deletes an existing workflow", () => {
      saveWorkflow(makeWorkflow("wf-1"));
      expect(deleteWorkflow("wf-1")).toBe(true);
      expect(loadWorkflow("wf-1")).toBeNull();
      expect(listWorkflows()).toHaveLength(0);
    });

    it("returns false for a non-existent workflow", () => {
      expect(deleteWorkflow("nope")).toBe(false);
    });
  });

  describe("update existing workflow", () => {
    it("updates an existing workflow instead of duplicating", () => {
      const wf = makeWorkflow("wf-1");
      saveWorkflow(wf);
      wf.name = "Updated Name";
      saveWorkflow(wf);
      expect(listWorkflows()).toHaveLength(1);
      expect(loadWorkflow("wf-1")!.name).toBe("Updated Name");
    });
  });

  describe("singleton instance", () => {
    it("exports a singleton instance", () => {
      expect(workflowEngine).toBeInstanceOf(WorkflowEngine);
    });

    it("instance methods delegate to module functions", () => {
      const wf = makeWorkflow("wf-1");
      const id = workflowEngine.save(wf);
      expect(id).toBe("wf-1");
      expect(workflowEngine.list()).toHaveLength(1);
      expect(workflowEngine.load("wf-1")!.id).toBe("wf-1");
    });
  });

  describe("runWorkflow", () => {
    it("throws when workflow is not found", async () => {
      await expect(runWorkflow("missing", {})).rejects.toThrow("Workflow not found");
    });

    it("runs a workflow with no steps and returns empty results", async () => {
      saveWorkflow(makeWorkflow("wf-empty", []));
      const results = await runWorkflow("wf-empty", { input: "data" });
      expect(results).toHaveLength(0);
    });
  });
});
