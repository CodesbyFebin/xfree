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
                : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text'
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
                  className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors"
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

// RFC 1321 MD5 - Web Crypto's subtle.digest has no MD5 algorithm, so this
// runs the real bitwise algorithm in JS rather than faking output from a
// different hash (which would silently return wrong checksums to anyone
// verifying a file/string against a known-good MD5 sum).
async function md5(input: string): Promise<string> {
  const rotateLeft = (x: number, c: number) => (x << c) | (x >>> (32 - c));

  const K = new Int32Array([
    -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426, -1473231341, -45705983,
    1770035416, -1958414417, -42063, -1990404162, 1804603682, -40341101, -1502002290, 1236535329,
    -165796510, -1069501632, 643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
    568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784, 1735328473, -1926607734,
    -378558, -2022574463, 1839030562, -35309556, -1530992060, 1272893353, -155497632, -1094730640,
    681279174, -358537222, -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
    -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606, -1051523, -2054922799,
    1873313359, -30611744, -1560198380, 1309151649, -145523070, -1120210379, 718787259, -343485551,
  ]);
  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const paddedLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, bitLen >>> 0, true);
  view.setUint32(paddedLen - 4, Math.floor(bitLen / 0x100000000), true);

  let [a0, b0, c0, d0] = [1732584193, -271733879, -1732584194, 271733878];

  for (let chunk = 0; chunk < paddedLen; chunk += 64) {
    const M = new Int32Array(16);
    for (let j = 0; j < 16; j++) M[j] = view.getInt32(chunk + j * 4, true);

    let [a, b, c, d] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const temp = d;
      d = c;
      c = b;
      b = b + rotateLeft((a + f + K[i] + M[g]) | 0, S[i]);
      a = temp;
    }
    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const toLE = (n: number) => {
    const bytes4 = new Uint8Array(4);
    new DataView(bytes4.buffer).setInt32(0, n, true);
    return Array.from(bytes4).map((b) => b.toString(16).padStart(2, '0')).join('');
  };
  return toLE(a0) + toLE(b0) + toLE(c0) + toLE(d0);
}
