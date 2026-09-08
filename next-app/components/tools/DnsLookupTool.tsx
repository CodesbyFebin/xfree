'use client';

import { useCallback, useState } from 'react';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'] as const;

interface Answer {
  name: string;
  type: number;
  data: string;
  TTL: number;
}

export function DnsLookupTool() {
  const [domain, setDomain] = useState('xfree.in');
  const [type, setType] = useState<(typeof RECORD_TYPES)[number]>('A');
  const [answers, setAnswers] = useState<Answer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lookup/dns?name=${encodeURIComponent(domain)}&type=${type}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Lookup failed');
        setAnswers(null);
      } else if (!data.Answer || data.Answer.length === 0) {
        setAnswers([]);
        setError(null);
      } else {
        setAnswers(data.Answer);
      }
    } catch {
      setError('Network error - could not reach the lookup service');
      setAnswers(null);
    } finally {
      setBusy(false);
    }
  }, [domain, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {RECORD_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${type === t ? 'bg-cyber-glow text-cyber-bg' : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Domain</label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={lookup} disabled={busy} className="cyber-btn text-xs px-6 py-2.5 rounded disabled:opacity-50"><span>{busy ? 'Looking up...' : 'Lookup'}</span></button>
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error}</p>}
      {answers && answers.length === 0 && !error && <p className="text-xs text-cyber-muted font-mono">No {type} records found.</p>}
      {answers && answers.length > 0 && (
        <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 space-y-2 font-mono text-xs">
          {answers.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-cyber-cyan">{a.name}</span>
              <span className="text-cyber-muted">TTL {a.TTL}</span>
              <span className="text-cyber-glow break-all">{a.data}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Looked up via XFree's own server using Cloudflare's DNS-over-HTTPS resolver.</p>
    </div>
  );
}
