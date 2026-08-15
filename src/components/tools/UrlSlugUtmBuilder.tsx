import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Link2, Copy, Check, Sparkles, RefreshCw } from "lucide-react";

interface UrlSlugUtmBuilderProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const UrlSlugUtmBuilder: React.FC<UrlSlugUtmBuilderProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"slug" | "utm">("slug");

  // Slugifier State
  const [titleText, setTitleText] = useState("How to Build a High-Speed Web App with React 19 & Express in 2026!");
  const [lowercase, setLowercase] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [separator, setSeparator] = useState("-");

  // UTM Builder State
  const [baseUrl, setBaseUrl] = useState("https://xfree.in/tools/bulk-url-extractor");
  const [utmSource, setUtmSource] = useState("newsletter");
  const [utmMedium, setUtmMedium] = useState("email");
  const [utmCampaign, setUtmCampaign] = useState("launch_2026");
  const [utmTerm, setUtmTerm] = useState("seo_tools");
  const [utmContent, setUtmContent] = useState("cta_top_button");

  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedUtm, setCopiedUtm] = useState(false);

  // Generate Slug
  const generatedSlug = useMemo(() => {
    if (!titleText.trim()) return "";

    let text = titleText;
    if (lowercase) text = text.toLowerCase();

    // Stop words
    if (removeStopWords) {
      const stopWords = ["a", "an", "the", "and", "or", "but", "is", "in", "it", "to", "for", "with", "on", "at", "by", "from", "of"];
      const words = text.split(/\s+/);
      text = words.filter((w) => !stopWords.includes(w.toLowerCase())).join(" ");
    }

    // Clean characters
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // accents
      .replace(/[^a-zA-Z0-9\s-]/g, "") // non-alphanumeric
      .trim()
      .replace(/\s+/g, separator);
  }, [titleText, lowercase, removeStopWords, separator]);

  // Generate UTM Link
  const generatedUtmUrl = useMemo(() => {
    if (!baseUrl.trim()) return "";
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      if (utmSource.trim()) url.searchParams.set("utm_source", utmSource.trim());
      if (utmMedium.trim()) url.searchParams.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim()) url.searchParams.set("utm_campaign", utmCampaign.trim());
      if (utmTerm.trim()) url.searchParams.set("utm_term", utmTerm.trim());
      if (utmContent.trim()) url.searchParams.set("utm_content", utmContent.trim());
      return url.toString();
    } catch {
      return baseUrl;
    }
  }, [baseUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const handleCopySlug = () => {
    navigator.clipboard.writeText(generatedSlug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
    onSaveHistory("URL Slug", generatedSlug);
  };

  const handleCopyUtm = () => {
    navigator.clipboard.writeText(generatedUtmUrl);
    setCopiedUtm(true);
    setTimeout(() => setCopiedUtm(false), 2000);
    onSaveHistory("UTM URL", generatedUtmUrl);
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("slug")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "slug" ? "bg-emerald-500 text-zinc-950 shadow-md" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          URL Slug Generator
        </button>

        <button
          onClick={() => setActiveTab("utm")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "utm" ? "bg-emerald-500 text-zinc-950 shadow-md" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          UTM Campaign Builder
        </button>
      </div>

      {activeTab === "slug" ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white mb-1 block">
              Article Title or Heading
            </label>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="Type your title..."
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => setLowercase(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Lowercase string</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={removeStopWords}
                onChange={(e) => setRemoveStopWords(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>Strip common stop words (a, the, in, to...)</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span>Separator:</span>
              <select
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs focus:outline-none"
              >
                <option value="-">- (Hyphen)</option>
                <option value="_">_ (Underscore)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Generated Clean URL Slug</span>
              <button
                onClick={handleCopySlug}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                {copiedSlug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSlug ? "Copied!" : "Copy Slug"}</span>
              </button>
            </div>
            <div className="text-sm font-mono text-emerald-400 break-all bg-zinc-900 p-3 rounded-lg border border-zinc-800">
              {generatedSlug || "slug-preview"}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white mb-1 block">Destination Web URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://yourdomain.com/landing-page"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">utm_source *</label>
              <input
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="google, newsletter, twitter"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">utm_medium *</label>
              <input
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="cpc, email, social"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">utm_campaign *</label>
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="summer_sale_2026"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">utm_term (Optional)</label>
              <input
                type="text"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
                placeholder="seo_tools"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">utm_content (Optional)</label>
              <input
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="header_banner_cta"
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Final Tracked Campaign Link</span>
              <button
                onClick={handleCopyUtm}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                {copiedUtm ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUtm ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
            <div className="text-xs font-mono text-emerald-400 break-all bg-zinc-900 p-3 rounded-lg border border-zinc-800">
              {generatedUtmUrl}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
