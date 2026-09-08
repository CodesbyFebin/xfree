'use client';

import { useMemo, useState } from 'react';

function hexToHsl(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  let r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
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
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function Swatches({ colors, copied, onCopy }: { colors: string[]; copied: string; onCopy: (swatch: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onCopy(c)}
          className="group flex flex-col items-center gap-1"
          title={c}
        >
          <div className="w-12 h-12 rounded-lg border border-cyber-border" style={{ backgroundColor: c }} />
          <span className="text-[9px] font-mono text-cyber-muted group-hover:text-cyber-glow">{copied === c ? 'COPIED' : c}</span>
        </button>
      ))}
    </div>
  );
}

export function ColorPaletteTool() {
  const [hex, setHex] = useState('#39ff14');
  const [copied, setCopied] = useState('');
  const hsl = useMemo(() => hexToHsl(hex), [hex]);

  const palettes = useMemo(() => {
    if (!hsl) return null;
    const [h, s, l] = hsl;
    return {
      complementary: [hslToHex(h, s, l), hslToHex(h + 180, s, l)],
      analogous: [hslToHex(h - 30, s, l), hslToHex(h, s, l), hslToHex(h + 30, s, l)],
      triadic: [hslToHex(h, s, l), hslToHex(h + 120, s, l), hslToHex(h + 240, s, l)],
      shades: [20, 35, 50, 65, 80].map((lightness) => hslToHex(h, s, lightness)),
    };
  }, [hsl]);

  const handleCopy = async (swatch: string) => {
    await navigator.clipboard.writeText(swatch);
    setCopied(swatch);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={hsl ? hslToHex(...hsl) : '#39ff14'}
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
      {!hsl && <p className="text-xs text-cyber-red font-mono">Enter a valid 6-digit hex color (e.g. #39ff14)</p>}
      {palettes && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-cyber-cyan font-mono font-semibold mb-2">Complementary</h3>
            <Swatches colors={palettes.complementary} copied={copied} onCopy={handleCopy} />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-cyber-cyan font-mono font-semibold mb-2">Analogous</h3>
            <Swatches colors={palettes.analogous} copied={copied} onCopy={handleCopy} />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-cyber-cyan font-mono font-semibold mb-2">Triadic</h3>
            <Swatches colors={palettes.triadic} copied={copied} onCopy={handleCopy} />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-cyber-cyan font-mono font-semibold mb-2">Shades</h3>
            <Swatches colors={palettes.shades} copied={copied} onCopy={handleCopy} />
          </div>
        </div>
      )}
    </div>
  );
}
