'use client';

import { useCallback, useState } from 'react';

// Rejection sampling for an unbiased uniform integer in [min, max] using
// crypto.getRandomValues - a naive `min + random() % range` introduces
// modulo bias (some values become slightly more likely than others).
function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;
  const buf = new Uint8Array(bytesNeeded);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf.reduce((acc, b) => acc * 256 + b, 0);
  } while (value > maxValid);
  return min + (value % range);
}

export function RandomNumberTool() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(5);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [results, setResults] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (min > max) {
      setError('Min must be less than or equal to Max');
      return;
    }
    if (!allowDuplicates && max - min + 1 < count) {
      setError('Range too small for the requested count without duplicates');
      return;
    }
    setError(null);
    if (allowDuplicates) {
      setResults(Array.from({ length: count }, () => secureRandomInt(min, max)));
    } else {
      const pool = new Set<number>();
      while (pool.size < count) pool.add(secureRandomInt(min, max));
      setResults(Array.from(pool));
    }
  }, [min, max, count, allowDuplicates]);

  const handleCopy = async () => {
    if (results.length) await navigator.clipboard.writeText(results.join(', '));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Min</label>
          <input type="number" value={min} onChange={(e) => setMin(parseInt(e.target.value) || 0)} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Max</label>
          <input type="number" value={max} onChange={(e) => setMax(parseInt(e.target.value) || 0)} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Count</label>
          <input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-cyber-muted cursor-pointer">
        <input type="checkbox" checked={allowDuplicates} onChange={(e) => setAllowDuplicates(e.target.checked)} />
        Allow duplicates
      </label>
      <div className="flex justify-end">
        <button onClick={generate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Generate</span></button>
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error}</p>}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">Results</label>
            <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>
          </div>
          <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 flex flex-wrap gap-2 font-mono text-sm text-cyber-glow">
            {results.map((r, i) => <span key={i} className="px-2 py-1 rounded bg-cyber-glow/10 border border-cyber-glow/30">{r}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
