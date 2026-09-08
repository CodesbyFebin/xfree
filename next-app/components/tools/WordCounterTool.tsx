'use client';

import { useMemo, useState } from 'react';

export function WordCounterTool() {
  const [input, setInput] = useState('The quick brown fox jumps over the lazy dog.');

  const stats = useMemo(() => {
    const words = input.trim() === '' ? [] : input.trim().split(/\s+/);
    const sentences = input.trim() === '' ? [] : input.split(/[.!?]+/).filter((s) => s.trim() !== '');
    const paragraphs = input.trim() === '' ? [] : input.split(/\n\s*\n/).filter((p) => p.trim() !== '');
    const readingTimeMin = Math.max(1, Math.round(words.length / 200));
    return {
      words: words.length,
      characters: input.length,
      charactersNoSpaces: input.replace(/\s/g, '').length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      readingTimeMin,
    };
  }, [input]);

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-40 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
        placeholder="Paste or type text..."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Words', value: stats.words },
          { label: 'Characters', value: stats.characters },
          { label: 'Chars (no spaces)', value: stats.charactersNoSpaces },
          { label: 'Sentences', value: stats.sentences },
          { label: 'Paragraphs', value: stats.paragraphs },
          { label: 'Reading time', value: `${stats.readingTimeMin} min` },
        ].map((s) => (
          <div key={s.label} className="cyber-card p-3 text-center">
            <div className="text-lg font-mono text-cyber-glow font-bold">{s.value}</div>
            <div className="text-[10px] text-cyber-muted uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
