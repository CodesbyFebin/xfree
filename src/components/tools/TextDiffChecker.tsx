import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Split, Copy, Check, Lock } from "lucide-react";

interface DiffProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const TextDiffChecker: React.FC<DiffProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"diff" | "hash">("diff");

  // Diff State
  const [textLeft, setTextLeft] = useState(
    "const app = express();\napp.listen(3000, () => console.log('Started'));"
  );
  const [textRight, setTextRight] = useState(
    "const app = express();\napp.use(express.json());\napp.listen(3000, () => console.log('Server running on 3000'));"
  );

  // Hash State
  const [hashInput, setHashInput] = useState("XFree.in Micro-Tools Platform");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Compute Line Diff
  const diffResult = useMemo(() => {
    const leftLines = textLeft.split("\n");
    const rightLines = textRight.split("\n");

    const max = Math.max(leftLines.length, rightLines.length);
    const rows = [];

    for (let i = 0; i < max; i++) {
      const left = leftLines[i] ?? "";
      const right = rightLines[i] ?? "";
      const isDiff = left !== right;

      rows.push({
        lineNum: i + 1,
        left,
        right,
        isDiff,
      });
    }

    return rows;
  }, [textLeft, textRight]);

  // Compute Hashes using Web Crypto API
  const [hashes, setHashes] = useState<{ sha256: string; sha512: string; sha1: string }>({
    sha256: "calculating...",
    sha512: "calculating...",
    sha1: "calculating...",
  });

  useMemo(() => {
    if (!hashInput) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);

    Promise.all([
      crypto.subtle.digest("SHA-256", data),
      crypto.subtle.digest("SHA-512", data),
      crypto.subtle.digest("SHA-1", data),
    ]).then(([s256, s512, s1]) => {
      const hex = (buffer: ArrayBuffer) =>
        Array.from(new Uint8Array(buffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      setHashes({
        sha256: hex(s256),
        sha512: hex(s512),
        sha1: hex(s1),
      });
    });
  }, [hashInput]);

  const handleCopyHash = (hashVal: string, type: string) => {
    navigator.clipboard.writeText(hashVal);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
    onSaveHistory(`Hash ${type}`, hashVal.slice(0, 30));
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("diff")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "diff" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Text & Code Diff Checker
        </button>

        <button
          onClick={() => setActiveTab("hash")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "hash" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Cryptographic Hash Generator
        </button>
      </div>

      {activeTab === "diff" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-white mb-1 block">Original Text (Left)</label>
              <textarea
                value={textLeft}
                onChange={(e) => setTextLeft(e.target.value)}
                rows={6}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-y"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-white mb-1 block">Modified Text (Right)</label>
              <textarea
                value={textRight}
                onChange={(e) => setTextRight(e.target.value)}
                rows={6}
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-y"
              />
            </div>
          </div>

          {/* Diff Output Table */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 overflow-x-auto space-y-1 font-mono text-xs">
            <div className="text-xs text-zinc-400 font-sans border-b border-zinc-800 pb-2 mb-2 font-bold">
              Line-by-Line Comparison Output
            </div>
            {diffResult.map((row) => (
              <div
                key={row.lineNum}
                className={`grid grid-cols-12 p-1.5 rounded ${
                  row.isDiff ? "bg-amber-500/10 border border-amber-500/20 text-amber-300" : "text-zinc-300"
                }`}
              >
                <span className="col-span-1 text-zinc-600 font-bold">#{row.lineNum}</span>
                <span className="col-span-5 truncate border-r border-zinc-800/80 pr-2">{row.left}</span>
                <span className="col-span-6 truncate pl-2">{row.right}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white mb-1 block">Input Text for Cryptographic Hashing</label>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-bold text-emerald-400">SHA-256</span>
                <button
                  onClick={() => handleCopyHash(hashes.sha256, "SHA-256")}
                  className="text-xs hover:text-white"
                >
                  {copiedHash === "SHA-256" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="text-emerald-300 break-all">{hashes.sha256}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-bold text-cyan-400">SHA-512</span>
                <button
                  onClick={() => handleCopyHash(hashes.sha512, "SHA-512")}
                  className="text-xs hover:text-white"
                >
                  {copiedHash === "SHA-512" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="text-cyan-300 break-all">{hashes.sha512}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-bold text-purple-400">SHA-1</span>
                <button
                  onClick={() => handleCopyHash(hashes.sha1, "SHA-1")}
                  className="text-xs hover:text-white"
                >
                  {copiedHash === "SHA-1" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="text-purple-300 break-all">{hashes.sha1}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
