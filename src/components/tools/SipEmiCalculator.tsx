import React, { useMemo, useState } from "react";
import { ToolDefinition } from "../../types";
import { Calculator, ChevronDown, ChevronUp, Copy, Check, TrendingUp, Landmark } from "lucide-react";

interface SipEmiCalculatorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

interface SipYearRow {
  year: number;
  invested: number;
  value: number;
}

function computeSip(monthly: number, annualRatePct: number, years: number) {
  const months = Math.max(0, Math.round(years * 12));
  const i = annualRatePct / 100 / 12;
  const rows: SipYearRow[] = [];

  for (let y = 1; y <= years; y++) {
    const n = y * 12;
    const invested = monthly * n;
    const value =
      i === 0 ? invested : monthly * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    rows.push({ year: y, invested, value });
  }

  const totalInvested = monthly * months;
  const maturityValue =
    i === 0 ? totalInvested : monthly * (((Math.pow(1 + i, months) - 1) / i) * (1 + i));
  const totalGain = maturityValue - totalInvested;

  return { rows, totalInvested, maturityValue, totalGain };
}

interface EmiMonthRow {
  month: number;
  principal: number;
  interest: number;
  balance: number;
}

function computeEmi(principal: number, annualRatePct: number, years: number) {
  const months = Math.max(0, Math.round(years * 12));
  const r = annualRatePct / 100 / 12;

  const emi =
    r === 0
      ? principal / Math.max(1, months)
      : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);

  const rows: EmiMonthRow[] = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principalPaid = Math.min(emi - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month: m, principal: principalPaid, interest, balance });
  }

  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  return { emi, rows, totalPayment, totalInterest };
}

export const SipEmiCalculator: React.FC<SipEmiCalculatorProps> = ({ tool, onSaveHistory }) => {
  const [mode, setMode] = useState<"sip" | "emi">("sip");
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  const [emiPrincipal, setEmiPrincipal] = useState(2500000);
  const [emiRate, setEmiRate] = useState(8.5);
  const [emiYears, setEmiYears] = useState(20);

  const sip = useMemo(() => computeSip(sipMonthly, sipRate, sipYears), [sipMonthly, sipRate, sipYears]);
  const emi = useMemo(() => computeEmi(emiPrincipal, emiRate, emiYears), [emiPrincipal, emiRate, emiYears]);

  const handleCopy = () => {
    const summary =
      mode === "sip"
        ? `SIP: ${formatINR(sipMonthly)}/month at ${sipRate}% for ${sipYears}y → Invested ${formatINR(sip.totalInvested)}, Maturity ${formatINR(sip.maturityValue)}, Gain ${formatINR(sip.totalGain)}`
        : `EMI: ${formatINR(emiPrincipal)} at ${emiRate}% for ${emiYears}y → EMI ${formatINR(emi.emi)}/month, Total Interest ${formatINR(emi.totalInterest)}, Total Payment ${formatINR(emi.totalPayment)}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(mode === "sip" ? `SIP ${sipMonthly}/${sipRate}%/${sipYears}y` : `EMI ${emiPrincipal}/${emiRate}%/${emiYears}y`, summary);
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 w-full sm:w-fit">
        <button
          onClick={() => setMode("sip")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            mode === "sip" ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> SIP Calculator
        </button>
        <button
          onClick={() => setMode("emi")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
            mode === "emi" ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Landmark className="w-4 h-4" /> EMI Calculator
        </button>
      </div>

      {/* Result Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>{mode === "sip" ? "SIP Maturity Estimate" : "Monthly EMI"}</span>
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Summary"}</span>
          </button>
        </div>

        {mode === "sip" ? (
          <>
            <div className="text-2xl sm:text-4xl font-mono text-emerald-400 font-bold bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
              {formatINR(sip.maturityValue)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wide">Total Invested</div>
                <div className="text-sm font-bold text-white mt-1">{formatINR(sip.totalInvested)}</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wide">Estimated Gain</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{formatINR(sip.totalGain)}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl sm:text-4xl font-mono text-emerald-400 font-bold bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center">
              {formatINR(emi.emi)} <span className="text-sm text-zinc-500 font-sans">/ month</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wide">Total Interest</div>
                <div className="text-sm font-bold text-white mt-1">{formatINR(emi.totalInterest)}</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <div className="text-[11px] text-zinc-400 uppercase tracking-wide">Total Payment</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">{formatINR(emi.totalPayment)}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Inputs */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          {mode === "sip" ? "Configure your SIP" : "Configure your loan"}
        </h4>
        {mode === "sip" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Monthly Investment (₹)</label>
              <input
                type="number"
                min={0}
                value={sipMonthly}
                onChange={(e) => setSipMonthly(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Expected Annual Return (%)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={sipRate}
                onChange={(e) => setSipRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Duration (years)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={sipYears}
                onChange={(e) => setSipYears(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Loan Amount (₹)</label>
              <input
                type="number"
                min={0}
                value={emiPrincipal}
                onChange={(e) => setEmiPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Annual Interest Rate (%)</label>
              <input
                type="number"
                min={0}
                step={0.05}
                value={emiRate}
                onChange={(e) => setEmiRate(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Tenure (years)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={emiYears}
                onChange={(e) => setEmiYears(Math.max(1, Math.min(30, Number(e.target.value))))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <button
          onClick={() => setShowBreakdown((s) => !s)}
          className="w-full flex items-center justify-between p-5 text-xs font-bold text-white uppercase tracking-wider"
        >
          <span>{mode === "sip" ? "Year-by-Year Growth Breakdown" : "Month-by-Month Amortization Schedule"}</span>
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showBreakdown && (
          <div className="max-h-96 overflow-y-auto border-t border-zinc-800">
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0 bg-zinc-950">
                {mode === "sip" ? (
                  <tr className="text-zinc-500 text-left">
                    <th className="p-3">Year</th>
                    <th className="p-3">Invested</th>
                    <th className="p-3">Value</th>
                  </tr>
                ) : (
                  <tr className="text-zinc-500 text-left">
                    <th className="p-3">Month</th>
                    <th className="p-3">Principal</th>
                    <th className="p-3">Interest</th>
                    <th className="p-3">Balance</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {mode === "sip"
                  ? sip.rows.map((row) => (
                      <tr key={row.year} className="border-t border-zinc-800/60 text-zinc-300">
                        <td className="p-3">{row.year}</td>
                        <td className="p-3">{formatINR(row.invested)}</td>
                        <td className="p-3 text-emerald-400">{formatINR(row.value)}</td>
                      </tr>
                    ))
                  : emi.rows.map((row) => (
                      <tr key={row.month} className="border-t border-zinc-800/60 text-zinc-300">
                        <td className="p-3">{row.month}</td>
                        <td className="p-3">{formatINR(row.principal)}</td>
                        <td className="p-3">{formatINR(row.interest)}</td>
                        <td className="p-3 text-emerald-400">{formatINR(row.balance)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
