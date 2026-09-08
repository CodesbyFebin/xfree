'use client';

import { useCallback, useState } from 'react';

// String-aware comment stripping - a naive global replace of /* ... */
// would be safe for CSS specifically (CSS has no line comments and
// url()/strings rarely contain "/*"), but this still walks the string
// so a value like content: "/* not a comment */" is never touched.
function stripCssComments(css: string): string {
  let result = '';
  let i = 0;
  let inString: '"' | "'" | null = null;
  while (i < css.length) {
    const c = css[i];
    if (inString) {
      result += c;
      if (c === inString && css[i - 1] !== '\\') inString = null;
      i++;
    } else if (c === '"' || c === "'") {
      inString = c;
      result += c;
      i++;
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
    } else {
      result += c;
      i++;
    }
  }
  return result;
}

function minifyCss(css: string): string {
  return stripCssComments(css)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

export function CssMinifierTool() {
  const [input, setInput] = useState('.button {\n  color: #39ff14;\n  padding: 10px 20px; /* comment */\n  border-radius: 4px;\n}\n');
  const [output, setOutput] = useState('');

  const execute = useCallback(() => {
    setOutput(minifyCss(input));
  }, [input]);

  const handleCopy = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  const savings = output ? Math.round((1 - output.length / input.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Input CSS</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              Minified {output && <span className="text-cyber-cyan">(-{savings}%)</span>}
            </label>
            {output && <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>}
          </div>
          <pre className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto whitespace-pre-wrap break-all">
            {output || 'Minified CSS will appear here...'}
          </pre>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={execute} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Minify</span></button>
      </div>
    </div>
  );
}
