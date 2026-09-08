'use client';

import { useCallback, useState } from 'react';

interface Result {
  valid: boolean;
  protocol?: string;
  host?: string;
  path?: string;
  query?: string;
  hash?: string;
  error?: string;
}

export function UrlValidatorTool() {
  const [input, setInput] = useState('https://www.xfree.in/tools/json-formatter?ref=xfree#top');
  const [result, setResult] = useState<Result | null>(null);

  const validate = useCallback(() => {
    // The browser's native URL parser is the actual spec-compliant WHATWG
    // URL parser - more reliable than a hand-written regex for this.
    try {
      const url = new URL(input.trim());
      setResult({
        valid: true,
        protocol: url.protocol.replace(':', ''),
        host: url.host,
        path: url.pathname,
        query: url.search || '(none)',
        hash: url.hash || '(none)',
      });
    } catch (e) {
      setResult({ valid: false, error: e instanceof Error ? e.message : 'Invalid URL' });
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">URL</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={validate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Validate</span></button>
      </div>
      {result && (
        <div className={`cyber-card p-4 border ${result.valid ? 'border-emerald-500/30' : 'border-cyber-red/30'}`}>
          <p className={`font-mono text-sm font-bold ${result.valid ? 'text-emerald-400' : 'text-cyber-red'}`}>
            {result.valid ? '✓ Valid URL' : `✗ Invalid URL: ${result.error}`}
          </p>
          {result.valid && (
            <div className="mt-2 text-xs text-cyber-muted font-mono space-y-1">
              <p>Protocol: <span className="text-cyber-glow">{result.protocol}</span></p>
              <p>Host: <span className="text-cyber-glow">{result.host}</span></p>
              <p>Path: <span className="text-cyber-glow">{result.path}</span></p>
              <p>Query: <span className="text-cyber-glow">{result.query}</span></p>
              <p>Hash: <span className="text-cyber-glow">{result.hash}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
