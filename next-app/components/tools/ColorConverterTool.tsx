'use client';

import { useMemo, useState } from 'react';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100];
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  const c = (1 - rr - k) / (1 - k);
  const m = (1 - gg - k) / (1 - k);
  const y = (1 - bb - k) / (1 - k);
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)];
}

export function ColorConverterTool() {
  const [hex, setHex] = useState('#39ff14');
  const [copiedKey, setCopiedKey] = useState('');

  const rgb = useMemo(() => hexToRgb(hex), [hex]);

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1500);
  };

  const formats = useMemo(() => {
    if (!rgb) return [];
    const [r, g, b] = rgb;
    const [h, s, l] = rgbToHsl(r, g, b);
    const [hh, sv, v] = rgbToHsv(r, g, b);
    const [c, m, y, k] = rgbToCmyk(r, g, b);
    return [
      { key: 'hex', label: 'HEX', value: rgbToHex(r, g, b) },
      { key: 'rgb', label: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
      { key: 'hsl', label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
      { key: 'hsv', label: 'HSV', value: `hsv(${hh}, ${sv}%, ${v}%)` },
      { key: 'cmyk', label: 'CMYK', value: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)` },
    ];
  }, [rgb]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={rgb ? rgbToHex(...rgb) : '#39ff14'}
          onChange={(e) => setHex(e.target.value)}
          className="w-14 h-14 rounded-lg border border-cyber-border bg-cyber-bg cursor-pointer"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="flex-1 bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="#39ff14"
        />
      </div>
      {!rgb && <p className="text-xs text-cyber-red font-mono">Enter a valid 6-digit hex color (e.g. #39ff14)</p>}
      <div className="space-y-2">
        {formats.map((f) => (
          <div key={f.key} className="flex items-center gap-3 bg-cyber-bg border border-cyber-border rounded-lg p-3">
            <span className="text-[10px] text-cyber-dim font-mono w-12 shrink-0">{f.label}</span>
            <span className="flex-1 text-sm font-mono text-cyber-glow break-all">{f.value}</span>
            <button onClick={() => handleCopy(f.key, f.value)} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors shrink-0">
              {copiedKey === f.key ? 'COPIED' : 'COPY'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
