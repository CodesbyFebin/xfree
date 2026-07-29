import React, { useState } from "react";
import { Upload, Download, Play, Check, AlertCircle, FileText, Table, Loader2 } from "lucide-react";
import { downloadAsCsv, downloadAsJson, downloadAsTxt } from "../utils/exportUtils";

export interface BatchItemResult {
  id: number;
  input: string;
  output: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

export interface BatchProcessingComponentProps {
  toolName?: string;
  placeholder?: string;
  onProcessLine?: (line: string, index: number) => Promise<string> | string;
  onProcessBatch?: (lines: string[]) => Promise<Array<{ input: string; output: string; success: boolean; error?: string }>>;
}

export const BatchProcessingComponent: React.FC<BatchProcessingComponentProps> = ({
  toolName = "Tool",
  placeholder = "Paste multiple items or URLs (one per line)...",
  onProcessLine,
  onProcessBatch,
}) => {
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<BatchItemResult[]>([]);
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "txt">("csv");

  // File upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
      }
    };
    reader.readAsText(file);
  };

  const parseInputLines = (text: string): string[] => {
    if (!text.trim()) return [];
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const handleRunBatch = async () => {
    const lines = parseInputLines(rawText);
    if (lines.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: lines.length });

    const initialResults: BatchItemResult[] = lines.map((line, idx) => ({
      id: idx + 1,
      input: line,
      output: "",
      status: "pending",
    }));

    setResults(initialResults);

    try {
      if (onProcessBatch) {
        // Run full array batch handler
        const batchOutputs = await onProcessBatch(lines);
        const updated = lines.map((line, idx) => {
          const res = batchOutputs[idx];
          return {
            id: idx + 1,
            input: line,
            output: res ? res.output : "No output returned",
            status: res && res.success ? ("success" as const) : ("error" as const),
            error: res ? res.error : undefined,
          };
        });
        setResults(updated);
        setProgress({ current: lines.length, total: lines.length });
      } else if (onProcessLine) {
        // Line-by-line processing
        const updated = [...initialResults];
        for (let i = 0; i < lines.length; i++) {
          updated[i].status = "processing";
          setResults([...updated]);
          try {
            const out = await onProcessLine(lines[i], i);
            updated[i].output = out;
            updated[i].status = "success";
          } catch (err: any) {
            updated[i].output = "Error processing line";
            updated[i].status = "error";
            updated[i].error = err.message || "Line error";
          }
          setProgress({ current: i + 1, total: lines.length });
          setResults([...updated]);
        }
      } else {
        // Fallback default echo/transformer if no callback provided
        const updated = lines.map((line, idx) => ({
          id: idx + 1,
          input: line,
          output: `Processed [${line}]`,
          status: "success" as const,
        }));
        setResults(updated);
        setProgress({ current: lines.length, total: lines.length });
      }
    } catch (err: any) {
      console.error("Batch execution error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (results.length === 0) return;
    const cleanToolSlug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, "_");

    if (exportFormat === "csv") {
      downloadAsCsv(
        results.map((r) => ({
          ID: r.id,
          Input: r.input,
          Output: r.output,
          Status: r.status,
        })),
        `${cleanToolSlug}_batch_results.csv`
      );
    } else if (exportFormat === "json") {
      downloadAsJson(results, `${cleanToolSlug}_batch_results.json`);
    } else {
      const txt = results.map((r) => `[Item #${r.id}] ${r.input} => ${r.output}`).join("\n");
      downloadAsTxt(txt, `${cleanToolSlug}_batch_results.txt`);
    }
  };

  const completedCount = results.filter((r) => r.status === "success").length;

  return (
    <div className="space-y-6">
      {/* File Upload or Raw Line Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Paste Batch Items (1 per line)</span>
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="w-full p-3 bg-white border-2 border-black font-mono text-xs text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Or Upload CSV / TXT File</span>
            </label>
            <div className="p-4 bg-gray-50 border-2 border-dashed border-black flex flex-col items-center justify-center text-center gap-2 hover:bg-gray-100 transition-colors relative cursor-pointer min-h-[120px]">
              <Upload className="w-6 h-6 text-gray-600" />
              <div className="text-xs font-bold text-black">
                {fileName ? `Uploaded: ${fileName}` : "Click or drag CSV/TXT file here"}
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleRunBatch}
            disabled={isProcessing || !rawText.trim()}
            className="w-full py-3 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black uppercase text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Batch ({progress.current}/{progress.total})...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Process Batch Now ({parseInputLines(rawText).length} items)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {progress.total > 0 && (
        <div className="p-4 bg-white border-2 border-black space-y-2">
          <div className="flex justify-between items-center text-xs font-black uppercase">
            <span>Batch Execution Status</span>
            <span>{Math.round((progress.current / progress.total) * 100)}% ({completedCount}/{progress.total} Done)</span>
          </div>
          <div className="w-full bg-gray-200 h-3 border border-black overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-200"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Batch Results Table */}
      {results.length > 0 && (
        <div className="p-4 bg-white border-2 border-black space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-blue-600" />
              <h3 className="text-xs font-black text-black uppercase">
                Batch Results ({results.length} records)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="px-2 py-1 text-xs font-bold bg-white border border-black uppercase"
              >
                <option value="csv">CSV Format</option>
                <option value="json">JSON Format</option>
                <option value="txt">TXT Format</option>
              </select>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-green-300 hover:bg-green-400 text-black border-2 border-black font-black uppercase text-xs flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Results</span>
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-black">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-gray-100 border-b border-black font-sans uppercase font-black">
                <tr>
                  <th className="p-2 border-r border-black w-12 text-center">#</th>
                  <th className="p-2 border-r border-black w-1/3">Input Requirement</th>
                  <th className="p-2 border-r border-black">Processed Output</th>
                  <th className="p-2 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-yellow-50">
                    <td className="p-2 border-r border-black text-center font-bold text-gray-500">{res.id}</td>
                    <td className="p-2 border-r border-black truncate max-w-xs">{res.input}</td>
                    <td className="p-2 border-r border-black text-blue-900 font-bold">{res.output || "—"}</td>
                    <td className="p-2 text-center font-sans font-black uppercase text-[10px]">
                      {res.status === "success" && (
                        <span className="text-green-700 bg-green-100 px-2 py-0.5 border border-green-300">
                          Success
                        </span>
                      )}
                      {res.status === "error" && (
                        <span className="text-red-700 bg-red-100 px-2 py-0.5 border border-red-300">
                          Failed
                        </span>
                      )}
                      {res.status === "processing" && (
                        <span className="text-blue-700 bg-blue-100 px-2 py-0.5 border border-blue-300 animate-pulse">
                          Running
                        </span>
                      )}
                      {res.status === "pending" && (
                        <span className="text-gray-600 bg-gray-100 px-2 py-0.5 border border-gray-300">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
