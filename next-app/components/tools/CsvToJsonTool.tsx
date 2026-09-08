'use client';

import { useCallback, useState } from 'react';

// A real RFC 4180-ish CSV parser (state machine over characters), not a
// naive split(',') - that breaks on any quoted field containing a comma,
// a newline, or an escaped "" quote, which are all valid, common CSV.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function csvToJson(text: string): unknown[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const [headers, ...dataRows] = rows;
  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
}

export function CsvToJsonTool() {
  const [input, setInput] = useState('name,type,free\nXFree,tool,true\nStudio,app,true');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    try {
      const json = csvToJson(input);
      setOutput(JSON.stringify(json, null, 2));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse CSV');
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
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">CSV</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">JSON Output</label>
            {output && (
              <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>
            )}
          </div>
          <pre className={`w-full h-48 bg-cyber-bg border rounded-lg p-3 font-mono text-xs overflow-auto whitespace-pre-wrap ${error ? 'border-cyber-red text-cyber-red' : 'border-cyber-border text-cyber-glow'}`}>
            {error || output || 'JSON will appear here...'}
          </pre>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={execute} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Convert to JSON</span></button>
      </div>
    </div>
  );
}
