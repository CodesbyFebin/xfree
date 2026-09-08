'use client';

import { useCallback, useState } from 'react';

interface IpInfo {
  ip: string;
  type: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  connection?: { isp?: string; org?: string; asn?: number };
}

export function IpLookupTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<IpInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lookup/ip${input ? `?ip=${encodeURIComponent(input)}` : ''}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Lookup failed');
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error - could not reach the lookup service');
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">IP Address (leave blank for your own)</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="8.8.8.8"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={lookup} disabled={busy} className="cyber-btn text-xs px-6 py-2.5 rounded disabled:opacity-50"><span>{busy ? 'Looking up...' : 'Lookup'}</span></button>
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error}</p>}
      {result && (
        <div className="cyber-card p-4 border-emerald-500/30 space-y-1 text-xs text-cyber-muted font-mono">
          <p>IP: <span className="text-cyber-glow">{result.ip}</span> ({result.type})</p>
          <p>Location: <span className="text-cyber-glow">{result.city}, {result.region}, {result.country} ({result.country_code})</span></p>
          <p>Coordinates: <span className="text-cyber-glow">{result.latitude}, {result.longitude}</span></p>
          {result.connection?.isp && <p>ISP: <span className="text-cyber-glow">{result.connection.isp}</span></p>}
          {result.connection?.asn && <p>ASN: <span className="text-cyber-glow">AS{result.connection.asn} {result.connection.org}</span></p>}
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Looked up via XFree's own server, which queries a public IP geolocation service (ipwho.is) - your query does not go directly from your browser to a third party.</p>
    </div>
  );
}
