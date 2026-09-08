'use client';

import { useCallback, useState } from 'react';

interface RdapEvent { eventAction: string; eventDate: string }
interface RdapData {
  ldhName?: string;
  status?: string[];
  events?: RdapEvent[];
  entities?: { roles?: string[]; vcardArray?: unknown }[];
  nameservers?: { ldhName: string }[];
}

export function WhoisLookupTool() {
  const [domain, setDomain] = useState('xfree.in');
  const [result, setResult] = useState<RdapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/lookup/whois?domain=${encodeURIComponent(domain)}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Lookup failed');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error - could not reach the lookup service');
    } finally {
      setBusy(false);
    }
  }, [domain]);

  const eventDate = (action: string) => result?.events?.find((e) => e.eventAction === action)?.eventDate;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Domain</label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="example.com"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={lookup} disabled={busy} className="cyber-btn text-xs px-6 py-2.5 rounded disabled:opacity-50"><span>{busy ? 'Looking up...' : 'Lookup'}</span></button>
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error}</p>}
      {result && (
        <div className="cyber-card p-4 border-emerald-500/30 space-y-1 text-xs text-cyber-muted font-mono">
          <p>Domain: <span className="text-cyber-glow">{result.ldhName ?? domain}</span></p>
          {result.status && <p>Status: <span className="text-cyber-glow">{result.status.join(', ')}</span></p>}
          {eventDate('registration') && <p>Registered: <span className="text-cyber-glow">{eventDate('registration')}</span></p>}
          {eventDate('expiration') && <p>Expires: <span className="text-cyber-glow">{eventDate('expiration')}</span></p>}
          {eventDate('last changed') && <p>Last changed: <span className="text-cyber-glow">{eventDate('last changed')}</span></p>}
          {result.nameservers && result.nameservers.length > 0 && (
            <p>Nameservers: <span className="text-cyber-glow">{result.nameservers.map((n) => n.ldhName).join(', ')}</span></p>
          )}
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Looked up via XFree's own server using RDAP (the modern, standardized successor to WHOIS) - registrant personal data is redacted by registries under ICANN policy, so it won't appear here even for real domains.</p>
    </div>
  );
}
