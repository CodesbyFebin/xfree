import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { RefreshCw, Copy, Check, Clock, Palette } from "lucide-react";

interface ConverterProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const TimestampColorConverter: React.FC<ConverterProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"timestamp" | "color" | "pxrem">("timestamp");

  // Timestamp State
  const [tsInput, setTsInput] = useState(String(Math.floor(Date.now() / 1000)));

  // Color State
  const [hexInput, setHexInput] = useState("#3b82f6");

  // CSS Units State
  const [pxInput, setPxInput] = useState(24);
  const [baseFontSize, setBaseFontSize] = useState(16);

  const [copied, setCopied] = useState(false);

  // Timestamp Conversion
  const parsedDate = useMemo(() => {
    if (!tsInput.trim()) return null;
    const num = Number(tsInput.trim());
    if (isNaN(num)) return null;

    // Detect milliseconds vs seconds
    const date = num > 1e11 ? new Date(num) : new Date(num * 1000);
    return {
      iso: date.toISOString(),
      local: date.toLocaleString(),
      utc: date.toUTCString(),
      relative: `${Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))} days ago`,
    };
  }, [tsInput]);

  // Color Conversion
  const colorOutput = useMemo(() => {
    let cleanHex = hexInput.trim().replace(/^#/, "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    if (cleanHex.length !== 6) return null;

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    const rgbStr = `rgb(${r}, ${g}, ${b})`;

    // HSL
    const rR = r / 255;
    const gR = g / 255;
    const bR = b / 255;
    const max = Math.max(rR, gR, bR);
    const min = Math.min(rR, gR, bR);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rR: h = (gR - bR) / d + (gR < bR ? 6 : 0); break;
        case gR: h = (bR - rR) / d + 2; break;
        case bR: h = (rR - gR) / d + 4; break;
      }
      h /= 6;
    }

    const hslStr = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

    return {
      hex: `#${cleanHex}`,
      rgb: rgbStr,
      hsl: hslStr,
    };
  }, [hexInput]);

  const handleCopy = (str: string) => {
    navigator.clipboard.writeText(str);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(activeTab, str);
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("timestamp")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "timestamp" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Unix Timestamp
        </button>

        <button
          onClick={() => setActiveTab("color")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "color" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Color Space Converter
        </button>

        <button
          onClick={() => setActiveTab("pxrem")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "pxrem" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          CSS Units (px ↔ rem)
        </button>
      </div>

      {activeTab === "timestamp" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              placeholder="Enter Unix timestamp..."
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-sm focus:outline-none"
            />
            <button
              onClick={() => setTsInput(String(Math.floor(Date.now() / 1000)))}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
            >
              Now
            </button>
          </div>

          {parsedDate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">ISO 8601 String</span>
                <span className="text-emerald-400 font-bold">{parsedDate.iso}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">Local Time</span>
                <span className="text-white font-bold">{parsedDate.local}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">UTC Time</span>
                <span className="text-cyan-300 font-bold">{parsedDate.utc}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">Relative</span>
                <span className="text-amber-400 font-bold">{parsedDate.relative}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "color" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={hexInput.startsWith("#") ? hexInput : `#${hexInput}`}
              onChange={(e) => setHexInput(e.target.value)}
              className="w-12 h-10 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer"
            />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="#3b82f6"
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs"
            />
          </div>

          {colorOutput && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
                <span className="text-zinc-500">HEX</span>
                <div className="text-emerald-400 font-bold flex justify-between">
                  <span>{colorOutput.hex}</span>
                  <button onClick={() => handleCopy(colorOutput.hex)}>Copy</button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
                <span className="text-zinc-500">RGB</span>
                <div className="text-cyan-300 font-bold flex justify-between">
                  <span>{colorOutput.rgb}</span>
                  <button onClick={() => handleCopy(colorOutput.rgb)}>Copy</button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
                <span className="text-zinc-500">HSL</span>
                <div className="text-purple-300 font-bold flex justify-between">
                  <span>{colorOutput.hsl}</span>
                  <button onClick={() => handleCopy(colorOutput.hsl)}>Copy</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "pxrem" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <label className="text-zinc-300 font-semibold block">Pixel Value (px)</label>
            <input
              type="number"
              value={pxInput}
              onChange={(e) => setPxInput(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono text-sm"
            />
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <label className="text-zinc-300 font-semibold block">REM Equivalent (Base {baseFontSize}px)</label>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {(pxInput / baseFontSize).toFixed(4).replace(/\.?0+$/, "")} rem
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
