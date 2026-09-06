import React, { useState, useCallback, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Copy, Check, RefreshCw, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PasswordGeneratorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const STRENGTH_LABELS: Record<StrengthLevel, { text: string; color: string; bg: string }> = {
  0: { text: "Very Weak", color: "text-rose-400", bg: "bg-rose-500" },
  1: { text: "Weak", color: "text-orange-400", bg: "bg-orange-500" },
  2: { text: "Fair", color: "text-amber-400", bg: "bg-amber-500" },
  3: { text: "Strong", color: "text-emerald-400", bg: "bg-emerald-500" },
  4: { text: "Very Strong", color: "text-emerald-400", bg: "bg-emerald-500" },
};

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export const PasswordGeneratorTool: React.FC<PasswordGeneratorProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [showStrength, setShowStrength] = useState(true);

  const ambiguousChars = "Il1O0";

  const generatePassword = useCallback(() => {
    let charset = "";
    if (includeUppercase) charset += CHAR_SETS.uppercase;
    if (includeLowercase) charset += CHAR_SETS.lowercase;
    if (includeNumbers) charset += CHAR_SETS.numbers;
    if (includeSymbols) charset += CHAR_SETS.symbols;

    if (excludeAmbiguous) {
      charset = charset.split("").filter(c => !ambiguousChars.includes(c)).join("");
    }

    if (!charset) {
      setPassword("");
      return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const result = Array.from(array, x => charset[x % charset.length]).join("");
    setPassword(result);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous]);

  const calculateStrength = useCallback((): StrengthLevel => {
    if (!password) return 0;
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    return Math.min(4, score) as StrengthLevel;
  }, [password]);

  const strength = useMemo(() => calculateStrength(), [calculateStrength]);
  const strengthInfo = STRENGTH_LABELS[strength];

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(`length=${length}`, password.slice(0, 20) + "...");
  };

  const handleRegenerate = () => {
    generatePassword();
  };

  const handleSave = () => {
    onSaveHistory(`length=${length}, chars=${[includeUppercase, includeLowercase, includeNumbers, includeSymbols].filter(Boolean).length}`, password.slice(0, 20) + "...");
  };

  return (
    <div className="space-y-6">
      {/* Password Display */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Generated Password</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Generate new password"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {password && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer transition-all"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-lg text-emerald-400 tracking-wider break-all min-h-[52px] flex items-center">
          {password || <span className="text-zinc-600 text-sm">Click generate to create password</span>}
        </div>

        {/* Strength Meter */}
        {showStrength && password && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Password Strength</span>
              <span className={`font-semibold ${strengthInfo.color}`}>{strengthInfo.text}</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    level <= strength ? strengthInfo.bg : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Length Slider */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider">Password Length</label>
          <span className="text-emerald-400 font-mono font-bold text-lg">{length}</span>
        </div>
        <input
          type="range"
          min={4}
          max={128}
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-zinc-500 font-mono">
          <span>4</span>
          <span>64</span>
          <span>128</span>
        </div>
      </div>

      {/* Character Options */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <label className="text-xs font-bold text-white uppercase tracking-wider">Character Sets</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "uppercase", label: "Uppercase (A-Z)", value: includeUppercase, onChange: setIncludeUppercase, example: "ABC" },
            { key: "lowercase", label: "Lowercase (a-z)", value: includeLowercase, onChange: setIncludeLowercase, example: "abc" },
            { key: "numbers", label: "Numbers (0-9)", value: includeNumbers, onChange: setIncludeNumbers, example: "123" },
            { key: "symbols", label: "Symbols (!@#$...)", value: includeSymbols, onChange: setIncludeSymbols, example: "!@#" },
          ].map(({ key, label, value, onChange, example }) => (
            <label
              key={key}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                value
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-zinc-800/50 border-zinc-700 text-zinc-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <span className="text-xs font-mono opacity-60">{example}</span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-400 cursor-pointer hover:border-zinc-600 transition-all">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
          />
          <span className="text-sm">Exclude ambiguous characters (Il1O0)</span>
        </label>
      </div>

      {/* Generate Button */}
      <button
        onClick={generatePassword}
        className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Generate Password</span>
      </button>

      {/* Privacy Notice */}
      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
        <p className="text-xs text-cyan-300 flex items-start gap-2">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Password generation happens entirely in your browser using the Web Crypto API. No data is transmitted to any server.</span>
        </p>
      </div>
    </div>
  );
};
