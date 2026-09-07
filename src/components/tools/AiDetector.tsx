import React, { useMemo, useState } from "react";
import { ToolDefinition } from "../../types";
import { AlertTriangle, Sparkles } from "lucide-react";

interface AiDetectorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

// Phrases disproportionately common in LLM output relative to typical human
// writing. This is a weak signal on its own — used only as one of several
// heuristic inputs, never as a standalone verdict.
const AI_TELLTALE_PHRASES = [
  "delve into", "in today's digital age", "it's important to note", "it is important to note",
  "in conclusion", "moreover", "furthermore", "boasts", "underscore", "tapestry",
  "realm of", "navigate the", "let's dive in", "unlock the", "unleash", "elevate your",
  "in the world of", "when it comes to", "at the end of the day", "as an ai language model",
  "i cannot", "i don't have personal", "seamless", "robust", "cutting-edge", "game-changer",
];

interface Analysis {
  score: number; // 0-100 heuristic "AI-likelihood"
  sentenceCount: number;
  avgSentenceLength: number;
  sentenceLengthCV: number; // coefficient of variation — lower = more uniform = more AI-like
  typeTokenRatio: number;
  telltaleHits: string[];
  signals: { label: string; weight: number; note: string }[];
}

function analyze(text: string): Analysis | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const words = trimmed.toLowerCase().match(/[a-z']+/g) || [];
  const sentenceLengths = sentences.map((s) => (s.match(/[a-z']+/gi) || []).length).filter((n) => n > 0);

  const avgSentenceLength = sentenceLengths.length ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length : 0;
  const variance = sentenceLengths.length > 1
    ? sentenceLengths.reduce((sum, n) => sum + Math.pow(n - avgSentenceLength, 2), 0) / sentenceLengths.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const sentenceLengthCV = avgSentenceLength > 0 ? stdDev / avgSentenceLength : 0;

  const uniqueWords = new Set(words);
  const typeTokenRatio = words.length > 0 ? uniqueWords.size / words.length : 0;

  const lowerText = trimmed.toLowerCase();
  const telltaleHits = AI_TELLTALE_PHRASES.filter((p) => lowerText.includes(p));

  const signals: Analysis["signals"] = [];
  let score = 30; // baseline — heuristics only push this up or down

  if (sentenceLengths.length >= 3) {
    if (sentenceLengthCV < 0.3) {
      score += 20;
      signals.push({ label: "Uniform sentence length", weight: 20, note: `Low variation (CV=${sentenceLengthCV.toFixed(2)}) across ${sentenceLengths.length} sentences — human writing usually varies more.` });
    } else if (sentenceLengthCV > 0.6) {
      score -= 10;
      signals.push({ label: "Varied sentence length", weight: -10, note: `High variation (CV=${sentenceLengthCV.toFixed(2)}) — a pattern more typical of human writing.` });
    }
  }

  if (telltaleHits.length > 0) {
    const add = Math.min(30, telltaleHits.length * 10);
    score += add;
    signals.push({ label: "Common AI phrasing", weight: add, note: `Found: "${telltaleHits.slice(0, 5).join('", "')}"` });
  }

  if (words.length >= 40) {
    if (typeTokenRatio > 0.75) {
      score += 10;
      signals.push({ label: "High vocabulary diversity", weight: 10, note: `${(typeTokenRatio * 100).toFixed(0)}% of words are unique — LLMs often avoid repeating words humans would repeat naturally.` });
    } else if (typeTokenRatio < 0.45) {
      score -= 5;
      signals.push({ label: "Natural word repetition", weight: -5, note: `${(typeTokenRatio * 100).toFixed(0)}% unique words — repetition is common in unedited human writing.` });
    }
  }

  score = Math.max(2, Math.min(97, score));

  return { score, sentenceCount: sentences.length, avgSentenceLength, sentenceLengthCV, typeTokenRatio, telltaleHits, signals };
}

export const AiDetector: React.FC<AiDetectorProps> = ({ tool, onSaveHistory }) => {
  const [text, setText] = useState(tool.exampleInput || "");
  const analysis = useMemo(() => analyze(text), [text]);

  const verdictLabel = (score: number) => {
    if (score >= 70) return { label: "Likely AI-generated", color: "text-rose-400" };
    if (score >= 45) return { label: "Uncertain / mixed signals", color: "text-amber-400" };
    return { label: "Likely human-written", color: "text-emerald-400" };
  };

  const handleAnalyze = () => {
    if (analysis) onSaveHistory(text.slice(0, 50), `${analysis.score}% AI-likelihood`);
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Heuristic estimate only — based on sentence-length uniformity, common AI phrasing, and vocabulary diversity. No detector (including paid enterprise ones) is reliably accurate, especially on short or edited text. Don't use this as the sole basis for an accusation.</span>
      </div>

      <div>
        <label className="text-xs font-bold text-white mb-1 block">Paste text to analyze</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleAnalyze}
          rows={8}
          placeholder="Paste at least a paragraph of text for a meaningful estimate..."
          className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {analysis && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className={`text-sm font-bold ${verdictLabel(analysis.score).color}`}>{verdictLabel(analysis.score).label}</span>
            </div>
            <span className="text-lg font-mono font-bold text-white">{analysis.score}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full ${analysis.score >= 70 ? "bg-rose-500" : analysis.score >= 45 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${analysis.score}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-400 pt-1">
            <div><div className="text-white font-mono font-bold">{analysis.sentenceCount}</div>sentences</div>
            <div><div className="text-white font-mono font-bold">{analysis.avgSentenceLength.toFixed(1)}</div>avg words/sentence</div>
            <div><div className="text-white font-mono font-bold">{(analysis.typeTokenRatio * 100).toFixed(0)}%</div>unique words</div>
          </div>

          {analysis.signals.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              {analysis.signals.map((s, i) => (
                <div key={i} className="text-xs text-zinc-400">
                  <span className={s.weight > 0 ? "text-rose-400" : "text-emerald-400"}>{s.weight > 0 ? "▲" : "▼"} {s.label}:</span> {s.note}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
