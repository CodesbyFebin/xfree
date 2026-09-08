'use client';

import { useCallback, useState } from 'react';
import { minify } from 'terser';

export function JsMinifierTool() {
  const [input, setInput] = useState('function greet(name) {\n  // says hello\n  console.log("Hello, " + name + "!");\n}\n\ngreet("XFree");\n');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const execute = useCallback(async () => {
    setBusy(true);
    try {
      // terser is a real JS parser + minifier (used by webpack/Vite/Rollup
      // in production) - not a regex-based approximation, which would
      // risk silently producing broken JavaScript on strings, template
      // literals, or regex literals that merely look like comments/code.
      const result = await minify(input, { compress: true, mangle: true });
      setOutput(result.code ?? '');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to minify - check for a syntax error');
      setOutput('');
    } finally {
      setBusy(false);
    }
  }, [input]);

  const handleCopy = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  const savings = output ? Math.round((1 - output.length / input.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Input JavaScript</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              Minified {output && <span className="text-cyber-cyan">(-{savings}%)</span>}
            </label>
            {output && <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>}
          </div>
          <pre className={`w-full h-48 bg-cyber-bg border rounded-lg p-3 font-mono text-xs overflow-auto whitespace-pre-wrap break-all ${error ? 'border-cyber-red text-cyber-red' : 'border-cyber-border text-cyber-glow'}`}>
            {error || output || 'Minified JS will appear here...'}
          </pre>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={execute} disabled={busy} className="cyber-btn text-xs px-6 py-2.5 rounded disabled:opacity-50"><span>{busy ? 'Minifying...' : 'Minify'}</span></button>
      </div>
      <p className="text-[10px] text-cyber-dim font-mono">Minified with Terser (a real JS parser, the same engine used by production build tools), entirely in your browser.</p>
    </div>
  );
}
