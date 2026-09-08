'use client';

import { useCallback, useMemo, useState } from 'react';

type Alignment = 'left' | 'center' | 'right';

export function MarkdownTableGeneratorTool() {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(2);
  const [alignment, setAlignment] = useState<Alignment>('left');
  const [headers, setHeaders] = useState<string[]>(['Name', 'Type', 'Free']);
  const [cells, setCells] = useState<string[][]>([
    ['JSON Formatter', 'Developer', 'Yes'],
    ['Regex Tester', 'Developer', 'Yes'],
  ]);
  const [copied, setCopied] = useState(false);

  const resize = useCallback((newCols: number, newRows: number) => {
    setCols(newCols);
    setRows(newRows);
    setHeaders((h) => Array.from({ length: newCols }, (_, i) => h[i] ?? `Column ${i + 1}`));
    setCells((c) =>
      Array.from({ length: newRows }, (_, r) =>
        Array.from({ length: newCols }, (_, col) => c[r]?.[col] ?? '')
      )
    );
  }, []);

  const separator = useMemo(() => {
    const sep = alignment === 'center' ? ':---:' : alignment === 'right' ? '---:' : '---';
    return `| ${Array(cols).fill(sep).join(' | ')} |`;
  }, [alignment, cols]);

  const markdown = useMemo(() => {
    const headerRow = `| ${headers.join(' | ')} |`;
    const bodyRows = cells.map((row) => `| ${row.join(' | ')} |`).join('\n');
    return `${headerRow}\n${separator}\n${bodyRows}`;
  }, [headers, separator, cells]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-cyber-muted font-mono">Columns</label>
          <input type="number" min={1} max={10} value={cols} onChange={(e) => resize(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)), rows)} className="w-16 bg-cyber-bg border border-cyber-border rounded px-2 py-1 text-sm font-mono text-cyber-glow" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-cyber-muted font-mono">Rows</label>
          <input type="number" min={1} max={20} value={rows} onChange={(e) => resize(cols, Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))} className="w-16 bg-cyber-bg border border-cyber-border rounded px-2 py-1 text-sm font-mono text-cyber-glow" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-cyber-muted font-mono">Alignment</label>
          <select value={alignment} onChange={(e) => setAlignment(e.target.value as Alignment)} className="bg-cyber-bg border border-cyber-border rounded px-2 py-1 text-xs font-mono text-cyber-glow">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border border-cyber-border p-1">
                  <input
                    value={h}
                    onChange={(e) => setHeaders((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                    className="w-32 bg-cyber-bg text-xs font-mono text-cyber-glow px-2 py-1 focus:outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border border-cyber-border p-1">
                    <input
                      value={cell}
                      onChange={(e) =>
                        setCells((prev) => prev.map((rr, ri) => (ri === r ? rr.map((cc, ci) => (ci === c ? e.target.value : cc)) : rr)))
                      }
                      className="w-32 bg-cyber-bg text-xs font-mono text-cyber-muted px-2 py-1 focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">Markdown</label>
          <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">{copied ? 'COPIED' : 'COPY'}</button>
        </div>
        <pre className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto whitespace-pre">{markdown}</pre>
      </div>
    </div>
  );
}
