import React, { useState, useRef, useCallback, useEffect } from "react";
import { ToolDefinition } from "../../types";
import { Upload, Download, RotateCcw } from "lucide-react";

interface PhotoEditorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

type FilterId = "none" | "grayscale" | "sepia" | "invert";

const FILTERS: Record<FilterId, string> = {
  none: "none",
  grayscale: "grayscale(1)",
  sepia: "sepia(0.8)",
  invert: "invert(1)",
};

const DEFAULT_ADJUST = { brightness: 100, contrast: 100, saturation: 100 };

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ tool, onSaveHistory }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState("edited-photo");
  const [adjust, setAdjust] = useState(DEFAULT_ADJUST);
  const [filter, setFilter] = useState<FilterId>("none");
  const [cropPct, setCropPct] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cssFilter = `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) saturate(${adjust.saturation}%) ${FILTERS[filter]}`;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const sx = (cropPct.x / 100) * image.naturalWidth;
    const sy = (cropPct.y / 100) * image.naturalHeight;
    const sw = (cropPct.w / 100) * image.naturalWidth;
    const sh = (cropPct.h / 100) * image.naturalHeight;
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = cssFilter;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  }, [image, cropPct, cssFilter]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFileName(file.name.replace(/\.[^.]+$/, "") + "-edited");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setAdjust(DEFAULT_ADJUST);
      setFilter("none");
      setCropPct({ x: 0, y: 0, w: 100, h: 100 });
      URL.revokeObjectURL(url);
      onSaveHistory(file.name, "loaded");
    };
    img.src = url;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.png`;
      a.click();
      URL.revokeObjectURL(url);
      onSaveHistory(fileName, "downloaded PNG");
    }, "image/png");
  };

  const reset = () => {
    setAdjust(DEFAULT_ADJUST);
    setFilter("none");
    setCropPct({ x: 0, y: 0, w: 100, h: 100 });
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
      {!image ? (
        <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 cursor-pointer text-center transition-colors">
          <Upload className="w-6 h-6 text-zinc-500" />
          <span className="text-sm text-zinc-300 font-semibold">Click to select a photo, or drag & drop</span>
          <span className="text-xs text-zinc-500">Processed entirely in your browser — never uploaded</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>
      ) : (
        <div className="grid md:grid-cols-[1fr_260px] gap-4">
          <div className="flex items-center justify-center p-3 rounded-xl bg-zinc-950 border border-zinc-800 overflow-auto">
            <canvas ref={canvasRef} className="max-w-full max-h-[420px] rounded" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-white mb-1 block">Filter</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(FILTERS) as FilterId[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold capitalize cursor-pointer ${filter === f ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {([
              ["brightness", "Brightness"],
              ["contrast", "Contrast"],
              ["saturation", "Saturation"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-0.5">
                  <span>{label}</span>
                  <span className="font-mono text-emerald-400">{adjust[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={adjust[key]}
                  onChange={(e) => setAdjust((a) => ({ ...a, [key]: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>
            ))}

            <div>
              <label className="text-xs font-bold text-white mb-1 block">Crop (%)</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["x", "Left"],
                  ["y", "Top"],
                  ["w", "Width"],
                  ["h", "Height"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="text-[10px] text-zinc-500">
                    {label}
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cropPct[key]}
                      onChange={(e) => setCropPct((c) => ({ ...c, [key]: Math.max(0, Math.min(100, Number(e.target.value))) }))}
                      className="w-full mt-0.5 p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Download PNG
              </button>
              <button onClick={reset} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer" title="Reset edits">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-[11px] text-emerald-400 hover:underline cursor-pointer">
              Choose a different photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
