'use client';

import { useState, useCallback } from 'react';

export function RegexTesterTool() {
  const [pattern, setPattern] = useState('\\w+');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('The quick brown fox jumps over the lazy dog.');
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = testString.match(regex);
      setOutput(matches || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid regex');
      setOutput([]);
    }
  }, [pattern, flags, testString]);

  const handleCopy = async () => {
    if (output.length > 0) {
      await navigator.clipboard.writeText(output.join('\n'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              Pattern
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
              placeholder="Enter regex pattern..."
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              Flags
            </label>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
              placeholder="g, i, m..."
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              Test String
            </label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="w-full h-32 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
              placeholder="Enter text to test..."
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              Matches ({output.length})
            </label>
            {output.length > 0 && (
              <button
                onClick={handleCopy}
                className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors"
              >
                COPY ALL
              </button>
            )}
          </div>
          <div className="w-full h-[calc(100%-2rem)] bg-cyber-bg border border-cyber-border rounded-lg p-3 overflow-auto">
            {error ? (
              <p className="text-cyber-red text-sm font-mono">{error}</p>
            ) : output.length > 0 ? (
              <div className="space-y-1">
                {output.map((match, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm font-mono"
                  >
                    <span className="text-cyber-dim text-xs">#{i + 1}</span>
                    <span className="text-cyber-glow bg-cyber-glow/10 px-2 py-0.5 rounded">
                      {match}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-cyber-dim text-sm font-mono">No matches found</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={execute}
          className="cyber-btn text-xs px-6 py-2.5 rounded"
        >
          <span>Test Regex</span>
        </button>
      </div>
    </div>
  );
}
