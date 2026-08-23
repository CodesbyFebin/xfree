import React, { useState } from "react";
import { ToolDefinition } from "../../types";
import { Sparkles, Copy, Check, Loader2, AlertCircle, Layers } from "lucide-react";
import { BatchProcessingComponent } from "../BatchProcessingComponent";

interface CloudAiMicroToolProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

const SUPPORTED_AI_TASK_IDS = new Set([
  "ai-regex",
  "ai-json-repair",
  "ai-meta-optimizer",
  "ai-sql-generator",
  "ai-search-intent",
  "ai-code-explainer",
  "ai-commit-generator",
  "ai-schema-generator",
]);

function taskIdForTool(toolId: string): string {
  return SUPPORTED_AI_TASK_IDS.has(toolId) ? toolId : "general";
}

export const CloudAiMicroToolComponent: React.FC<CloudAiMicroToolProps> = ({ tool, onSaveHistory }) => {
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [inputVal, setInputVal] = useState(tool.exampleInput || "");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecuteAi = async () => {
    if (!inputVal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: taskIdForTool(tool.id), input: inputVal }),
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || "Failed to process AI request");
      setAiResult(json.data);
      onSaveHistory(inputVal.slice(0, 50), JSON.stringify(json.data).slice(0, 100));
    } catch (err: any) {
      setError(err.message || "An error occurred calling AI proxy.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!aiResult) return;
    const textToCopy = typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBatchProcess = async (lines: string[]) => {
    const response = await fetch("/api/ai/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: taskIdForTool(tool.id), items: lines }),
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || "Failed batch execution");
    onSaveHistory(`Batch CSV/TXT (${lines.length} items)`, `Batch complete for ${tool.title}`);
    return lines.map((line, idx) => {
      const found = json.results?.find((r: any) => r.id === idx + 1);
      if (found && found.success) {
        let formattedOutput = "";
        if (tool.id === "ai-regex" && found.data?.pattern) {
          formattedOutput = `/${found.data.pattern}/${found.data.flags || "g"}`;
        } else if (tool.id === "ai-meta-optimizer" && found.data?.title) {
          formattedOutput = `Title: ${found.data.title} | Meta: ${found.data.metaDescription || ""}`;
        } else {
          formattedOutput = typeof found.data === "string" ? found.data : JSON.stringify(found.data);
        }
        return { input: line, output: formattedOutput, success: true };
      }
      return { input: line, output: "Error processing item", success: false, error: found?.error };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b-2 border-black bg-gray-100 p-1 font-bold text-xs uppercase">
        <button onClick={() => setActiveTab("single")} className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${activeTab === "single" ? "bg-black text-white font-black shadow-sm" : "text-gray-700 hover:bg-gray-200"}`}>
          <Sparkles className="w-4 h-4 text-yellow-300" /><span>Single Prompt Mode</span>
        </button>
        <button onClick={() => setActiveTab("batch")} className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${activeTab === "batch" ? "bg-black text-white font-black shadow-sm" : "text-gray-700 hover:bg-gray-200"}`}>
          <Layers className="w-4 h-4 text-blue-400" /><span>Batch File Processing (CSV / TXT)</span><span className="px-1.5 py-0.5 bg-yellow-300 text-black text-[10px] font-black uppercase border border-black">NEW</span>
        </button>
      </div>

      {activeTab === "single" ? (
        <div className="space-y-6">
          <div className="p-5 bg-white brutal-border brutal-shadow space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="text-xs font-black uppercase text-black flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-600" /><span>AI Input Requirement</span></label>
              <button onClick={handleExecuteAi} disabled={loading || !inputVal.trim()} className="flex items-center gap-2 px-5 py-2.5 border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs uppercase brutal-shadow-sm disabled:opacity-50 transition-all cursor-pointer">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}<span>{loading ? "Processing AI..." : "Run AI Tool"}</span>
              </button>
            </div>
            <textarea value={inputVal} onChange={(e) => setInputVal(e.target.value)} rows={5} placeholder="Describe requirement or paste code/text..." className="w-full p-3.5 border-2 border-black bg-gray-50 text-black text-xs font-medium focus:outline-none focus:bg-white resize-y leading-relaxed" />
          </div>

          {error && <div className="p-4 border-2 border-red-600 bg-red-50 text-red-700 text-xs font-mono font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}

          {aiResult && (
            <div className="p-5 bg-white brutal-border brutal-shadow space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <span className="text-xs font-black text-black uppercase flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-blue-600" /> AI Generated Result</span>
                <button onClick={handleCopyResult} className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs uppercase cursor-pointer">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}<span>{copied ? "Copied!" : "Copy Result"}</span>
                </button>
              </div>

              {tool.id === "ai-regex" && aiResult.pattern && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 border-2 border-black bg-yellow-100 text-black font-black text-sm">/{aiResult.pattern}/{aiResult.flags || "g"}</div>
                  {aiResult.explanation && <div className="p-3.5 border-2 border-black bg-gray-50 text-gray-800 space-y-1 font-sans"><span className="font-black text-black text-xs uppercase block">Explanation:</span><p className="text-xs text-gray-700 font-medium">{aiResult.explanation}</p></div>}
                </div>
              )}

              {tool.id === "ai-meta-optimizer" && aiResult.title && (
                <div className="space-y-3 font-sans text-xs">
                  <div className="p-3.5 border-2 border-black bg-blue-50 space-y-1"><span className="text-gray-500 block text-[10px] uppercase font-black">Optimized Title Tag</span><span className="text-blue-700 font-black text-sm">{aiResult.title}</span></div>
                  <div className="p-3.5 border-2 border-black bg-gray-50 space-y-1"><span className="text-gray-500 block text-[10px] uppercase font-black">Meta Description</span><span className="text-gray-900 text-xs font-medium leading-relaxed">{aiResult.metaDescription}</span></div>
                </div>
              )}

              <pre className="p-4 border-2 border-black bg-black text-green-400 text-xs font-mono leading-relaxed overflow-x-auto max-h-96">{JSON.stringify(aiResult, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 bg-white brutal-border brutal-shadow">
          <BatchProcessingComponent toolName={tool.title} placeholder={`Paste list of items or URLs for ${tool.title} (1 item per line)...`} onProcessBatch={handleBatchProcess} />
        </div>
      )}
    </div>
  );
};
