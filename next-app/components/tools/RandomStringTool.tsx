'use client';

import { useCallback, useState } from 'react';

const CHARSETS = {
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  numeric: '0123456789',
  hex: '0123456789abcdef',
};

export function RandomStringTool() {
  const [length, setLength] = useState(24);
  const [charset, setCharset] = useState<keyof typeof CHARSETS>('alphanumeric');
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const chars = CHARSETS[charset];
    const out: string[] = [];
    for (let n = 0; n < count; n++) {
      const arr = new Uint32Array(length);
      crypto.getRandomValues(arr);
      out.push(Array.from(arr, (x) => chars[x % chars.length]).join(''));
    }
    setResults(out);
  }, [length, charset, count]);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(results.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Length</label>
          <input
            type="number"
            min={1}
            max={256}
            value={length}
            onChange={(e) => setLength(Math.min(256, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Charset</label>
          <select
            value={charset}
            onChange={(e) => setCharset(e.target.value as keyof typeof CHARSETS)}
            className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none"
          >
            <option value="alphanumeric">Alphanumeric</option>
            <option value="alpha">Letters only</option>
            <option value="numeric">Numbers only</option>
            <option value="hex">Hex</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Count</label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={generate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Generate</span></button>
      </div>
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">Results</label>
            <button onClick={handleCopyAll} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">
              {copied ? 'COPIED' : 'COPY ALL'}
            </button>
          </div>
          <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 space-y-1 max-h-64 overflow-y-auto font-mono text-sm text-cyber-glow break-all">
            {results.map((r, i) => <div key={i}>{r}</div>)}
          </div>
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Generated with crypto.getRandomValues() (Web Crypto API), not Math.random().</p>
    </div>
  );
}
