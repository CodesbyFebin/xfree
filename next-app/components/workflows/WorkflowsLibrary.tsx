'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS } from '@/lib/data/tools';

interface SavedWorkflow {
  id: string;
  name: string;
  steps: Array<{
    toolId: string;
    input?: string;
  }>;
  createdAt: string;
}

const STORAGE_KEY = 'xfree_workflows';

export function getSavedWorkflows(): SavedWorkflow[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveWorkflow(workflow: Omit<SavedWorkflow, 'id' | 'createdAt'>): SavedWorkflow {
  const workflows = getSavedWorkflows();
  const newWorkflow: SavedWorkflow = {
    ...workflow,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  workflows.push(newWorkflow);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  return newWorkflow;
}

export function deleteWorkflow(id: string): void {
  const workflows = getSavedWorkflows();
  const filtered = workflows.filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function WorkflowsLibrary() {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', steps: [{ toolId: '', input: '' }] });

  useEffect(() => {
    setWorkflows(getSavedWorkflows());
  }, []);

  const handleAddStep = () => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, { toolId: '', input: '' }],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!newWorkflow.name || newWorkflow.steps.length === 0) return;

    const saved = saveWorkflow({
      name: newWorkflow.name,
      steps: newWorkflow.steps.filter(s => s.toolId),
    });
    setWorkflows(prev => [...prev, saved]);
    setNewWorkflow({ name: '', steps: [{ toolId: '', input: '' }] });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white font-mono">Saved Workflows</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded text-xs font-mono bg-cyber-glow text-black hover:bg-cyber-glow/90 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Workflow'}
        </button>
      </div>

      {showForm && (
        <div className="cyber-card p-4 space-y-4">
          <input
            type="text"
            placeholder="Workflow name..."
            value={newWorkflow.name}
            onChange={e => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 rounded bg-cyber-bg border border-cyber-border text-white font-mono text-sm focus:border-cyber-glow focus:outline-none"
          />

          {newWorkflow.steps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={step.toolId}
                onChange={e => {
                  const steps = [...newWorkflow.steps];
                  steps[i].toolId = e.target.value;
                  setNewWorkflow(prev => ({ ...prev, steps }));
                }}
                className="flex-1 px-3 py-2 rounded bg-cyber-bg border border-cyber-border text-white font-mono text-sm focus:border-cyber-glow focus:outline-none"
              >
                <option value="">Select tool...</option>
                {TOOLS.filter(t => t.indexable).map(tool => (
                  <option key={tool.id} value={tool.id}>{tool.title}</option>
                ))}
              </select>
              <button
                onClick={() => handleRemoveStep(i)}
                className="px-2 py-2 rounded text-red-400 hover:bg-red-500/20 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={handleAddStep}
            className="text-xs font-mono text-cyber-muted hover:text-cyber-glow"
          >
            + Add Step
          </button>

          <button
            onClick={handleSave}
            disabled={!newWorkflow.name || newWorkflow.steps.every(s => !s.toolId)}
            className="w-full px-4 py-2 rounded bg-cyber-glow text-black font-mono text-sm font-bold hover:bg-cyber-glow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Workflow
          </button>
        </div>
      )}

      {workflows.length === 0 && !showForm ? (
        <div className="cyber-card p-8 text-center">
          <p className="text-cyber-muted font-mono text-sm">
            No saved workflows yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {workflows.map(workflow => (
            <div key={workflow.id} className="cyber-card p-4 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">{workflow.name}</h3>
                  <p className="text-xs text-cyber-muted mt-1">
                    {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/tools/${workflow.steps[0]?.toolId || ''}`}
                    className="px-2 py-1 rounded text-xs font-mono text-cyber-glow hover:bg-cyber-glow/10 transition-colors"
                  >
                    Run →
                  </Link>
                  <button
                    onClick={() => {
                      deleteWorkflow(workflow.id);
                      setWorkflows(getSavedWorkflows());
                    }}
                    className="px-2 py-1 rounded text-xs font-mono text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
