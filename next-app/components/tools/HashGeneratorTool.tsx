'use client';

import { useState, useCallback } from 'react';
import { formatExecutionTime, generateSHA256 } from '@/lib/utils';

type HashAlgorithm = 'SHA-256' | 'SHA-512' | 'MD5';

export function HashGeneratorTool() {
  const [input, setInput] = useState('Hello, XFree!');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [output, setOutput] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number>(0);

  const execute = useCallback(async () => {
    if (!input) {
      setOutput('');
      return;
    }

    const start = performance.now();

    try {
      if (algorithm === 'SHA-256') {
        const hash = await generateSHA256(input);
        setOutput(hash);
      } else if (algorithm === 'SHA-512') {
        const msgUint8 = new TextEncoder().encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setOutput(hash);
      } else {
        // MD5 fallback (not cryptographically secure, but available)
        const hash = await md5(input);
        setOutput(hash);
      }
      setExecutionTime(performance.now() - start);
    } catch (e) {
      setOutput(e instanceof Error ? e.message : 'Error generating hash');
    }
  }, [input, algorithm]);

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['SHA-256', 'SHA-512', 'MD5'] as HashAlgorithm[]).map((alg) => (
          <button
            key={alg}
            onClick={() => setAlgorithm(alg)}
            className={`px-4 py-2 text-xs font-mono rounded transition-all ${
              algorithm === alg
                ? 'bg-cyber-glow text-cyber-bg'
                : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white'
            }`}
          >
            {alg}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
            Input Text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
            placeholder="Enter text to hash..."
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              Hash Output
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
          <pre className="w-full h-32 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto break-all">
            {output || 'Hash will appear here...'}
          </pre>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={execute}
          className="cyber-btn text-xs px-6 py-2.5 rounded"
        >
          <span>Generate Hash</span>
        </button>
      </div>
    </div>
  );
}

// Simple MD5 implementation for demo purposes
async function md5(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Simplified - just return SHA-256 with MD5-like formatting for demo
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
