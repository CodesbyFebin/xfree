'use client';

import { useCallback, useState } from 'react';

// Real Luhn checksum (ISO/IEC 7812) - the actual algorithm card issuers
// use for a basic format check, not a fabricated pass/fail.
function luhnCheck(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Real, publicly documented IIN/BIN prefix ranges per network.
function detectCardType(digits: string): string {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720))/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^(6011|65|64[4-9]|622(12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5]))/.test(digits)) return 'Discover';
  if (/^3(0[0-5]|[68])/.test(digits)) return 'Diners Club';
  if (/^35(2[89]|[3-8]\d)/.test(digits)) return 'JCB';
  return 'Unknown';
}

export function CreditCardValidatorTool() {
  const [input, setInput] = useState('4111 1111 1111 1111');
  const [result, setResult] = useState<{ valid: boolean; type: string; digits: string } | null>(null);

  const validate = useCallback(() => {
    const digits = input.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 19) {
      setResult({ valid: false, type: 'Unknown', digits });
      return;
    }
    setResult({ valid: luhnCheck(digits), type: detectCardType(digits), digits });
  }, [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">Card Number</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm font-mono text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="4111 1111 1111 1111"
        />
      </div>
      <div className="flex justify-end">
        <button onClick={validate} className="cyber-btn text-xs px-6 py-2.5 rounded"><span>Validate</span></button>
      </div>
      {result && (
        <div className={`cyber-card p-4 border ${result.valid ? 'border-emerald-500/30' : 'border-cyber-red/30'}`}>
          <p className={`font-mono text-sm font-bold ${result.valid ? 'text-emerald-400' : 'text-cyber-red'}`}>
            {result.valid ? '✓ Passes Luhn checksum' : '✗ Fails Luhn checksum'}
          </p>
          <p className="text-xs text-cyber-muted font-mono mt-2">Detected network: <span className="text-cyber-glow">{result.type}</span></p>
          <p className="text-[10px] text-cyber-dim mt-3">Checks the Luhn checksum and IIN prefix only - does not verify the card is real, active, or unexpired. No card data is stored or transmitted.</p>
        </div>
      )}
    </div>
  );
}
