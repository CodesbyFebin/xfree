'use client';

import { useCallback, useState } from 'react';
import * as yaml from 'js-yaml';

type Mode = 'json-to-yaml' | 'yaml-to-json' | 'validate';

interface Props {
  mode: Mode;
}

function YamlToolBase({ mode }: Props) {
  const isValidateOnly = mode === 'validate';
  const [input, setInput] = useState(
    mode === 'json-to-yaml'
      ? '{\n  "name": "XFree",\n  "free": true,\n  "tools": ["json", "yaml"]\n}'
      : 'name: XFree\nfree: true\ntools:\n  - json\n  - yaml\n'
  );
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    try {
      if (mode === 'json-to-yaml') {
        setOutput(yaml.dump(JSON.parse(input)));
      } else if (mode === 'yaml-to-json') {
        setOutput(JSON.stringify(yaml.load(input), null, 2));
      } else {
        yaml.load(input);
        setOutput('Valid YAML ✓');
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      setOutput('');
    }
  }, [input, mode]);

  const handleCopy = async () => {
    if (output) await navigator.clipboard.writeText(output);
  };

  return (
    <div className="space-y-4">
      <div className={isValidateOnly ? '' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        <div>
          <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
            {mode === 'json-to-yaml' ? 'JSON Input' : 'YAML Input'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-48 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors resize-none"
          />
        </div>
        {!isValidateOnly && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold">
                {mode === 'json-to-yaml' ? 'YAML Output' : 'JSON Output'}
              </label>
              {output && <button onClick={handleCopy} className="text-[10px] text-cyber-glow hover:text-cyber-text font-mono transition-colors">COPY</button>}
            </div>
            <pre className={`w-full h-48 bg-cyber-bg border rounded-lg p-3 font-mono text-xs overflow-auto whitespace-pre-wrap ${error ? 'border-cyber-red text-cyber-red' : 'border-cyber-border text-cyber-glow'}`}>
              {error || output || 'Output will appear here...'}
            </pre>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button onClick={execute} className="cyber-btn text-xs px-6 py-2.5 rounded">
          <span>{mode === 'json-to-yaml' ? 'Convert to YAML' : mode === 'yaml-to-json' ? 'Convert to JSON' : 'Validate YAML'}</span>
        </button>
      </div>
      {isValidateOnly && (
        <div className={`cyber-card p-3 border ${error ? 'border-cyber-red/30' : output ? 'border-emerald-500/30' : 'border-cyber-border'}`}>
          <p className={`font-mono text-sm font-bold ${error ? 'text-cyber-red' : output ? 'text-emerald-400' : 'text-cyber-muted'}`}>
            {error || output || 'Click Validate YAML'}
          </p>
        </div>
      )}
    </div>
  );
}

export function JsonToYamlTool() { return <YamlToolBase mode="json-to-yaml" />; }
export function YamlToJsonTool() { return <YamlToolBase mode="yaml-to-json" />; }
export function YamlValidatorTool() { return <YamlToolBase mode="validate" />; }
