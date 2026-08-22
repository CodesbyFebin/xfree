import React, { useState } from "react";
import { Brain, Sparkles, RefreshCw, Copy, Check, ArrowRight, Lightbulb, Zap } from "lucide-react";

export function ThinkingModeComponent() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
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
      const response = await fetch("/api/ai/thinking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: "general",
          prompt: prompt.trim(),
        }),
      });

      const data = await response.json();
      if (data.success && data.answer) {
        setAnswer(data.answer);
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 rounded-2xl text-white shadow-lg shadow-purple-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Gemini Thinking Mode
              <span className="px-2.5 py-0.5 text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Server-selected reasoning model
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Deep, multi-step analytical reasoning for complex architectural, regex, database, and SEO strategy queries
            </p>
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <label className="text-xs font-mono uppercase text-slate-400 mb-2 block">
          Sample High-Complexity Scenarios:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(item.prompt)}
              className="p-3 bg-slate-800/80 hover:bg-slate-800 text-left rounded-xl border border-slate-700/80 hover:border-purple-500/50 transition-all group"
            >
              <div className="text-xs font-semibold text-purple-300 group-hover:text-purple-200 flex items-center justify-between">
                <span>{item.label}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Query Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase text-slate-300">
            Complex Query or Code Problem:
          </label>
          <span className="text-xs text-slate-500 font-mono">ThinkingLevel: HIGH · server-configured output limit</span>
        </div>
        <textarea
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a complex coding error, SQL architecture query, regex logic requirement, or technical SEO migration scenario..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
        />
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExecuteThinking}
          disabled={loading || !prompt.trim()}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Thinking with the server-selected reasoning model...</span>
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
        <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Reasoning Output */}
      {answer && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Deep Reasoning Output:
            </h3>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Output"}</span>
            </button>
          </div>
          <div className="p-5 bg-slate-950 rounded-xl border border-purple-900/40 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
