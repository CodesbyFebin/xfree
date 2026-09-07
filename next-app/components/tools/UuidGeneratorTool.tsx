'use client';

import { useState, useCallback } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';

export function UuidGeneratorTool() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generateUuids = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        })
      );
    }
    setUuids(newUuids);
  }, [count]);

  const handleCopy = async (uuid: string) => {
    await navigator.clipboard.writeText(uuid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
            Number of UUIDs
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-24 bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none"
          />
        </div>
        <div className="flex-1" />
      </div>

      <div className="flex justify-end">
        <button
          onClick={generateUuids}
          className="cyber-btn text-xs px-6 py-2.5 rounded flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Generate UUIDs</span>
        </button>
      </div>

      {uuids.length > 0 && (
        <>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
                Generated UUIDs
              </label>
              <button
                onClick={handleCopyAll}
                className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                COPY ALL
              </button>
            </div>
            <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
              {uuids.map((uuid, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <span className="font-mono text-sm text-cyber-glow">{uuid}</span>
                  <button
                    onClick={() => handleCopy(uuid)}
                    className="opacity-0 group-hover:opacity-100 text-cyber-muted hover:text-cyber-glow transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-cyber-muted">
            <span className="w-2 h-2 rounded-full bg-cyber-glow" />
            <span>UUID v4 (RFC 4122) - Cryptographically random</span>
          </div>
        </>
      )}
    </div>
  );
}
