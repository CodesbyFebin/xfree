import React, { useState, useEffect } from "react";
import { IntentBar } from "../intent/IntentBar";
import { solveProblem, ExecutionResult, ExecutionStep, ExecutionPlan } from "../../lib/execution-engine";
import { classifyIntent } from "../../lib/intent-engine";
import { findToolBySlug } from "../../data/toolsRegistry";
import { ToolDefinition } from "../../types";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Play,
  Search,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SolvePageProps {
  problem: string;
  onNavigate?: (path: string) => void;
}

type SolveState = "idle" | "loading-plan" | "plan-ready" | "executing" | "results" | "error";

export const SolvePage: React.FC<SolvePageProps> = ({ problem, onNavigate }) => {
  const [state, setState] = useState<SolveState>("idle");
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(-1);

  const handleNavigateBack = () => {
    onNavigate?.("/");
  };

  const handleSolve = async (intentQuery: string) => {
    setState("loading-plan");
    setError(null);
    try {
      const intent = classifyIntent(intentQuery);
      const solveResult = await solveProblem(intentQuery);
      setPlan(solveResult.plan);
      setState("plan-ready");

      setTimeout(() => executePlan(solveResult.plan.steps, intentQuery), 0);
    } catch (err: any) {
      setState("error");
      setError(err?.message ?? "Failed to solve the problem");
    }
  };

  const executePlan = async (steps: ExecutionStep[], originalQuery: string) => {
    setState("executing");
    const allResults: ExecutionResult[] = [];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      try {
        const step = steps[i];
        const input = allResults.length > 0 ? allResults[allResults.length - 1].output : { problem: originalQuery };
        const result = await executeStep(step, input);
        allResults.push(result);
      } catch (err: any) {
        setError(err?.message ?? `Step ${i + 1} failed`);
        break;
      }
    }

    setResults(allResults);
    setCurrentStep(-1);
    setState(allResults.length > 0 ? "results" : "error");
  };

  const executeStep = async (step: ExecutionStep, input: any): Promise<ExecutionResult> => {
    try {
      const result = await import("../../lib/execution-engine").then((mod) =>
        mod.executeTool({
          toolId: step.toolId,
          input,
          options: { verify: step.verify },
        }),
      );
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: err?.message ?? "Unknown error",
        executionTimeMs: 0,
        traceId: `step_error_${Date.now()}`,
      };
    }
  };

  const handleExecuteTool = (toolSlug: string) => {
    handleSolve(toolSlug);
  };

  const handleSearchIntent = (query: string) => {
    handleSolve(query);
  };

  const handleRetry = () => {
    handleSolve(problem);
  };

  useEffect(() => {
    if (problem && state === "idle") {
      handleSolve(problem);
    }
  }, [problem]);

  const renderPlan = () => {
    if (!plan) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 mb-2">Execution Plan</h3>
        {plan.steps.map((step, idx) => {
          const tool = findToolBySlug(step.toolId);
          const isRunning = currentStep === idx;
          const isCompleted = results[idx]?.success;

          return (
            <div
              key={step.step}
              className={`p-4 rounded-xl border transition-all ${
                isRunning
                  ? "bg-cyan-500/10 border-cyan-500/30 animate-pulse"
                  : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-800/50 border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                  {step.step}
                </span>
                <div className="flex-1">
                  <code className="text-sm font-mono text-cyan-400">{step.toolId}</code>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tool?.shortDescription ?? step.expectedOutput ?? "Execute tool"}
                  </p>
                </div>
                {isRunning && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderResults = () => {
    if (state !== "results" && state !== "executing") return null;

    return (
      <div className="space-y-4 mt-6">
        <h3 className="text-sm font-semibold text-slate-400">Results</h3>
        {results.map((result, idx) => {
          const step = plan?.steps[idx];
          const tool = step ? findToolBySlug(step.toolId) : null;

          return (
            <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-cyan-400 bg-slate-900/50 px-2 py-0.5 rounded">
                      Step {idx + 1}
                    </span>
                    {tool ? (
                      <span className="text-sm font-semibold text-slate-200">{tool.title}</span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-200">{step?.toolId ?? "Unknown"}</span>
                    )}
                  </div>

                  {result.success ? (
                    <pre className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto">
                      {typeof result.output === "string"
                        ? result.output
                        : JSON.stringify(result.output, null, 2)}
                    </pre>
                  ) : (
                    <div className="flex items-start gap-2 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{result.error}</span>
                    </div>
                  )}
                </div>

                {result.success && typeof result.output === "string" && (
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.output);
                      } catch {}
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Copy output"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>

              {result.executionTimeMs > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{result.executionTimeMs}ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen starry-bg text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={handleNavigateBack}
            className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-200">Solve</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-16">
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-4">Problem: "{problem}"</p>
            <IntentBar
              onExecuteTool={handleExecuteTool}
              onSearchIntent={handleSearchIntent}
              recentInputs={[problem].filter(Boolean)}
            />
          </div>

          {state === "idle" && (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p>Enter a problem or select a tool to get started.</p>
            </div>
          )}

          {(state === "loading-plan" || state === "executing") && (
            <>
              {state === "loading-plan" && (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-cyan-400" />
                  <p>Analyzing your intent and building an execution plan...</p>
                </div>
              )}
              {plan && renderPlan()}
            </>
          )}

          {state === "plan-ready" && plan && renderPlan()}

          {renderResults()}

          {state === "error" && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300">Something went wrong</p>
                  <p className="text-sm text-slate-300 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
