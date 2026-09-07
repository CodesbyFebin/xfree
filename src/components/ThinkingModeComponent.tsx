import React, { useState } from "react";
import { Brain, Sparkles, RefreshCw, Copy, Check, ArrowRight, Lightbulb } from "lucide-react";

export function ThinkingModeComponent() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    {
      label: "Complex SQL Join & Window Function",
      prompt: "Write a SQL query for PostgreSQL that calculates the running 7-day average revenue per active user, handling NULL dates and user retention cohorts efficiently.",
    },
    {
      label: "Regex for Recursive Nested JSON",
      prompt: "Explain how to validate or parse balanced nested brackets and JSON objects using advanced PCRE regex patterns, with edge case breakdowns.",
    },
    {
      label: "SEO Canonical & Multi-Domain Architecture",
      prompt: "Formulate a step-by-step programmatic SEO canonicalization and redirect strategy for a site migrating 500,000 URLs across 3 international subdomains.",
    },
  ];

  const handleExecuteThinking = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      // The server always uses its own fixed system prompt and model for
      // this task (src/server/tasks.ts / env config) — the client can't
      // override either, by design, so only the prompt itself is sent.
      const response = await fetch("/api/ai/thinking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();
      if (data.success && data.answer) {
        setAnswer(data.answer);
        setModel(data.model || null);
      } else {
        setError(data.error || "Thinking mode failed to produce output.");
      }
    } catch (err: any) {
      setError(err.message || "Network error connecting to Thinking Mode server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cyber-card p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyber-glow/10 border border-cyber-glow/30 rounded-xl text-cyber-glow">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
              Deep Reasoning Mode
              <span className="px-2.5 py-0.5 text-xs font-mono bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 rounded-full">
                {model || "Gemini"}
              </span>
            </h2>
            <p className="text-xs text-cyber-muted">
              Deep, multi-step analytical reasoning for complex architectural, regex, database, and SEO strategy queries
            </p>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <label className="text-xs font-mono uppercase text-cyber-muted mb-2 block">
          Sample high-complexity scenarios:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(item.prompt)}
              className="p-3 bg-cyber-bg/60 hover:bg-cyber-bg text-left rounded-xl border border-cyber-border hover:border-cyber-glow/40 transition-all group focus-ring"
            >
              <div className="text-xs font-semibold text-cyber-glow flex items-center justify-between">
                <span>{item.label}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-cyber-muted mt-1 line-clamp-2">{item.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase text-cyber-muted">
          Complex query or code problem:
        </label>
        <textarea
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a complex coding error, SQL architecture query, regex logic requirement, or technical SEO migration scenario..."
          className="w-full bg-cyber-bg border border-cyber-border rounded-xl p-4 text-sm text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-glow font-mono"
        />
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExecuteThinking}
          disabled={loading || !prompt.trim()}
          className="cyber-btn cyber-btn-filled px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Thinking deeply…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run Deep Thinking Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-cyber-magenta/10 border border-cyber-magenta/30 rounded-xl text-cyber-magenta text-sm">
          {error}
        </div>
      )}

      {/* Reasoning Output */}
      {answer && (
        <div className="space-y-3 pt-4 border-t border-cyber-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
              <Lightbulb className="w-4 h-4 text-cyber-amber" />
              Deep reasoning output:
            </h3>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs bg-cyber-bg hover:bg-cyber-surface text-cyber-muted hover:text-white rounded-lg border border-cyber-border flex items-center gap-1.5 transition-colors focus-ring"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-cyber-glow" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Output"}</span>
            </button>
          </div>
          <div className="p-5 bg-cyber-bg rounded-xl border border-cyber-border text-cyber-text font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
