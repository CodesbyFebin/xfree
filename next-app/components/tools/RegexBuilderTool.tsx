'use client';

import { useMemo, useState } from 'react';

const TEMPLATES: { label: string; pattern: string }[] = [
  { label: 'Email', pattern: '^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$' },
  { label: 'URL', pattern: '^https?:\\/\\/[\\w.-]+\\.[a-zA-Z]{2,}([\\/\\w.-]*)*\\/?$' },
  { label: 'IPv4 address', pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$' },
  { label: 'Digits only', pattern: '^\\d+$' },
  { label: 'Letters only', pattern: '^[a-zA-Z]+$' },
  { label: 'Alphanumeric', pattern: '^[a-zA-Z0-9]+$' },
  { label: 'Hex color', pattern: '^#[0-9a-fA-F]{6}$' },
  { label: 'US phone (basic)', pattern: '^\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}$' },
  { label: 'Date (YYYY-MM-DD)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  { label: 'Whitespace only', pattern: '^\\s*$' },
];

export function RegexBuilderTool() {
  const [pattern, setPattern] = useState(TEMPLATES[0].pattern);
  const [testInput, setTestInput] = useState('user@example.com');

  const result = useMemo(() => {
    try {
      const regex = new RegExp(pattern);
      return { valid: true, matches: regex.test(testInput) };
    } catch {
      return { valid: false, matches: false };
    }
  }, [pattern, testInput]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Start from a template</label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => setPattern(t.pattern)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${pattern === t.pattern ? 'bg-cyber-glow text-cyber-bg' : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Pattern</label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Test String</label>
        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      <div className={`cyber-card p-3 border ${!result.valid ? 'border-cyber-red/30' : result.matches ? 'border-emerald-500/30' : 'border-cyber-border'}`}>
        <p className={`font-mono text-sm font-bold ${!result.valid ? 'text-cyber-red' : result.matches ? 'text-emerald-400' : 'text-cyber-muted'}`}>
          {!result.valid ? '✗ Invalid pattern' : result.matches ? '✓ Matches' : 'No match'}
        </p>
      </div>
    </div>
  );
}
