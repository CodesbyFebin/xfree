'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrCodeGeneratorTool() {
  const [text, setText] = useState('https://www.xfree.in');
  const [dataUrl, setDataUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text) {
      setDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(text, { width: 320, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to generate QR code');
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Text or URL</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      {error && <p className="text-xs text-cyber-red font-mono">{error}</p>}
      {dataUrl && (
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="Generated QR code" className="rounded-lg border border-cyber-border" width={240} height={240} />
          <button onClick={handleDownload} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Download PNG</span></button>
        </div>
      )}
    </div>
  );
}
