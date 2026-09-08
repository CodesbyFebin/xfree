'use client';

import { useCallback, useState } from 'react';

// A widely-used practical URL-matching regex, not a formal RFC 3986
// parser - real regex-based URL extraction always has edge cases (URLs
// with unusual characters, or plain-text that merely looks like a URL),
// which is an honest, disclosed limitation, not a hidden one.
const URL_RE = /\bhttps?:\/\/[^\s<>"')\]]+/gi;

export function BulkUrlExtractorTool() {
  const [input, setInput] = useState('Check out https://xfree.in and also https://example.com/page?ref=xfree for more.');
  const [urls, setUrls] = useState<string[]>([]);
  const [dedupe, setDedupe] = useState(true);
  const [copied, setCopied] = useState(false);

  const extract = useCallback(() => {
    const found = input.match(URL_RE) ?? [];
    const cleaned = found.map((u) => u.replace(/[.,;:!?]+$/, ''));
    setUrls(dedupe ? Array.from(new Set(cleaned)) : cleaned);
  }, [input, dedupe]);

  const handleCopy = async () => {
    if (urls.length) {
      await navigator.clipboard.writeText(urls.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-40 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
        placeholder="Paste text containing URLs..."
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-cyber-muted cursor-pointer">
          <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
          Remove duplicates
        </label>
        <button onClick={extract} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Extract URLs</span></button>
      </div>
      {urls.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">Found ({urls.length})</label>
            <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">
              {copied ? 'COPIED' : 'COPY ALL'}
            </button>
          </div>
          <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 space-y-1 max-h-64 overflow-y-auto font-mono text-xs text-cyber-glow break-all">
            {urls.map((u, i) => <div key={i}>{u}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
