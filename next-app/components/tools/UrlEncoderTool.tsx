'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';

type Mode = 'encode' | 'decode';

export function UrlEncoderTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('encode');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const process = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (e) {
      setOutput('Error: Invalid input for decoding');
    }
  }, [input, mode]);

  const handleCopy = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'encode' ? 'decode' : 'encode'));
    setOutput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={toggleMode}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono rounded transition-all bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Switch to {mode === 'encode' ? 'Decode' : 'Encode'}</span>
        </button>
        <div className="ml-auto">
          <span className="text-xs font-mono text-cyber-glow">
            {mode === 'encode' ? 'RFC 3986 Encoding' : 'URI Decoding'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
            {mode === 'encode' ? 'Text to Encode' : 'Encoded URL to Decode'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-32 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
            placeholder={mode === 'encode' ? 'Enter text to URL encode...' : 'Paste encoded URL to decode...'}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
              {mode === 'encode' ? 'Encoded Output' : 'Decoded Output'}
            </label>
            {output && (
              <button
                onClick={handleCopy}
                className="text-[10px] text-cyber-glow hover:text-white font-mono transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            )}
          </div>
          <pre className="w-full h-32 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-xs text-cyber-glow overflow-auto break-all">
            {output || 'Result will appear here...'}
          </pre>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={process}
          className="cyber-btn text-xs px-6 py-2.5 rounded"
        >
          <span>{mode === 'encode' ? 'Encode URL' : 'Decode URL'}</span>
        </button>
      </div>

      <div className="text-xs text-cyber-muted space-y-1">
        <p>• Encode: Converts special characters to %XX format (e.g., spaces become %20)</p>
        <p>• Decode: Converts %XX sequences back to characters</p>
      </div>
    </div>
  );
}
