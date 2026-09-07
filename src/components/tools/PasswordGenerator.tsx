import React, { useState, useMemo, useEffect } from "react";
import { ToolDefinition } from "../../types";
import { Copy, Check, RefreshCw, ShieldCheck } from "lucide-react";
import { passwordStrength } from "../../lib/tools/security";

interface PasswordGeneratorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

const STRENGTH_LABELS = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
const STRENGTH_COLORS = ["bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

function generatePassword(length: number, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }): string {
  const sets = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  };
  const pool = (Object.keys(opts) as (keyof typeof opts)[]).filter((k) => opts[k]).map((k) => sets[k]).join("");
  if (!pool) return "";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => pool[b % pool.length]).join("");
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ tool, onSaveHistory }) => {
  const [activeTab, setActiveTab] = useState<"generate" | "check">("generate");
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [password, setPassword] = useState(() => generatePassword(16, { upper: true, lower: true, numbers: true, symbols: true }));
  const [copied, setCopied] = useState(false);

  const [checkInput, setCheckInput] = useState(tool.exampleInput || "");
  const [checkResult, setCheckResult] = useState<{ score: 0 | 1 | 2 | 3 | 4; feedback: string[] } | null>(null);

  const regenerate = () => {
    const next = generatePassword(length, opts);
    setPassword(next);
    onSaveHistory(`length=${length}`, next.slice(0, 4) + "…");
  };

  useEffect(() => {
    let cancelled = false;
    if (!checkInput) {
      setCheckResult(null);
      return;
    }
    passwordStrength({ password: checkInput }).then((r) => {
      if (!cancelled) setCheckResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [checkInput]);

  const crackTimeEstimate = useMemo(() => {
    if (!password) return "";
    const poolSize = (opts.upper ? 26 : 0) + (opts.lower ? 26 : 0) + (opts.numbers ? 10 : 0) + (opts.symbols ? 26 : 0);
    const combinations = Math.pow(poolSize || 1, password.length);
    // Assumes 10 billion guesses/sec, a common offline GPU-cracking benchmark figure.
    const seconds = combinations / 1e10;
    const units: [number, string][] = [[60, "seconds"], [60, "minutes"], [24, "hours"], [365, "days"], [100, "years"]];
    let val = seconds;
    let label = "seconds";
    for (const [factor, name] of units) {
      if (val < factor) {
        label = name;
        break;
      }
      val /= factor;
      label = name;
    }
    if (val > 1e6) return "centuries";
    return `~${val < 1 ? "<1" : Math.round(val)} ${label}`;
  }, [password, opts]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggle = (key: keyof typeof opts) => {
    const next = { ...opts, [key]: !opts[key] };
    if (Object.values(next).every((v) => !v)) return; // keep at least one charset
    setOpts(next);
    setPassword(generatePassword(length, next));
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "generate" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
        >
          Generate Password
        </button>
        <button
          onClick={() => setActiveTab("check")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === "check" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
        >
          Check Strength
        </button>
      </div>

      {activeTab === "generate" ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
            <code className="text-sm sm:text-base font-mono text-emerald-300 break-all">{password || "Select at least one character set"}</code>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={regenerate} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer" title="Regenerate">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {password && <p className="text-[11px] text-zinc-500">Estimated offline crack time: <span className="text-zinc-300 font-mono">{crackTimeEstimate}</span> (10B guesses/sec benchmark)</p>}

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <label htmlFor="pw-length">Length</label>
              <span className="font-mono text-emerald-400">{length}</span>
            </div>
            <input
              id="pw-length"
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => {
                const l = Number(e.target.value);
                setLength(l);
                setPassword(generatePassword(l, opts));
              }}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([
              ["upper", "A-Z Uppercase"],
              ["lower", "a-z Lowercase"],
              ["numbers", "0-9 Numbers"],
              ["symbols", "!@# Symbols"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={opts[key]} onChange={() => toggle(key)} className="accent-emerald-500" />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white mb-1 block">Enter a password to check</label>
            <input
              type="text"
              value={checkInput}
              onChange={(e) => setCheckInput(e.target.value)}
              placeholder="Type a password..."
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {checkResult && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-bold text-white">{STRENGTH_LABELS[checkResult.score]}</span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= checkResult.score ? STRENGTH_COLORS[checkResult.score] : "bg-zinc-800"}`} />
                ))}
              </div>
              {checkResult.feedback.length > 0 && (
                <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                  {checkResult.feedback.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
