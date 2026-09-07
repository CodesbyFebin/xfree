'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Download, Plus, Trash2 } from 'lucide-react';

interface RuleEntry {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

const COMMON_BOTS = ['*', 'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot'];

export function RobotsTxtGeneratorTool() {
  const [rules, setRules] = useState<RuleEntry[]>([
    { userAgent: '*', allow: ['/'], disallow: [] },
  ]);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const addRule = () => {
    setRules([...rules, { userAgent: 'Googlebot', allow: [], disallow: [] }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof RuleEntry, value: string) => {
    const updated = [...rules];
    (updated[index] as any)[field] = value;
    setRules(updated);
  };

  const addPath = (index: number, field: 'allow' | 'disallow') => {
    const updated = [...rules];
    updated[index][field].push('');
    setRules(updated);
  };

  const updatePath = (ruleIndex: number, pathIndex: number, field: 'allow' | 'disallow', value: string) => {
    const updated = [...rules];
    updated[ruleIndex][field][pathIndex] = value;
    setRules(updated);
  };

  const removePath = (ruleIndex: number, pathIndex: number, field: 'allow' | 'disallow') => {
    const updated = [...rules];
    updated[ruleIndex][field].splice(pathIndex, 1);
    setRules(updated);
  };

  const generateRobotsTxt = useCallback(() => {
    const lines: string[] = [];

    rules.forEach((rule, i) => {
      lines.push(`User-agent: ${rule.userAgent}`);
      rule.allow.forEach((path) => {
        if (path) lines.push(`Allow: ${path}`);
      });
      rule.disallow.forEach((path) => {
        if (path) lines.push(`Disallow: ${path}`);
      });
      if (i < rules.length - 1) lines.push('');
    });

    if (sitemapUrl) {
      lines.push('');
      lines.push(`Sitemap: ${sitemapUrl}`);
    }

    return lines.join('\n');
  }, [rules, sitemapUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateRobotsTxt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateRobotsTxt()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
          Crawler Rules
        </label>

        {rules.map((rule, ruleIndex) => (
          <div key={ruleIndex} className="bg-cyber-bg border border-cyber-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyber-muted font-mono">User-agent:</span>
              <select
                value={rule.userAgent}
                onChange={(e) => updateRule(ruleIndex, 'userAgent', e.target.value)}
                className="flex-1 bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-sm font-mono text-cyber-glow"
              >
                {COMMON_BOTS.map((bot) => (
                  <option key={bot} value={bot}>{bot}</option>
                ))}
              </select>
              <button
                onClick={() => removeRule(ruleIndex)}
                className="text-cyber-muted hover:text-rose-400 transition-colors"
                disabled={rules.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-400 font-mono">Allow:</span>
                <button
                  onClick={() => addPath(ruleIndex, 'allow')}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> ADD
                </button>
              </div>
              {rule.allow.map((path, pathIndex) => (
                <div key={pathIndex} className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => updatePath(ruleIndex, pathIndex, 'allow', e.target.value)}
                    className="flex-1 bg-cyber-surface border border-cyber-border rounded px-2 py-1 text-xs font-mono text-emerald-400"
                    placeholder="/public/"
                  />
                  <button
                    onClick={() => removePath(ruleIndex, pathIndex, 'allow')}
                    className="text-cyber-muted hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-rose-400 font-mono">Disallow:</span>
                <button
                  onClick={() => addPath(ruleIndex, 'disallow')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> ADD
                </button>
              </div>
              {rule.disallow.map((path, pathIndex) => (
                <div key={pathIndex} className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => updatePath(ruleIndex, pathIndex, 'disallow', e.target.value)}
                    className="flex-1 bg-cyber-surface border border-cyber-border rounded px-2 py-1 text-xs font-mono text-rose-400"
                    placeholder="/admin/"
                  />
                  <button
                    onClick={() => removePath(ruleIndex, pathIndex, 'disallow')}
                    className="text-cyber-muted hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addRule}
          className="w-full py-2 border border-cyber-border border-dashed rounded-lg text-xs text-cyber-muted hover:text-cyber-glow hover:border-cyber-glow transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule for Another Bot
        </button>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
          Sitemap URL (optional)
        </label>
        <input
          type="url"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="https://example.com/sitemap.xml"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
            Generated robots.txt
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
            <button
              onClick={handleDownload}
              className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              DOWNLOAD
            </button>
          </div>
        </div>
        <pre className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-4 font-mono text-xs text-cyber-glow overflow-auto">
          {generateRobotsTxt()}
        </pre>
      </div>
    </div>
  );
}
