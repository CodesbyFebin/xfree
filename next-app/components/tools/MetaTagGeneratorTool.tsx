'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Eye } from 'lucide-react';

export function MetaTagGeneratorTool() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [siteUrl, setSiteUrl] = useState('https://example.com');
  const [twitterCard, setTwitterCard] = useState<'summary' | 'summary_large_image'>('summary_large_image');
  const [copied, setCopied] = useState('');

  const metaTags = useCallback(() => {
    const tags: string[] = [];

    tags.push(`<title>${title || 'Page Title'}</title>`);
    tags.push(`<meta name="description" content="${description || 'Page description'}">`);
    tags.push('');
    tags.push(`<!-- Open Graph / Facebook -->`);
    tags.push(`<meta property="og:type" content="website">`);
    tags.push(`<meta property="og:url" content="${siteUrl}">`);
    tags.push(`<meta property="og:title" content="${title || 'Page Title'}">`);
    tags.push(`<meta property="og:description" content="${description || 'Page description'}">`);
    if (imageUrl) {
      tags.push(`<meta property="og:image" content="${imageUrl}">`);
    }
    tags.push('');
    tags.push(`<!-- Twitter -->`);
    tags.push(`<meta name="twitter:card" content="${twitterCard}">`);
    tags.push(`<meta name="twitter:url" content="${siteUrl}">`);
    tags.push(`<meta name="twitter:title" content="${title || 'Page Title'}">`);
    tags.push(`<meta name="twitter:description" content="${description || 'Page description'}">`);
    if (imageUrl) {
      tags.push(`<meta name="twitter:image" content="${imageUrl}">`);
    }

    return tags.join('\n');
  }, [title, description, imageUrl, siteUrl, twitterCard]);

  const handleCopy = async (section: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
              placeholder="Enter page title..."
              maxLength={60}
            />
            <span className="text-[10px] text-cyber-muted mt-1 block text-right">{title.length}/60</span>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              Meta Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
              placeholder="Enter meta description..."
              maxLength={160}
            />
            <span className="text-[10px] text-cyber-muted mt-1 block text-right">{description.length}/160</span>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              Site URL
            </label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              OG Image URL (optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
              placeholder="https://example.com/og-image.png"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
              Twitter Card Type
            </label>
            <div className="flex gap-2">
              {(['summary', 'summary_large_image'] as const).map((card) => (
                <button
                  key={card}
                  onClick={() => setTwitterCard(card)}
                  className={`px-4 py-2 text-xs font-mono rounded transition-all ${
                    twitterCard === card
                      ? 'bg-cyber-glow text-cyber-bg'
                      : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white'
                  }`}
                >
                  {card}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              Generated Meta Tags
            </label>
            <button
              onClick={() => handleCopy('all', metaTags())}
              className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors flex items-center gap-1"
            >
              {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'all' ? 'COPIED' : 'COPY ALL'}
            </button>
          </div>
          <pre className="w-full h-[400px] bg-cyber-bg border border-cyber-border rounded-lg p-4 font-mono text-xs text-cyber-glow overflow-auto whitespace-pre-wrap">
            {metaTags() || 'Fill in the fields to generate meta tags...'}
          </pre>
        </div>
      </div>

      <div className="cyber-card p-4 border-cyber-cyan/30">
        <div className="flex items-center gap-2 text-xs text-cyber-cyan mb-2">
          <Eye className="w-4 h-4" />
          <span className="font-semibold">Social Preview Tip</span>
        </div>
        <p className="text-cyber-muted text-xs">
          Test your meta tags with{" "}
          <a href="https://socialsharepreview.com" target="_blank" rel="noopener noreferrer" className="text-cyber-glow hover:underline">
            socialsharepreview.com
          </a>{" "}
          or Twitter&apos;s{" "}
          <a href="https://cards-dev.twitter.com/validator" target="_blank" rel="noopener noreferrer" className="text-cyber-glow hover:underline">
            Card Validator
          </a>
          .
        </p>
      </div>
    </div>
  );
}
