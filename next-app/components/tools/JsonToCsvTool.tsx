'use client';

import { useCallback, useState } from 'react';

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function jsonToCsv(json: unknown): string {
  if (!Array.isArray(json)) {
    throw new Error('Input must be a JSON array of objects');
  }
  if (json.length === 0) return '';

  const headers = Array.from(
    json.reduce((set: Set<string>, row) => {
      if (row && typeof row === 'object') {
        Object.keys(row as Record<string, unknown>).forEach((k) => set.add(k));
      }
      return set;
    }, new Set<string>())
  );

  const lines = [headers.map(csvEscape).join(',')];
  for (const row of json) {
    const record = (row ?? {}) as Record<string, unknown>;
    lines.push(headers.map((h) => csvEscape(record[h])).join(','));
  }
  return lines.join('\n');
}

export function JsonToCsvTool() {
  const [input, setInput] = useState('[\n  { "name": "XFree", "type": "tool", "free": true },\n  { "name": "Studio", "type": "app", "free": true }\n]');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    try {
      const parsed = JSON.parse(input);
      setOutput(jsonToCsv(parsed));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setOutput('');
    }
  }, [input]);

  const handleCopy = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">JSON Array</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">CSV Output</label>
            {output && (
              <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>
            )}
          </div>
          <pre className={`w-full h-48 bg-cyber-bg border rounded-lg p-3 font-mono text-xs overflow-auto whitespace-pre-wrap ${error ? 'border-cyber-red text-cyber-red' : 'border-cyber-border text-cyber-glow'}`}>
            {error || output || 'CSV will appear here...'}
          </pre>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={execute} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Convert to CSV</span></button>
      </div>
    </div>
  );
}
