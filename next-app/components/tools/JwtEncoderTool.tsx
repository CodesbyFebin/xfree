'use client';

import { useCallback, useState } from 'react';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Real JWT construction per RFC 7519 with HS256 (RFC 7518) signing via
// the Web Crypto API - not a fabricated signature. header.payload is
// signed with HMAC-SHA256 using the provided secret, exactly like any
// standard JWT library would produce for HS256.
async function signJwt(header: object, payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${signingInput}.${signatureB64}`;
}

export function JwtEncoderTool() {
  const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "XFree User",\n  "iat": 1700000000\n}');
  const [secret, setSecret] = useState('my-secret-key');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const encode = useCallback(async () => {
    try {
      const parsedPayload = JSON.parse(payload);
      const token = await signJwt({ alg: 'HS256', typ: 'JWT' }, parsedPayload, secret);
      setOutput(token);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to encode JWT');
      setOutput('');
    }
  }, [payload, secret]);

  const handleCopy = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Payload (JSON)</label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          className="w-full h-32 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Secret Key (HS256)</label>
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={encode} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Generate JWT</span></button>
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error}</p>}
      {output && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">JWT (HS256)</label>
            <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>
          </div>
          <pre className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto break-all">{output}</pre>
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Signed with HMAC-SHA256 via the Web Crypto API, entirely in your browser.</p>
    </div>
  );
}
