export const stringCaseConverter = async (input: { text: string; mode: 'upper' | 'lower' | 'title' | 'snake' | 'camel' }): Promise<string> => {
  const { text, mode } = input;
  switch (mode) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'title': return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case 'snake': return text.replace(/\s+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    case 'camel': return text.replace(/\s+/g, '').replace(/([A-Z])/g, (m) => m.toLowerCase()).replace(/_([a-z])/g, (m) => m[1].toUpperCase());
    default: return text;
  }
};

export const stringReverse = async (input: { text: string }): Promise<string> => {
  return input.text.split('').reverse().join('');
};

export const stringTrimmer = async (input: { text: string; type: 'left' | 'right' | 'both' }): Promise<string> => {
  switch (input.type) {
    case 'left': return input.text.replace(/^\s+/, '');
    case 'right': return input.text.replace(/\s+$/, '');
    default: return input.text.trim();
  }
};

export const stringAnalyzer = async (input: { text: string }): Promise<{ length: number; words: number; chars: number; uniqueChars: number }> => {
  const text = input.text;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const uniqueChars = new Set(text).size;
  return { length: text.length, words, chars: text.length, uniqueChars };
};

export const textToAscii = async (input: { text: string }): Promise<string> => {
  return input.text.split('').map(c => c.charCodeAt(0).toString(10)).join(' ');
};

export const asciiToText = async (input: { ascii: string }): Promise<string> => {
  return input.ascii.split(' ').map(n => String.fromCharCode(parseInt(n))).join('');
};

export const textEntropy = async (input: { text: string }): Promise<number> => {
  const freq: Record<string, number> = {};
  for (const c of input.text) freq[c] = (freq[c] || 0) + 1;
  const len = input.text.length;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
};

export const textToSentenceCase = async (input: { text: string }): Promise<string> => {
  return input.text.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());
};

export const wordCounter = async (input: { text: string }): Promise<{ words: number; chars: number; sentences: number }> => {
  const words = input.text.trim().split(/\s+/).filter(w => w.length > 0).length;
  const sentences = input.text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  return { words, chars: input.text.length, sentences };
};

export const lineCounter = async (input: { text: string }): Promise<{ lines: number; chars: number }> => {
  const lines = input.text.split('\n').length;
  return { lines, chars: input.text.length };
};

export const duplicateRemover = async (input: { text: string; mode: 'line' | 'word' }): Promise<string> => {
  const items = input.mode === 'line'
    ? input.text.split('\n').map(l => l.trim()).filter(l => l)
    : input.text.split(/\s+/).filter(w => w);
  const unique = [...new Set(items)];
  return input.mode === 'line' ? unique.join('\n') : unique.join(' ');
};

export const textDiff = async (input: { text1: string; text2: string }): Promise<{ added: string[]; removed: string[] }> => {
  const lines1 = input.text1.split('\n');
  const lines2 = input.text2.split('\n');
  const added = lines2.filter(l => !lines1.includes(l));
  const removed = lines1.filter(l => !lines2.includes(l));
  return { added, removed };
};
