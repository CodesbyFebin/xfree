'use client';

import { useCallback, useState } from 'react';

const ALGORITHMS = ['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512'] as const;
type Algorithm = (typeof ALGORITHMS)[number];

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function HmacGeneratorTool() {
  const [message, setMessage] = useState('Hello, XFree!');
  const [secret, setSecret] = useState('my-secret-key');
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
      setOutput(toHex(signature));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate HMAC');
      setOutput('');
    }
  }, [message, secret, algorithm]);

  const handleCopy = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        {ALGORITHMS.map((alg) => (
          <button
            key={alg}
            onClick={() => setAlgorithm(alg)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${algorithm === alg ? 'bg-cyber-glow text-cyber-bg' : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text'}`}
          >
            HMAC-{alg.replace('-', '')}
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full h-24 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Secret Key</label>
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={generate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Generate HMAC</span></button>
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error}</p>}
      {output && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">HMAC-{algorithm.replace('-', '')}</label>
            <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>
          </div>
          <pre className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto break-all">{output}</pre>
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Generated using the Web Crypto API (crypto.subtle) directly in your browser.</p>
    </div>
  );
}
