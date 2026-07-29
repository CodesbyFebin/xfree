import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Code, Copy, Check, Sparkles } from "lucide-react";

interface RegexTesterProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const RegexTesterExplainer: React.FC<RegexTesterProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [pattern, setPattern] = useState("([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})");
  const [flagG, setFlagG] = useState(true);
  const [flagI, setFlagI] = useState(true);
  const [flagM, setFlagM] = useState(false);
  const [testText, setTestText] = useState(
    "Contact our team at support@xfree.in or sales.team@company.co.uk for immediate assistance!"
  );
  const [replaceText, setReplaceText] = useState("[REDACTED_EMAIL]");
  const [copiedPattern, setCopiedPattern] = useState(false);

  const flagsStr = `${flagG ? "g" : ""}${flagI ? "i" : ""}${flagM ? "m" : ""}`;

  // Evaluate regex
  const regexEval = useMemo(() => {
    if (!pattern.trim()) {
      return { matches: [], error: null, replacedText: testText };
    }

    try {
      const regex = new RegExp(pattern, flagsStr);
      const matches: { match: string; index: number; groups: string[] }[] = [];

      if (flagG) {
        let match;
        let guard = 0;
        while ((match = regex.exec(testText)) !== null && guard < 500) {
          guard++;
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      } else {
        const match = regex.exec(testText);
        if (match) {
          matches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      const replacedText = testText.replace(regex, replaceText);

      return { matches, error: null, replacedText };
    } catch (err: any) {
      return { matches: [], error: err.message || "Invalid Regex Pattern", replacedText: testText };
    }
  }, [pattern, flagsStr, testText, replaceText, flagG]);

  const handleCopyPattern = () => {
    navigator.clipboard.writeText(`/${pattern}/${flagsStr}`);
    setCopiedPattern(true);
    setTimeout(() => setCopiedPattern(false), 2000);
    onSaveHistory(`Regex /${pattern}/`, `${regexEval.matches.length} matches`);
  };

  return (
    <div className="space-y-6">
      {/* Pattern Input & Flag Bar */}
      <div className="p-5 glass-panel rounded-2xl space-y-4 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" />
            <span>Regular Expression Pattern</span>
          </label>
          <button
            onClick={handleCopyPattern}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copiedPattern ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPattern ? "Copied!" : "Copy Regex"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl font-mono text-cyan-400 font-bold">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Type regex pattern..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-500/50"
          />
          <span className="text-xl font-mono text-cyan-400 font-bold">/</span>
          <span className="px-3 py-2 rounded-xl bg-slate-800 text-cyan-300 font-mono text-sm font-semibold border border-white/10">
            {flagsStr || "none"}
          </span>
        </div>

        {/* Flag Checkboxes */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={flagG}
              onChange={(e) => setFlagG(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-slate-900 accent-cyan-500"
            />
            <span>global (g)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={flagI}
              onChange={(e) => setFlagI(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-slate-900 accent-cyan-500"
            />
            <span>case-insensitive (i)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={flagM}
              onChange={(e) => setFlagM(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-slate-900 accent-cyan-500"
            />
            <span>multiline (m)</span>
          </label>
        </div>

        {regexEval.error && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono">
            {regexEval.error}
          </div>
        )}
      </div>

      {/* Test Sample Text Input */}
      <div className="p-5 glass-panel rounded-2xl space-y-3 border border-white/10">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
          Test Sample String
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          rows={4}
          className="w-full p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500/50 resize-y"
        />
      </div>

      {/* Match Results Breakdown Table */}
      <div className="p-5 glass-panel rounded-2xl space-y-4 border border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Match Highlights ({regexEval.matches.length} Found)
          </span>
        </div>

        {regexEval.matches.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 text-xs text-slate-400 italic">
            No matches found for pattern "/{pattern}/" in test text.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 font-mono text-xs text-slate-200 leading-relaxed">
              {regexEval.matches.map((m, idx) => (
                <div key={idx} className="p-3 my-1.5 rounded-xl bg-slate-800/80 border border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] uppercase">
                      Match #{idx + 1}
                    </span>
                    <span className="font-mono text-cyan-300 font-bold text-xs">{m.match}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Index: {m.index}</span>

                  {m.groups.length > 0 && (
                    <div className="w-full pt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                      <span className="font-bold text-slate-400">Groups:</span>
                      {m.groups.map((g, gIdx) => (
                        <span key={gIdx} className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 font-mono text-purple-300">
                          ${gIdx + 1}: "{g}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* String Replacement Testing Box */}
      <div className="p-5 glass-panel rounded-2xl space-y-3 border border-white/10">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
          String Replacement Preview
        </label>
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replacement string (e.g. $1 or [REDACTED])..."
          className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
        />
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-mono font-medium text-slate-200 leading-relaxed">
          {regexEval.replacedText}
        </div>
      </div>
    </div>
  );
};
