import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Code, Copy, Check, AlertTriangle, CheckCircle2, FileText, Sparkles, Network } from "lucide-react";

interface JsonFormatterProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const JsonFormatterValidatorDiff: React.FC<JsonFormatterProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [jsonInput, setJsonInput] = useState(tool.exampleInput || "");
  const [activeMode, setActiveMode] = useState<"format" | "minify" | "tree">("format");
  const [copied, setCopied] = useState(false);

  // Parse and validate JSON
  const validationResult = useMemo(() => {
    if (!jsonInput.trim()) {
      return { isValid: true, error: null, formatted: "", minified: "", parsed: null };
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      const minified = JSON.stringify(parsed);
      return { isValid: true, error: null, formatted, minified, parsed };
    } catch (err: any) {
      return {
        isValid: false,
        error: err.message || "Invalid JSON syntax",
        formatted: "",
        minified: "",
        parsed: null,
      };
    }
  }, [jsonInput]);

  // Attempt standard client-side JSON auto-fix
  const handleAutoFix = () => {
    try {
      // Fix single quotes to double quotes, trailing commas, missing quotes around keys
      let fixed = jsonInput
        .replace(/'/g, '"')
        .replace(/,\s*([\}\]])/g, "$1") // trailing commas
        .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":'); // unquoted keys

      const parsed = JSON.parse(fixed);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Keep as is if heuristic fails
    }
  };

  const handleCopyOutput = () => {
    const text = activeMode === "minify" ? validationResult.minified : validationResult.formatted;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(jsonInput.slice(0, 50), "Formatted JSON");
  };

  // Helper component for simple interactive JSON tree node rendering
  const renderTreeNode = (data: any, keyName?: string): React.ReactNode => {
    if (data === null) return <span className="text-zinc-500 font-mono">null</span>;
    if (typeof data === "boolean") return <span className="text-amber-400 font-mono">{String(data)}</span>;
    if (typeof data === "number") return <span className="text-cyan-400 font-mono">{data}</span>;
    if (typeof data === "string") return <span className="text-emerald-300 font-mono">"{data}"</span>;

    if (Array.isArray(data)) {
      return (
        <details open className="pl-3 border-l border-zinc-800 my-1">
          <summary className="cursor-pointer text-zinc-400 hover:text-white font-mono text-xs">
            {keyName ? <span className="text-purple-300">{keyName}: </span> : null}
            <span className="text-zinc-500">Array({data.length})</span>
          </summary>
          <div className="pl-3 space-y-1 mt-1">
            {data.map((item, idx) => (
              <div key={idx} className="text-xs">
                {renderTreeNode(item, String(idx))}
              </div>
            ))}
          </div>
        </details>
      );
    }

    if (typeof data === "object") {
      return (
        <details open className="pl-3 border-l border-zinc-800 my-1">
          <summary className="cursor-pointer text-zinc-400 hover:text-white font-mono text-xs">
            {keyName ? <span className="text-purple-300">{keyName}: </span> : null}
            <span className="text-zinc-500">Object({Object.keys(data).length})</span>
          </summary>
          <div className="pl-3 space-y-1 mt-1">
            {Object.entries(data).map(([k, v]) => (
              <div key={k} className="text-xs">
                {renderTreeNode(v, k)}
              </div>
            ))}
          </div>
        </details>
      );
    }

    return String(data);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Raw Input Column */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Raw JSON Input</span>
          </label>
          <div className="flex items-center gap-2">
            {!validationResult.isValid && (
              <button
                onClick={handleAutoFix}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-all cursor-pointer"
              >
                Auto-Fix Common Errors
              </button>
            )}
            <span className="text-xs text-zinc-400 font-mono">
              {jsonInput.length.toLocaleString()} chars
            </span>
          </div>
        </div>

        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Paste JSON string here..."
          rows={14}
          className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-y leading-relaxed"
        />

        {/* Validation Status Indicator */}
        <div className="pt-2">
          {validationResult.isValid ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Valid JSON Syntax</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationResult.error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Output Column */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveMode("format")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeMode === "format" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                Pretty Print
              </button>
              <button
                onClick={() => setActiveMode("minify")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeMode === "minify" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                Minify
              </button>
              <button
                onClick={() => setActiveMode("tree")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeMode === "tree" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                Tree View
              </button>
            </div>

            {validationResult.isValid && (
              <button
                onClick={handleCopyOutput}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Output"}</span>
              </button>
            )}
          </div>

          {/* Formatted View */}
          {activeMode === "format" && (
            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-[420px]">
              {validationResult.isValid
                ? validationResult.formatted
                : "<!-- Fix JSON syntax errors on the left to view output -->"}
            </pre>
          )}

          {/* Minified View */}
          {activeMode === "minify" && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300 leading-relaxed break-all max-h-[420px] overflow-y-auto">
              {validationResult.isValid ? validationResult.minified : "Invalid JSON"}
            </div>
          )}

          {/* Interactive Tree View */}
          {activeMode === "tree" && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 max-h-[420px] overflow-y-auto">
              {validationResult.isValid && validationResult.parsed ? (
                renderTreeNode(validationResult.parsed)
              ) : (
                <div className="text-zinc-500 italic">Invalid JSON for Tree View</div>
              )}
            </div>
          )}
        </div>

        {validationResult.isValid && (
          <div className="pt-2 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
            <span>Size: {new Blob([validationResult.minified]).size} bytes</span>
            <span>Keys: {validationResult.parsed && typeof validationResult.parsed === "object" ? Object.keys(validationResult.parsed).length : 1}</span>
          </div>
        )}
      </div>
    </div>
  );
};
