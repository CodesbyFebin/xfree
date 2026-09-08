'use client';

import { useCallback, useState } from 'react';
import { format } from 'sql-formatter';

const DIALECTS = ['sql', 'mysql', 'postgresql', 'sqlite', 'transactsql'] as const;

export function SqlFormatterTool() {
  const [input, setInput] = useState('select id, name, email from users where active=1 order by name;');
  const [dialect, setDialect] = useState<(typeof DIALECTS)[number]>('sql');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    try {
      setOutput(format(input, { language: dialect, keywordCase: 'upper' }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to format SQL');
      setOutput('');
    }
  }, [input, dialect]);

  const handleCopy = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DIALECTS.map((d) => (
          <button
            key={d}
            onClick={() => setDialect(d)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${dialect === d ? 'bg-cyber-glow text-cyber-bg' : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text'}`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Input SQL</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">Formatted</label>
            {output && <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>}
          </div>
          <pre className={`w-full h-48 bg-cyber-bg border rounded-lg p-3 font-mono text-xs overflow-auto whitespace-pre-wrap ${error ? 'border-cyber-red text-cyber-red' : 'border-cyber-border text-cyber-glow'}`}>
            {error || output || 'Formatted SQL will appear here...'}
          </pre>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={execute} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Format SQL</span></button>
      </div>
    </div>
  );
}
