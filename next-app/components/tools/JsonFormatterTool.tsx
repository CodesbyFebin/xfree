'use client';

import { useState, useCallback } from 'react';
import { formatExecutionTime } from '@/lib/utils';

export function JsonFormatterTool() {
  const [input, setInput] = useState('{"name":"xfree","type":"micro-tool","features":["local","fast","private"]}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const [mode, setMode] = useState<'format' | 'minify' | 'validate'>('format');

  const execute = useCallback(() => {
    const start = performance.now();
    try {
      const parsed = JSON.parse(input);
      let result: string;

      if (mode === 'minify') {
        result = JSON.stringify(parsed);
      } else if (mode === 'validate') {
        setOutput('Valid JSON ✓');
        setError(null);
        setExecutionTime(performance.now() - start);
        return;
      } else {
        result = JSON.stringify(parsed, null, 2);
      }

      setOutput(result);
      setError(null);
      setExecutionTime(performance.now() - start);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setOutput('');
      setExecutionTime(performance.now() - start);
    }
  }, [input, mode]);

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['format', 'minify', 'validate'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-xs font-mono rounded transition-all ${
              mode === m
                ? 'bg-cyber-glow text-cyber-bg'
                : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white'
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
            Input JSON
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
            placeholder="Paste your JSON here..."
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              Output
            </label>
            <div className="flex items-center gap-2">
              {executionTime > 0 && (
                <span className="text-[10px] text-cyber-muted font-mono">
                  {formatExecutionTime(executionTime)}
                </span>
              )}
              {output && (
                <button
                  onClick={handleCopy}
                  className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors"
                >
                  COPY
                </button>
              )}
            </div>
          </div>
          <pre
            className={`w-full h-48 bg-cyber-bg border rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre-wrap ${
              error ? 'border-cyber-red text-cyber-red' : 'border-cyber-border text-cyber-glow'
            }`}
          >
            {error || output || 'Results will appear here...'}
          </pre>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-cyber-muted font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow" />
          <span>{error ? 'Error' : 'Ready'}</span>
        </div>
        <button
          onClick={execute}
          className="cyber-btn text-xs px-6 py-2.5 rounded"
        >
          <span>Execute ({mode})</span>
        </button>
      </div>
    </div>
  );
}
