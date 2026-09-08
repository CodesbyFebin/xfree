'use client';

import { useCallback, useState } from 'react';

export function XmlValidatorTool() {
  const [input, setInput] = useState('<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>Hello, XFree!</item>\n</root>');
  const [result, setResult] = useState<{ valid: boolean; message: string } | null>(null);

  const validate = useCallback(() => {
    // The browser's own XML parser is the actual spec-compliant
    // implementation - it surfaces a <parsererror> node on malformed XML
    // rather than throwing, so that's what gets checked for.
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'application/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      setResult({ valid: false, message: errorNode.textContent?.trim() || 'Malformed XML' });
    } else {
      setResult({ valid: true, message: `Well-formed XML. Root element: <${doc.documentElement.tagName}>` });
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
      />
      <div className="flex justify-end">
        <button onClick={validate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Validate XML</span></button>
      </div>
      {result && (
        <div className={`cyber-card p-4 border ${result.valid ? 'border-emerald-500/30' : 'border-cyber-red/30'}`}>
          <p className={`font-mono text-sm font-bold ${result.valid ? 'text-emerald-400' : 'text-cyber-red'}`}>
            {result.valid ? '✓ ' : '✗ '}{result.message}
          </p>
        </div>
      )}
    </div>
  );
}
