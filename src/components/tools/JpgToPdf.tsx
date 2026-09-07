import React, { useState, useCallback } from "react";
import { ToolDefinition } from "../../types";
import { Upload, X, FileDown, GripVertical } from "lucide-react";

interface JpgToPdfProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

interface LoadedImage {
  id: string;
  file: File;
  previewUrl: string;
  jpegBytes: Uint8Array;
  width: number;
  height: number;
}

const MAX_PAGE_POINTS = 792; // ~US Letter long edge, keeps generated pages a sane size

// Loads a File of any browser-supported image type, draws it to a canvas to
// normalize it, and returns raw JPEG bytes + pixel dimensions. Re-encoding
// through canvas is what lets PNG/WebP/etc. inputs become embeddable as a
// PDF /DCTDecode (JPEG) image stream without a JPEG parser/re-muxer.
async function loadAsJpeg(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Could not decode ${file.name} as an image`));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff"; // flatten transparency (PNG) onto white before JPEG encode
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) throw new Error(`Failed to encode ${file.name} as JPEG`);
    const buf = await blob.arrayBuffer();
    return { bytes: new Uint8Array(buf), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Builds a minimal, valid multi-page PDF with each image as a full-bleed
// page, embedding the JPEG bytes directly via a /DCTDecode XObject (no
// re-encoding, no external PDF library). One page per image, sized to the
// image's own pixel dimensions scaled down to fit MAX_PAGE_POINTS.
function buildPdf(images: LoadedImage[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  const enc = new TextEncoder();
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const startObj = (id: number) => {
    offsets[id] = length;
  };

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  const objectCount = images.length * 3 + 2;
  const pageIds = images.map((_, i) => 3 + i * 3);

  startObj(1);
  push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  startObj(2);
  push(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${images.length} >>\nendobj\n`);

  images.forEach((img, i) => {
    const pageId = 3 + i * 3;
    const contentId = 4 + i * 3;
    const imageId = 5 + i * 3;
    const scale = Math.min(1, MAX_PAGE_POINTS / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    startObj(pageId);
    push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    const contentStream = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    startObj(contentId);
    push(`${contentId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

    startObj(imageId);
    push(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpegBytes.length} >>\nstream\n`
    );
    push(img.jpegBytes);
    push(`\nendstream\nendobj\n`);
  });

  const xrefOffset = length;
  push(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= objectCount; id++) {
    push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

export const JpgToPdf: React.FC<JpgToPdfProps> = ({ tool, onSaveHistory }) => {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    setDownloadUrl(null);
    try {
      const loaded: LoadedImage[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const { bytes, width, height } = await loadAsJpeg(file);
        loaded.push({ id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`, file, previewUrl: URL.createObjectURL(file), jpegBytes: bytes, width, height });
      }
      setImages((prev) => [...prev, ...loaded]);
      onSaveHistory(`${files.length} image(s)`, "queued");
    } catch (err: any) {
      setError(err.message || "Failed to load one or more images");
    } finally {
      setBusy(false);
    }
  }, [onSaveHistory]);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setDownloadUrl(null);
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleConvert = () => {
    if (images.length === 0) return;
    setBusy(true);
    try {
      const pdfBytes = buildPdf(images);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(URL.createObjectURL(blob));
      onSaveHistory(`${images.length} image(s)`, `${(pdfBytes.length / 1024).toFixed(0)} KB PDF`);
    } catch (err: any) {
      setError(err.message || "Failed to build PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
      <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 cursor-pointer text-center transition-colors">
        <Upload className="w-6 h-6 text-zinc-500" />
        <span className="text-sm text-zinc-300 font-semibold">Click to select images, or drag & drop</span>
        <span className="text-xs text-zinc-500">JPG, PNG, WebP, and more — processed entirely in your browser</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </label>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">{error}</div>}

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-white">{images.length} image{images.length > 1 ? "s" : ""} queued — drag order with arrows, first image = page 1</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <img src={img.previewUrl} alt={img.file.name} className="w-full h-28 object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-200 disabled:opacity-30 cursor-pointer" title="Move earlier">
                    <GripVertical className="w-3.5 h-3.5 rotate-90" />
                  </button>
                  <button onClick={() => removeImage(img.id)} className="p-1.5 rounded-lg bg-rose-600 text-white cursor-pointer" title="Remove">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-emerald-300 font-mono">#{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleConvert}
          disabled={images.length === 0 || busy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4" />
          {busy ? "Working…" : `Convert ${images.length || ""} Image${images.length === 1 ? "" : "s"} to PDF`}
        </button>
        {downloadUrl && (
          <a href={downloadUrl} download={`${tool.slug || "images"}.pdf`} className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer">
            Download PDF
          </a>
        )}
      </div>
      <p className="text-[11px] text-zinc-500">Images never leave your device — the PDF is assembled entirely client-side.</p>
    </div>
  );
};
