'use client';

import { useState, useCallback } from 'react';

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export function JwtDecoderTool() {
  const [input, setInput] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  const [decoded, setDecoded] = useState<DecodedJWT | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decode = useCallback(() => {
    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const decodeBase64 = (str: string): string => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return json;
      };

      const header = JSON.parse(decodeBase64(parts[0]));
      const payload = JSON.parse(decodeBase64(parts[1]));
      const signature = parts[2];

      setDecoded({ header, payload, signature });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to decode JWT');
      setDecoded(null);
    }
  }, [input]);

  const handleCopy = async (part: 'header' | 'payload') => {
    if (decoded) {
      await navigator.clipboard.writeText(JSON.stringify(decoded[part], null, 2));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
          JWT Token
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-24 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          placeholder="Paste your JWT token here..."
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={decode}
          className="cyber-btn text-xs px-6 py-2.5 rounded"
        >
          <span>Decode JWT</span>
        </button>
      </div>

      {error && (
        <div className="bg-cyber-red/10 border border-cyber-red/30 rounded-lg p-4">
          <p className="text-cyber-red text-sm font-mono">{error}</p>
        </div>
      )}

      {decoded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-cyber-cyan font-mono font-semibold">
                Header
              </label>
              <button
                onClick={() => handleCopy('header')}
                className="text-[10px] text-cyber-cyan hover:text-white font-mono transition-colors"
              >
                COPY
              </button>
            </div>
            <pre className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-lg p-3 font-mono text-xs text-cyber-cyan overflow-auto">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
                Payload
              </label>
              <button
                onClick={() => handleCopy('payload')}
                className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors"
              >
                COPY
              </button>
            </div>
            <pre className="w-full bg-cyber-bg border border-cyber-glow/30 rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-magenta font-mono font-semibold mb-2 block">
              Signature
            </label>
            <pre className="w-full bg-cyber-bg border border-cyber-magenta/30 rounded-lg p-3 font-mono text-xs text-cyber-magenta overflow-auto break-all">
              {decoded.signature}
            </pre>
            <p className="text-[10px] text-cyber-dim mt-2 font-mono">
              Signature verification requires the secret key
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
