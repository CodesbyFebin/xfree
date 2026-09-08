'use client';

import { useMemo, useState } from 'react';

type DiffLine = { type: 'same' | 'add' | 'remove'; text: string };

// Standard LCS-based line diff (patience-diff-style output via a plain
// longest-common-subsequence table) - real algorithm, not a naive
// line-by-line index comparison, so insertions/deletions in the middle
// of a file don't cascade into false diffs on every line after them.
const MAX_DIFF_LINES = 2000;

function diffLines(a: string[], b: string[]): DiffLine[] {
  // LCS is O(n*m) time and space - fine for typical paste-sized input,
  // but a naive huge paste (megabytes) would hang the tab. Cap rather
  // than silently truncate output without saying so.
  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) {
    return [{ type: 'remove', text: `Input too large to diff in-browser (max ${MAX_DIFF_LINES} lines per side).` }];
  }
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      result.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ type: 'remove', text: a[i] });
      i++;
    } else {
      result.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) result.push({ type: 'remove', text: a[i++] });
  while (j < m) result.push({ type: 'add', text: b[j++] });

  return result;
}

export function DiffTool() {
  const [left, setLeft] = useState('line one\nline two\nline three');
  const [right, setRight] = useState('line one\nline TWO\nline three\nline four');

  const diff = useMemo(() => diffLines(left.split('\n'), right.split('\n')), [left, right]);
  const addCount = diff.filter((d) => d.type === 'add').length;
  const removeCount = diff.filter((d) => d.type === 'remove').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Original</label>
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            className="w-full h-40 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Changed</label>
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            className="w-full h-40 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-4 mb-2 text-xs font-mono">
          <span className="text-emerald-400">+{addCount} added</span>
          <span className="text-cyber-red">-{removeCount} removed</span>
        </div>
        <div className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs overflow-auto max-h-80">
          {diff.map((line, i) => (
            <div
              key={i}
              className={
                line.type === 'add'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : line.type === 'remove'
                  ? 'bg-cyber-red/10 text-cyber-red'
                  : 'text-cyber-muted'
              }
            >
              {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}
              {line.text || ' '}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
