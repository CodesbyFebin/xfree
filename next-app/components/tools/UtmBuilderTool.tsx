'use client';

import { useMemo, useState } from 'react';

export function UtmBuilderTool() {
  const [baseUrl, setBaseUrl] = useState('https://example.com/page');
  const [source, setSource] = useState('newsletter');
  const [medium, setMedium] = useState('email');
  const [campaign, setCampaign] = useState('spring-sale');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      const url = new URL(baseUrl);
      if (source) url.searchParams.set('utm_source', source);
      if (medium) url.searchParams.set('utm_medium', medium);
      if (campaign) url.searchParams.set('utm_campaign', campaign);
      if (term) url.searchParams.set('utm_term', term);
      if (content) url.searchParams.set('utm_content', content);
      return url.toString();
    } catch {
      return null;
    }
  }, [baseUrl, source, medium, campaign, term, content]);

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const fields: [string, string, (v: string) => void, boolean][] = [
    ['Website URL', baseUrl, setBaseUrl, true],
    ['Campaign Source (utm_source)', source, setSource, false],
    ['Campaign Medium (utm_medium)', medium, setMedium, false],
    ['Campaign Name (utm_campaign)', campaign, setCampaign, false],
    ['Campaign Term (utm_term, optional)', term, setTerm, false],
    ['Campaign Content (utm_content, optional)', content, setContent, false],
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map(([label, value, setter]) => (
          <div key={label}>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-1 block">{label}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
            />
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">Generated URL</label>
          {result && (
            <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">
              {copied ? 'COPIED' : 'COPY'}
            </button>
          )}
        </div>
        <pre className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto break-all whitespace-pre-wrap">
          {result || 'Enter a valid website URL...'}
        </pre>
      </div>
    </div>
  );
}
