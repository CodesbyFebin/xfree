'use client';

import { useState, useCallback } from 'react';

type Mode = 'encode' | 'decode';

export function Base64Tool() {
  const [input, setInput] = useState('XFree is awesome!');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
      setOutput('');
    }
  }, [input, mode]);

  const handleSwap = () => {
    setInput(output);
    setOutput('');
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['encode', 'decode'] as Mode[]).map((m) => (
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
            {mode === 'encode' ? 'Text to Encode' : 'Base64 to Decode'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
            placeholder={mode === 'encode' ? 'Enter text...' : 'Enter Base64...'}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
            </label>
            {output && (
              <button
                onClick={handleCopy}
                className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors"
              >
                COPY
              </button>
            )}
          </div>
          <pre
            className={`w-full h-40 bg-cyber-bg border rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre-wrap ${
              error ? 'border-cyber-red text-cyber-red' : 'border-cyber-border text-cyber-glow'
            }`}
          >
            {error || output || 'Result will appear here...'}
          </pre>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleSwap}
          className="text-xs text-cyber-muted hover:text-cyber-glow font-mono transition-colors"
        >
          ↕ Swap input/output
        </button>
        <button
          onClick={execute}
          className="cyber-btn text-xs px-6 py-2.5 rounded"
        >
          <span>{mode === 'encode' ? 'Encode' : 'Decode'}</span>
        </button>
      </div>
    </div>
  );
}
