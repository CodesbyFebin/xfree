import React, { useState } from "react";
import { ToolDefinition } from "../../types";
import { Eye, Copy, Check, Share2, Globe, Twitter, Facebook, Linkedin } from "lucide-react";

interface MetaTagOpenGraphPreviewProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const MetaTagOpenGraphPreview: React.FC<MetaTagOpenGraphPreviewProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [title, setTitle] = useState("XFree.in — Free AI + Developer Micro-Tools Platform");
  const [description, setDescription] = useState(
    "Fast, privacy-first browser micro-tools for developers, SEO pros, and creators. Get X done for free with zero setup or software installation."
  );
  const [url, setUrl] = useState("https://xfree.in/");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80");
  const [siteName, setSiteName] = useState("XFree.in");
  const [twitterHandle, setTwitterHandle] = useState("@xfree_in");
  const [activeTab, setActiveTab] = useState<"google" | "twitter" | "facebook" | "code">("google");
  const [copied, setCopied] = useState(false);

  // Computed lengths
  const titleLen = title.length;
  const descLen = description.length;

  // Generate HTML Head Code
  const generatedHtml = `<head>
  <!-- Standard Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="${siteName}">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${twitterHandle}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
</head>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(title, "Meta HTML Tags");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs Column */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Page Metadata Form</span>
        </h3>

        {/* Title Tag */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <label className="font-semibold text-zinc-200">Page Title</label>
            <span className={`font-mono ${titleLen > 60 ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
              {titleLen} / 60 chars
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <label className="font-semibold text-zinc-200">Meta Description</label>
            <span className={`font-mono ${descLen > 160 ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
              {descLen} / 160 chars
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 resize-none font-medium"
          />
        </div>

        {/* Canonical URL */}
        <div>
          <label className="text-xs font-semibold text-zinc-200 mb-1 block">Canonical URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* OpenGraph Social Image URL */}
        <div>
          <label className="text-xs font-semibold text-zinc-200 mb-1 block">Social Image URL (1200x630)</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
          <div>
            <label className="text-xs font-semibold text-zinc-200 mb-1 block">Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-200 mb-1 block">Twitter Handle</label>
            <input
              type="text"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Visual Live Cards Preview Column */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 flex flex-col justify-between">
        <div>
          {/* Tab buttons */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab("google")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "google" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Google SERP
              </button>
              <button
                onClick={() => setActiveTab("twitter")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "twitter" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                <Twitter className="w-3.5 h-3.5" /> Twitter / X Card
              </button>
              <button
                onClick={() => setActiveTab("facebook")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "facebook" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                <Facebook className="w-3.5 h-3.5" /> Social Card
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeTab === "code" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
                }`}
              >
                HTML Code
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy HTML"}</span>
            </button>
          </div>

          {/* Render Active Preview */}
          {activeTab === "google" && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-sans space-y-1">
              <div className="text-xs text-zinc-400 flex items-center gap-1">
                <span>{url}</span>
              </div>
              <div className="text-lg font-medium text-blue-400 hover:underline cursor-pointer line-clamp-1">
                {title}
              </div>
              <div className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                {description}
              </div>
            </div>
          )}

          {activeTab === "twitter" && (
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-lg max-w-md mx-auto">
              <div className="h-44 bg-zinc-900 overflow-hidden relative">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400 truncate">{url}</div>
                <div className="text-sm font-bold text-white line-clamp-1">{title}</div>
                <div className="text-xs text-zinc-400 line-clamp-2 leading-tight">{description}</div>
              </div>
            </div>
          )}

          {activeTab === "facebook" && (
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-lg max-w-md mx-auto">
              <div className="h-48 bg-zinc-900 overflow-hidden">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 space-y-0.5">
                <div className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider truncate">{siteName || "XFREE.IN"}</div>
                <div className="text-xs font-bold text-white line-clamp-1">{title}</div>
                <div className="text-[11px] text-zinc-400 line-clamp-2">{description}</div>
              </div>
            </div>
          )}

          {activeTab === "code" && (
            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-72">
              {generatedHtml}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
