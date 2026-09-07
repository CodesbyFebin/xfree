import React, { useState, useEffect, useRef } from "react";
import { ToolDefinition } from "../../types";
import { RotateCw, ExternalLink, AlertTriangle } from "lucide-react";

interface MobileTesterProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

const DEVICES = [
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667 },
  { id: "iphone-14", label: "iPhone 14", width: 390, height: 844 },
  { id: "iphone-14-pro-max", label: "iPhone 14 Pro Max", width: 430, height: 932 },
  { id: "galaxy-s21", label: "Galaxy S21", width: 360, height: 800 },
  { id: "pixel-7", label: "Pixel 7", width: 412, height: 915 },
  { id: "ipad-mini", label: "iPad Mini", width: 768, height: 1024 },
  { id: "ipad-pro", label: "iPad Pro 12.9\"", width: 1024, height: 1366 },
];

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return url.toString();
  } catch {
    return null;
  }
}

export const MobileTester: React.FC<MobileTesterProps> = ({ tool, onSaveHistory }) => {
  const [input, setInput] = useState(tool.exampleInput || "");
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState(DEVICES[1].id);
  const [landscape, setLandscape] = useState(false);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "timeout">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const device = DEVICES.find((d) => d.id === deviceId) || DEVICES[1];
  const frameWidth = landscape ? device.height : device.width;
  const frameHeight = landscape ? device.width : device.height;

  const handleLoad = () => {
    const url = normalizeUrl(input);
    if (!url) return;
    setActiveUrl(url);
    setLoadState("loading");
    onSaveHistory(url, `previewed on ${device.label}`);
  };

  useEffect(() => {
    if (loadState !== "loading") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLoadState((s) => (s === "loading" ? "timeout" : s)), 6000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loadState, activeUrl]);

  // Scale the device frame down to fit the panel on small screens while
  // keeping the iframe's own viewport at true device pixel dimensions.
  const maxPanelWidth = 420;
  const displayScale = Math.min(1, maxPanelWidth / frameWidth);

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Some sites set headers (X-Frame-Options / frame-ancestors) that block embedding entirely — that's a restriction the target site controls, not this tool. If a preview stays blank, use "Open in new tab" instead.</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          placeholder="example.com"
          className="flex-1 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
        />
        <button onClick={handleLoad} className="px-4 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer whitespace-nowrap">
          Load Preview
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            onClick={() => setDeviceId(d.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${deviceId === d.id ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          >
            {d.label}
          </button>
        ))}
        <button onClick={() => setLandscape((v) => !v)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer">
          <RotateCw className="w-3 h-3" /> {landscape ? "Landscape" : "Portrait"}
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 py-4">
        <div className="text-[11px] font-mono text-zinc-500">{frameWidth} × {frameHeight}px{displayScale < 1 ? ` (shown at ${Math.round(displayScale * 100)}%)` : ""}</div>
        <div
          className="rounded-[2rem] border-4 border-zinc-700 bg-black overflow-hidden shadow-2xl relative"
          style={{ width: frameWidth * displayScale, height: frameHeight * displayScale }}
        >
          {activeUrl ? (
            <iframe
              key={`${activeUrl}-${deviceId}-${landscape}`}
              src={activeUrl}
              title="Mobile device preview"
              onLoad={() => setLoadState("loaded")}
              style={{
                width: frameWidth,
                height: frameHeight,
                transform: `scale(${displayScale})`,
                transformOrigin: "top left",
                border: "none",
                background: "#fff",
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs px-4 text-center">
              Enter a URL above and click "Load Preview"
            </div>
          )}
          {loadState === "timeout" && (
            <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center gap-2 px-4 text-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <p className="text-xs text-zinc-300">This site didn't load in the preview — it likely blocks embedding.</p>
              {activeUrl && (
                <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-400 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open in new tab instead
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
