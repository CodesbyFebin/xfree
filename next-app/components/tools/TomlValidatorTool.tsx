'use client';

import { useCallback, useState } from 'react';
import { parse } from 'smol-toml';

export function TomlValidatorTool() {
  const [input, setInput] = useState('name = "XFree"\nfree = true\n\n[server]\nport = 8080\n');
  const [result, setResult] = useState<{ valid: boolean; message: string; parsed?: string } | null>(null);

  const validate = useCallback(() => {
    try {
      const parsed = parse(input);
      setResult({ valid: true, message: 'Valid TOML ✓', parsed: JSON.stringify(parsed, null, 2) });
    } catch (e) {
      setResult({ valid: false, message: e instanceof Error ? e.message : 'Invalid TOML' });
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
      />
      <div className="flex justify-end">
        <button onClick={validate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Validate TOML</span></button>
      </div>
      {result && (
        <div className={`cyber-card p-4 border ${result.valid ? 'border-emerald-500/30' : 'border-cyber-red/30'}`}>
          <p className={`font-mono text-sm font-bold ${result.valid ? 'text-emerald-400' : 'text-cyber-red'}`}>
            {result.valid ? '✓ ' : '✗ '}{result.message}
          </p>
          {result.parsed && (
            <pre className="mt-3 text-xs text-cyber-muted font-mono overflow-auto max-h-48">{result.parsed}</pre>
          )}
        </div>
      )}
    </div>
  );
}
