'use client';

import { useEffect, useState } from 'react';
import { marked } from 'marked';

const DEFAULT_MD = `# XFree Markdown Editor

Type **Markdown** on the left, see the *rendered* preview on the right.

- Real-time preview
- Supports headings, lists, links, code blocks
- No signup, runs entirely in your browser

\`\`\`js
console.log("Hello, XFree!");
\`\`\`

[Visit XFree](https://www.xfree.in)
`;

export function MarkdownEditorTool() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(marked.parse(markdown)).then((result) => {
      if (!cancelled) setHtml(result as string);
    });
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Markdown</label>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="w-full h-96 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Preview</label>
        <div
          className="w-full h-96 bg-cyber-bg border border-cyber-border rounded-lg p-4 overflow-auto prose prose-invert prose-sm max-w-none [&_a]:text-cyber-glow [&_code]:text-cyber-glow [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:rounded"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
