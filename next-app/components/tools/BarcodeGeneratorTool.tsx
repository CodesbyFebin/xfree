'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';

const FORMATS = ['CODE128', 'EAN13', 'UPC', 'CODE39'] as const;

export function BarcodeGeneratorTool() {
  const [value, setValue] = useState('XFREE12345');
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('CODE128');
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format,
        width: 2,
        height: 80,
        displayValue: true,
        background: 'transparent',
        lineColor: '#39ff14',
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Invalid value for ${format}`);
    }
  }, [value, format]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        {FORMATS.map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${format === f ? 'bg-cyber-glow text-cyber-bg' : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text'}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Value</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error} - {format} requires a specific format/length (e.g. EAN13 needs 12-13 digits).</p>}
      <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 flex justify-center overflow-x-auto">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
