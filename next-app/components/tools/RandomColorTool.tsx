'use client';

import { useCallback, useState } from 'react';

function generateColor(): { hex: string; rgb: string } {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const r = bytes[0], g = bytes[1], b = bytes[2];
  const hex = '#' + Array.from(bytes, (v) => v.toString(16).padStart(2, '0')).join('');
  return { hex, rgb: `rgb(${r}, ${g}, ${b})` };
}

export function RandomColorTool() {
  const [count, setCount] = useState(6);
  const [colors, setColors] = useState<{ hex: string; rgb: string }[]>([]);
  const [copied, setCopied] = useState('');

  const generate = useCallback(() => {
    setColors(Array.from({ length: count }, generateColor));
  }, [count]);

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">Count</label>
        <input
          type="number"
          min={1}
          max={24}
          value={count}
          onChange={(e) => setCount(Math.min(24, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-20 bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none"
        />
        <button onClick={generate} className="cyber-btn text-xs px-6 py-2.5 rounded ml-auto"><span>Generate</span></button>
      </div>
      {colors.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {colors.map((c, i) => (
            <button key={i} onClick={() => handleCopy(c.hex)} className="group text-left">
              <div className="w-full h-16 rounded-lg border border-cyber-border" style={{ backgroundColor: c.hex }} />
              <div className="mt-1 text-xs font-mono text-cyber-muted group-hover:text-cyber-glow">{copied === c.hex ? 'COPIED' : c.hex}</div>
              <div className="text-[10px] font-mono text-cyber-dim">{c.rgb}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
