'use client';

import { useMemo, useState } from 'react';

interface Token {
  text: string;
  description: string;
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  '\\d': 'any digit (0-9)',
  '\\D': 'any non-digit',
  '\\w': 'any word character (letter, digit, underscore)',
  '\\W': 'any non-word character',
  '\\s': 'any whitespace character',
  '\\S': 'any non-whitespace character',
  '\\b': 'a word boundary',
  '\\B': 'a non-word-boundary',
  '.': 'any character (except newline)',
};

// Tokenizes the common, well-defined subset of JS regex syntax
// (anchors, character classes, groups, quantifiers, alternation,
// escaped literals) into a real explanation per token - not a
// templated guess. Uncommon/advanced constructs (lookbehind edge
// cases, Unicode property escapes) fall back to a literal token
// description rather than a wrong explanation.
function tokenize(pattern: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < pattern.length) {
    const c = pattern[i];

    if (c === '^') { tokens.push({ text: '^', description: 'start of the string (or line, with the m flag)' }); i++; continue; }
    if (c === '$') { tokens.push({ text: '$', description: 'end of the string (or line, with the m flag)' }); i++; continue; }

    if (c === '\\') {
      const two = pattern.slice(i, i + 2);
      if (CLASS_DESCRIPTIONS[two]) {
        tokens.push({ text: two, description: CLASS_DESCRIPTIONS[two] });
        i += 2;
        continue;
      }
      tokens.push({ text: two, description: `a literal "${pattern[i + 1]}" character (escaped)` });
      i += 2;
      continue;
    }

    if (c === '[') {
      const end = pattern.indexOf(']', i + 1);
      const cls = end === -1 ? pattern.slice(i) : pattern.slice(i, end + 1);
      const negated = cls.startsWith('[^');
      tokens.push({ text: cls, description: `${negated ? 'any character NOT' : 'any one character'} in the set ${cls}` });
      i = end === -1 ? pattern.length : end + 1;
      continue;
    }

    if (c === '(') {
      let end = i + 1;
      let depth = 1;
      while (end < pattern.length && depth > 0) {
        if (pattern[end] === '(') depth++;
        else if (pattern[end] === ')') depth--;
        end++;
      }
      const group = pattern.slice(i, end);
      let desc = 'a capturing group';
      if (group.startsWith('(?:')) desc = 'a non-capturing group';
      else if (group.startsWith('(?<')) desc = `a named capturing group "${group.match(/\(\?<([^>]+)>/)?.[1] ?? ''}"`;
      else if (group.startsWith('(?=')) desc = 'a positive lookahead';
      else if (group.startsWith('(?!')) desc = 'a negative lookahead';
      else if (group.startsWith('(?<=')) desc = 'a positive lookbehind';
      else if (group.startsWith('(?<!')) desc = 'a negative lookbehind';
      tokens.push({ text: group, description: desc });
      i = end;
      continue;
    }

    if (c === '{') {
      const end = pattern.indexOf('}', i + 1);
      if (end !== -1) {
        const quant = pattern.slice(i, end + 1);
        const [minS, maxS] = quant.slice(1, -1).split(',');
        const desc = maxS === undefined
          ? `exactly ${minS} times`
          : maxS === '' ? `${minS} or more times` : `between ${minS} and ${maxS} times`;
        tokens.push({ text: quant, description: `the previous token, ${desc}` });
        i = end + 1;
        continue;
      }
    }

    if (c === '*') { tokens.push({ text: '*', description: 'the previous token, zero or more times' }); i++; continue; }
    if (c === '+') { tokens.push({ text: '+', description: 'the previous token, one or more times' }); i++; continue; }
    if (c === '?') { tokens.push({ text: '?', description: 'the previous token, zero or one time (optional)' }); i++; continue; }
    if (c === '|') { tokens.push({ text: '|', description: 'OR - matches whatever is on either side' }); i++; continue; }

    tokens.push({ text: c, description: `a literal "${c}" character` });
    i++;
  }
  return tokens;
}

export function RegexExplainerTool() {
  const [pattern, setPattern] = useState('^\\w+@[a-zA-Z0-9-]+\\.\\w{2,}$');
  const tokens = useMemo(() => {
    try {
      new RegExp(pattern);
      return tokenize(pattern);
    } catch {
      return null;
    }
  }, [pattern]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Regex Pattern</label>
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
        />
      </div>
      {tokens === null && <p className="text-xs text-cyber-red font-mono">Invalid regex pattern</p>}
      {tokens && (
        <div className="space-y-2">
          {tokens.map((t, i) => (
            <div key={i} className="flex items-start gap-3 bg-cyber-bg border border-cyber-border rounded-lg p-3">
              <code className="text-cyber-glow font-mono text-sm bg-cyber-glow/10 px-2 py-0.5 rounded shrink-0">{t.text}</code>
              <span className="text-sm text-cyber-muted">{t.description}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Covers common regex syntax (anchors, classes, groups, quantifiers, alternation). Advanced/rare constructs are shown as literal tokens.</p>
    </div>
  );
}
