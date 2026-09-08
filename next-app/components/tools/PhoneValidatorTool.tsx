'use client';

import { useCallback, useState } from 'react';
import { parsePhoneNumberFromString, getCountries } from 'libphonenumber-js';

interface Result {
  valid: boolean;
  country?: string;
  callingCode?: string;
  type?: string;
  national?: string;
  international?: string;
  e164?: string;
  error?: string;
}

export function PhoneValidatorTool() {
  const [input, setInput] = useState('+1 415 555 2671');
  const [result, setResult] = useState<Result | null>(null);

  const validate = useCallback(() => {
    try {
      const phone = parsePhoneNumberFromString(input);
      if (!phone) {
        setResult({ valid: false, error: 'Could not parse phone number - try including a country code (e.g. +1...)' });
        return;
      }
      setResult({
        valid: phone.isValid(),
        country: phone.country,
        callingCode: phone.countryCallingCode,
        type: phone.getType() ?? 'Unknown',
        national: phone.formatNational(),
        international: phone.formatInternational(),
        e164: phone.number,
      });
    } catch (e) {
      setResult({ valid: false, error: e instanceof Error ? e.message : 'Invalid phone number' });
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Phone Number</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="+1 415 555 2671"
        />
        <p className="text-[10px] text-cyber-dim mt-1 font-mono">Include a country code (e.g. +1, +44) for the most reliable result.</p>
      </div>
      <div className="flex justify-end">
        <button onClick={validate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Validate</span></button>
      </div>
      {result && (
        <div className={`cyber-card p-4 border ${result.valid ? 'border-emerald-500/30' : 'border-cyber-red/30'}`}>
          <p className={`font-mono text-sm font-bold ${result.valid ? 'text-emerald-400' : 'text-cyber-red'}`}>
            {result.valid ? '✓ Valid phone number' : `✗ ${result.error ?? 'Invalid phone number'}`}
          </p>
          {result.valid && (
            <div className="mt-2 text-xs text-cyber-muted font-mono space-y-1">
              <p>Country: <span className="text-cyber-glow">{result.country} (+{result.callingCode})</span></p>
              <p>Type: <span className="text-cyber-glow">{result.type}</span></p>
              <p>National format: <span className="text-cyber-glow">{result.national}</span></p>
              <p>International format: <span className="text-cyber-glow">{result.international}</span></p>
              <p>E.164: <span className="text-cyber-glow">{result.e164}</span></p>
            </div>
          )}
        </div>
      )}
      <p className="text-[10px] text-cyber-dim font-mono">Validated using libphonenumber-js (Google's libphonenumber metadata) entirely in your browser - no number is sent anywhere. Supports {getCountries().length} countries/regions.</p>
    </div>
  );
}
