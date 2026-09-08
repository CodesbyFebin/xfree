'use client';

import { useMemo, useState } from 'react';

const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g');

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function SlugGeneratorTool() {
  const [input, setInput] = useState('My Awesome Blog Post Title!');
  const [copied, setCopied] = useState(false);
  const slug = useMemo(() => slugify(input), [input]);

  const handleCopy = async () => {
    if (!slug) return;
    await navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Text</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="Enter a title..."
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">URL Slug</label>
          {slug && (
            <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">
              {copied ? 'COPIED' : 'COPY'}
            </button>
          )}
        </div>
        <pre className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow overflow-auto break-all">
          {slug || 'slug-will-appear-here'}
        </pre>
      </div>
    </div>
  );
}
