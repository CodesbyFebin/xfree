'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Shield } from 'lucide-react';

export function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showStrength, setShowStrength] = useState(true);

  const ambiguousChars = 'Il1O0';

  const calculateStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-zinc-700' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    const normalized = Math.min(4, score);
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];
    return { score: normalized, label: labels[normalized], color: colors[normalized] };
  };

  const strength = calculateStrength(password);

  const generatePassword = useCallback(() => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeAmbiguous) {
      charset = charset.split('').filter((c) => !ambiguousChars.includes(c)).join('');
    }

    if (!charset) {
      setPassword('');
      return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const result = Array.from(array, (x) => charset[x % charset.length]).join('');
    setPassword(result);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous]);

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border">
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-bold text-cyber-glow uppercase tracking-wider font-mono flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Generated Password
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={generatePassword}
              className="p-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-glow transition-all cursor-pointer"
              title="Generate new"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {password && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-glow text-cyber-bg font-bold text-xs cursor-pointer transition-all hover:bg-cyber-glow/90"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cyber-bg border border-cyber-border font-mono text-lg text-cyber-glow tracking-wider break-all min-h-[52px] flex items-center">
          {password || <span className="text-cyber-muted text-sm">Click generate to create password</span>}
        </div>

        {showStrength && password && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyber-muted">Strength</span>
              <span className="font-semibold text-cyber-glow">{strength.label}</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full transition-all ${level <= strength.score ? strength.color : 'bg-zinc-700'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white uppercase tracking-wider font-mono">Length</label>
          <span className="text-cyber-glow font-mono font-bold text-lg">{length}</span>
        </div>
        <input
          type="range"
          min={4}
          max={128}
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyber-glow"
        />
        <div className="flex justify-between text-xs text-cyber-muted font-mono">
          <span>4</span>
          <span>64</span>
          <span>128</span>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-cyber-surface border border-cyber-border space-y-4">
        <label className="text-xs font-bold text-white uppercase tracking-wider font-mono">Character Sets</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'uppercase', label: 'Uppercase (A-Z)', value: includeUppercase, onChange: setIncludeUppercase, example: 'ABC' },
            { key: 'lowercase', label: 'Lowercase (a-z)', value: includeLowercase, onChange: setIncludeLowercase, example: 'abc' },
            { key: 'numbers', label: 'Numbers (0-9)', value: includeNumbers, onChange: setIncludeNumbers, example: '123' },
            { key: 'symbols', label: 'Symbols (!@#$)', value: includeSymbols, onChange: setIncludeSymbols, example: '!@#' },
          ].map(({ key, label, value, onChange, example }) => (
            <label
              key={key}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                value ? 'bg-cyber-glow/10 border-cyber-glow/30 text-cyber-glow' : 'bg-cyber-bg border-cyber-border text-cyber-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <span className="text-xs font-mono opacity-60">{example}</span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-cyber-bg border border-cyber-border text-cyber-muted cursor-pointer hover:border-cyber-glow/50 transition-all">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-cyber-bg text-cyber-glow focus:ring-cyber-glow"
          />
          <span className="text-sm">Exclude ambiguous characters (Il1O0)</span>
        </label>
      </div>

      <button
        onClick={generatePassword}
        className="w-full py-4 rounded-xl bg-cyber-glow hover:bg-cyber-glow/90 text-cyber-bg font-bold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Generate Password
      </button>

      <div className="p-4 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20">
        <p className="text-xs text-cyber-cyan flex items-start gap-2">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          Generated using Web Crypto API locally. No data transmitted.
        </p>
      </div>
    </div>
  );
}
