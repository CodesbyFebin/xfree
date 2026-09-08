'use client';

import { useCallback, useState } from 'react';

// A practical, widely-used email format regex - not a full RFC 5322
// state-machine parser (RFC 5322 technically permits things like quoted
// local parts and comments that essentially no real mail provider
// accepts in practice). This checks *format*, not deliverability - that
// distinction is stated in the UI rather than implied away.
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function EmailValidatorTool() {
  const [input, setInput] = useState('user@example.com');
  const [result, setResult] = useState<{ valid: boolean; local: string; domain: string } | null>(null);

  const validate = useCallback(() => {
    const trimmed = input.trim();
    const valid = EMAIL_RE.test(trimmed) && trimmed.length <= 254;
    const [local, domain] = trimmed.split('@');
    setResult({ valid, local: local ?? '', domain: domain ?? '' });
  }, [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Email Address</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="user@example.com"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={validate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Validate</span></button>
      </div>
      {result && (
        <div className={`cyber-card p-4 border ${result.valid ? 'border-emerald-500/30' : 'border-cyber-red/30'}`}>
          <p className={`font-mono text-sm font-bold ${result.valid ? 'text-emerald-400' : 'text-cyber-red'}`}>
            {result.valid ? '✓ Valid format' : '✗ Invalid format'}
          </p>
          {result.valid && (
            <div className="mt-2 text-xs text-cyber-muted font-mono space-y-1">
              <p>Local part: <span className="text-cyber-glow">{result.local}</span></p>
              <p>Domain: <span className="text-cyber-glow">{result.domain}</span></p>
            </div>
          )}
          <p className="text-[10px] text-cyber-dim mt-3">Checks format only - does not verify the mailbox exists or accepts mail.</p>
        </div>
      )}
    </div>
  );
}
