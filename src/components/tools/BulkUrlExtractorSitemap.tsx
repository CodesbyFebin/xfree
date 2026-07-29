import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Globe, Download, Copy, Check, Filter, Trash2, FileCode, CheckCircle2, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

interface BulkUrlExtractorSitemapProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const BulkUrlExtractorSitemap: React.FC<BulkUrlExtractorSitemapProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [rawText, setRawText] = useState(tool.exampleInput || "");
  const [domainFilter, setDomainFilter] = useState("example.com");
  const [dedupe, setDedupe] = useState(true);
  const [stripQuery, setStripQuery] = useState(false);
  const [stripTrailingSlash, setStripTrailingSlash] = useState(true);
  const [changeFreq, setChangeFreq] = useState("weekly");
  const [priority, setPriority] = useState("0.8");
  const [maxUrlsPerSitemap, setMaxUrlsPerSitemap] = useState(1000);
  const [activeTab, setActiveTab] = useState<"urls" | "sitemap" | "index">("sitemap");
  const [copiedXml, setCopiedXml] = useState(false);

  // Extract URLs logic
  const extractionResult = useMemo(() => {
    if (!rawText.trim()) {
      return { urls: [], totalRawFound: 0, duplicatesRemoved: 0, externalExcluded: 0 };
    }

    // Regex to match URLs
    const urlRegex = /(https?:\/\/[^\s<>"':;(){}\[\]]+)/gi;
    const matches = rawText.match(urlRegex) || [];
    const totalRawFound = matches.length;

    let processed: string[] = [];
    let externalExcluded = 0;

    for (let rawUrl of matches) {
      try {
        // Clean trailing punctuation
        let cleanUrlStr = rawUrl.replace(/[\.\,\;\:\)\>\]\'\"]+$/, "");
        const parsed = new URL(cleanUrlStr);

        if (domainFilter.trim()) {
          const filterClean = domainFilter.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          if (!parsed.hostname.toLowerCase().includes(filterClean)) {
            externalExcluded++;
            continue;
          }
        }

        if (stripQuery) {
          parsed.search = "";
        }

        let finalUrl = parsed.toString();
        if (stripTrailingSlash && finalUrl.length > 10 && finalUrl.endsWith("/")) {
          finalUrl = finalUrl.slice(0, -1);
        }

        processed.push(finalUrl);
      } catch (e) {
        // Ignore invalid URL parse
      }
    }

    const uniqueUrls = dedupe ? Array.from(new Set(processed)) : processed;
    const duplicatesRemoved = processed.length - uniqueUrls.length;

    return {
      urls: uniqueUrls,
      totalRawFound,
      duplicatesRemoved,
      externalExcluded,
    };
  }, [rawText, domainFilter, dedupe, stripQuery, stripTrailingSlash]);

  // Generate XML Sitemap output
  const sitemapXml = useMemo(() => {
    const urls = extractionResult.urls;
    if (urls.length === 0) return "<!-- No URLs extracted yet. Paste raw text or HTML above. -->";

    const lastmod = new Date().toISOString().split("T")[0];
    const urlEntries = urls
      .slice(0, maxUrlsPerSitemap)
      .map(
        (u) => `  <url>
    <loc>${u.replace(/&/g, "&amp;")}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }, [extractionResult.urls, changeFreq, priority, maxUrlsPerSitemap]);

  // Generate Sitemap Index if chunked
  const sitemapIndexXml = useMemo(() => {
    const total = extractionResult.urls.length;
    if (total <= maxUrlsPerSitemap) return null;

    const fileCount = Math.ceil(total / maxUrlsPerSitemap);
    const lastmod = new Date().toISOString().split("T")[0];
    const baseUrl = domainFilter ? `https://${domainFilter.replace(/^https?:\/\//, "")}` : "https://example.com";

    const entries = Array.from({ length: fileCount }).map(
      (_, i) => `  <sitemap>
    <loc>${baseUrl}/sitemap_${i + 1}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
    ).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
  }, [extractionResult.urls, maxUrlsPerSitemap, domainFilter]);

  const handleCopyXml = () => {
    const content = activeTab === "index" && sitemapIndexXml ? sitemapIndexXml : sitemapXml;
    navigator.clipboard.writeText(content);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
    onSaveHistory(rawText.slice(0, 100), `${extractionResult.urls.length} URLs in Sitemap XML`);
  };

  const handleDownloadXml = () => {
    const isIndex = activeTab === "index" && sitemapIndexXml;
    const content = isIndex ? sitemapIndexXml : sitemapXml;
    const filename = isIndex ? "sitemap_index.xml" : "sitemap.xml";

    const blob = new Blob([content], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxtUrls = () => {
    const content = extractionResult.urls.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "extracted_urls.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Raw Input (Text, HTML Source, Link List, or Crawl Logs)</span>
          </label>
          <span className="text-xs text-zinc-400">
            {rawText.length.toLocaleString()} characters
          </span>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste HTML source code, text containing URLs, or log files here..."
          rows={6}
          className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500/80 transition-all resize-y"
        />

        {/* Filters & Customization Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Domain Filter (Optional)
            </label>
            <input
              type="text"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              placeholder="e.g. example.com"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Change Frequency
            </label>
            <select
              value={changeFreq}
              onChange={(e) => setChangeFreq(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="always">always</option>
              <option value="hourly">hourly</option>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
              <option value="never">never</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Default Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="1.0">1.0 (Homepage)</option>
              <option value="0.9">0.9</option>
              <option value="0.8">0.8 (Key pages)</option>
              <option value="0.7">0.7</option>
              <option value="0.5">0.5 (Standard)</option>
              <option value="0.3">0.3 (Minor)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
              Max URLs / File
            </label>
            <input
              type="number"
              value={maxUrlsPerSitemap}
              onChange={(e) => setMaxUrlsPerSitemap(Number(e.target.value) || 1000)}
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Checkbox Toggles */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={dedupe}
              onChange={(e) => setDedupe(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Deduplicate URLs</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={stripQuery}
              onChange={(e) => setStripQuery(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Remove Query Strings (?ref=...)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={stripTrailingSlash}
              onChange={(e) => setStripTrailingSlash(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>Strip Trailing Slash</span>
          </label>
        </div>
      </div>

      {/* Real-time Extraction Statistics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium">Extracted Valid URLs</div>
          <div className="text-2xl font-bold text-emerald-400">
            {extractionResult.urls.length.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium">Raw Match Count</div>
          <div className="text-2xl font-bold text-white">
            {extractionResult.totalRawFound.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium">Duplicates Removed</div>
          <div className="text-2xl font-bold text-amber-400">
            {extractionResult.duplicatesRemoved.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium">External Filtered</div>
          <div className="text-2xl font-bold text-zinc-400">
            {extractionResult.externalExcluded.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Output Tabs & XML Preview */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("sitemap")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "sitemap"
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              XML Sitemap Preview ({extractionResult.urls.length})
            </button>

            {sitemapIndexXml && (
              <button
                onClick={() => setActiveTab("index")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "index"
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                Sitemap Index XML
              </button>
            )}

            <button
              onClick={() => setActiveTab("urls")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "urls"
                  ? "bg-emerald-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              Clean URL List (.txt)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyXml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedXml ? "Copied!" : "Copy XML"}</span>
            </button>

            <button
              onClick={activeTab === "urls" ? handleDownloadTxtUrls : handleDownloadXml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{activeTab === "urls" ? "Download .txt" : "Download .xml"}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "urls" ? (
          <div className="space-y-2">
            <div className="max-h-96 overflow-y-auto space-y-1 bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-200">
              {extractionResult.urls.length === 0 ? (
                <div className="text-zinc-500 italic">No URLs extracted yet.</div>
              ) : (
                extractionResult.urls.map((url, idx) => (
                  <div key={idx} className="py-0.5 border-b border-zinc-900/60 flex items-center justify-between">
                    <span className="truncate max-w-2xl">{url}</span>
                    <span className="text-[10px] text-zinc-400 font-sans">#{idx + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <pre className="max-h-96 overflow-y-auto p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
            {activeTab === "index" && sitemapIndexXml ? sitemapIndexXml : sitemapXml}
          </pre>
        )}
      </div>
    </div>
  );
};
