'use client';

import { useState } from 'react';

function toWords(input: string): string[] {
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean);
}

const CONVERTERS: { id: string; label: string; convert: (s: string) => string }[] = [
  { id: 'lower', label: 'lowercase', convert: (s) => s.toLowerCase() },
  { id: 'upper', label: 'UPPERCASE', convert: (s) => s.toUpperCase() },
  { id: 'title', label: 'Title Case', convert: (s) => toWords(s).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') },
  { id: 'sentence', label: 'Sentence case', convert: (s) => { const l = s.toLowerCase(); return l.charAt(0).toUpperCase() + l.slice(1); } },
  { id: 'camel', label: 'camelCase', convert: (s) => { const w = toWords(s).map((x) => x.toLowerCase()); return w.map((x, i) => (i === 0 ? x : x.charAt(0).toUpperCase() + x.slice(1))).join(''); } },
  { id: 'pascal', label: 'PascalCase', convert: (s) => toWords(s).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('') },
  { id: 'snake', label: 'snake_case', convert: (s) => toWords(s).map((w) => w.toLowerCase()).join('_') },
  { id: 'kebab', label: 'kebab-case', convert: (s) => toWords(s).map((w) => w.toLowerCase()).join('-') },
  { id: 'constant', label: 'CONSTANT_CASE', convert: (s) => toWords(s).map((w) => w.toUpperCase()).join('_') },
];

export function CaseConverterTool() {
  const [input, setInput] = useState('Hello XFree World');
  const [copiedId, setCopiedId] = useState('');

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1500);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-24 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
        placeholder="Enter text..."
      />
      <div className="space-y-2">
        {CONVERTERS.map((c) => {
          const result = input ? c.convert(input) : '';
          return (
            <div key={c.id} className="flex items-center gap-3 bg-cyber-bg border border-cyber-border rounded-lg p-3">
              <span className="text-[10px] text-cyber-dim font-mono w-28 shrink-0">{c.label}</span>
              <span className="flex-1 text-sm font-mono text-cyber-glow break-all">{result || '—'}</span>
              {result && (
                <button
                  onClick={() => handleCopy(c.id, result)}
                  className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors shrink-0"
                >
                  {copiedId === c.id ? 'COPIED' : 'COPY'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
